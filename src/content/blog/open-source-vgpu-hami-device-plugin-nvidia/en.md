---

title: "HAMI vGPU Solution Principle Analysis: hami-device-plugin-nvidia Implementation"
coverTitle: "HAMi NVIDIA Device Plugin Implementation"
slug: "open-source-vgpu-hami-device-plugin-nvidia-analysis"
date: "2025-07-23"
excerpt: "This is the first article in a series analyzing the implementation principles of the open-source vGPU solution HAMI, focusing on the hami-device-plugin-nvidia."
author: "Dynamia AI Team"
tags: ["HAMi", "GPU Sharing", "vGPU", "Kubernetes", "Heterogeneous Computing"]
coverImage: "/images/blog/gpu3/cover2.jpg"
language: "en"

---

This is the first article in a series analyzing the implementation principles of the open-source vGPU solution HAMI, focusing on the implementation of `hami-device-plugin-nvidia`.

Previously, in [Open Source vGPU Solution: HAMI for Fine-Grained GPU Partitioning](https://dynamia.ai/blog/open-source-vgpu-hami-fine-grained-partitioning), we introduced what HAMI is. Then, in [Open Source vGPU Solution HAMI: Core & Memory Isolation Test](https://dynamia.ai/blog/open-source-vgpu-hami-core-memory-test), we tested the vGPU solution provided by HAMI.

Next, we will gradually analyze the implementation principles of vGPU in HAMI, which involves many components. It is tentatively divided into several parts:

1.  **hami-device-plugin-nvidia**: How GPU discovery and allocation logic are implemented in HAMI's version of the device-plugin, and how it differs from NVIDIA's official device-plugin.

2.  **hami-scheduler**: How HAMI performs scheduling, and how the `impack/spread` high-availability scheduling strategies are implemented.

3.  **hami-core (also known as cgroup-hook)**: This is the core part of HAMI's vGPU solution, explaining how HAMI intercepts CUDA APIs to achieve Core & Memory isolation and limits.

This is the first article, analyzing the implementation principles of `hami-device-plugin-nvidia`.

---

## 1. Overview

NVIDIA has its own device-plugin. This raises the question: **Why did HAMI need to implement its own device plugin?**

Does ***hami-device-plugin-nvidia*** have features that NVIDIA's native ***device plugin*** lacks? With this question in mind, let's start examining the `hami-device-plugin-nvidia` source code.

---

## 2. Program Entry Point

> Based on HAMI v2.3.13

HAMI first supported NVIDIA GPUs by implementing a separate device plugin for them.

- The startup file is in [`cmd/device-plugin/nvidia`](https://github.com/Project-HAMi/HAMi/tree/master/cmd/device-plugin/nvidia)

- The core logic is in [`pkg/device-plugin/nvidiadevice`](https://github.com/Project-HAMi/HAMi/tree/master/pkg/device-plugin/nvidiadevice)

> It is assumed that everyone is familiar with the k8s device plugin mechanism, so only the core code logic is analyzed here to keep the article concise.

For a device plugin, we generally focus on the following 3 methods:

- `Register`: Registers the plugin with the Kubelet; the `ResourceName` parameter is important.

- `ListAndWatch`: How the device plugin discovers and reports GPUs.

- `Allocate`: How the device plugin allocates GPUs to a Pod.

The startup command is in [`/cmd/device-plugin/nvidia`](https://github.com/Project-HAMi/HAMi/tree/master/cmd/device-plugin/nvidia), which uses ***github.com/urfave/cli/v2*** to build a command-line tool.

```go
func main() {
	var configFile string

	c := cli.NewApp()
	c.Name = "NVIDIA Device Plugin"
	c.Usage = "NVIDIA device plugin for Kubernetes"
	c.Version = info.GetVersionString()
	c.Action = func(ctx *cli.Context) error {
		return start(ctx, c.Flags)
	}

	c.Flags = []cli.Flag{
		&cli.StringFlag{
			Name:    "mig-strategy",
			Value:   spec.MigStrategyNone,
			Usage:   "the desired strategy for exposing MIG devices on GPUs that support it:\n\t\t[none | single | mixed]",
			EnvVars: []string{"MIG_STRATEGY"},
		},
		&cli.BoolFlag{
			Name:    "fail-on-init-error",
			Value:   true,
			Usage:   "fail the plugin if an error is encountered during initialization, otherwise block indefinitely",
			EnvVars: []string{"FAIL_ON_INIT_ERROR"},
		},
		&cli.StringFlag{
			Name:    "nvidia-driver-root",
			Value:   "/",
			Usage:   "the root path for the NVIDIA driver installation (typical values are '/' or '/run/nvidia/driver')",
			EnvVars: []string{"NVIDIA_DRIVER_ROOT"},
		},
		&cli.BoolFlag{
			Name:    "pass-device-specs",
			Value:   false,
			Usage:   "pass the list of DeviceSpecs to the kubelet on Allocate()",
			EnvVars: []string{"PASS_DEVICE_SPECS"},
		},
		&cli.StringSliceFlag{
			Name:    "device-list-strategy",
			Value:   cli.NewStringSlice(string(spec.DeviceListStrategyEnvvar)),
			Usage:   "the desired strategy for passing the device list to the underlying runtime:\n\t\t[envvar | volume-mounts | cdi-annotations]",
			EnvVars: []string{"DEVICE_LIST_STRATEGY"},
		},
		&cli.StringFlag{
			Name:    "device-id-strategy",
			Value:   spec.DeviceIDStrategyUUID,
			Usage:   "the desired strategy for passing device IDs to the underlying runtime:\n\t\t[uuid | index]",
			EnvVars: []string{"DEVICE_ID_STRATEGY"},
		},
		&cli.BoolFlag{
			Name:    "gds-enabled",
			Usage:   "ensure that containers are started with NVIDIA_GDS=enabled",
			EnvVars: []string{"GDS_ENABLED"},
		},
		&cli.BoolFlag{
			Name:    "mofed-enabled",
			Usage:   "ensure that containers are started with NVIDIA_MOFED=enabled",
			EnvVars: []string{"MOFED_ENABLED"},
		},
		&cli.StringFlag{
			Name:        "config-file",
			Usage:       "the path to a config file as an alternative to command line options or environment variables",
			Destination: &configFile,
			EnvVars:     []string{"CONFIG_FILE"},
		},
		&cli.StringFlag{
			Name:    "cdi-annotation-prefix",
			Value:   spec.DefaultCDIAnnotationPrefix,
			Usage:   "the prefix to use for CDI container annotation keys",
			EnvVars: []string{"CDI_ANNOTATION_PREFIX"},
		},
		&cli.StringFlag{
			Name:    "nvidia-ctk-path",
			Value:   spec.DefaultNvidiaCTKPath,
			Usage:   "the path to use for the nvidia-ctk in the generated CDI specification",
			EnvVars: []string{"NVIDIA_CTK_PATH"},
		},
		&cli.StringFlag{
			Name:    "container-driver-root",
			Value:   spec.DefaultContainerDriverRoot,
			Usage:   "the path where the NVIDIA driver root is mounted in the container; used for generating CDI specifications",
			EnvVars: []string{"CONTAINER_DRIVER_ROOT"},
		},
	}
	c.Flags = append(c.Flags, addFlags()...)
	err := c.Run(os.Args)
	if err != nil {
		klog.Error(err)
		os.Exit(1)
	}
}

func addFlags() []cli.Flag {
	addition := []cli.Flag{
		&cli.StringFlag{
			Name:    "node-name",
			Value:   os.Getenv(util.NodeNameEnvName),
			Usage:   "node name",
			EnvVars: []string{"NodeName"},
		},
		&cli.UintFlag{
			Name:    "device-split-count",
			Value:   2,
			Usage:   "the number for NVIDIA device split",
			EnvVars: []string{"DEVICE_SPLIT_COUNT"},
		},
		&cli.Float64Flag{
			Name:    "device-memory-scaling",
			Value:   1.0,
			Usage:   "the ratio for NVIDIA device memory scaling",
			EnvVars: []string{"DEVICE_MEMORY_SCALING"},
		},
		&cli.Float64Flag{
			Name:    "device-cores-scaling",
			Value:   1.0,
			Usage:   "the ratio for NVIDIA device cores scaling",
			EnvVars: []string{"DEVICE_CORES_SCALING"},
		},
		&cli.BoolFlag{
			Name:    "disable-core-limit",
			Value:   false,
			Usage:   "If set, the core utilization limit will be ignored",
			EnvVars: []string{"DISABLE_CORE_LIMIT"},
		},
		&cli.StringFlag{
			Name:  "resource-name",
			Value: "nvidia.com/gpu",
			Usage: "the name of field for number GPU visible in container",
		},
	}
	return addition
}
```

At startup, it does two things:
- Registers the plugin with the Kubelet
- Starts a gRPC service

We only need to focus on a few received parameters:

```go
&cli.UintFlag{
	Name:    "device-split-count",
	Value:   2,
	Usage:   "the number for NVIDIA device split",
	EnvVars: []string{"DEVICE_SPLIT_COUNT"},
},
&cli.Float64Flag{
	Name:    "device-memory-scaling",
	Value:   1.0,
	Usage:   "the ratio for NVIDIA device memory scaling",
	EnvVars: []string{"DEVICE_MEMORY_SCALING"},
},
&cli.Float64Flag{
	Name:    "device-cores-scaling",
	Value:   1.0,
	Usage:   "the ratio for NVIDIA device cores scaling",
	EnvVars: []string{"DEVICE_CORES_SCALING"},
},
&cli.BoolFlag{
	Name:    "disable-core-limit",
	Value:   false,
	Usage:   "If set, the core utilization limit will be ignored",
	EnvVars: []string{"DISABLE_CORE_LIMIT"},
},
&cli.StringFlag{
	Name:  "resource-name",
	Value: "nvidia.com/gpu",
	Usage: "the name of field for number GPU visible in container",
},
```
- `device-split-count`: Represents the number of splits for a GPU. No single GPU can be allocated to more tasks than its configured count. If it's set to N, a maximum of N tasks can exist on each GPU simultaneously. (It is recommended to adjust this dynamically based on GPU performance; a value greater than 10 is generally suggested.)
- `device-memory-scaling`: Represents the GPU memory oversubscription ratio. The default is 1.0. A value greater than 1.0 enables virtual memory (experimental feature), and it is not recommended to change it.
- `device-cores-scaling`: Represents the GPU core oversubscription ratio, default is 1.0.
- `disable-core-limit`: Whether to disable the GPU Core Limit. Default is false, not recommended to change.
- `resource-name`: The resource name. It is recommended to change this, as using the default `nvidia.com/gpu` conflicts with the native NVIDIA resource.

---
## 3. Register

The `Register` method is implemented as follows:

```go
// pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go#L222

// Register registers the device plugin for the given resourceName with Kubelet.
func (plugin *NvidiaDevicePlugin) Register() error {
	conn, err := plugin.dial(kubeletdevicepluginv1beta1.KubeletSocket, 5*time.Second)
	if err != nil {
		return err
	}
	defer conn.Close()

	client := kubeletdevicepluginv1beta1.NewRegistrationClient(conn)
	reqt := &kubeletdevicepluginv1beta1.RegisterRequest{
		Version:      kubeletdevicepluginv1beta1.Version,
		Endpoint:     path.Base(plugin.socket),
		ResourceName: string(plugin.rm.Resource()),
		Options: &kubeletdevicepluginv1beta1.DevicePluginOptions{
			GetPreferredAllocationAvailable: false,
		},
	}

	_, err = client.Register(context.Background(), reqt)
	if err != nil {
		return err
	}
	return nil
}
```

Key information during device plugin registration:

- **ResourceName**: The resource name. This device plugin will be used when this name matches the resource requested by a Pod for vGPU. (This can be configured at device plugin startup, typically with a flag like `--resource-name=nvidia.com/vgpu`).
- **Version**: The device plugin version, here it's `v1beta1`.
- **Endpoint**: The access address of the device plugin. The Kubelet interacts with the device plugin via this socket. (HAMI uses the format `/var/lib/kubelet/device-plugins/nvidia-xxx.sock`, where `xxx` is parsed from the `ResourceName`. For example, for `nvidia.com/vgpu`, `xxx` would be `vgpu`.)

Assuming we use the default values, `ResourceName` is **nvidia.com/gpu** and `Endpoint` is **/var/lib/kubelet/device-plugins/nvidia-gpu.sock**.

- Subsequently, when a Pod requests the `nvidia.com/gpu` resource, it will be handled by this device plugin for resource allocation. The Kubelet will call the device plugin API via the `/var/lib/kubelet/device-plugins/nvidia-gpu.sock` file.
- Conversely, if we request `nvidia.com/gpu` in a Pod's resources, this `ResourceName` does not match the HAMI plugin, so it is not handled by the HAMI device plugin but by NVIDIA's own device plugin.

### WatchAndRegister

This is a special logic in the HAMI device plugin that adds the GPU information of the node as annotations to the Node object.
> It communicates directly with the kube-apiserver, bypassing the traditional device-plugin reporting process.

**The hami-scheduler will later use these reported annotations as part of its scheduling basis.** We will analyze this in detail when we discuss the hami-scheduler.

```go
func (plugin *NvidiaDevicePlugin) WatchAndRegister() {
	klog.Info("Starting WatchAndRegister")
	errorSleepInterval := time.Second * 5
	successSleepInterval := time.Second * 30
	for {
		err := plugin.RegistrInAnnotation()
		if err != nil {
			klog.Errorf("Failed to register annotation: %v", err)
			klog.Infof("Retrying in %v seconds...", errorSleepInterval)
			time.Sleep(errorSleepInterval)
		} else {
			klog.Infof("Successfully registered annotation. Next check in %v seconds...", successSleepInterval)
			time.Sleep(successSleepInterval)
		}
	}
}
```

### getAPIDevices ###

This function gets the GPU information on the Node and assembles it into `api.DeviceInfo` objects.

```go
func (plugin *NvidiaDevicePlugin) getAPIDevices() *[]*api.DeviceInfo {
	devs := plugin.Devices()
	nvml.Init()
	res := make([]*api.DeviceInfo, 0, len(devs))
	idx := 0
	for idx < len(devs) {
		ndev, ret := nvml.DeviceGetHandleByIndex(idx)
		if ret != nvml.SUCCESS {
			klog.Errorln("nvml new device by index error idx=", idx, "err=", ret)
			panic(0)
		}

		memoryTotal := 0
		memory, ret := ndev.GetMemoryInfo()
		if ret == nvml.SUCCESS {
			memoryTotal = int(memory.Total)
		} else {
			klog.Error("nvml get memory error ret=", ret)
			panic(0)
		}

		UUID, ret := ndev.GetUUID()
		if ret != nvml.SUCCESS {
			klog.Error("nvml get uuid error ret=", ret)
			panic(0)
		}

		Model, ret := ndev.GetName()
		if ret != nvml.SUCCESS {
			klog.Error("nvml get name error ret=", ret)
			panic(0)
		}

		registeredmem := int32(memoryTotal / 1024 / 1024)
		if *util.DeviceMemoryScaling != 1 {
			registeredmem = int32(float64(registeredmem) * *util.DeviceMemoryScaling)
		}
		klog.Infoln("MemoryScaling=", *util.DeviceMemoryScaling, "registeredmem=", registeredmem)

		health := true
		for _, val := range devs {
			if strings.Compare(val.ID, UUID) == 0 {
				if strings.EqualFold(val.Health, "healthy") {
					health = true
				} else {
					health = false
				}
				break
			}
		}

		numa, err := plugin.getNumaInformation(idx)
		if err != nil {
			klog.ErrorS(err, "failed to get numa information", "idx", idx)
		}

		res = append(res, &api.DeviceInfo{
			ID:      UUID,
			Count:   int32(*util.DeviceSplitCount),
			Devmem:  registeredmem,
			Devcore: int32(*util.DeviceCoresScaling * 100),
			Type:    fmt.Sprintf("%v-%v", "NVIDIA", Model),
			Numa:    numa,
			Health:  health,
		})

		idx++
		klog.Infof("nvml registered device id=%v, memory=%v, type=%v, numa=%v", idx, registeredmem, Model, numa)
	}
	return &res
}
```

The core part:

```go
// Get GPU info via NVML library
ndev, ret := nvml.DeviceGetHandleByIndex(idx)
memoryTotal := 0
memory, ret := ndev.GetMemoryInfo()
if ret == nvml.SUCCESS {
    memoryTotal = int(memory.Total)
}
UUID, ret := ndev.GetUUID()
Model, ret := ndev.GetName()

// Handle Scaling
registeredmem := int32(memoryTotal / 1024 / 1024)
if *util.DeviceMemoryScaling != 1 {
    registeredmem = int32(float64(registeredmem) * *util.DeviceMemoryScaling)
}

// Assemble the result and return
res = append(res, &api.DeviceInfo{
    ID:      UUID,
    Count:   int32(*util.DeviceSplitCount),
    Devmem:  registeredmem,
    Devcore: int32(*util.DeviceCoresScaling * 100),
    Type:    fmt.Sprintf("%v-%v", "NVIDIA", Model),
    Numa:    numa,
    Health:  health,
})
```

### Update Node Annotations ###

After getting the device information, it calls the kube-apiserver to update the Node object's annotations to store the device info.

```go
encodeddevices := util.EncodeNodeDevices(*devices)
annos[nvidia.HandshakeAnnos] = "Reported " + time.Now().String()
annos[nvidia.RegisterAnnos]  = encodeddevices
klog.Infof("patch node with the following annos %v", fmt.Sprintf("%v", annos))
err = util.PatchNodeAnnotations(node, annos)
```
Normally, information should be reported through the k8s device plugin interface, but this is a special logic of HAMI.

### Demo ###
Let's check the annotations on the Node to see what data is recorded.

```yaml
apiVersion: v1
kind: Node
metadata:
  annotations:
    hami.io/node-handshake: Requesting_2024.09.25 07:48:26
    hami.io/node-nvidia-register: 'GPU-03f69c50-207a-2038-9b45-23cac89cb67d,10,46068,100,NVIDIA-NVIDIA A40,0,true:GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,10,46068,100,NVIDIA-NVIDIA A40,0,true:'
```
`hami.io/node-nvidia-register` is the GPU information updated to the Node by HAMI's device plugin. Let's format it:
```
GPU-03f69c50-207a-2038-9b45-23cac89cb67d,10,46068,100,NVIDIA-NVIDIA A40,0,true:
GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,10,46068,100,NVIDIA-NVIDIA A40,0,true:
```There are two A40 GPUs on the current node.

- `GPU-03f69c50-207a-2038-9b45-23cac89cb67d`: The UUID of the GPU device.
- `10,46068,100`: Split into 10 parts, each card has 46068MB of memory, and 100 cores (indicating no oversubscription is configured).
- `NVIDIA-NVIDIA`: GPU type.
- `A40`: GPU model.
- `0`: Represents the GPU's NUMA architecture.
- `true`: Indicates the GPU is healthy.
- `:`: The final colon is a delimiter.

> PS: This information will be used by the hami-scheduler during scheduling, which we will ignore for now.

### Summary ###
The `Register` method is divided into two parts:
- `Register`: Registers the device plugin with the kubelet.
- `WatchAndRegister`: Discovers GPU information on the Node and interacts with the kube-apiserver to add this information as annotations to the Node object for later use by the hami-scheduler.

## 4. ListAndWatch

The `ListAndWatch` method is used to discover devices on the node and report them to the Kubelet.
Since the same GPU needs to be split for use by multiple Pods, HAMI's device plugin also has a device replication operation similar to TimeSlicing.

The implementation is as follows:
```go
// ListAndWatch lists devices and update that list according to the health status
func (plugin *NvidiaDevicePlugin) ListAndWatch(e *kubeletdevicepluginv1beta1.Empty, s kubeletdevicepluginv1beta1.DevicePlugin_ListAndWatchServer) error {
	s.Send(&kubeletdevicepluginv1beta1.ListAndWatchResponse{Devices: plugin.apiDevices()})

	for {
		select {
		case <-plugin.stop:
			return nil
		case d := <-plugin.health:
			// FIXME: there is no way to recover from the Unhealthy state.
			d.Health = kubeletdevicepluginv1beta1.Unhealthy
			klog.Infof("'%s' device marked unhealthy: %s", plugin.rm.Resource(), d.ID)
			s.Send(&kubeletdevicepluginv1beta1.ListAndWatchResponse{Devices: plugin.apiDevices()})
		}
	}
}
```
The actual implementation is in **plugin.apiDevices**, which involves several jumps and ultimately resides in the `buildGPUDeviceMap` method:

```go
// VisitDevices visits each top-level device and invokes a callback function for it
func (d *devicelib) VisitDevices(visit func(int, Device) error) error {
	count, ret := d.nvml.DeviceGetCount()
	if ret != nvml.SUCCESS {
		return fmt.Errorf("error getting device count: %v", ret)
	}

	for i := 0; i < count; i++ {
		device, ret := d.nvml.DeviceGetHandleByIndex(i)
		if ret != nvml.SUCCESS {
			return fmt.Errorf("error getting device handle for index '%v': %v", i, ret)
		}
		dev, err := d.newDevice(device)
		if err != nil {
			return fmt.Errorf("error creating new device wrapper: %v", err)
		}

		isSkipped, err := dev.isSkipped()
		if err != nil {
			return fmt.Errorf("error checking whether device is skipped: %v", err)
		}
		if isSkipped {
			continue
		}
		err = visit(i, dev)
		if err != nil {
			return fmt.Errorf("error visiting device: %v", err)
		}
	}
	return nil
}

// buildGPUDeviceMap builds a map of resource names to GPU devices
func (b *deviceMapBuilder) buildGPUDeviceMap() (DeviceMap, error) {
	devices := make(DeviceMap)

	b.VisitDevices(func(i int, gpu device.Device) error {
		name, ret := gpu.GetName()
		if ret != nvml.SUCCESS {
			return fmt.Errorf("error getting product name for GPU: %v", ret)
		}
		migEnabled, err := gpu.IsMigEnabled()
		if err != nil {
			return fmt.Errorf("error checking if MIG is enabled on GPU: %v", err)
		}
		if migEnabled && *b.config.Flags.MigStrategy != spec.MigStrategyNone {
			return nil
		}
		for _, resource := range b.config.Resources.GPUs {
			if resource.Pattern.Matches(name) {
				index, info := newGPUDevice(i, gpu)
				return devices.setEntry(resource.Name, index, info)
			}
		}
		return fmt.Errorf("GPU name '%v' does not match any resource patterns", name)
	})
	return devices, nil
}
```
It also uses the NVML library directly to get GPU information.

Then, similar to TimeSlicing, it replicates the GPU based on `DeviceSplitCount`:
```go
// GetPluginDevices returns the plugin Devices from all devices in the Devices
func (ds Devices) GetPluginDevices() []*kubeletdevicepluginv1beta1.Device {
	var res []*kubeletdevicepluginv1beta1.Device

	if !strings.Contains(ds.GetIDs()[0], "MIG") {
		for _, dev := range ds {
			for i := uint(0); i < *util.DeviceSplitCount; i++ {
				id := fmt.Sprintf("%v-%v", dev.ID, i)
				res = append(res, &kubeletdevicepluginv1beta1.Device{
					ID:       id,
					Health:   dev.Health,
					Topology: nil,
				})
			}
		}
	} else {
		for _, d := range ds {
			res = append(res, &d.Device)
		}
	}

	return res
}
```

The core part:
```go
for _, dev := range ds {
	for i := uint(0); i < *util.DeviceSplitCount; i++ {
		id := fmt.Sprintf("%v-%v", dev.ID, i)
		res = append(res, &kubeletdevicepluginv1beta1.Device{
			ID:       id,
			Health:   dev.Health,
			Topology: nil,
		})
	}
}
```

### Summary ###
`ListAndWatch` has no significant extra logic; its main function is similar to TimeSlicing, replicating devices based on `DeviceSplitCount`.
Although HAMI can achieve GPU splitting, in Kubernetes, each Pod consumes the requested resource entirely. Therefore, to comply with Kubernetes logic, physical GPUs are typically replicated to allow more GPU tasks to run.

## 5. Allocate ##

HAMI's `Allocate` implementation consists of two parts:

- **HAMI's custom logic**: This mainly involves setting corresponding environment variables based on the resources requested in the Pod's spec, and mounting `libvgpu.so` to replace the native driver in the Pod.
- **NVIDIA's native logic**: This involves setting the `NVIDIA_VISIBLE_DEVICES` environment variable, which then allows the NVIDIA Container Toolkit to allocate a GPU to the container.

Since HAMI does not have the ability to allocate GPUs to containers itself, it incorporates NVIDIA's native logic in addition to its own custom logic.
This way, the Pod has the necessary environment variables, the NVIDIA Container Toolkit allocates a GPU to it, and HAMI's custom logic replaces `libvgpu.so` and adds some environment variables to enforce GPU limits.

### HAMI's Custom Logic ###

HAMI's nvidia-device-plugin `Allocate` implementation is as follows:
```go
// pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go#L290
func (plugin *NvidiaDevicePlugin) Allocate(ctx context.Context, reqs *kubeletdevicepluginv1beta1.AllocateRequest) (*kubeletdevicepluginv1beta1.AllocateResponse, error) {
	klog.InfoS("Allocate", "request", reqs)
	responses := kubeletdevicepluginv1beta1.AllocateResponse{}
	nodename := os.Getenv(util.NodeNameEnvName)
	current, err := util.GetPendingPod(ctx, nodename)
	if err != nil {
		nodelock.ReleaseNodeLock(nodename, NodeLockNvidia)
		return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
	}
	klog.V(5).Infof("allocate pod name is %s/%s, annotation is %+v", current.Namespace, current.Name, current.Annotations)

	for idx, req := range reqs.ContainerRequests {
		// If the devices being allocated are replicas, then (conditionally)
		// error out if more than one resource is being allocated.
		if strings.Contains(req.DevicesIDs[0], "MIG") {
			if plugin.config.Sharing.TimeSlicing.FailRequestsGreaterThanOne && rm.AnnotatedIDs(req.DevicesIDs).AnyHasAnnotations() {
				if len(req.DevicesIDs) > 1 {
					return nil, fmt.Errorf("request for '%v: %v' too large: maximum request size for shared resources is 1", plugin.rm.Resource(), len(req.DevicesIDs))
				}
			}
			for _, id := range req.DevicesIDs {
				if !plugin.rm.Devices().Contains(id) {
					return nil, fmt.Errorf("invalid allocation request for '%s': unknown device: %s", plugin.rm.Resource(), id)
				}
			}
			response, err := plugin.getAllocateResponse(req.DevicesIDs)
			if err != nil {
				return nil, fmt.Errorf("failed to get allocate response: %v", err)
			}
			responses.ContainerResponses = append(responses.ContainerResponses, response)
		} else {
			currentCtr, devreq, err := util.GetNextDeviceRequest(nvidia.NvidiaGPUDevice, *current)
			klog.Infoln("deviceAllocateFromAnnotation=", devreq)
			if err != nil {
				device.PodAllocationFailed(nodename, current, NodeLockNvidia)
				return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
			}
			if len(devreq) != len(reqs.ContainerRequests[idx].DevicesIDs) {
				device.PodAllocationFailed(nodename, current, NodeLockNvidia)
				return &kubeletdevicepluginv1beta1.AllocateResponse{}, errors.New("device number not matched")
			}
			response, err := plugin.getAllocateResponse(util.GetContainerDeviceStrArray(devreq))
			if err != nil {
				return nil, fmt.Errorf("failed to get allocate response: %v", err)
			}

			err = util.EraseNextDeviceTypeFromAnnotation(nvidia.NvidiaGPUDevice, *current)
			if err != nil {
				device.PodAllocationFailed(nodename, current, NodeLockNvidia)
				return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
			}

			for i, dev := range devreq {
				limitKey := fmt.Sprintf("CUDA_DEVICE_MEMORY_LIMIT_%v", i)
				response.Envs[limitKey] = fmt.Sprintf("%vm", dev.Usedmem)
			}
			response.Envs["CUDA_DEVICE_SM_LIMIT"] = fmt.Sprint(devreq[0].Usedcores)
			response.Envs["CUDA_DEVICE_MEMORY_SHARED_CACHE"] = fmt.Sprintf("%s/vgpu/%v.cache", hostHookPath, uuid.New().String())
			if *util.DeviceMemoryScaling > 1 {
				response.Envs["CUDA_OVERSUBSCRIBE"] = "true"
			}
			if *util.DisableCoreLimit {
				response.Envs[api.CoreLimitSwitch] = "disable"
			}

			cacheFileHostDirectory := fmt.Sprintf("%s/vgpu/containers/%s_%s", hostHookPath, current.UID, currentCtr.Name)
			os.RemoveAll(cacheFileHostDirectory)
			os.MkdirAll(cacheFileHostDirectory, 0777)
			os.Chmod(cacheFileHostDirectory, 0777)
			os.MkdirAll("/tmp/vgpulock", 0777)
			os.Chmod("/tmp/vgpulock", 0777)

			response.Mounts = append(response.Mounts,
				&kubeletdevicepluginv1beta1.Mount{
					ContainerPath: fmt.Sprintf("%s/vgpu/libvgpu.so", hostHookPath),
					HostPath:      hostHookPath + "/vgpu/libvgpu.so",
					ReadOnly:      true,
				},
				&kubeletdevicepluginv1beta1.Mount{
					ContainerPath: fmt.Sprintf("%s/vgpu", hostHookPath),
					HostPath:      cacheFileHostDirectory,
					ReadOnly:      false,
				},
				&kubeletdevicepluginv1beta1.Mount{
					ContainerPath: "/tmp/vgpulock",
					HostPath:      "/tmp/vgpulock",
					ReadOnly:      false,
				},
			)

			found := false
			for _, val := range currentCtr.Env {
				if strings.Compare(val.Name, "CUDA_DISABLE_CONTROL") == 0 {
					t, _ := strconv.ParseBool(val.Value)
					if !t {
						continue
					}
					found = true
					break
				}
			}
			if !found {
				response.Mounts = append(response.Mounts, &kubeletdevicepluginv1beta1.Mount{
					ContainerPath: "/etc/ld.so.preload",
					HostPath:      hostHookPath + "/vgpu/ld.so.preload",
					ReadOnly:      true,
				})
			}

			_, err = os.Stat(fmt.Sprintf("%s/vgpu/license", hostHookPath))
			if err == nil {
				response.Mounts = append(response.Mounts,
					&kubeletdevicepluginv1beta1.Mount{
						ContainerPath: "/tmp/license",
						HostPath:      fmt.Sprintf("%s/vgpu/license", hostHookPath),
						ReadOnly:      true,
					},
					&kubeletdevicepluginv1beta1.Mount{
						ContainerPath: "/usr/bin/vgpuvalidator",
						HostPath:      fmt.Sprintf("%s/vgpu/vgpuvalidator", hostHookPath),
						ReadOnly:      true,
					},
				)
			}
			responses.ContainerResponses = append(responses.ContainerResponses, response)
		}
	}
	klog.Infoln("Allocate Response", responses.ContainerResponses)
	device.PodAllocationTrySuccess(nodename, nvidia.NvidiaGPUDevice, NodeLockNvidia, current)
	return &responses, nil
}
```
This is quite long, so let's focus on the core parts and ignore MIG-related logic for now.
First, it adds a `CUDA_DEVICE_MEMORY_LIMIT_$Index` environment variable for GPU memory limitation.
```go
for i, dev := range devreq {
    limitKey := fmt.Sprintf("CUDA_DEVICE_MEMORY_LIMIT_%v", i)
    response.Envs[limitKey] = fmt.Sprintf("%vm", dev.Usedmem)

    /*tmp := response.Envs["NVIDIA_VISIBLE_DEVICES"]
    if i > 0 {
        response.Envs["NVIDIA_VISIBLE_DEVICES"] = fmt.Sprintf("%v,%v", tmp, dev.UUID)
    } else {
        response.Envs["NVIDIA_VISIBLE_DEVICES"] = dev.UUID
    }*/
}
```

Then, it configures the environment variable for GPU core limitation based on the requested `gpucores`.
```go
response.Envs["CUDA_DEVICE_SM_LIMIT"] = fmt.Sprint(devreq[0].Usedcores)
```
This is used to set the location of the share_region mmap file in the container.
```go
response.Envs["CUDA_DEVICE_MEMORY_SHARED_CACHE"] = fmt.Sprintf("%s/vgpu/%v.cache", hostHookPath, uuid.New().String())
```
GPU memory oversubscription.```go
if *util.DeviceMemoryScaling > 1 {
	response.Envs["CUDA_OVERSUBSCRIBE"] = "true"
}
```
Whether to disable the compute power limit.
```go
if *util.DisableCoreLimit {
	response.Envs[api.CoreLimitSwitch] = "disable"
}
```
Mounting vgpu related files.
> This is where the replacement of the `libvgpu.so` library is implemented.
```go
// Cache file storage location /usr/local/vgpu/containers/xxx/xxx
cacheFileHostDirectory := fmt.Sprintf("%s/vgpu/containers/%s_%s", hostHookPath, current.UID, currentCtr.Name)
os.RemoveAll(cacheFileHostDirectory)

os.MkdirAll(cacheFileHostDirectory, 0777)
os.Chmod(cacheFileHostDirectory, 0777)
os.MkdirAll("/tmp/vgpulock", 0777)
os.Chmod("/tmp/vgpulock", 0777)

response.Mounts = append(response.Mounts,
	// Mount libvgpu.so from the host to the pod to replace nvidia's default driver
	&kubeletdevicepluginv1beta1.Mount{
		ContainerPath: fmt.Sprintf("%s/vgpu/libvgpu.so", hostHookPath),
		HostPath:      hostHookPath + "/vgpu/libvgpu.so",
		ReadOnly:      true,
	},
	// Mount a random file into the pod for vgpu use
	&kubeletdevicepluginv1beta1.Mount{
		ContainerPath: fmt.Sprintf("%s/vgpu", hostHookPath),
		HostPath:      cacheFileHostDirectory,
		ReadOnly:      false,
	},
	// A lock file
	&kubeletdevicepluginv1beta1.Mount{
		ContainerPath: "/tmp/vgpulock",
		HostPath:      "/tmp/vgpulock",
		ReadOnly:      false,
	},
)
```
Replacing the dynamic library. This is done when `CUDA_DISABLE_CONTROL=true` is not specified.

```go
found := false
for _, val := range currentCtr.Env {
	if strings.Compare(val.Name, "CUDA_DISABLE_CONTROL") == 0 {
		// If the environment variable exists but is false or fails to parse, ignore it
		t, _ := strconv.ParseBool(val.Value)
		if !t {
			continue
		}
		// Only mark as found if the environment variable exists and is true
		found = true
		break
	}
}
if !found {
	response.Mounts = append(response.Mounts,
		&kubeletdevicepluginv1beta1.Mount{
			ContainerPath: "/etc/ld.so.preload",
			HostPath:      hostHookPath + "/vgpu/ld.so.preload",
			ReadOnly:      true,
		},
	)
}```
The entire implementation is relatively easy to understand. It adds a series of environment variables to the Pod and adds Mounts configurations to replace `libvgpu.so`. This `libvgpu.so` will then enforce Core & Memory limits based on these environment variables.

### NVIDIA ###

```go
// pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go#L423
func (plugin *NvidiaDevicePlugin) getAllocateResponse(requestIds []string) (*kubeletdevicepluginv1beta1.ContainerAllocateResponse, error) {
	deviceIDs := plugin.deviceIDsFromAnnotatedDeviceIDs(requestIds)

	responseID := uuid.New().String()
	response, err := plugin.getAllocateResponseForCDI(responseID, deviceIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get allocate response for CDI: %v", err)
	}

	response.Envs = plugin.apiEnvs(plugin.deviceListEnvvar, deviceIDs)

	if *plugin.config.Flags.Plugin.PassDeviceSpecs {
		response.Devices = plugin.apiDeviceSpecs(*plugin.config.Flags.NvidiaDriverRoot, requestIds)
	}
	if *plugin.config.Flags.GDSEnabled {
		response.Envs["NVIDIA_GDS"] = "enabled"
	}
	if *plugin.config.Flags.MOFEDEnabled {
		response.Envs["NVIDIA_MOFED"] = "enabled"
	}

	return &response, nil
}
```

The core part is this line, which adds an environment variable:
```go
response.Envs = plugin.apiEnvs(plugin.deviceListEnvvar, deviceIDs)
```
And the value of `plugin.deviceListEnvvar` comes from:
```go
// NewNvidiaDevicePlugin returns an initialized NvidiaDevicePlugin
func NewNvidiaDevicePlugin(config *util.DeviceConfig, resourceManager rm.ResourceManager, cdiHandler cdi.Interface, cdiEnabled bool) *NvidiaDevicePlugin {
	_, name := resourceManager.Resource().Split()

	deviceListStrategies, _ := spec.NewDeviceListStrategies(*config.Flags.Plugin.DeviceListStrategy)

	return &NvidiaDevicePlugin{
		rm:                   resourceManager,
		config:               config,
		deviceListEnvvar:     "NVIDIA_VISIBLE_DEVICES",
		deviceListStrategies: deviceListStrategies,
		socket:               kubeletdevicepluginv1beta1.DevicePluginPath + "nvidia-" + name + ".sock",
		cdiHandler:           cdiHandler,
		cdiEnabled:           cdiEnabled,
		cdiAnnotationPrefix:  *config.Flags.Plugin.CDIAnnotationPrefix,

		// These will be reinitialized every time the plugin server is restarted.
		server: nil,
		health: nil,
		stop:   nil,
	}
}
```
That is: **NVIDIA_VISIBLE_DEVICES**

Coincidentally, this ENV is part of the NVIDIA device plugin's implementation. After setting this environment variable, the `nvidia-container-toolkit` will allocate GPUs to containers that have this variable.

> HAMI reuses the capability of `nvidia-container-toolkit` to allocate GPUs to Pods here.

### Summary ###
The core of the `Allocate` method involves three things:

- HAMI's custom logic (adding environment variables `CUDA_DEVICE_MEMORY_LIMIT_X` and `CUDA_DEVICE_SM_LIMIT` for resource limitation; mounting `libvgpu.so` into the Pod for replacement).
- NVIDIA's native logic (adding the `NVIDIA_VISIBLE_DEVICES` environment variable for GPU allocation, leveraging the NVIDIA Container Toolkit to mount the GPU into the Pod).

## 6. Summary ##

At this point, the working principle of HAMI's NVIDIA device plugin is clear.

- First, during `Register`, the plugin registers itself. It can be configured with a different `ResourceName` than the native NVIDIA device plugin to distinguish them. (It also starts a background goroutine, `WatchAndRegister`, to periodically update GPU information onto the Node object's annotations for the Scheduler's use.)
- Then, `ListAndWatch` discovers devices and replicates them according to the configuration, allowing the same device to be allocated to multiple Pods. (This is the same as the TimeSlicing solution.)
- Finally, the `Allocate` method mainly does three things:
    1.  Adds the `NVIDIA_VISIBLE_DEVICES` environment variable to the container, leveraging the NVIDIA Container Toolkit to allocate a GPU to the container.
    2.  Adds `Mounts` configurations to mount `libvgpu.so` into the container, replacing the original driver.
    3.  Adds some of HAMI's custom environment variables like `CUDA_DEVICE_MEMORY_LIMIT_X` and `CUDA_DEVICE_SM_LIMIT` to the container, which, in conjunction with `libvgpu.so`, enforce GPU core and memory limits.

**The core is really in the `Allocate` method: adding the `CUDA_DEVICE_MEMORY_LIMIT_X` and `CUDA_DEVICE_SM_LIMIT` environment variables to the container and mounting `libvgpu.so` to replace the original driver.**

After the container starts, CUDA API requests first pass through `libvgpu.so`, which then enforces Core & Memory limits based on the `CUDA_DEVICE_MEMORY_LIMIT_X` and `CUDA_DEVICE_SM_LIMIT` environment variables.

Finally, to answer the question posed at the beginning: **Why did HAMI need to implement its own device plugin? Does `hami-device-plugin-nvidia` have features that the native NVIDIA device plugin lacks?**

The HAMI device plugin has made several modifications compared to the native NVIDIA device plugin:

1.  During registration, it starts an additional background goroutine, `WatchAndRegister`, to periodically update GPU information to the Node object's annotations for the Scheduler's use.
2.  `ListAndWatch` discovers devices and replicates them according to the configuration, allowing the same physical GPU to be allocated to multiple Pods (the native NVIDIA device plugin also has this, known as the TimeSlicing solution).
3.  `Allocate` adds HAMI's custom logic:
    - (Mounting `libvgpu.so` into the container to replace the original driver).
    - (Specifying some of HAMI's custom environment variables like `CUDA_DEVICE_MEMORY_LIMIT_X` and `CUDA_DEVICE_SM_LIMIT`, which work with `libvgpu.so` to enforce GPU core and memory limits).

---
## 7. FAQ ##

### How does `libvgpu.so` get on the Node? ###
The `Allocate` method needs to mount `libvgpu.so` into the Pod. It uses a `HostPath` mount, which means `libvgpu.so` must exist on the host machine.

**So the question is, how does `libvgpu.so` get onto the host machine?**
This is actually packaged within the device-plugin image provided by HAMI. When the device-plugin starts, it copies it from the Pod to the host. The relevant YAML is as follows:

```yaml
- name: NVIDIA_MIG_MONITOR_DEVICES
  value: all
- name: HOOK_PATH
  value: /usr/local
image: 192.168.116.54:5000/projecthami/hami:v2.3.13
imagePullPolicy: IfNotPresent
lifecycle:
  postStart:
    exec:
      command:
      - /bin/sh
      - -c
      - cp -f /k8s-vgpu/lib/nvidia/* /usr/local/vgpu/
name: device-plugin
resources: {}
securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    add:
    - SYS_ADMIN
    drop:
    - ALL
terminationMessagePath: /dev/termination-log
terminationMessagePolicy: File
volumeMounts:
- mountPath: /var/lib/kubelet/device-plugins
  name: device-plugin
- mountPath: /usr/local/vgpu
  name: lib
```

A hostPath is mounted into the container, and then the container executes the command **`cp -f /k8s-vgpu/lib/nvidia/* /usr/local/vgpu/`** to copy it to the host.

---
*To learn more about the HAMI project, please visit the [GitHub repository](https://github.com/Project-HAMi/HAMi) or join our [Slack community](https://cloud-native.slack.com/archives/C07T10BU4R2).*