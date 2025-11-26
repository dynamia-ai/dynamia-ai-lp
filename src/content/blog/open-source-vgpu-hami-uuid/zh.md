---
title: "精准而优雅： HAMi 调度特性之按 GPU 类型和 UUID 调度"
coverTitle: "精准而优雅： HAMi 调度特性之按 GPU 类型和 UUID 调度"
slug: "open-source-vgpu-hami-UUID"
date: "2025-07-30"
excerpt: "这一篇我们分析一下 HAMi 的调度特性：根据 GPU 类型甚至 UUID 实现精细调。"
author: 密瓜智能
tags: ["HAMi", "GPU 共享", "vGPU", "Kubernetes", "异构算力"]
coverImage: "/images/blog/gpu9/cover.jpg"
language: "zh"
---


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

![p1](/images/blog/gpu9/p1.jpg)

1. 用户创建 Pod 并在 Pod 中申请了 vGPU 资源

2. kube-apiserver 根据 MutatingWebhookConfiguration 配置请求 HAMi-Webhook

3. HAMi-Webhook 检测 Pod 中的 Resource，如果申请的由 HAMi 管理的 vGPU 资源，就会把 Pod 中的 SchedulerName 改成了 hami-scheduler，这样这个 Pod 就会由 hami-scheduler 进行调度了。

- 对于特权模式的 Pod，Webhook 会直接跳过不处理

- 对于使用 vGPU 资源但指定了 nodeName 的 Pod，Webhook 会直接拒绝

4. hami-scheduler 进行 Pod 调度，不过就是用的 k8s 的默认 kube-scheduler 镜像，因此调度逻辑和默认的 default-scheduler 是一样的，**但是 kube-scheduler 还会根据 KubeSchedulerConfiguration 配置，调用 Extender Scheduler 插件**

- 这个 Extender Scheduler 就是 hami-scheduler Pod 中的另一个 Container，该 Container 同时提供了 Webhook 和 Scheduler 相关 API。

- 当 Pod 申请了 vGPU 资源时，kube-scheduler 就会根据配置以 HTTP 形式调用 Extender Scheduler 插件，这样就实现了自定义调度逻辑

5. Extender Scheduler 插件包含了真正的 hami 调度逻辑， 调度时根据节点剩余资源量进行打分选择节点

- 这里就包含了 spread & binpark 等 高级调度策略的实现

6. 异步任务，包括 GPU 感知逻辑

- devicePlugin 中的后台 Goroutine 定时上报 Node 上的 GPU 资源并写入到 Node 的 Annoations

- 除了 DevicePlugin 之外，还使用异步任务以 Patch Annotation 方式提交更多信息

- Extender Scheduler 插件根据 Node Annoations 解析出 GPU 资源总量、从 Node 上已经运行的 Pod 的 Annoations 中解析出 GPU 使用量，计算出每个 Node 剩余的可用资源保存到内存供调度时使用

整个调度分为 Node 级别和 Card 级别，默认情况下根据配置的 Binpack、Spread 调度策略选择格式的目标。

当前通过 Annoations 指定 GPU 则是额外逻辑，需要根据 Annoations 中的配置选择合适 Card，最终再根据 Card 选择合适节点。

### 根据 Annoations 过滤掉不满足条件的 Card

核心逻辑在 fitInCertainDevice 方法中，挨个 Card 检测，判断其是否满足条件，包括 Core 和 Memory 是否满足 Pod 申请，以及 Annoations 中解析出的 Type 和 UUID 限制。

当一个 Node 上的所有 Card 都不满足条件时，说明当前 Node 也不满足条件，因此把 Node 也过滤掉。

最终得到满足条件的 Node 以及 Node 上满足条件的 Card，最后在根据配置的 Binpack、Spread 调度策略选择出目标节点以及 Card。

```go
// pkg/scheduler/score.go#L65
func fitInCertainDevice(node *NodeUsage, request util.ContainerDeviceRequest, annos map[string]string, pod *corev1.Pod, allocated *util.PodDevices) (bool, map[string]util.ContainerDevices) {
    k := request
    originReq := k.Nums
    prevnuma := -1
    klog.InfoS("Allocating device for container request", "pod", klog.KObj(pod), "card request", k)
    var tmpDevs map[string]util.ContainerDevices
    tmpDevs = make(map[string]util.ContainerDevices)
    for i := len(node.Devices.DeviceLists) - 1; i >= 0; i-- {
        found, numa := checkType(annos, *node.Devices.DeviceLists[i].Device, k)
        if !found {
            continue
        }
        if numa && prevnuma != node.Devices.DeviceLists[i].Device.Numa {
            k.Nums = originReq
            prevnuma = node.Devices.DeviceLists[i].Device.Numa
            tmpDevs = make(map[string]util.ContainerDevices)
        }
        if !checkUUID(annos, *node.Devices.DeviceLists[i].Device, k) {
            continue
        }

        memreq := int32(0)
        if node.Devices.DeviceLists[i].Device.Count <= node.Devices.DeviceLists[i].Device.Used {
            continue
        }
        if k.Coresreq > 100 {
            klog.ErrorS(nil, "core limit can't exceed 100", "pod", klog.KObj(pod))
            k.Coresreq = 100
            //return false, tmpDevs
        }
        if k.Memreq > 0 {
            memreq = k.Memreq
        }
        if k.MemPercentagereq != 101 && k.Memreq == 0 {
            //This incurs an issue
            memreq = node.Devices.DeviceLists[i].Device.Totalmem * k.MemPercentagereq / 100
        }
        if node.Devices.DeviceLists[i].Device.Totalmem-node.Devices.DeviceLists[i].Device.Usedmem < memreq {
            continue
        }
        if node.Devices.DeviceLists[i].Device.Totalcore-node.Devices.DeviceLists[i].Device.Usedcores < k.Coresreq {
            continue
        }
        // Coresreq=100 indicates it want this card exclusively
        if node.Devices.DeviceLists[i].Device.Totalcore == 100 && k.Coresreq == 100 && node.Devices.DeviceLists[i].Device.Used > 0 {
            continue
        }
        // You can't allocate core=0 job to an already full GPU
        if node.Devices.DeviceLists[i].Device.Totalcore != 0 && node.Devices.DeviceLists[i].Device.Usedcores == node.Devices.DeviceLists[i].Device.Totalcore && k.Coresreq == 0 {
            continue
        }
        if !device.GetDevices()[k.Type].CustomFilterRule(allocated, request, tmpDevs[k.Type], node.Devices.DeviceLists[i].Device) {
            continue
        }
        if k.Nums > 0 {
            klog.InfoS("first fitted", "pod", klog.KObj(pod), "device", node.Devices.DeviceLists[i].Device.ID)
            k.Nums--
            tmpDevs[k.Type] = append(tmpDevs[k.Type], util.ContainerDevice{
                Idx:       int(node.Devices.DeviceLists[i].Device.Index),
                UUID:      node.Devices.DeviceLists[i].Device.ID,
                Type:      k.Type,
                Usedmem:   memreq,
                Usedcores: k.Coresreq,
            })
        }
        if k.Nums == 0 {
            klog.InfoS("device allocate success", "pod", klog.KObj(pod), "allocate device", tmpDevs)
            return true, tmpDevs
        }
        if node.Devices.DeviceLists[i].Device.Mode == "mig" {
            i++
        }
    }
    return false, tmpDevs
}
```

### By Type

```go
// pkg/scheduler/score.go#L38
func checkType(annos map[string]string, d util.DeviceUsage, n util.ContainerDeviceRequest) (bool, bool) {
    // General type check, NVIDIA->NVIDIA MLU->MLU
    klog.V(3).InfoS("Type check", "device", d.Type, "req", n.Type)
    if !strings.Contains(d.Type, n.Type) {
        return false, false
    }
    for _, val := range device.GetDevices() {
        found, pass, numaAssert := val.CheckType(annos, d, n)
        if found {
            return pass, numaAssert
        }
    }
    klog.Infof("Unrecognized device %s", n.Type)
    return false, false
}

func checkGPUtype(annos map[string]string, cardtype string) bool {
    cardtype = strings.ToUpper(cardtype)
    if inuse, ok := annos[GPUInUse]; ok {
        useTypes := strings.Split(inuse, ",")
        // if false return false...
        if !ContainsSliceFunc(useTypes, func(useType string) bool {
            return strings.Contains(cardtype, strings.ToUpper(useType))
        }) {
            return false
        }
    }
    if unuse, ok := annos[GPUNoUse]; ok {
        unuseTypes := strings.Split(unuse, ",")
        // if true return false
        if ContainsSliceFunc(unuseTypes, func(unuseType string) bool {
            return strings.Contains(cardtype, strings.ToUpper(unuseType))
        }) {
            return false
        }
    }
    return true
}
```

同样是包括 TypeUse 和 TypeNoUse 两个。

```go
if inuse, ok := annos[GPUInUse]; ok {
    useTypes := strings.Split(inuse, ",")
    // if false return false...
    if !ContainsSliceFunc(useTypes, func(useType string) bool {
        return strings.Contains(cardtype, strings.ToUpper(useType))
    }) {
        return false
    }
}
```

这里的 cardtype 就是类似 NVIDIA-NVIDIA-A40 这样的格式，useType 则是用户在 Annoations 中指定的 Type。

同时这里使用 strings.Contains(cardtype, strings.ToUpper(useType)) 进行匹配，因此 Annoations 中可以指定NVIDIA-NVIDIA-A40 这样的 fullname 或者 A40 这样 shortname。

当前 Card 不匹配 Annoations 中指定的任意一个 Use Type 时说明当前 Card 不满足条件，因此返回 false。

对于 NoUse Type 则是 只要当前 Card 匹配上 NoUse 中的任意 Card 则说明当前 Card 在 blacklist 中，也返回 false。

```go
if unuse, ok := annos[GPUNoUse]; ok {
    unuseTypes := strings.Split(unuse, ",")
    // if true return false
    if ContainsSliceFunc(unuseTypes, func(unuseType string) bool {
        return strings.Contains(cardtype, strings.ToUpper(unuseType))
    }) {
        return false
    }
}
```

这样就过滤掉了不满足提交的 Card。

### By UUID

UUID 也是同样的，Annoations 中解析用户指定的 Use UUID 和 NoUse UUID 列表，然后匹配当前 Card，从而过滤掉不满足条件的 Card。

```go
// pkg/scheduler/score.go#L54
func checkUUID(annos map[string]string, d util.DeviceUsage, n util.ContainerDeviceRequest) bool {
    devices, ok := device.GetDevices()[n.Type]
    if !ok {
        klog.Errorf("can not get device for %s type", n.Type)
        return false
    }
    result := devices.CheckUUID(annos, d)
    klog.V(2).Infof("checkUUID result is %v for %s type", result, n.Type)
    return result
}

func (dev *NvidiaGPUDevices) CheckUUID(annos map[string]string, d util.DeviceUsage) bool {
    userUUID, ok := annos[GPUUseUUID]
    if ok {
        klog.V(5).Infof("check uuid for nvidia user uuid [%s], device id is %s", userUUID, d.ID)
        // use , symbol to connect multiple uuid
        userUUIDs := strings.Split(userUUID, ",")
        for _, uuid := range userUUIDs {
            if d.ID == uuid {
                return true
            }
        }
        return false
    }

    noUserUUID, ok := annos[GPUNoUseUUID]
    if ok {
        klog.V(5).Infof("check uuid for nvidia not user uuid [%s], device id is %s", noUserUUID, d.ID)
        // use , symbol to connect multiple uuid
        noUserUUIDs := strings.Split(noUserUUID, ",")
        for _, uuid := range noUserUUIDs {
            if d.ID == uuid {
                return false
            }
        }
        return true
    }

    return true
}
```

> 需要注意的是：UUID 和 Type 不一样，这里是完全匹配。

### 记录目标 Card 到 Annoations

fitInCertainDevice 方法过滤出合适 Node、Card 后，Scheduler 的 Bind 接口直接将 Node 和 Pod 绑定即可完成调度，但是 Card 是由 DevicePlugin 在分配的，因此在 Scheduler 中通过 Annoations 形式将 Card 记录到 Pod 上，后续 DevicePlugin 直接从 Annoations 中读取即可。

```go
sort.Sort(nodeScores)
m := (*nodeScores).NodeList[len((*nodeScores).NodeList)-1]
klog.Infof("schedule %v/%v to %v %v", args.Pod.Namespace, args.Pod.Name, m.NodeID, m.Devices)
annotations := make(map[string]string)
annotations[util.AssignedNodeAnnotations] = m.NodeID
annotations[util.AssignedTimeAnnotations] = strconv.FormatInt(time.Now().Unix(), 10)

for _, val := range device.GetDevices() {
    val.PatchAnnotations(&annotations, m.Devices)
}
```

Annoations 大概是这样的：

```yaml
root@test:~/lixd/hami# k get po hami-30 -oyaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    hami.io/bind-phase: allocating
    hami.io/bind-time: "1732072495"
    hami.io/vgpu-devices-allocated: GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,NVIDIA,20000,30:;
    hami.io/vgpu-devices-to-allocate: GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,NVIDIA,20000,30:;
    hami.io/vgpu-node: test
    hami.io/vgpu-time: "1732072495"
```

其中 hami.io/vgpu-devices-to-allocate 则是 Scheduler 为 Pod 选择的目标 GPU

## 5. DevicePlugin 解析 GPU 并分配

在调度时，我们把最终选择的 GPU 记录到了 Pod 的 Annoations 上，DevicePlugin 这边就不需要选择 GPU 了，从 Annoations 上解析即可

```go
// pkg/util/util.go#L281
func GetNextDeviceRequest(dtype string, p corev1.Pod) (corev1.Container, ContainerDevices, error) {
    pdevices, err := DecodePodDevices(InRequestDevices, p.Annotations)
    if err != nil {
        return corev1.Container{}, ContainerDevices{}, err
    }
    klog.Infof("pod annotation decode value is %+v", pdevices)
    res := ContainerDevices{}

    pd, ok := pdevices[dtype]
    if !ok {
        return corev1.Container{}, res, errors.New("device request not found")
    }
    for ctridx, ctrDevice := range pd {
        if len(ctrDevice) > 0 {
            return p.Spec.Containers[ctridx], ctrDevice, nil
        }
    }
    return corev1.Container{}, res, errors.New("device request not found")
}

// pkg/util/util.go#L254
func DecodePodDevices(checklist map[string]string, annos map[string]string) (PodDevices, error) {
    klog.V(5).Infof("checklist is [%+v], annos is [%+v]", checklist, annos)
    if len(annos) == 0 {
        return PodDevices{}, nil
    }
    pd := make(PodDevices)
    for devID, devs := range checklist {
        str, ok := annos[devs]
        if !ok {
            continue
        }
        pd[devID] = make(PodSingleDevice, 0)
        for _, s := range strings.Split(str, OnePodMultiContainerSplitSymbol) {
            cd, err := DecodeContainerDevices(s)
            if err != nil {
                return PodDevices{}, nil
            }
            if len(cd) == 0 {
                continue
            }
            pd[devID] = append(pd[devID], cd)
        }
    }
    klog.InfoS("Decoded pod annos", "poddevices", pd)
    return pd, nil
}
```

具体的解析逻辑如下，就是按照预设规则，以冒号，逗号进行切分

```go
// pkg/util/util.go#L223
func DecodeContainerDevices(str string) (ContainerDevices, error) {
    if len(str) == 0 {
        return ContainerDevices{}, nil
    }
    cd := strings.Split(str, OneContainerMultiDeviceSplitSymbol)
    contdev := ContainerDevices{}
    tmpdev := ContainerDevice{}
    klog.V(5).Infof("Start to decode container device %s", str)
    if len(str) == 0 {
        return ContainerDevices{}, nil
    }
    for _, val := range cd {
        if strings.Contains(val, ",") {
            //fmt.Println("cd is ", val)
            tmpstr := strings.Split(val, ",")
            if len(tmpstr) < 4 {
                return ContainerDevices{}, fmt.Errorf("pod annotation format error; information missing, please do not use nodeName field in task")
            }
            tmpdev.UUID = tmpstr[0]
            tmpdev.Type = tmpstr[1]
            devmem, _ := strconv.ParseInt(tmpstr[2], 10, 32)
            tmpdev.Usedmem = int32(devmem)
            devcores, _ := strconv.ParseInt(tmpstr[3], 10, 32)
            tmpdev.Usedcores = int32(devcores)
            contdev = append(contdev, tmpdev)
        }
    }
    klog.V(5).Infof("Finished decoding container devices. Total devices: %d", len(contdev))
    return contdev, nil
}
```

至此，整个流程就完成了。

## 6.小结

1. HAMi 提供了一个指定调度到(或者不调度到)某种(个) GPU 的功能：

- By Type：指定 GPU Type，仅调度(或者不调度)到某些指定 Type 的卡上，例如：A100、A40

- By UUID：指定 GPU UUID，仅调度(或者不调度)到调度到特定 UUID 对应的卡上

- 通过该特性，可以实现更加精细的调度，当集群中存在多种 GPU 时比较有用

2. 可以通过解析 Node Annoations 中的 hami.io.node-nvidia-register key 找到该节点上注册的 GPU 信息，例如：

```bash
root@j99cloudvm:~# node=j99cloudvm
kubectl get node $node -o jsonpath='{.metadata.annotations.hami\.io/node-nvidia-register}'
GPU-03f69c50-207a-2038-9b45-23cac89cb67d,10,46068,100,NVIDIA-NVIDIA A40,0,true:GPU-1afede84-4e70-2174-49af-f07ebb94d1ae,10,46068,100,NVIDIA-NVIDIA A40,0,true:
```

3. 匹配规则:

- 对于 Type 当前使用 strings.Contains 方式，因此可以指定 Type 的 fullnameNVIDIA-NVIDIA A40,或者 shortname A40

- 对于 UUID 则是完全匹配，必须一致才行

4. 如果 Annoations 填写错误，比如指定了一个不存在的 UUID 或者 Type 则会导致调度失败，Pod 处于 Pending 状态。

---

*想了解更多 HAMi 项目信息，请访问 [GitHub 仓库](https://github.com/Project-HAMi/HAMi) 或加入我们的 [Slack 社区](https://cloud-native.slack.com/archives/C07T10BU4R2)。* 

---


