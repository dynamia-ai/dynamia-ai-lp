---
title: "HAMi Heterogeneous Device Virtualization with Hygon DCU: vDCU Resource Scheduling in K8s"
slug: "open-source-vgpu-hami-K8s-vDCU"
date: "2025-07-31"
excerpt: "This article analyzes how Hygon DCU devices can be virtualized through HAMi to achieve unified management and scheduling."
author: "Dynamia AI Team"
tags: ["HAMI", "GPU Sharing", "vGPU", "Kubernetes", "Heterogeneous Computing"]
coverImage: "/images/blog/KAI-Scheduler-VS-HAMi/cover.jpg"
language: "en"
---


This article is adapted from: https://mp.weixin.qq.com/s/gpyhltXK3CSTkwk4ZwD74A

After a series of articles analyzing the deployment, usage, and underlying implementation principles of HAMi vGPU, this article will analyze how Hygon DCU devices can be virtualized through HAMi to achieve unified management and scheduling.

## 1. vDCU Related Commands

Before we begin, let's briefly go over how to use the native vDCU functionality of Hygon DCU.

### 1.1 View Physical DCU Resources

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

### 1.2 Split vDCU

Split a DCU into 4 parts, containing 5, 15, 20, and 20 compute units, and 4096, 8192, 8192, and 8192MiB of video memory, respectively.

```bash
$ hy-smi virtual -create-vdevices 4 -d 0 \
-vdevice-compute-units 5,15,20,20 \
-vdevice-memory-size 4096,8192,8192,8192

The virtual device is created successfully!
```

### 1.3 View vDCU Information

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
 Global memory: 8589934592 bytes```

### 1.4 Destroy vDCU

```bash
# -d ${dev_id} specifies the physical DCU ID. If not specified, all physical DCUs are selected.
# -destroy-vdevice destroys all vDCUs on this physical DCU.
hy-smi virtual -d ${dev_id} -destroy-vdevice
```

### 1.5 Using vDCU with Docker

Execute the following command when starting the container to mount the vDCU into it. The following command indicates that the user mounts the 0th vDCU instance when starting the container.

```bash
docker run -it --name container_name \
--device=/dev/kfd \
--device=/dev/dri \
--device=/dev/mkfd \
-v /etc/vdev/vdev0.conf:/etc/vdev/docker/vdev0.conf:ro \
${docker_image:tag} \
/bin/bash
```

**As you can see, in addition to mounting device files like kfd, dri, and mkfd via the `--device` flag, an additional `/etc/vdev/vdev0.conf` file is mounted into the container.**

In fact, this file is the vDCU's configuration file, which records the detailed information of that vDCU.

Although we can't see the relevant source code, it's certain that the driver will check for the existence of this file. If it exists, it means a vDCU is currently in use. The driver then uses the information in this file to find the corresponding physical DCU, as well as core, memory, and other information to enforce the limits.

Next, let's see how to use vDCU in HAMi.

## 2. Deploying HAMi

Prerequisites:

- dtk driver >= 24.04

### 2.1 Deployment

Deploy using Helm.

```bash
# Add repo
helm repo add hami-charts https://project-hami.github.io/HAMi/
# Install
helm install hami hami-charts/hami -n kube-system
```

> PS: You can customize your installation by adjusting the [HAMi deployment configuration](https://github.com/Project-HAMi/HAMi/blob/master/docs/config.md).

If your current environment cannot pull online images, you can specify an image repository.

```bash
export registry=192.168.10.172:5000
# If no tag is specified, the same version as the current cluster will be used automatically. Ensure the Registry has this image.
export kubescheduler=$registry/kube-scheduler

helm upgrade --install hami hami-charts/hami -n kube-system \
--set scheduler.kubeScheduler.image=$kubescheduler \
--set scheduler.extender.image=$registry/projecthami/hami \
--set scheduler.patch.imageNew=$registry/liangjw/kube-webhook-certgen:v1.1.1
```

### 2.2 Check Pod Running Status

```bash
$ kubectl -n kube-system get po -l app.kubernetes.io/name=hami
NAME                              READY   STATUS    RESTARTS   AGE
hami-scheduler-6dbdf69644-mz9m5   2/2     Running   0          2m19s
```

If `hami-scheduler` is Running, the installation was successful.

>PS: For a DCU environment, only the hami-scheduler Pod will be started.

## 3. Deploying hami-vdcu-device-plugin

```bash
# The corresponding DevicePlugin also uses the version provided by the HAMi community.
# First, label the DCU nodes with dcu=on.
kubectl label nodes {nodeid} dcu=on
```

### 3.1 Preparation

Then, perform the following preparations.

Create the vdev directory.

```bash
# on the dcu node, create this directory:
$ mkdir /etc/vdev
```

Copy dtk to the /opt/dtk directory.

>Because the container will uniformly mount /opt/dtk, we copy it from the deployment directory to the specified directory.

```bash
# should change dtk-xx.xx.x to your installed dtk version
$ cp -r /opt/dtk-xx.xx.x /opt/dtk
```

Note: The `/opt/dtk-xx.xx.x` path depends on the directory specified when you previously deployed DTK.

### 3.2 Deployment

Now you can start the deployment.

Get the relevant YAML from the https://github.com/Project-HAMi/dcu-vgpu-device-plugin project:

```bash
wget https://raw.githubusercontent.com/Project-HAMi/dcu-vgpu-device-plugin/refs/heads/master/k8s-dcu-plugin.yaml
wget https://raw.githubusercontent.com/Project-HAMi/dcu-vgpu-device-plugin/refs/heads/master/k8s-dcu-rbac.yaml
```

Then deploy the device-plugin.

```bash
kubectl apply -f k8s-dcu-rbac.yaml
kubectl apply -f k8s-dcu-plugin.yaml
```

### 3.3 Check Pod Running Status

Confirm that the relevant components are running correctly:

```bash
$ kubectl get po -n kube-code
NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE
kube-code     hami-dcu-vgpu-device-plugin-cgwwv        1/1     Running   4          14m
kube-code     hami-dcu-vgpu-device-plugin-lp7gl        1/1     Running   0          8m36s
kube-code     hami-dcu-vgpu-device-plugin-lswbl        1/1     Running   0          8m40s
kube-code     hami-dcu-vgpu-device-plugin-svwl7        1/1     Running   0          8m38s
kube-code     hami-scheduler-bb5586989-q7bvr           2/2     Running   0          54m
```

As you can see, the dcu-vdcu-device-plugin on several DCU nodes is running normally.

At this point, the relevant components are deployed. Next, let's verify if vDCU can be used correctly.

## 4. Verifying vDCU

### 4.1 View Node Resources

Next is to check the node's resource situation and whether vDCU is registered correctly.

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

Here, `hygon.com/dcunum: 32` is the number of vDCUs. A single node has 8 DCUs, and here it is split 4 ways.

>PS: Because a single physical Hygon DCU currently only supports being split into 4 vDCUs.

### 4.2 Start a Pod Using vDCU

The complete YAML is as follows:

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
          hygon.com/dcucores: 15 # each dcu use 15% of total compute cores```

Similar to vGPU, it supports specifying the number of cards, core, memory, and other resources separately.

After entering the Pod, first source the environment variables.

```bash
source /opt/hygondriver/env.sh
```

Then use the following command to verify:

```bash
hy-virtual -show-device-info
```

```bash
Device 0:
        Actual Device: 0
        Compute units: 9
        Global memory: 2097152000 bytes
```

`Compute units` and `Global memory` are the core and memory we specified earlier.

This confirms that HAMi vDCU is working.

### 4.3 Notes

Some important notes:

1. If your image is not a 'dtk-embedded-image', you need to install `pciutils`, `libelf-dev`, and `kmod` after the task runs. Otherwise, DCU tools like `hy-smi` or `hy-virtual` may not work correctly.

2. Sharing DCUs in init containers is not supported. Pods with "hygon.com/dcumem" in an init container will never be scheduled.

3. Each container can only get one vDCU. If you want to mount multiple DCU devices, you should not set `hygon.com/dcumem` or `hygon.com/dcucores`.

## 5. Implementation Analysis

Let's briefly analyze the vdcu-device-plugin. According to the steps for using vDCU in the first chapter, the vdcu-device-plugin, in addition to the normal reporting of device information and allocation of devices, also needs to handle the following things:

1.  **vDCU Configuration File Maintenance**
    *   When a Pod is created, generate the corresponding vDCU configuration file based on the core and memory requested in the YAML.
    *   When the Pod is deleted, the corresponding configuration file also needs to be deleted.

2.  **Mounting the vDCU Configuration File into the Pod**
    *   This is the only way for the driver to know how much core and memory to limit this vDCU to.

It's recommended to read this first:
[HAMi vGPU Solution Analysis Part 1: hami-device-plugin-nvidia Implementation](https://dynamia.ai/zh/blog/open-source-vgpu-hami-device-plugin-nvidia)

The implementations are similar.

### 5.1 Register

First, the DevicePlugin must be registered with the Kubelet. Here, `device-plugin-manager` is used, so there is no separate registration code. However, we can look at what work is done at startup.

```go
// Start is an optional interface that could be implemented by plugin.
// If case Start is implemented, it will be executed by Manager after
// plugin instantiation and before its registration to kubelet. This
// method could be used to prepare resources before they are offered
// to Kubernetes.
func (p *Plugin) Start() error {
    var err error

    // Initialize device info
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

At startup, DCU information is obtained through `dcgm.DeviceInfos()`.

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

Specific implementation:

```go
// DeviceInfos gets the list of device information.
// @Summary Get the list of device information
// @Description Returns a list of detailed information for all devices
// @Produce json
// @Success 200 {array} DeviceInfo "Returns a list of device information"
// @Failure 500 {object} error "Internal server error"
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
        // Parse BDFID
        domain := (bdfid >> 32) & 0xffffffff
        bus := (bdfid >> 8) & 0xff
        dev := (bdfid >> 3) & 0x1f
        function := bdfid & 0x7
        // Format PCI ID
        pciBusNumber := fmt.Sprintf("%04X:%02X:%02X.%X", domain, bus, dev, function)
        // Device serial number
        deviceId, _ := rsmiDevSerialNumberGet(i)
        // Get device type identifier id
        devTypeId, _ := rsmiDevIdGet(i)
        devType := fmt.Sprintf("%x", devTypeId)
        // Model name
        devTypeName := type2name[devType]
        // Get total device memory
        memoryTotal, _ := rsmiDevMemoryTotalGet(i, RSMI_MEM_TYPE_FIRST)
        mt, _ := strconv.ParseFloat(fmt.Sprintf("%f", float64(memoryTotal)/1.0), 64)
        glog.Info(" DCU[%v] memory total memory total: %.0f", i, mt)
        // Get used device memory
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

// rsmiNumMonitorDevices gets the number of gpus *
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

// rsmiDevPciIdGet gets the unique pci device identifier
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

This method mainly calls two other methods:

-   `RefreshContainerDevices`: Maintains vDCU configuration information, removing corresponding files after a Pod is deleted.
-   `RegistrInAnnotation`: Records the physical DCU information on the node to the node's Annotation.

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

Based on the files in the `/usr/local/vgpu/dcu` directory and the Pod information in Kubernetes, this function updates the vDCU usage status and cleans up unused vDCU configuration files to ensure that the device status information is consistent with the actual usage.

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

This records the Device information in the Node's Annotation, so that `hami-scheduler` can get the detailed information of the DCUs on each node from the Annotation.

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

`ListAndWatch` detects the DCUs on the node and reports them to the Kubelet, which is then submitted to the kube-apiserver by the Kubelet, and finally updated in the Node's Resources.

The content of the ListAndWatch method is as follows:

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

Looking at it, there is some ineffective code. The useful part is below:

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

Based on the device information obtained in the `Start` method earlier, `fakeDevice`s are generated and submitted to the kubelet.

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

Here, `Count` is fixed at 4, meaning each DCU can be split into 4 vDCUs.

>PS: Because the Hygon DCU virtualization function currently supports a maximum of 4 vDCUs on one physical card.

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

Then, in `generateFakeDevs`, a sufficient number of fakedevs are copied based on the Count information. At this point, the number of DCUs perceived by the Kubelet will be 4 times the number of physical DCUs.

### Allocate

`Allocate` contains the logic for actually allocating vDCUs to the Pod.

>PS: Because there is no separate container runtime, some extra work needs to be done in Allocate, such as mounting devices or directories like kfd, mkfd, dri, hygondriver, hyhal, etc., into the Pod.

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

This is the same logic as `hami-nvidia-device-plugin`; the device to be allocated has already been selected during the `hami-scheduler` phase.

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

Finally, a vdev configuration file will be created and mounted into the Pod.

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

The `RefreshContainerDevices` method from earlier maintains the vdev configuration files created here. When the Pod is deleted, the corresponding directory needs to be cleaned up.

```go
dirName := string(current.UID) + "_" + ctr.Name + "_" + fmt.Sprint(devidx) + "_" + fmt.Sprint(pipeid) + "_" + fmt.Sprint(vdevidx) + "_" + fmt.Sprint(coremsk1) + "_" + fmt.Sprint(coremsk2)
cacheFileHostDirectory := fmt.Sprintf("/usr/local/vgpu/dcu/%s", dirName)
err = createvdevFile(pcibusId, coremsk1, coremsk2, reqcores, mem, 0, vdevidx, pipeid, cacheFileHostDirectory, "vdev0.conf")
if err != nil {
    return "", err
}```

The content of `createvdevFile` is as follows:

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

It simply creates a file and writes all the relevant information into it. The driver can then read this configuration file to know how much core and memory the Pod can use.

>PS: This is different from the way vGPU passes information through environment variables, but the purpose is the same.

This part of the logic is consistent with the following command, both are used to create vDCU configuration files.

```bash
$ hy-smi virtual -create-vdevices 4 -d 0 \
-vdevice-compute-units 5,15,20,20 \
-vdevice-memory-size 4096,8192,8192,8192
```

---
*To learn more about the HAMi project, please visit our [GitHub repository](https://github.com/Project-HAMi/HAMi) or join our [Slack community](https://cloud-native.slack.com/archives/C07T10BU4R2).*

---