---
title: "HAMi vGPU 方案原理分析 Part1：hami-device-plugin-nvidia 实现"
slug: "open-source-vgpu-hami-device-plugin-nvidia"
date: "2025-07-23"
excerpt: "本文为开源的vGPU方案HAMi实现原理分析第一篇，主要分析 hami-device-plugin-nvidia 实现原理。"
author: "密瓜智能"
tags: ["HAMI", "GPU 共享", "vGPU", "Kubernetes", "异构算力"]
coverImage: "/images/blog/gpu3/cover.jpg"
language: "zh"
---


# 开源 vGPU 方案 HAMI 原理分析 Part1: hami-device-plugin-nvidia

本文为开源 vGPU 方案 HAMI 实现原理分析第一篇，主要分析 hami-device-plugin-nvidia 实现原理。

之前在 [开源 vGPU 方案：HAMi，实现细粒度 GPU 切分](https://dynamia.ai/zh/blog/open-source-vgpu-hami-fine-grained-partitioning)介绍了HAMi是什么，然后在 [开源 vGPU 方案 HAMi: Core & Memory 隔离测试](https://dynamia.ai/zh/blog/open-source-vgpu-hami-core-memory-test)中对HAMi提供的 vGPU 方案进行了测试。

接下来则是逐步分析 HAMI 中的 vGPU 实现原理，涉及到的东西比较多，暂定分为几部分：

1. **ami-device-plugin-nvidia**：HAMI 版本的 device-plugin 中 GPU 感知以及分配逻辑怎么样实现的，和 NVIDIA 官方的 device-plugin 有何不同。

2. **hami-scheduler**：HAMI 是如何调度调度的，impack/spread 高可用调度策略是怎么实现的

3. **hami-core（也叫作 cgroup-hook)**：这也是 HAMI 实现 vGPU 方案核心的部分，HAMI 是如何通过拦截 CUDA API 来实现 Core&Memory 隔离限制的

本文为第一篇，分析 hami-device-plugin-nvidia 实现原理。

---

## 1. 概述

NVIDIA 是有自己实现 device-plugin 的，那么问题来了：**HAMI 为什么还要自己实现一个 device plugin 呢？**

是 ***hami-device-plugin-nvidia*** 是有哪些 ***NVIDIA*** 原生 ***device plugin*** 没有的功能吗？带着疑问，我们开始查看 hami-device-plugin-nvidia 源码。

---

## 2.程序入口

> 基于HAMi v2.3.13版本

HAMi 首先支持的是NVIDIA GPU，单独实现了一个device plugin nvidia。

- 启动文件在 [`cmd/device-plugin/nvidia`](https://github.com/Project-HAMi/HAMi/tree/master/cmd/device-plugin/nvidia)

- 核心实在在 [`pkg/device-plugin/nvidiadevice`](https://github.com/Project-HAMi/HAMi/tree/master/pkg/device-plugin/nvidiadevice)

> 默认大家都对 k8s 的 device plugin 机制比较熟悉了，因此这里只分析核心代码逻辑，不然篇幅就太长了。

对于一个 device plugin 我们一般关注以下 3 个方法：

- Register：将插件注册到 Kubelet 的，参数 ResourceName 比较重要

- ListAndWatch：device plugin 是怎么感知 GPU 并上报的

- Allocate：device plugin 是如何将 GPU 分配给 Pod 的

启动命令在[`/cmd/device-plugin/nvidia`](https://github.com/Project-HAMi/HAMi/tree/master/cmd/device-plugin/nvidia)，用的是 ***github.com/urfave/cli/v2***构建的一个命令行工具。

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


启动时做了两件事：

- 将插件注册到Kubelet

- 启动一个gRPC服务

我们只需要关注一下接收的几个参数：

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

- device-split-count：表示 GPU 的分割数，每一张 GPU 都不能分配超过其配置数目的任务。若其配置为 N 的话，每个 GPU 上最多可以同时存在 N 个任务。
（建议根据 GPU 性能动态调整，一般建议大于 10。）

- device-memory-scaling：表示 GPU memory 的 oversubscription(超额订阅)** **比例，默认 1.0，大于 1.0 则表示启用虚拟显存（实验功能），不建议修改。

- device-cores-scaling：表示 GPU core 的 oversubscription(超额订阅)比例，默认 1.0。

- disable-core-limit：是否关闭 GPU Core Limit，默认 false，不建议修改。resource-name：资源名称，建议改掉，不推荐使用默认的 [NVIDIA GPU Resources](https://nvidia.com/gpu) 因为这个和 nvidia 原生的重复了。

---

## 3. Register

Register 方法实现如下：

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
device plugin 注册时的几个核心信息：

- **ResourceName**：资源名称，这个和创建 Pod 时申请 vGPU 的资源名匹配时就会使用到该 device plugin。
（也是可以在 deivce plugin 启动时配置的，一般叫做 --resource-name=nvidia.com/vgpu）

- **Version**：device plugin 的版本，这里是 v1beta1

- **Endpoint**：device plugin 的访问地址，Kubelet 会通过这个 sock 和 device plugin 进行交互。
（hami 用的格式为：/var/lib/kubelet/device-plugins/nvidia-xxx.sock，其中 xxx 是 从 ResourceName 中解析出来的，比如 nvidia.com/vgpu 那么这里的 xx 就是后面的 vgpu。）

假设我们都使用默认值，ResourceName 为 **nvidia.com/vgpu**，Endpoint 为 **/var/lib/kubelet/device-plugins/nvidia-vgpu.sock**。

- 后续 Pod Resource 中申请使用 nvidia.com/vgpu 资源时，就会由该 device plugin 来处理，实现资源分配，Kubelet 则是通过 var/lib/kubelet/device-plugins/nvidia-vgpu.sock 这个 sock 文件调用 device plugin API。

- 反之，我们在 Pod Resource 中申请使用 nvidia.com/gpu 时，这个 ResourceName 和 hami 插件不匹配，因此不由 hami device plugin nvidia 处理，而是由 nvidia 自己的 device plugin 进行处理。

### WatchAndRegister

这个是 HAMi device plugin 中的一个特殊逻辑，将 node 上的 GPU 信息以 annotations 的形式添加到 Node 对象上。

> 直接通过 kube-apiserver 通信，绕过传统 device-plugin 上报流程。

**后续 HAMi-Scheduler 在进行调度时就会用到这边上报的 annotations 作为调度依据的一部分**，分析 HAMi-Scheduler 时在仔细分析。

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

获取 Node 上的 GPU 信息，并组装成 api.DeviceInfo 对象。

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

核心部分

```go
// 通过 nvml 库获取 GPU 信息
ndev, ret := nvml.DeviceGetHandleByIndex(idx)
memoryTotal := 0
memory, ret := ndev.GetMemoryInfo()
if ret == nvml.SUCCESS {
    memoryTotal = int(memory.Total)
}
UUID, ret := ndev.GetUUID()
Model, ret := ndev.GetName()

// 处理 Scaling
registeredmem := int32(memoryTotal / 1024 / 1024)
if *util.DeviceMemoryScaling != 1 {
    registeredmem = int32(float64(registeredmem) * *util.DeviceMemoryScaling)
}

// 组装结果返回
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
### 更新到 Node Annoations ###

拿到 Device 信息之后，调用 kube-apiserver 更新 Node 对象的 Annoations 把 Device 信息存起来。

```go
encodeddevices := util.EncodeNodeDevices(*devices)
annos[nvidia.HandshakeAnnos] = "Reported " + time.Now().String()
annos[nvidia.RegisterAnnos]  = encodeddevices
klog.Infof("patch node with the following annos %v", fmt.Sprintf("%v", annos))
err = util.PatchNodeAnnotations(node, annos)
```

正常应该是走 k8s 的 device plugin 接口上报信息才对，这里是 HAMi 的特殊逻辑。

### Demo ###

查看 Node 上的 Annoations，看看这边记录了些什么数据

```yaml
apiVersion: v1
kind: Node
metadata:
  annotations:
    hami.io/node-handshake: Requesting_2024.09.25 07:48:26
    hami.io/node-nvidia-register: 'GPU-03f69c50-207a-2038-9b45-23cac89cb67d,10,46068,100,NVIDIA-NVIDIA A40,0,true:GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,10,46068,100,NVIDIA-NVIDIA A40,0,true:'
```

hami.io/node-nvidia-register 就是 HAMi 的 device plugin 更新到 Node 上的 GPU 信息，格式化一下

```go
GPU-03f69c50-207a-2038-9b45-23cac89cb67d,10,46068,100,NVIDIA-NVIDIA A40,0,true:
GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,10,46068,100,NVIDIA-NVIDIA A40,0,true:
```

当前节点上是两张 A40 GPU，

- GPU-03f69c50-207a-2038-9b45-23cac89cb67d：为 GPU 设备的 UUID

- 10,46068,100：切分为 10 份，每张卡 46068M 内存，core 为 100 个(说明没有配置 oversubscription)

- NVIDIA-NVIDIA：GPU 类型

- A40：GPU 型号

- 0：表示 GPU 的 NUMA 结构

- true：表示该 GPU 是健康的

- : 最后的冒号是分隔符

> ps：这部分信息后续 hami-scheduler 进行调度时会用到，这里暂时不管。

### 小结 ###

Register 方法分为两部分：
- Register：将 device plugin 注册到 kubelet

- WatchAndRegister：感知 Node 上的 GPU 信息，并和 kube-apiserver 交互，将这部分信息以 annotations 的形式添加到 Node 对象上,以便后续 hami-scheduler 使用。

## 4. ListAndWatch

ListAndWatch 方法用于感知节点上的设备并上报给 Kubelet。

由于需要将同一个 GPU 切分给多个 Pod 使用，因此 HAMi 的 device plugin 也会有类似 TimeSlicing 中的 Device 复制操作。

具体实现如下：

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

具体实现在 **plugin.apiDevices**,跳转比较多，最终实现在 buildGPUDeviceMap 方法里：

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

也是直接使用 nvml 库获取 GPU 信息。

然后和 TimeSlicing 类似，根据 DeviceSplitCount 对 GPU 进行复制：

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

核心部分

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

### 小结 ###

ListAndWatch 没有太多额外逻辑，主要和 TimeSlicing 类似的，根据 DeviceSplitCount 进行 Device 复制操作。

因为虽然 HAMi 可以实现 GPU 切分，但是 k8s 中每个 Pod 都会把申请的 Resource 消耗掉，因此为了符合 k8s 逻辑，一般都会选择对物理 GPU 进行复制，便于运行更多的 GPU。

## 5.Allocate ##

HAMi 的 Allocate 实现中包含两部分：

- **HAMi 的自定义逻辑**：主要是根据 Pod Resource 中的申请资源数量设置对应的环境变量，以及挂载 libvgpu.so 以替换 Pod 中的原生驱动

- **NVIDIA 的原生逻辑**：则是设置 NVIDIA_VISIBLE_DEVICES 这个环境变量，然后由 NVIDIA Container Toolkit 对该容器分配 GPU。

因为 HAMi 并没有为容器分配 GPU 的能力， 因此除了 HAMi 自定义的逻辑之外，还把 NVIDIA 的原生逻辑也加上了。

这样 Pod 中有环境变量， NVIDIA Container Toolkit 就会为其分配 GPU，然后 HAMi 自定义逻辑中替换 libvgpu.so 和添加部分环境变量，以此来实现了对 GPU 的限制。

### HAMi 自定义逻辑 ###

HAMi nvidia-device-plugin 的 Allocate 实现如下：

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

比较长，我们只需要关注核心部分，同时先忽略 MIG 相关的逻辑。

首先是添加一个 CUDA_DEVICE_MEMORY_LIMIT_$Index 的环境变量，用于 gpu memory 限制。

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

然后则是根据申请的 gpucores 配置 gpu core 限制的环境变量

```go
response.Envs["CUDA_DEVICE_SM_LIMIT"] = fmt.Sprint(devreq[0].Usedcores)
```

这个用于设置 share_region mmap 文件在容器中的位置

```go
response.Envs["CUDA_DEVICE_MEMORY_SHARED_CACHE"] = fmt.Sprintf("%s/vgpu/%v.cache", hostHookPath, uuid.New().String())
```

Gpu memory 超额订阅

```go
if *util.DeviceMemoryScaling > 1 {
	response.Envs["CUDA_OVERSUBSCRIBE"] = "true"
}
```

是否关闭算力限制

```go
if *util.DisableCoreLimit {
	response.Envs[api.CoreLimitSwitch] = "disable"
}
```

挂载 vgpu 相关文件

> 这里就实现了 libvgpu.so 库的替换。

```go
// 缓存文件存放位置 /usr/local/vgpu/containers/xxx/xxx
cacheFileHostDirectory := fmt.Sprintf("%s/vgpu/containers/%s_%s", hostHookPath, current.UID, currentCtr.Name)
os.RemoveAll(cacheFileHostDirectory)

os.MkdirAll(cacheFileHostDirectory, 0777)
os.Chmod(cacheFileHostDirectory, 0777)
os.MkdirAll("/tmp/vgpulock", 0777)
os.Chmod("/tmp/vgpulock", 0777)

response.Mounts = append(response.Mounts,
	// 宿主机上的 libvgpu.so挂载到 pod 里替换 nvidia 默认的驱动
	&kubeletdevicepluginv1beta1.Mount{
		ContainerPath: fmt.Sprintf("%s/vgpu/libvgpu.so", hostHookPath),
		HostPath:      hostHookPath + "/vgpu/libvgpu.so",
		ReadOnly:      true,
	},
	// 随机的文件挂载进 pod 作为 vgpu 使用
	&kubeletdevicepluginv1beta1.Mount{
		ContainerPath: fmt.Sprintf("%s/vgpu", hostHookPath),
		HostPath:      cacheFileHostDirectory,
		ReadOnly:      false,
	},
	// 一个 lock 文件
	&kubeletdevicepluginv1beta1.Mount{
		ContainerPath: "/tmp/vgpulock",
		HostPath:      "/tmp/vgpulock",
		ReadOnly:      false,
	},
)
```

替换动态库,当没有指定 CUDA_DISABLE_CONTROL=true 时就会做该处理

```go
found := false
for _, val := range currentCtr.Env {
	if strings.Compare(val.Name, "CUDA_DISABLE_CONTROL") == 0 {
		// 如果环境变量存在但为 false 或解析失败，则忽略
		t, _ := strconv.ParseBool(val.Value)
		if !t {
			continue
		}
		// 只有环境变量存在且为 true 时才标记 found
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
}
```

整个实现也算比较容易理解，就是给 Pod 增加了一系列环境变量，以及增加了替换 libvgpu.so 的 Mounts 配置，后续这个 libvgpu.so 就会根据这些环境变量做 Core&Memory 的限制。

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

核心部分就是这一句，添加了一个环境变量

```go
response.Envs = plugin.apiEnvs(plugin.deviceListEnvvar, deviceIDs)
```

而 plugin.deviceListEnvvar 的值来自：

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

即：**NVIDIA_VISIBLE_DEVICES**

正好，这个 ENV 就是 NVIDIA deviceplugin 中的实现，设置该环境变量之后 nvidia-container-toolkit 会为有这个环境变量的容器分配 GPU。

> HAMi 这里则是复用了 nvidia-container-toolkit 的能力将 GPU 分配给 Pod。

### 小结 ###

Allocate 方法中核心部分包括三件事情：

- HAMi 自定义逻辑（添加用于资源限制的环境变量CUDA_DEVICE_MEMORY_LIMIT_X 和 CUDA_DEVICE_SM_LIMIT）；（挂载 libvgpu.so 到 Pod 中进行替换）

- NVIDIA 原生逻辑（添加用于分配 GPU 的 环境变量 NVIDIA_VISIBLE_DEVICES,借助 NVIDIA Container Toolkit 将 GPU 挂载到 Pod 里）

## 6.总结 ##

至此，HAMi 的 NVIDIA device plugin 工作原理就很清晰了。

- 首先是 Register 插件注册，可以配置使用和原生 nvidia device plugin 不同的 ResourceName 来进行区分。（另外会额外启动一个后台 goroutine WatchAndRegister 定时将 GPU 信息更新到 Node 对象的 Annoations 上便于 Scheduler 时使用。）

- 然后 ListAndWatch 感知设备时也根据配置对 Device 进行复制，让同一个设备能够分配给多个 Pod。（这个和 TimeSlicing 方案一样）

- 最后 Allocate 方法中主要做三件事：

1. 为容器中增加NVIDIA_VISIBLE_DEVICES 环境变量，借助 NVIDIA Container Toolkit 实现为容器分配 GPU

2. 增加 Mounts 配置，挂载 libvgpu.so 到容器中实现对原始驱动的替换

3. 为容器中增加部分 HAMi 自定义的环境变量 CUDA_DEVICE_MEMORY_LIMIT_X 和 CUDA_DEVICE_SM_LIMIT ，配合 ibvgpu.so 实现 GPU core、memory 的限制

**核心其实就是在 Allocate 方法中，给容器中添加CUDA_DEVICE_MEMORY_LIMIT_X 和 CUDA_DEVICE_SM_LIMIT环境变量和挂载 libvgpu.so 到容器中实现对原始驱动的替换。**

当容器启动后，CUDA API 请求先经过 libvgpu.so，然后 libvgpu.so 根据环境变量 CUDA_DEVICE_MEMORY_LIMIT_X 和 CUDA_DEVICE_SM_LIMIT 实现 Core & Memory 限制。

最后回答开篇提出的问题：**HAMi 为什么要自己实现一个 device plugin 呢？hami-device-plugin-nvidia 是有哪些 NVIDIA 原生 device plugin 没有的功能吗？**

在 hami device plugin 相比原生的 NVIDIA device plugin 做了几个修改：

1. 注册时额外启动后台 goroutine WatchAndRegister 定时将 GPU 信息更新到 Node 对象的 Annoations 上便于 Scheduler 时使用。

2. ListAndWatch 感知设备时也根据配置对 Device 进行复制，便于将同一个物理 GPU 分配给多个 Pod (这个其实原生的 NVIDIA device plugin 也有，就是 TimeSlicing 方案。)

3. Allocate 中增加了 HAMi 自定义逻辑：
(挂载 libvgpu.so 到容器中实现对原始驱动的替换);(指定部分 HAMi 自定义的环境变量CUDA_DEVICE_MEMORY_LIMIT_X 和 CUDA_DEVICE_SM_LIMIT，配合 ibvgpu.so 实现 GPU core、memory 的限制)

---

## 7.FAQ ##

### Node 上的 libvgpu.so 是怎么来的 ###

Allocate 方法中要将 libvgpu.so 挂载到 Pod 里，这里用的是 HostPath 方式挂载，说明这个 libvgpu.so 是存在于宿主机上的。

**那么问题来了，宿主机上的 libvgpu.so 是怎么来的?**

这个实际上是打包在 HAMi 提供的 device-plugin 镜像里的，device-plugin 启动时将其从 Pod 里复制到宿主机上，相关 yaml 如下：

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

  挂载了 hostPath 到容器里，然后容器里执行**cp -f /k8s-vgpu/lib/nvidia/* /usr/local/vgpu/** 命令将其复制到宿主机。

  ---

  *想了解更多 HAMi 项目信息，请访问 [GitHub 仓库](https://github.com/Project-HAMi/HAMi) 或加入我们的 [Slack 社区](https://cloud-native.slack.com/archives/C07T10BU4R2)。* 

---