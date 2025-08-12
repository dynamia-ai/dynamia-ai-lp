---
title: "HAMI vGPU Principle Analysis Part 2: hami-webhook Principle Analysis"
slug: "open-source-vgpu-hami-webhook-analysis"
date: "2025-07-24"
excerpt: "In the last article, we analyzed hami-device-plugin-nvidia and understood how HAMI's NVIDIA device plugin works. This is the second article in the HAMI principle analysis series, analyzing the implementation of hami-scheduler."
author: "Dynamia AI Team"
tags: ["HAMI", "GPU Sharing", "vGPU", "Kubernetes", "Heterogeneous Computing"]
coverImage: "/images/blog/gpu4/cover2.jpg"
language: "en"
---

In the last article, we analyzed `hami-device-plugin-nvidia` and understood how HAMI's NVIDIA device plugin works.

[Previous article: "HAMI vGPU Solution Principle Analysis Part 1: hami-device-plugin-nvidia Implementation"](https://dynamia.ai/blog/open-source-vgpu-hami-device-plugin-nvidia-analysis)

This is the second article in the HAMI principle analysis series, analyzing the implementation of `hami-scheduler`.

To achieve vGPU-based scheduling, HAMI implements its own scheduler: `hami-scheduler`. In addition to basic scheduling logic, it also includes advanced scheduling strategies like `spread` & `binpack`.

This raises several key questions:

1.  How do Pods get scheduled by `hami-scheduler`? When creating a Pod without specifying a `SchedulerName`, it should be scheduled by the `default-scheduler`.
2.  What is the logic of `hami-scheduler`, and how are advanced scheduling strategies like `spread` & `binpack` implemented?

Due to the amount of content, this topic will be split into three articles: hami-webhook, hami-scheduler, and the Spread & Binpack scheduling strategy. This article will focus on answering the first question.

> The following analysis is based on HAMI v2.4.0.

## 1. hami-scheduler Startup Command

The `hami-scheduler` actually consists of two components:
- `hami-webhook`
- `hami-scheduler`

Although they are two components, their code is located together. The startup file is **cmd/scheduler/main.go**:

This is a command-line tool implemented using the Cobra library.

```go
var (
	sher        *scheduler.Scheduler
	tlsKeyFile  string
	tlsCertFile string
	rootCmd     = &cobra.Command{
		Use:   "scheduler",
		Short: "kubernetes vgpu scheduler",
		Run: func(cmd *cobra.Command, args []string) {
			start()
		},
	}
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		klog.Fatal(err)
	}
}
```

The `start` method that is ultimately called is as follows:

```go
func start() {
	// Initialize GPU inventory
	device.InitDevices()

	// Build and start the scheduler
	sher = scheduler.NewScheduler()
	sher.Start()
	defer sher.Stop()

	// Background goroutines
	go sher.RegisterFromNodeAnnotations()     // Sync node GPU annotations
	go initMetrics(config.MetricsBindAddress) // Prometheus metrics

	// HTTP routes
	router := httprouter.New()
	router.POST("/filter",  routes.PredicateRoute(sher))
	router.POST("/bind",    routes.Bind(sher))
	router.POST("/webhook", routes.WebHookRoute())
	router.GET("/healthz",  routes.HealthzRoute())

	// Start server (plain or TLS)
	klog.Info("listen on ", config.HTTPBind)
	if len(tlsCertFile) == 0 || len(tlsKeyFile) == 0 {
		if err := http.ListenAndServe(config.HTTPBind, router); err != nil {
			klog.Fatal("Listen and Serve error, ", err)
		}
	} else {
		if err := http.ListenAndServeTLS(config.HTTPBind, tlsCertFile, tlsKeyFile, router); err != nil {
			klog.Fatal("Listen and Serve error, ", err)
		}
	}
}
```

First, it initializes the devices.
> This will be used by the Webhook later, we'll look at it in a moment.

```go
// device.InitDevices() scans local GPU devices via NVML,
// parses node annotations, and builds the in-memory inventory.
device.InitDevices()
```

Then it starts the Scheduler.

```go
sher = scheduler.NewScheduler() // create scheduler instance
sher.Start()                  // start scheduling loop
defer sher.Stop()             // graceful shutdown on exit```

Next, it starts a Goroutine to continuously parse GPU information from the Annotations that the device plugin previously added to the Node objects.

```go
// background goroutine: continuously syncs GPU inventory
// from Node annotations into the scheduler cache
go sher.RegisterFromNodeAnnotations()
```

Finally, it starts an HTTP service.

```go
router := httprouter.New()
router.POST("/filter",  routes.PredicateRoute(sher)) // scheduler predicate plugin
router.POST("/bind",    routes.Bind(sher))           // scheduler bind plugin
router.POST("/webhook", routes.WebHookRoute())       // mutating/validating webhook
router.GET("/healthz",  routes.HealthzRoute())       // liveness probe
```

Here:
- `/webhook` is the Webhook component.
- `/filter` and `/bind` are the Scheduler components.
- `/healthz` is used for health checks.

Next, we will analyze the implementation of the Webhook and Scheduler through the source code.

## 2. hami-webhook

The Webhook here is a Mutating Webhook, primarily serving the Scheduler.

Its core function is: **To determine if a Pod is using HAMI vGPU based on the `ResourceName` in the Pod's `Resource` field. If so, it modifies the Pod's `SchedulerName` to `hami-scheduler` so that it can be scheduled by `hami-scheduler`. Otherwise, it does nothing.**

### MutatingWebhookConfiguration ###

To make the Webhook effective, HAMI creates a **MutatingWebhookConfiguration** object during deployment. The content is as follows:

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  annotations:
    meta.helm.sh/release-name: vgpu
    meta.helm.sh/release-namespace: kube-system
  labels:
    app.kubernetes.io/managed-by: Helm
  name: vgpu-hami-webhook
webhooks:
- admissionReviewVersions:
  - v1beta1
  clientConfig:
    caBundle: xxx
    service:
      name: vgpu-hami-scheduler
      namespace: kube-system
      path: /webhook
      port: 443
  failurePolicy: Ignore
  matchPolicy: Equivalent
  name: vgpu.hami.io
  namespaceSelector:
    matchExpressions:
    - key: hami.io/webhook
      operator: NotIn
      values:
      - ignore
  objectSelector:
    matchExpressions:
    - key: hami.io/webhook
      operator: NotIn
      values:
      - ignore
  reinvocationPolicy: Never
  rules:
  - apiGroups:
    - ""
    apiVersions:
    - v1
    operations:
    - CREATE
    resources:
    - pods
    scope: '*'
  sideEffects: None
  timeoutSeconds: 10
```

The effect is that when a Pod is created, the kube-apiserver will call the webhook corresponding to this service, thus injecting our custom logic.

It targets the `CREATE` event for Pods:

```yaml
rules:
- apiGroups:
  - ""
  apiVersions:
  - v1
  operations:
  - CREATE
  resources:
  - pods
  scope: '*'
```

However, it excludes the following objects:
```yaml
namespaceSelector:
  matchExpressions:
  - key: hami.io/webhook
    operator: NotIn
    values:
    - ignore
objectSelector:
  matchExpressions:
  - key: hami.io/webhook
    operator: NotIn
    values:
    - ignore
```
This means that any namespace or resource object with the label `hami.io/webhook=ignore` will not trigger this Webhook logic.

The requested Webhook is:```yaml
service:
  name: vgpu-hami-scheduler
  namespace: kube-system
  path: /webhook
  port: 443
```
This means that for a `CREATE` event on a matching Pod, the kube-apiserver will call the service specified, which is our `hami-webhook`.

Now let's analyze what `hami-webhook` actually does.

### Source Code Analysis ###

The specific implementation of this Webhook is as follows:
```go
// pkg/scheduler/webhook.go#L52
func (h *webhook) Handle(_ context.Context, req admission.Request) admission.Response {
	pod := &corev1.Pod{}
	if err := h.decoder.Decode(req, pod); err != nil {
		klog.Errorf("Failed to decode request: %v", err)
		return admission.Errored(http.StatusBadRequest, err)
	}
	if len(pod.Spec.Containers) == 0 {
		klog.Warningf(template+" - Denying admission as pod has no containers", req.Namespace, req.Name, req.UID)
		return admission.Denied("pod has no containers")
	}

	klog.Infof(template, req.Namespace, req.Name, req.UID)
	hasResource := false
	for idx, ctr := range pod.Spec.Containers {
		c := &pod.Spec.Containers[idx]
		if ctr.SecurityContext != nil && ctr.SecurityContext.Privileged != nil && *ctr.SecurityContext.Privileged {
			klog.Warningf(template+" - Denying admission as container %s is privileged", req.Namespace, req.Name, req.UID, c.Name)
			continue
		}
		for _, val := range device.GetDevices() {
			found, err := val.MutateAdmission(c)
			if err != nil {
				klog.Errorf("validating pod failed:%s", err.Error())
				return admission.Errored(http.StatusInternalServerError, err)
			}
			hasResource = hasResource || found
		}
	}

	if !hasResource {
		klog.Infof(template+" - Allowing admission for pod: no resource found", req.Namespace, req.Name, req.UID)
	} else if len(config.SchedulerName) > 0 {
		pod.Spec.SchedulerName = config.SchedulerName
	}

	marshaledPod, err := json.Marshal(pod)
	if err != nil {
		klog.Errorf(template+" - Failed to marshal pod, error: %v", req.Namespace, req.Name, req.UID, err)
		return admission.Errored(http.StatusInternalServerError, err)
	}
	return admission.PatchResponseFromRaw(req.Object.Raw, marshaledPod)
}
```

The logic is quite simple:
1.  Determine if the Pod needs to be scheduled by `hami-scheduler`.
2.  If it does, change the Pod's `SchedulerName` field to `hami-scheduler` (the name is configurable).

So, the core question is: how does it determine if the Pod needs to be scheduled by `hami-scheduler`?

### How to Determine if `hami-scheduler` Should Be Used ###

The Webhook mainly determines this based on whether the Pod requests vGPU resources, but there are some special cases.

### Privileged Pods ###

First, HAMI ignores privileged Pods directly.

```go
if ctr.SecurityContext != nil {
	if ctr.SecurityContext.Privileged != nil && *ctr.SecurityContext.Privileged {
		klog.Warningf(template+" - Denying admission as container %s is privileged", req.Namespace, req.Name, req.UID, c.Name)
		continue
	}
}
```
This is because when privileged mode is enabled, the Pod can access all devices on the host, making restrictions meaningless. Therefore, it is ignored here.

### Specific Judgment Logic ###

Then, it determines whether to use `hami-scheduler` based on the resources in the Pod:

```go
for _, val := range device.GetDevices() {
	found, err := val.MutateAdmission(c)
	if err != nil {
		klog.Errorf("validating pod failed:%s", err.Error())
		return admission.Errored(http.StatusInternalServerError, err)
	}
	hasResource = hasResource || found
}
```

If the Pod's resources request a vGPU resource supported by HAMI, then it needs to be scheduled by `hami-scheduler`.

And which devices does HAMI support? These are the ones initialized in the `start` function:

```go
var devices map[string]Devices

func GetDevices() map[string]Devices {
	return devices
}

func InitDevices() {
	devices = make(map[string]Devices)
	DevicesToHandle = []string{}

	devices[cambricon.CambriconMLUDevice] = cambricon.InitMLUDevice()
	devices[nvidia.NvidiaGPUDevice]       = nvidia.InitNvidiaDevice()
	devices[hygon.HygonDCUDevice]         = hygon.InitDCUDevice()
	devices[iluvatar.IluvatarGPUDevice]   = iluvatar.InitIluvatarDevice()

	DevicesToHandle = append(DevicesToHandle,
		nvidia.NvidiaGPUCommonWord,
		cambricon.CambriconMLUCommonWord,
		hygon.HygonDCUCommonWord,
		iluvatar.IluvatarGPUCommonWord,
	)

	for _, dev := range ascend.InitDevices() {
		devices[dev.CommonWord()] = dev
		DevicesToHandle = append(DevicesToHandle, dev.CommonWord())
	}
}
```

`devices` is a global variable, and `InitDevices` initializes it for use by the Webhook, including support for NVIDIA, Hygon, Iluvatar, Ascend, etc.

Let's take NVIDIA as an example to explain how HAMI determines if a Pod needs its scheduling. The `MutateAdmission` implementation is as follows:

```go
func (dev *NvidiaGPUDevices) MutateAdmission(ctr *corev1.Container) (bool, error) {
	// GPU-related mutations
	if priority, ok := ctr.Resources.Limits[corev1.ResourceName(ResourcePriority)]; ok {
		ctr.Env = append(ctr.Env, corev1.EnvVar{
			Name:  api.TaskPriority,
			Value: fmt.Sprint(priority.Value()),
		})
	}

	_, resourceNameOK := ctr.Resources.Limits[corev1.ResourceName(ResourceName)]
	if resourceNameOK {
		return resourceNameOK, nil
	}

	_, resourceCoresOK := ctr.Resources.Limits[corev1.ResourceName(ResourceCores)]
	_, resourceMemOK := ctr.Resources.Limits[corev1.ResourceName(ResourceMem)]
	_, resourceMemPercentageOK := ctr.Resources.Limits[corev1.ResourceName(ResourceMemPercentage)]

	if resourceCoresOK || resourceMemOK || resourceMemPercentageOK {
		if config.DefaultResourceNum > 0 {
			ctr.Resources.Limits[corev1.ResourceName(ResourceName)] =
				*resource.NewQuantity(int64(config.DefaultResourceNum), resource.BinarySI)
			resourceNameOK = true
		}
	}

	if !resourceNameOK && OverwriteEnv {
		ctr.Env = append(ctr.Env, corev1.EnvVar{
			Name:  "NVIDIA_VISIBLE_DEVICES",
			Value: "none",
		})
	}
	return resourceNameOK, nil
}
```

First, if the Pod's requested resources contain the corresponding `ResourceName`, it directly returns `true`.

```go
_, resourceNameOK := ctr.Resources.Limits[corev1.ResourceName(ResourceName)]
if resourceNameOK {
	return resourceNameOK, nil
}
```

The corresponding `ResourceName` for NVIDIA GPUs is:

```go
fs.StringVar(&ResourceName, "resource-name", "nvidia.com/gpu", "resource name")
```
If a Pod requests this resource in its `Resource` field, it needs to be scheduled by HAMI. The logic for other resources is similar.
> HAMI supports GPUs from NVIDIA, Iluvatar, Huawei, Cambricon, Hygon, etc. The default ResourceNames are: `nvidia.com/gpu`, `iluvatar.ai/vgpu`, `hygon.com/dcunum`, `cambricon.com/mlu`, `huawei.com/Ascend310`, etc. Pods using these ResourceNames will be scheduled by `hami-scheduler`.
> PS: These ResourceNames can be configured in the corresponding device plugins.

If the Pod does not directly request `nvidia.com/gpu` but requests resources like `gpucore` or `gpumem`, and the Webhook's `DefaultResourceNum` is greater than 0, it will also return `true` and automatically add the `nvidia.com/gpu` resource request.

```go
_, resourceCoresOK := ctr.Resources.Limits[corev1.ResourceName(ResourceCores)]
_, resourceMemOK := ctr.Resources.Limits[corev1.ResourceName(ResourceMem)]
_, resourceMemPercentageOK := ctr.Resources.Limits[corev1.ResourceName(ResourceMemPercentage)]

if resourceCoresOK || resourceMemOK || resourceMemPercentageOK {
	if config.DefaultResourceNum > 0 {
		ctr.Resources.Limits[corev1.ResourceName(ResourceName)] =
			*resource.NewQuantity(int64(config.DefaultResourceNum), resource.BinarySI)
		resourceNameOK = true
	}
}
```

### Modifying SchedulerName ###

For Pods that meet the above conditions, they need to be scheduled by `hami-scheduler`. The Webhook will change the Pod's `spec.schedulerName` to `hami-scheduler`.

The specific logic is as follows:

```go
if !hasResource {
	klog.Infof(template+" - Allowing admission for pod: no resource found", req.Namespace, req.Name, req.UID)
} else if len(config.SchedulerName) > 0 {
	pod.Spec.SchedulerName = config.SchedulerName
}
```

This way, the Pod will be scheduled by `hami-scheduler`, and the `hami-scheduler`'s work begins.

There is another special case: if `nodeName` is specified at creation time, the Webhook will reject the Pod. This is because specifying a `nodeName` means the Pod doesn't need scheduling and will be started directly on the specified node, but it hasn't gone through scheduling, so the node might not have sufficient resources.

```go
if pod.Spec.NodeName != "" {
	klog.Infof(template+" - Pod already has node assigned", req.Namespace, req.Name, req.UID)
	return admission.Denied("pod has node assigned")
}
```

---

## 3. Summary ##

The purpose of this Webhook is: to change the scheduler for Pods requesting vGPU resources to `hami-scheduler`, which will then handle their scheduling.

There are also some special cases:

-   For privileged Pods, the Webhook will ignore them and will not switch them to be scheduled by `hami-scheduler`; they will still use the `default-scheduler`.
-   For Pods that directly specify a `nodeName`, the Webhook will reject and block the Pod's creation.

Based on these special cases, the following issue, which has been reported multiple times in the community, may occur:

**A privileged Pod requests `gpucore` and `gpumem` resources, but after creation, it remains in a Pending state and cannot be scheduled, with an error indicating that no node has `gpucore` or `gpumem` resources.**

This is because the Webhook skips privileged Pods, so the Pod is handled by the `default-scheduler`. The `default-scheduler` checks the Pod's `ResourceName` and finds that no Node has `gpucore` or `gpumem` resources, so it cannot be scheduled, and the Pod remains in a Pending state.
> PS: `gpucore` and `gpumem` are virtual resources and are not advertised on the Node object itself; only `hami-scheduler` can handle them.

### HAMI Webhook Workflow:

1.  A user creates a Pod and requests vGPU resources in it.
2.  Based on the `MutatingWebhookConfiguration`, the kube-apiserver sends a request to the HAMI-Webhook.
3.  The HAMI-Webhook inspects the Pod's resources, finds that it is requesting a vGPU resource managed by HAMI, and therefore changes the Pod's `SchedulerName` to `hami-scheduler`. This ensures the Pod will be scheduled by `hami-scheduler`.
    -   For privileged Pods, the Webhook will skip them without any processing.
    -   For Pods using vGPU resources but with a specified `nodeName`, the Webhook will reject them.
4.  Next, the process enters the `hami-scheduler`'s scheduling logic, which we will analyze in the next article.

With this, we have clarified **why and which Pods will be scheduled by `hami-scheduler`**. This also explains why privileged Pods might fail to be scheduled.

The next article will begin the analysis of the `hami-scheduler` implementation.

---
*To learn more about the HAMI project, please visit the [GitHub repository](https://github.com/Project-HAMi/HAMi) or join our [Slack community](https://cloud-native.slack.com/archives/C07T10BU4R2).*