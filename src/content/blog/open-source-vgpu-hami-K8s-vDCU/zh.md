---
title: "HAMi 异构设备虚拟化之海光 DCU 实战：K8s 下的 vDCU 资源调度与纳管"
slug: "open-source-vgpu-hami-K8s-vDCU"
date: "2025-07-31"
excerpt: "本文是分析海光 DCU 设备如何通过 HAMi 完成虚拟化，实现统一纳管与调度。"
author: "密瓜智能"
tags: ["HAMI", "GPU 共享", "vGPU", "Kubernetes", "异构算力"]
coverImage: "/images/blog/gpu10/cover.jpg"
language: "zh"
---

本文摘自：https://mp.weixin.qq.com/s/gpyhltXK3CSTkwk4ZwD74A

之前通过一系列文章分析了 HAMI vGPU 部署使用以及背后的实现原理，本文则是分析海光 DCU 设备如何通过 HAMi 完成虚拟化，实现统一纳管与调度。

## 1. vDCU 相关命令

在这之前简单过一下海光 DCU 自带的 vDCU 功能如何使用。

### 1.1 查看物理 DCU 资源

```bash
$ hy-smi virtual -show-device-info

Device 0:
 Actual Device: 0
 Compute units: 60
 Global memory: 34342961152 bytes
Device 1:
 Actual Device: 1
 Compute units: 60
 Global memory: 34342961152 bytes
```
### 1.2 拆分 vDCU

拆分 DCU 为 4 份，分别包含 5，15，20，20 个计算单元以及 4096，8192，8192，8192MiB 的显存

```bash
$ hy-smi virtual -create-vdevices 4 -d 0 \
-vdevice-compute-units 5,15,20,20 \
-vdevice-memory-size 4096,8192,8192,8192

The virtual device is created successfully!
```

### 1.3 查看 vdcu 信息

```bash
$ hy-smi virtual -show-vdevice-info
Virtual Device 0:
 Actual Device: 7
 Compute units: 5
 Global memory: 4294967296 bytes
- 5 -
Virtual Device 1:
 Actual Device: 7
 Compute units: 15
 Global memory: 8589934592 bytes
Virtual Device 2:
 Actual Device: 7
 Compute units: 20
 Global memory: 8589934592 bytes
Virtual Device 3:
 Actual Device: 7
 Compute units: 20
 Global memory: 8589934592 bytes
```

### 1.4 销毁 vDCU

```bash
# -d ${dev_id} 指定物理 DCU ID，不指定则选定所有物理 DCU
# -destroy-vdevice 销毁此物理 DCU 上所有 vDCU
hy-smi virtual -d ${dev_id} -destroy-vdevice
```

### 1.5 Docker 使用 vDCU

在容器启动的时候执行以下命令将 vDCU 挂载至容器内。以下命令表示用户在启动容器时，挂载第 0 号 vDCU 实例。

```bash
docker run -it --name container_name \
--device=/dev/kfd \
--device=/dev/dri \
--device=/dev/mkfd \
-v /etc/vdev/vdev0.conf:/etc/vdev/docker/vdev0.conf:ro \
${docker_image:tag} \
/bin/bash
```

**可以看到除了通过 --device 方式挂载 kfd、dri、mkfd 等设备文件之外，还额外挂载了一个 /etc/vdev/vdev0.conf 文件到容器里**

实际上这个文件就是 vDCU 的配置文件，内部记录了该 vDCU 的详细信息。

虽然看不到相关源码，不过可以肯定的是，驱动程序肯定会查看该文件是否存在，如果存在则说明当前使用的是 vDCU，然后根据该文件中的信息来找到对应的物理 DCU，以及 core、mem 等信息以完成限制。

接下来看下 HAMi 中如何使用 vDCU。

## 2.部署 HAMi

前提条件：

- dtk 驱动程序 >= 24.04

### 2.1 部署

使用 Helm 部署

```bash
# 添加 repo
helm repo add hami-charts https://project-hami.github.io/HAMi/
# 安装
helm install hami hami-charts/hami -n kube-system
```

> ps：可以通过调整 [HAMi 部署配置](https://github.com/Project-HAMi/HAMi/blob/master/docs/config.md)来自定义你的安装。

如果当前环境无法拉取在线镜像，可以指定镜像仓库

```bash
export registry=192.168.10.172:5000
# 不指定 tag,会自动使用当前集群同样版本，需要确保 Registry 有该镜像
export kubescheduler=$registry/kube-scheduler

helm upgrade --install hami hami-charts/hami -n kube-system \
--set scheduler.kubeScheduler.image=$kubescheduler \
--set scheduler.extender.image=$registry/projecthami/hami \
--set scheduler.patch.imageNew=$registry/liangjw/kube-webhook-certgen:v1.1.1
```

### 2.2 检查 Pod 运行情况

```bash
$ kubectl -n kube-system get po -l app.kubernetes.io/name=hami
NAME                              READY   STATUS    RESTARTS   AGE
hami-scheduler-6dbdf69644-mz9m5   2/2     Running   0          2m19s
```

如果 hami-scheduler Running 说明安装成功。

>ps：对于 DCU 环境只会启动 hami-scheduler 一个 Pod。

## 3. 部署 hami-vdcu-device-plugin

```bash
# 对应的 DevicePlugin 也是用 HAMi 社区提供的版本。
# 先给 DCU 节点打上 label dcu=on
kubectl label nodes {nodeid} dcu=on
```

### 3.1 准备工作

然后做以下准备工作

创建 vdev 目录

```bash
# on the dcu node, create these directory:
$ mkdir /etc/vdev
```

将 dtk 复制到 /opt/dtk 目录

>因为容器会统一挂载 /opt/dtk ，因此将其从部署目录 cp 到指定目录

```bash
# should change dtk-xx.xx.x to your installed dtk version
$ cp -r /opt/dtk-xx.xx.x /opt/dtk
```

注意：/opt/dtk-xx.xx.x 这个位置取决于之前部署 DTK 时指定的目录

### 3.2 部署

然后就可以开始部署了

从 https://github.com/Project-HAMi/dcu-vgpu-device-plugin 项目获取相关 yaml：

```bash
wget https://raw.githubusercontent.com/Project-HAMi/dcu-vgpu-device-plugin/refs/heads/master/k8s-dcu-plugin.yaml
wget https://raw.githubusercontent.com/Project-HAMi/dcu-vgpu-device-plugin/refs/heads/master/k8s-dcu-rbac.yaml
```

然后部署 device-plugin

```bash
kubectl apply -f k8s-dcu-rbac.yaml
kubectl apply -f k8s-dcu-plugin.yaml
```

### 3.3 检查 Pod 运行情况

确认相关组件都正常运行：

```bash
$ kubectl get po -n kube-code
NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE
kube-code     hami-dcu-vgpu-device-plugin-cgwwv        1/1     Running   4          14m
kube-code     hami-dcu-vgpu-device-plugin-lp7gl        1/1     Running   0          8m36s
kube-code     hami-dcu-vgpu-device-plugin-lswbl        1/1     Running   0          8m40s
kube-code     hami-dcu-vgpu-device-plugin-svwl7        1/1     Running   0          8m38s
kube-code     hami-scheduler-bb5586989-q7bvr           2/2     Running   0          54m
```

可以看到，几个 DCU 节点上的 dcu-vdcu-device-plugin 都运行正常。

至此，相关组件部署完成，接下来验证下 vDCU 能否正常使用了。

## 4. 验证 vdcu

### 4.1 查看 Node 资源

接下来就是查看节点资源情况，vdcu 是否正常注册。

```bash
$ kubectl describe node d41gpucns41 | grep Capacity -A 8  
Capacity:
  cpu:                64
  ephemeral-storage:  934609028Ki
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  hygon.com/dcu:      0
  hygon.com/dcunum:   32
  memory:             1043017856Ki
  pods:               500
```

这里的  hygon.com/dcunum:   32 就是 vdcu 数量，单节点 8 DCU，这里是做了 4 倍切分。

>ps: 因为当前一块海光物理 DCU 只支持切分为 4 个 vDCU。

### 4.2 启动 Pod 使用 vdcu

完整 yaml 如下：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: alexnet-tf-gpu-pod-mem
  labels:
    purpose: demo-tf-amdgpu
spec:
  containers:
    - name: alexnet-tf-gpu-container
      image: ubuntu:20.04
      workingDir: /root
      command: ["sleep", "infinity"]
      resources:
        limits:
          hygon.com/dcunum: 1 # requesting a GPU
          hygon.com/dcumem: 2000 # each dcu require 2000 MiB device memory
          hygon.com/dcucores: 15 # each dcu use 15% of total compute cores
```

和 vGPU 类似，支持单独指定卡数、core、mem 等资源。

进入 Pod 后先 source 下环境变量

```bash
source /opt/hygondriver/env.sh
```

然后使用以下命令验证

```bash
hy-virtual -show-device-info
```

```bash
Device 0:
        Actual Device: 0
        Compute units: 9
        Global memory: 2097152000 bytes
```

Compute units 和 Global memory 就是我们前面指定的 core 和 mem。

至此，说明 HAMi vdcu 已经生效了。

### 4.3 注意事项

一些注意事项：

1. 如果您的镜像不是 'dtk-embedded-image'，则需要在任务运行后安装 pciutiils、libelf-dev、kmod，否则，像 hy-smi 或 hy-virtual 这样的 dcu 工具可能无法正常工作。

2. 不支持在 init 容器中共享 DCU，init 容器中带有 "hygon.com/dcumem" 的 pod 将永远不会被调度。

3. 每个容器只能获取一个 vdcu。如果您想挂载多个 dcu 设备，则不应设置 hygon.com/dcumem 或 hygon.com/dcucores。

## 5. 实现分析

简单分析一下 vdcu-device-plugin，根据第一章中使用 vDCU 的步骤可知，vdcu-device-plugin

除了正常的上报设备信息，分配设备之外，还需要处理以下事情：

1. vDCU 配置文件维护

- 创建 Pod 时根据 yaml 中申请的 core、mem 生成对应的 vdcu 配置文件

- Pod 删除后也需要删除对应的配置文件

2. 挂载 vDCU 配置文件到 Pod 中

- 只有这样驱动程序才知道将该 vDCU 限制在多少 core、mem

推荐先看下这篇

[HAMi vGPU 方案原理分析 Part1：hami-device-plugin-nvidia 实现device-plugin](https://dynamia.ai/zh/blog/open-source-vgpu-hami-device-plugin-nvidia)

 实现上都是类似的。

 ### 5.1 Register

 首先是要将 DevicePlugin 注册到 Kubelet，这里用的是 device-plugin-manager 因此没有单独注册的代码，不过也可以看下在启动的时候做了哪些工作。

 ```go
// Start is an optional interface that could be implemented by plugin.
// If case Start is implemented, it will be executed by Manager after
// plugin instantiation and before its registration to kubelet. This
// method could be used to prepare resources before they are offered
// to Kubernetes.
func (p *Plugin) Start() error {
    var err error

    // 初始化 device info
    dcgm.Init()
    p.devices, err = dcgm.DeviceInfos()
    if err != nil {
        log.Fatalf("dcgm DeviceInfos failed:%s", err.Error())
    }
    for idx := range p.devices {
        p.devices[idx].DevTypeName = fmt.Sprintf("%v-%v", "DCU", p.devices[idx].DevTypeName)
    }
    fmt.Println("infos=", p.devices)

    for idx, val := range p.devices {
        p.coremask[idx][0] = initCoreUsage(int(val.ComputeUnit))
        p.coremask[idx][1] = initCoreUsage(int(val.ComputeUnit))
    }

    go p.WatchAndRegister()
    return nil
}
```

启动时通过dcgm.DeviceInfos() 获取 DCU 信息

```go
dcgm.Init()
p.devices, err = dcgm.DeviceInfos()
if err != nil {
    log.Fatalf("dcgm DeviceInfos failed:%s", err.Error())
}
for idx := range p.devices {
    p.devices[idx].DevTypeName = fmt.Sprintf("%v-%v", "DCU", p.devices[idx].DevTypeName)
}
fmt.Println("infos=", p.devices)

for idx, val := range p.devices {
    p.coremask[idx][0] = initCoreUsage(int(val.ComputeUnit))
    p.coremask[idx][1] = initCoreUsage(int(val.ComputeUnit))
}
```

### DeviceInfos

具体实现

```go
// DeviceInfos 获取设备信息列表
// @Summary 获取设备信息列表
// @Description 返回所有设备的详细信息列表
// @Produce json
// @Success 200 {array} DeviceInfo "返回设备信息列表"
// @Failure 500 {object} error "服务器内部错误"
// @Router /DeviceInfos [get]
func DeviceInfos()(deviceInfos []DeviceInfo, err error) {
    numDevices, err := rsmiNumMonitorDevices()
    if err != nil {
        return nil, err
    }
    for i := 0; i < numDevices; i++ {
        bdfid, err := rsmiDevPciIdGet(i)
        if err != nil {
            return nil, err
        }
        // 解析BDFID
        domain := (bdfid >> 32) & 0xffffffff
        bus := (bdfid >> 8) & 0xff
        dev := (bdfid >> 3) & 0x1f
        function := bdfid & 0x7
        // 格式化PCI ID
        pciBusNumber := fmt.Sprintf("%04X:%02X:%02X.%X", domain, bus, dev, function)
        //设备序列号
        deviceId, _ := rsmiDevSerialNumberGet(i)
        //获取设备类型标识id
        devTypeId, _ := rsmiDevIdGet(i)
        devType := fmt.Sprintf("%x", devTypeId)
        //型号名称
        devTypeName := type2name[devType]
        //获取设备内存总量
        memoryTotal, _ := rsmiDevMemoryTotalGet(i, RSMI_MEM_TYPE_FIRST)
        mt, _ := strconv.ParseFloat(fmt.Sprintf("%f", float64(memoryTotal)/1.0), 64)
        glog.Info(" DCU[%v] memory total memory total: %.0f", i, mt)
        //获取设备内存使用量
        memoryUsed, _ := rsmiDevMemoryUsageGet(i, RSMI_MEM_TYPE_FIRST)
        mu, _ := strconv.ParseFloat(fmt.Sprintf("%f", float64(memoryUsed)/1.0), 64)
        glog.Info(" DCU[%v] memory used :%.0f", i, mu)
        computeUnit := computeUnitType[devTypeName]
        glog.Info(" DCU[%v] computeUnit : %.0f", i, computeUnit)
        deviceInfo := DeviceInfo{
            DvInd:       i,
            DeviceId:    deviceId,
            DevType:     devType,
            DevTypeName: devTypeName,
            PciBusNumber: pciBusNumber,
            MemoryTotal: mt,
            MemoryUsed:  mu,
            ComputeUnit: computeUnit,
        }
        deviceInfos = append(deviceInfos, deviceInfo)
    }
    glog.Info("deviceInfos: ", dataToJson(deviceInfos))
    return
}
```

```go
package dcgm

/*
#cgo CFLAGS: -Wall -I./include
#cgo LDFLAGS: -L./lib -lrocm_smi64 -lhydmi -Wl,--unresolved-symbols=ignore-in-object-files
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <kfd_ioctl.h>
#include <rocm_smi64Config.h>
#include <rocm_smi.h>
#include <dmi_virtual.h>
#include <dmi_error.h>
#include <dmi.h>
#include <dmi_mig.h>
*/
import "C"
import (
    "encoding/json"
    "fmt"
    "os"
    "unsafe"

    "github.com/golang/glog"
)

// rsmiNumMonitorDevices 获取gpu数量 *
func rsmiNumMonitorDevices()(gpuNum int, err error){
    var p C.uint
    ret := C.rsmi_num_monitor_devices(&p)
    //glog.Info("go_rsmi_num_monitor_devices_ret:", ret)
    if err = errorString(ret); err != nil {
        return 0, fmt.Errorf("Error go_rsmi_num_monitor_devices_ret: %s", err)
    }
    gpuNum = int(p)
    //glog.Info("go_rsmi_num_monitor_devices:", gpuNum)
    return gpuNum, nil
}

// rsmiDevPciIdGet 获取唯一pci设备标识符
func rsmiDevPciIdGet(dvInd int) (bdfid int64, err error) {
    var cbdfid C.uint64_t
    ret := C.rsmi_dev_pci_id_get(C.uint32_t(dvInd), &cbdfid)
    //glog.Infof("rsmi_dev_pci_id_get ret:%v, retStr:%v", ret, errorString(ret))
    if err = errorString(ret); err != nil {
        glog.Errorf("rsmi_dev_pci_id_get err:%v", err.Error())
        return bdfid, err
    }
    bdfid = int64(cbdfid)
    //glog.Infof("rsmiDevPciIdGet bdfid:%v", bdfid)
    return
}
```

### WatchAndRegister

该方法主要调用两个方法：

- RefreshContainerDevices：维护 vdcu 配置信息，Pod 删除后移除对应文件

- RegistrInAnnotation：将节点上的物理 DCU 信息记录到节点的 Annoation 上。

```go
func (r *Plugin) WatchAndRegister() {
    klog.Info("into WatchAndRegister")
    for {
        r.RefreshContainerDevices()
        err := r.RegistrInAnnotation()
        if err != nil {
            klog.Errorf("register error, %v", err)
            time.Sleep(time.Second * 5)
        } else {
            time.Sleep(time.Second * 30)
        }
    }
}
```

### RefreshContainerDevices

根据 /usr/local/vgpu/dcu 目录下的文件和 Kubernetes 中的 Pod 信息，更新 vdcu 使用情况，并清理不再使用的 vdcu 配置文件，以确保设备状态信息与实际使用情况保持一致。

```go
func (p *Plugin) RefreshContainerDevices() error {
    files, err := os.ReadDir("/usr/local/vgpu/dcu")
    if err != nil {
        return err
    }
    idx := 0
    for idx < len(p.devices) {
        p.coremask[idx][0] = initCoreUsage(int(p.devices[idx].ComputeUnit))
        p.coremask[idx][1] = initCoreUsage(int(p.devices[idx].ComputeUnit))
        idx++
    }

    for _, f := range files {
        pods, err := client.GetClient().CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
        if err != nil {
            return err
        }
        found := false
        for _, val := range pods.Items {
            if strings.Contains(f.Name(), string(val.UID)) {
                found = true
                var didx, pid, vdidx int
                tmpstr := strings.Split(f.Name(), "_")
                didx, _ = strconv.Atoi(tmpstr[2])
                pid, _ = strconv.Atoi(tmpstr[3])
                vdidx, _ = strconv.Atoi(tmpstr[4])
                p.coremask[didx][0], _ = addCoreUsage(p.coremask[didx][0], tmpstr[5])
                p.coremask[didx][1], _ = addCoreUsage(p.coremask[didx][1], tmpstr[6])
                p.vidx[vdidx] = true
                p.pipeid[didx][pid] = true
            }
        }
        if !found {
            var didx, pid, vdidx int
            tmpstr := strings.Split(f.Name(), "_")
            didx, _ = strconv.Atoi(tmpstr[2])
            pid, _ = strconv.Atoi(tmpstr[3])
            vdidx, _ = strconv.Atoi(tmpstr[4])
            p.vidx[vdidx] = false
            p.pipeid[didx][pid] = false
            os.RemoveAll("/usr/local/vgpu/dcu/" + f.Name())
            os.Remove(fmt.Sprintf("/etc/vdev/vdev%d.conf", vdidx))
        }
        fmt.Println(f.Name())
    }
    fmt.Println(p.coremask)
    return nil
}
```

### RegistrInAnnotation

将 Device 信息记录到 Node  Annoation 上，这样 hami-scheduler 可以从 Annoation 中拿到每个节点上 DCU 的详细信息。

```go
func (r *Plugin) RegistrInAnnotation() error {
    devices := r.apiDevices()
    annos := make(map[string]string)
    if len(util.NodeName) == 0 {
        util.NodeName = os.Getenv(util.NodeNameEnvName)
    }
    node, err := util.GetNode(util.NodeName)
    if err != nil {
        klog.Errorln("get node error", err.Error())
        return err
    }
    encodeddevices := util.EncodeNodeDevices(*devices)
    annos[util.HandshakeAnnosString] = "Reported " + time.Now().String()
    annos[util.RegisterAnnos] = encodeddevices
    klog.Infoln("Reporting devices", encodeddevices, "in", time.Now().String())
    err = util.PatchNodeAnnotations(node, annos)

    if err != nil {
        klog.Errorln("patch node error", err.Error())
    }
    return err
}
```

### ListAndWatch

ListAndWatch 检测节点上的 DCU 并上报给 Kubelet，由 Kubelet 提交 kube-apiserver，最终更新到 Node 的 Resource 上。

ListAndWatch 方法内容如下：

```go
// ListAndWatch returns a stream of List of Devices
// Whenever a Device state change or a Device disappears, ListAndWatch
// returns the new list
func (p *Plugin) ListAndWatch(e *kubeletdevicepluginv1beta1.Empty, s kubeletdevicepluginv1beta1.DevicePlugin_ListAndWatchServer) error {
    p.AMDGPUs = amdgpu.GetAMDGPUs()

    devs := make([]*kubeletdevicepluginv1beta1.Device, len(p.AMDGPUs))

    // limit scope for hwloc
    func() {
        var hw hwloc.Hwloc
        hw.Init()
        defer hw.Destroy()

        i := 0
        for id := range p.AMDGPUs {
            dev := &kubeletdevicepluginv1beta1.Device{
                ID:     id,
                Health: kubeletdevicepluginv1beta1.Healthy,
            }
            devs[i] = dev
            i++

            numas, err := hw.GetNUMANodes(id)
            glog.Infof("Watching GPU with bus ID: %s NUMA Node: %+v", id, numas)
            if err != nil {
                glog.Error(err)
                continue
            }

            if len(numas) == 0 {
                glog.Errorf("No NUMA for GPU ID: %s", id)
                continue
            }

            numaNodes := make([]*kubeletdevicepluginv1beta1.NUMANode, len(numas))
            for j, v := range numas {
                numaNodes[j] = &kubeletdevicepluginv1beta1.NUMANode{
                    ID: int64(v),
                }
            }

            dev.Topology = &kubeletdevicepluginv1beta1.TopologyInfo{
                Nodes: numaNodes,
            }
        }
    }()

    fakedevs := p.apiDevices()
    s.Send(&kubeletdevicepluginv1beta1.ListAndWatchResponse{Devices: p.generateFakeDevs(fakedevs)})

    for {
        select {
        case <-p.Heartbeat:
            var health = kubeletdevicepluginv1beta1.Unhealthy

            // TODO there are no per device health check currently
            // TODO all devices on a node is used together by kfd
            if simpleHealthCheck() {
                health = kubeletdevicepluginv1beta1.Healthy
            }

            for i := 0; i < len(p.AMDGPUs); i++ {
                devs[i].Health = health
            }
            s.Send(&kubeletdevicepluginv1beta1.ListAndWatchResponse{Devices: p.generateFakeDevs(fakedevs)})
        }
    }
    // returning a value with this function will unregister the plugin from k8s
}
```

看了下有部分无效代码，有用的下面这部分：

```go
fakedevs := p.apiDevices()
s.Send(&kubeletdevicepluginv1beta1.ListAndWatchResponse{Devices: p.generateFakeDevs(fakedevs)})

for {
    select {
    case <-p.Heartbeat:
        s.Send(&kubeletdevicepluginv1beta1.ListAndWatchResponse{Devices: p.generateFakeDevs(fakedevs)})
    }
}
```
### apiDevices

根据前面 Start 方法中获取到的 device 信息生成 fakeDevice 提交给 kubelet。

```go
func (r *Plugin) apiDevices() *[]*api.DeviceInfo {
    res := []*api.DeviceInfo{}
    for idx, val := range r.devices {
        if val.MemoryTotal > 0 {
            res = append(res, &api.DeviceInfo{
                Index:   idx,
                Id:      "DCU-" + fmt.Sprint(idx),
                Count:   4,
                Devmem:  int32(val.MemoryTotal / 1024 / 1024),
                Devcore: 100,
                Numa:    0,
                Type:    val.DevTypeName,
                Health:  true,
            })
        }
    }
    return &res
}
```

其中 Count 固定为 4，即每个 DCU 可以切分为 4 个 vdcu。

>ps:因为目前海光 DCU 虚拟化功能在一张物理卡上支持最多 4 个 vDCU。

### generateFakeDevs

```go
func (p *Plugin) generateFakeDevs(devices *[]*api.DeviceInfo) []*kubeletdevicepluginv1beta1.Device {
    fakedevs := []*kubeletdevicepluginv1beta1.Device{}

    for _, val := range *devices {
        idx := 0
        for idx < int(val.Count) {
            fakedevs = append(fakedevs, &kubeletdevicepluginv1beta1.Device{
                ID:     val.Id + "-fake-" + fmt.Sprint(idx),
                Health: kubeletdevicepluginv1beta1.Healthy,
            })
            idx++
        }
    }
    return fakedevs
}
```

然后在 generateFakeDevs 中在根据 Count 信息复制出足够数量的 fakedev，至此对 Kubelet 来说感知到的 dcu 数量将是 物理 dcu 数量的 4 倍。

### Allocate

Allocate 则是包含了真正将 vDCU 分配给 Pod 的逻辑。

>ps：因为没有单独的 container runtime,因此在 Allocate 中需要额外做一些工作，比如把kfd、mkfd、dri、hygondriver、hyhal 等等设备或者目录挂载到 Pod 中。

```go
func (p *Plugin) Allocate(ctx context.Context, reqs *kubeletdevicepluginv1beta1.AllocateRequest) (*kubeletdevicepluginv1beta1.AllocateResponse, error) {
    var car kubeletdevicepluginv1beta1.ContainerAllocateResponse
    var dev *kubeletdevicepluginv1beta1.DeviceSpec
    responses := kubeletdevicepluginv1beta1.AllocateResponse{}
    nodename := util.NodeName
    current, err := hmutil.GetPendingPod(ctx, nodename)
    if err != nil {
        // nodelock.ReleaseNodeLock(nodename, NodeLockDCU, current, false)
        return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
    }
    klog.Infof("Allocate for pod %s/%s uid [%s] \n", current.Namespace, current.Name, current.UID)
    drmCards, drmRenders, err := util.ListDcuDrmDevices()
    if err != nil {
        util.PodAllocationFailed(nodename, current, NodeLockDCU)
        return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
    }
    for idx := range reqs.ContainerRequests {
        currentCtr, devreq, err := util.GetNextDeviceRequest(util.HygonDCUDevice, *current)
        klog.Infoln("deviceAllocateFromAnnotation=", devreq)
        if err != nil {
            util.PodAllocationFailed(nodename, current, NodeLockDCU)
            return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
        }
        if len(devreq) != len(reqs.ContainerRequests[idx].DevicesIDs) {
            util.PodAllocationFailed(nodename, current, NodeLockDCU)
            return &kubeletdevicepluginv1beta1.AllocateResponse{}, errors.New("device number not matched")
        }

        err = util.EraseNextDeviceTypeFromAnnotation(util.HygonDCUDevice, *current)
        if err != nil {
            util.PodAllocationFailed(nodename, current, NodeLockDCU)
            return &kubeletdevicepluginv1beta1.AllocateResponse{}, err
        }

        car = kubeletdevicepluginv1beta1.ContainerAllocateResponse{}
        // Currently, there are only 1 /dev/kfd per nodes regardless of the # of GPU available
        // for compute/rocm/HSA use cases
        dev = new(kubeletdevicepluginv1beta1.DeviceSpec)
        dev.HostPath = "/dev/kfd"
        dev.ContainerPath = "/dev/kfd"
        dev.Permissions = "rwm"
        car.Devices = append(car.Devices, dev)

        dev = new(kubeletdevicepluginv1beta1.DeviceSpec)
        dev.HostPath = "/dev/mkfd"
        dev.ContainerPath = "/dev/mkfd"
        dev.Permissions = "rwm"
        car.Devices = append(car.Devices, dev)

        for _, val := range devreq {
            var devIdx = -1
            klog.Infof("Allocating device ID: %s", val.UUID)
            succeedCount, err := fmt.Sscanf(val.UUID, "DCU-%d", &devIdx)
            if err != nil || succeedCount == 0 || devIdx == -1 {
                klog.Errorf("Invalid request device uuid: %s", val.UUID)
                util.PodAllocationFailed(nodename, current, NodeLockDCU)
                return &kubeletdevicepluginv1beta1.AllocateResponse{}, fmt.Errorf("invalid request device uuid %s", val.UUID)
            }

            if devIdx > len(drmCards) || devIdx > len(drmRenders) {
                klog.Errorf("Invalid device index: %d, all devices counts is: %d, all renders count is: %d", devIdx, len(drmCards), len(drmRenders))
                util.PodAllocationFailed(nodename, current, NodeLockDCU)
                return &kubeletdevicepluginv1beta1.AllocateResponse{}, fmt.Errorf("can not match dcu dri request %s. cards %d, renders %d", val.UUID, len(drmCards), len(drmRenders))
            }

            drmCardName := drmCards[devIdx]
            klog.Infof("All dcu dri card devs: %v, mapped dri: %s", drmCards, drmCardName)
            devpath := fmt.Sprintf("/dev/dri/%s", drmCardName)
            dev = new(kubeletdevicepluginv1beta1.DeviceSpec)
            dev.HostPath = devpath
            dev.ContainerPath = devpath
            dev.Permissions = "rw"
            car.Devices = append(car.Devices, dev)

            drmRenderName := drmRenders[devIdx]
            klog.Infof("All dcu dri render devs: %v, mapped dri: %s", drmRenders, drmRenderName)
            devpath = fmt.Sprintf("/dev/dri/%s", drmRenderName)
            dev = new(kubeletdevicepluginv1beta1.DeviceSpec)
            dev.HostPath = devpath
            dev.ContainerPath = devpath
            dev.Permissions = "rw"
            car.Devices = append(car.Devices, dev)
        }
        // Create vdev file
        klog.Infoln("devreqs=", len(devreq), "usedmem=", devreq[0].Usedmem, ":", p.devices[0].MemoryTotal/1024/1024)
        if len(devreq) < 2 && devreq[0].Usedmem < int32(p.devices[0].MemoryTotal/1024/1024) {
            filename, err := p.createvdevFiles(current, &currentCtr, devreq)
            if err != nil {
                util.PodAllocationFailed(nodename, current, NodeLockDCU)
                return &responses, err
            }
            if len(filename) > 0 {
                car.Mounts = append(car.Mounts, &kubeletdevicepluginv1beta1.Mount{
                    ContainerPath: "/etc/vdev/docker/",
                    HostPath:      filename,
                    ReadOnly:      false,
                }, &kubeletdevicepluginv1beta1.Mount{
                    ContainerPath: "/opt/hygondriver",
                    HostPath:      os.Getenv("HYGONPATH"),
                    ReadOnly:      false,
                }, &kubeletdevicepluginv1beta1.Mount{
                    ContainerPath: "/opt/hyhal",
                    HostPath:      "/opt/hyhal",
                    ReadOnly:      false,
                })
                car.Mounts = append(car.Mounts)
            }
        }
    }
    responses.ContainerResponses = append(responses.ContainerResponses, &car)
    klog.Infoln("response=", responses)
    util.PodAllocationTrySuccess(nodename, util.HygonDCUDevice, NodeLockDCU, current)
    return &responses, nil
}
```

和 hami-nvidia-device-plugin 一样的逻辑，在 hami-scheduler 的时候就已经把要分配的 device 选好了。

### DecodePodDevices

```go
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

### createvdevFiles

最后会创建一个 vdev 配置文件并挂载到 Pod 里

```go
filename, err := p.createvdevFiles(current, &currentCtr, devreq)
if err != nil {
    util.PodAllocationFailed(nodename, current, NodeLockDCU)
    return &responses, err
}
if len(filename) > 0 {
    car.Mounts = append(car.Mounts, &kubeletdevicepluginv1beta1.Mount{
        ContainerPath: "/etc/vdev/docker/",
        HostPath:      filename,
        ReadOnly:      false,
    })
    car.Mounts = append(car.Mounts)
}
```

之前的 RefreshContainerDevices 方法维护的就是这里创建的 vdev 配置文件，当 Pod 删除后需要清理对应的目录。

```go
dirName := string(current.UID) + "_" + ctr.Name + "_" + fmt.Sprint(devidx) + "_" + fmt.Sprint(pipeid) + "_" + fmt.Sprint(vdevidx) + "_" + fmt.Sprint(coremsk1) + "_" + fmt.Sprint(coremsk2)
cacheFileHostDirectory := fmt.Sprintf("/usr/local/vgpu/dcu/%s", dirName)
err = createvdevFile(pcibusId, coremsk1, coremsk2, reqcores, mem, 0, vdevidx, pipeid, cacheFileHostDirectory, "vdev0.conf")
if err != nil {
    return "", err
}
```

createvdevFile 内容如下：

```go
func createvdevFile(pcibusId, coremsk1, coremsk2 string, reqcores, mem int32, deviceid, vdevidx, pipeid int, cacheFileHostDirectory, cacheFileName string) error {
    s := ""
    s = fmt.Sprintf("PciBusId: %s\n", pcibusId)
    s = s + fmt.Sprintf("cu_mask: 0x%s\n", coremsk1)
    s = s + fmt.Sprintf("cu_mask: 0x%s\n", coremsk2)
    s = s + fmt.Sprintf("cu_count: %d\n", reqcores)
    s = s + fmt.Sprintf("mem: %d MiB\n", mem)
    s = s + fmt.Sprintf("device_id: %d\n", deviceid)
    s = s + fmt.Sprintf("vdev_id: %d\n", vdevidx)
    s = s + fmt.Sprintf("pipe_id: %d\n", pipeid)
    s = s + fmt.Sprintln("enable: 1")
    klog.Infoln("s=", s)

    _, err := os.Stat(cacheFileHostDirectory)
    if os.IsNotExist(err) {
        err := os.MkdirAll(cacheFileHostDirectory, 0777)
        if err != nil {
            return err
        }
        err = os.Chmod(cacheFileHostDirectory, 0777)
        if err != nil {
            return err
        }
    }

    err = os.WriteFile(fmt.Sprintf("%s/%s", cacheFileHostDirectory, cacheFileName), []byte(s), os.ModePerm)
    if err != nil {
        return err
    }
    return nil
}
```

就是简单创建了一个文件，但是把相关信息都写到文件里了，后续驱动程序根据该配置文件就知道该 Pod 可以使用多少 core 多少 mem 了。

>ps：和 vGPU 通过 env 传递信息的方式不同，但是作用都是一样的。

这部分逻辑和以下命令一致，都是用于创建 vDCU 配置文件。

```bash
$ hy-smi virtual -create-vdevices 4 -d 0 \
-vdevice-compute-units 5,15,20,20 \
-vdevice-memory-size 4096,8192,8192,8192
```
---
*想了解更多 HAMi 项目信息，请访问 [GitHub 仓库](https://github.com/Project-HAMi/HAMi) 或加入我们的 [Slack 社区](https://cloud-native.slack.com/archives/C07T10BU4R2)。* 

---

