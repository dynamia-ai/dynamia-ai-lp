---
title: "精准而优雅： HAMi 调度特性之按 GPU 类型和 UUID 调度"
slug: "open-source-vgpu-hami-UUID"
date: "2025-07-30"
excerpt: "这一篇我们分析一下 HAMi 的调度特性：根据 GPU 类型甚至 UUID 实现精细调。"
author: 密瓜智能
tags: ["HAMI", "GPU 共享", "vGPU", "Kubernetes", "异构算力"]
coverImage: "/images/blog/gpu9/cover.jpg"
language: "zh"
---

# 精准而优雅：HAMi 调度特性之按 GPU 类型和 UUID 调度

本文摘自：https://mp.weixin.qq.com/s/1eQC2_WGhN7DMNnTW4r0cw

上一篇我们简单分析一下 HAMi-Core(libvgpu.so) vCUDA 的工作原理，包括怎么生效的，CUDA API 怎么拦截的，以及是怎么实现的对 GPU 的 core、memory 资源的 limit 的。

这一篇我们分析一下 HAMi 的调度特性：根据 GPU 类型甚至 UUID 实现精细调度。

## 1.概述

HAMi 提供了按 GPU 类型和 GPU UUID 的精准调度的能力：

- By Type：通过指定 GPU 型号（如 A100、A40）来调度 Pod，让任务仅调度(或者不调度)到某些指定类型的卡上

- By UUID：通过指定特定 GPU 的 UUID 来调度任务，让任务仅调度(或者不调度)到调度到特定 UUID 对应的卡上

这两个特性使得用户能够灵活地控制 Pod 的调度，确保任务在特定 GPU 上运行，从而优化资源利用或满足特定硬件要求。

> 对于 NVIDIA GPU 来说，不论什么型号都是统一使用 nvidia.com/gpu 作为 ResourceName，即使是固定申请 10% core，对于不同 GPU 来说肯定性能也是不同的，因此可以使用该特性将性能需求较大的任务调度到高性能 GPU 上。

具体 Workflow 可以分为以下几个步骤：

1. Device-Plugin 上报 GPU 信息：GPU 的类型和 UUID 通过device-plugin进行上报，并注册到 Node 的 Annotations 中。

2. Pod 创建时指定 Annotations：Pod 的 Annotations 中指定要调度的 GPU 类型或 UUID。

3. HAMi Scheduler 调度：hami-scheduler根据 Pod 的 Annotations 和节点上注册的 GPU 信息，过滤掉不满足条件的节点和 GPU，并最终选择合适的节点和 GPU。

4. GPU 分配：当设备插件为 Pod 分配 GPU 时，它从 Annotations 中获取 GPU 信息，并进行分配。

>以下分析基于 v2.4 版本

## 2. DevicePlugin 上报 GPU 信息

这部分之前详细分析过，推荐阅读：[HAMi vGPU 方案原理分析 Part1：hami-device-plugin-nvidia 实现](https://dynamia.ai/zh/blog/open-source-vgpu-hami-device-plugin-nvidia)

### 上报 GPU 信息

对于 K8s 提供的标准 DevicePlugin 来说，只能上报每个节点上有多少标准资源，通过 ResourceName 区分，例如:nvidia.com/vgpu。

其中并不包括我们调度所需要的 GPU 信息，例如：Type、UUID、显存 等信息,因此新增了部分自定义逻辑，如下：

```go
// pkg/device-plugin/nvidiadevice/nvinternal/plugin/register.go#L199
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

启动这个 WatchAndRegister 的后台 Goroutine 感知 Node 上的 GPU 信息然后以 Annoations 形式更新到 Node 对象上，以实现 GPU 信息注册。

GPU 信息格式如下：

```go
// pkg/device-plugin/nvidiadevice/nvinternal/plugin/register.go#L155
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

所以卡的型号应该是 NVIDIA-NVIDIA A40 这样的格式,NVIDIA 为固定值，NVIDIA A40 则是 Model。

### 查看已注册 GPU 信息

可以通过解析 Node Annoations 中的 hami.io.node-nvidia-register key 找到该节点上注册的 GPU 信息，例如：

```bash
root@j99cloudvm:~# node=j99cloudvm
kubectl get node $node -o jsonpath='{.metadata.annotations.hami\.io/node-nvidia-register}'
GPU-03f69c50-207a-2038-9b45-23cac89cb67d,10,46068,100,NVIDIA-NVIDIA A40,0,true:GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,10,46068,100,NVIDIA-NVIDIA A40,0,true:
```

上述节点就包含两个 GPU，UUID 和 Type 分别是：

- Card1：GPU-03f69c50-207a-2038-9b45-23cac89cb67d NVIDIA-NVIDIA A40

- Card2：GPU-1afede84-4e70-2174-49af-f07ebb94d1ae NVIDIA-NVIDIA A40

后续使用时就需要指定上述 UUID 或者 Type。

## 3. 创建 Pod 时指定 GPU

> 在 Examples 目录下提供了相关的 Demo：https://github.com/Project-HAMi/HAMi/tree/master/examples/nvidia

### By Type

指定将 Pod 调度到 A40 型号的 GPU 上

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
  annotations:
    nvidia.com/use-gputype: "A40"
spec:
  containers:
    - name: ubuntu-container
      image: ubuntu:18.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          nvidia.com/gpu: 2
```

指定不能使用 A100 型号 GPU

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
  annotations:
    nvidia.com/use-gputype: "A40"
spec:
  containers:
    - name: ubuntu-container
      image: ubuntu:18.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          nvidia.com/gpu: 2
```

### By UUID

通过 UUID 指定将 Pod 调度到对应 GPU

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
  annotations:
    nvidia.com/use-gpuuuid: "GPU-03f69c50-207a-2038-9b45-23cac89cb67d,GPU-03f69c50-207a-2038-9b45-23cac89cb67e"
spec:
  containers:
    - name: ubuntu-container
      image: ubuntu:18.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          nvidia.com/gpu: 1
```

通过 UUID 限制不让 Pod 调度到某些 GPU

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
  annotations:
    nvidia.com/nouse-gpuuuid: "GPU-03f69c50-207a-2038-9b45-23cac89cb67d"
spec:
  containers:
    - name: ubuntu-container
      image: ubuntu:18.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          nvidia.com/gpu: 2
```

## 4. Scheduler 调度时处理 Annoations

不管是 By Type、By UUID 还是 Use 以及 NoUse 的处理逻辑都是类似的，就不展开了，以 Use ByType 为例进行分析。

参考前面几篇 HAMi 调度相关的文章:

[HAMi vGPU 原理分析 Part3：hami-scheduler 工作流程分析](https://dynamia.ai/zh/blog/open-source-vgpu-hami-scheduler)

[HAMi vGPU 原理分析 Part4：Spread&Binpack 高级调度策略实现](https://dynamia.ai/zh/blog/open-source-vgpu-hami-Spread-Binpack)

调度流程如下：




