---
title: "HAMi vGPU 原理分析 Part2：hami-webhook 原理分析"
slug: "open-source-vgpu-hami-webhook"
date: "2025-07-24"
excerpt: "上篇我们分析了 hami-device-plugin-nvidia，知道了 HAMi 的 NVIDIA device plugin 工作原理。本文为 HAMi 原理分析的第二篇，分析 hami-scheduler 实现原理。"
author: "密瓜智能"
tags: ["HAMI", "GPU 共享", "vGPU", "Kubernetes", "异构算力"]
coverImage: "/images/blog/gpu4/cover.jpg"
language: "zh"
---

# HAMi vGPU 原理分析 Part2：hami-webhook 原理分析

上篇我们分析了 hami-device-plugin-nvidia，知道了 HAMi 的 NVIDIA device plugin 工作原理。

[上一篇文章《HAMi vGPU 方案原理分析 Part1: hami-device-plugin-nvidia 实现》](https://dynamia.ai/zh/blog/open-source-vgpu-hami-device-plugin-nvidia)


本文为 HAMi 原理分析的第二篇，分析 hami-scheduler 实现原理。

为了实现基于 vGPU 的调度，HAMi 实现了自己的 Scheduler：hami-scheduler，除了基础调度逻辑之外，还有 spread & binpark 等 高级调度策略。

主要包括以下几个问题：

1. Pod 是如何使用到 hami-scheduler，创建 Pod 时我们未指定 SchedulerName 默认会使用 default-scheduler 进行调度才对

2. hami-scheduler 逻辑，spread & binpark 等 高级调度策略是如何实现的

由于内容比较多，拆分为了 hami-webhook、 hami-scheduler 以及 Spread&Binpack 调度策略三篇文章，本篇我们主要解决第一个问题。

> 以下分析基于 HAMi v2.4.0

## 1.hami-scheduler 启动命令

hami-scheduler 具体包括两个组件：
- hami-webhook

- hami-scheduler

虽然是两个组件，实际上代码是放在一起的，**cmd/scheduler/main.go** 为启动文件：

这里也是用 corba 库实现的一个命令行工具。

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

最终启动的 start 方法如下：

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

开始初始化了一下 Device

> 这个后续 Webhook 会用到，等会再看

```go
// device.InitDevices() scans local GPU devices via NVML,
// parses node annotations, and builds the in-memory inventory.
device.InitDevices()
```

然后启动了 Scheduler

```go
sher = scheduler.NewScheduler() // create scheduler instance
sher.Start()                  // start scheduling loop
defer sher.Stop()             // graceful shutdown on exit
```

接着启动了一个 Goroutine 来从之前 device plugin 添加到 Node 对象上的 Annotations 中不断解析拿到具体的 GPU 信息

```go
// background goroutine: continuously syncs GPU inventory
// from Node annotations into the scheduler cache
go sher.RegisterFromNodeAnnotations()
```

最后则是启动了一个 HTTP 服务

```go
router := httprouter.New()
router.POST("/filter",  routes.PredicateRoute(sher)) // scheduler predicate plugin
router.POST("/bind",    routes.Bind(sher))           // scheduler bind plugin
router.POST("/webhook", routes.WebHookRoute())       // mutating/validating webhook
router.GET("/healthz",  routes.HealthzRoute())       // liveness probe
```

其中

- /webhook 就是 Webhook 组件

- /filter 和 /bind 则是 Scheduler 组件

- /healthz 则用作健康检查。

接下来在通过源码分析 Webhook 以及 Scheduler 各自的实现。

## 2.hami-webhook

这里的 Webhook 是一个 Mutating Webhook，主要是为 Scheduler 服务的。

核心功能是：**根据 Pod Resource 字段中的 ResourceName 判断该 Pod 是否使用了 HAMi vGPU，如果是则修改 Pod 的 SchedulerName 为 hami-scheduler，让 hami-scheduler 进行调度，否则不做处理。**

### MutatingWebhookConfiguration ###

为了让 Webhook 生效，HAMi 部署时会创建 **MutatingWebhookConfiguration** 对象，具体内容如下：

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

  具体效果是在创建 Pod 时，kube-apiserver 会调用该 service 对应的 webhook，这样就注入了我们的自定义逻辑。
  
  关注的对象为 Pod 的 CREATE 事件：

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

  但是不包括以下对象

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

即：namespace 或者 资源对象上带 hami.io/webhook=ignore label 的都不走该 Webhook 逻辑。

请求的 Webhook 为