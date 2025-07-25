---
title: "HAMi vGPU 方案：实现细粒度 GPU 切分"
slug: "open-source-vgpu-hami-fine-grained-partitioning"
date: "2025-07-21"
excerpt: "本文主要分享一个开源的GPU虚拟化方案：HAMi，包括如何安装、配置以及使用。"
author: 密瓜智能
tags: ["HAMI", "GPU 共享", "vGPU", "Kubernetes", "异构算力"]
coverImage: "/images/blog/gpu1/cover.jpg"
language: "zh"
---

# 开源 vGPU 方案：HAMi —— 实现细粒度 GPU 切分  
> 本文主要分享一个开源的 GPU 虚拟化方案：HAMi，包括如何安装、配置以及使用。

本文摘自：https://mp.weixin.qq.com/s/7L6NuSSP_iMwbtooQIJUjw

## 1. 为什么需要 GPU 共享 / 切分？

开始之前我们先思考一个问题，为什么需要 GPU 共享、切分等方案？

或者说是另外一个问题：明明直接在裸机环境使用，都可以多个进程共享 GPU，怎么到 k8s 环境就不行了？

### 资源感知 ###

首先在 k8s 中资源是和节点绑定的，对于 GPU 资源，我们只用 NVIDIA 提供的 device plugin 进行感知，并上报到 Kube-apiserver，这样我们就能在Node对象上看到对应的资源了。

就像这样：


```bash
Capacity:
  cpu:                128
  ephemeral-storage:  879000896Ki
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  memory:             1056457696Ki
  nvidia.com/gpu:     8
  pods:               110
  ```

可以看到，该节点除了基础的 cpu、memory 之外，还有一个 `nvidia.com/gpu: 8` 信息，表示该节点上有 8 个 GPU。


### 资源申请 ###

然后我们就可以在创建 Pod 时申请对应的资源了，比如申请一个 GPU：


```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
  - name: gpu-container
    image: nvidia/cuda:11.0-base   # 一个支持 GPU 的镜像
    resources:
      limits:
        nvidia.com/gpu: 1          # 申请 1 个 GPU
    command: ["nvidia-smi"]        # 示例命令，显示 GPU 的信息
  restartPolicy: OnFailure
  ```

apply 该 yaml 之后，kube-scheduler 在调度该 Pod 时就会将其调度到一个拥有足够 GPU 资源的 Node 上。

同时该 Pod 申请的部分资源也会标记为已使用，不会再分配给其他 Pod。

到这里，问题的答案就已经很明显了：

- device-plugin 感知到节点上的物理 GPU 数量，上报到 kube-apiserver

- kube-scheduler 调度 Pod 时会根据 pod 中的 Request 消耗对应资源

**即：Node 上的 GPU 资源被 Pod 申请之后，在 k8s 中就被标记为已消耗了，后续创建的 Pod 会因为资源不够导致无法调度。**

实际上：可能 GPU 性能比较好，可以支持多个 Pod 共同使用，但是因为 k8s 中的调度限制导致多个 Pod 无法正常共享。

因此，我们才需要 GPU 共享、切分等方案。

今天给大家分享一个开源的 vGPU 方案 **HAMI[1]**。

<div style="border: 1px solid #ddd; padding: 5px; background-color: #f9f9f9;">
ps: NVIDIA 也有自己的 vGPU 方案，但是需要 license
</div>



---

## 2. 什么是HAMi？

HAMi全称是： **Heterogeneous AI Computing Virtualization Middleware** ，HAMi给自己的定位或者希望是做一个异构算力虚拟化平台。 


但是现在比较完善的是对 NVIDIA GPU 的 vGPU 方案，因此我们可以简单认为他就是个vGPU方案。

整体架构如下：

![p3](/images/blog/gpu1/photo3.jpg)

可以看到组件还是比较多的，涉及到 Webhook、Scheduler、Device Plugin、HAMi-Core 等等。这篇文章只讲使用，因此架构、原理就一笔带过。

### Feature ###

使用 HAMi 最大的一个功能点就是可以实现 GPU 的细粒度的隔离，可以对 core 和 memory 使用 1% 级别的隔离。

具体如下：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
    - name: ubuntu-container
      image: ubuntu:18.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          nvidia.com/gpu: 1          # 请求 1 个 vGPU
          nvidia.com/gpumem: 3000    # 每个 vGPU 申请 3000 MiB 显存（可选）
          nvidia.com/gpucores: 30    # 每个 vGPU 使用 30% 的 GPU 算力（可选）
  restartPolicy: OnFailure
  ```

- **nvidia.com/gpu**：请求一个 GPU
- **nvidia.com/gpumem**：只申请使用 3000M GPU Memory
- **nvidia.com/gpucores**：申请使用 30% 的 GPU core，也就是该 Pod 只能使用到 30% 的算力

### Design ###

HAMi实现 GPU core和 memory 隔离、限制是使用的 vCUDA 方案，具体设计如下：

![p5](/images/blog/gpu1/photo5.jpg)

HAMi 使用的是软件层面的 vCUDA 方案，对 NVIDIA 原生的 CUDA 驱动进行重写(libvgpu.so)，然后挂载到 Pod 中进行替换，然后在自己的实现的 CUDA 驱动中对 API 进行拦截，实现资源隔离以及限制的效果。

例如：原生 libvgpu.so 在进行内存分配时，只有在 GPU 内存真的用完的时候才会提示 CUDA OOM，但是对于 HAMi 实现的 libvgpu.so 来说，检测到 Pod 中使用的内存超过了 Resource 中的申请量就直接返回 OOM，从而实现资源的一个限制。

然后在执行 nvidia-smi 命令查看 GPU 信息时，也只返回 Pod Resource 中申请的资源，这样在查看时也进行隔离。

<div style="border: 1px solid #ccc; padding: 10px; background-color: #f0f0f0;">
ps: 需要对 CUDA 和 NVML 的部分 API 拦截。
</div>

---

## 3. HAMi 功能速览

HAMi 提供了 Helm Chart 安装也是比较简单的。

### 部署GPU Operator ###

需要注意的是 HAMi 会依赖 NVIDIA 的那一套，因此推荐先部署 GPU-Operator。

部署好 GPU Operator 之后再部署HAmi。

### 部署HAMi ###

首先使用 helm 添加我们的 repo

```bash
helm repo add hami-charts https://project-hami.github.io/HAMi/
```

随后，使用下列指令获取集群服务端版本

<div style="border: 1px solid #ccc; padding: 10px; background-color: #f0f0f0; margin: 10px 0;">
这里使用的是 v1.27.4 版本
</div>

```bash
kubectl version
```

在安装过程中须根据集群服务端版本（上一条指令的结果）指定调度器镜像版本，例如集群服务端版本为 v1.27.4，则可以使用如下指令进行安装

```bash
helm install hami hami-charts/hami \
  --set scheduler.kubeScheduler.imageTag=v1.27.4 \
  -n kube-system
  ```

通过 kubectl get pods 指令看到 **vgpu-device-plugin** 与 **vgpu-scheduler**两个 pod 状态为 **Running** 即为安装成功。

```bash
root@iZj6c5dnq07p1ic04ei9vwZ:~# kubectl get pods -n kube-system|grep hami
hami-device-plugin-b6mvj                          2/2     Running   0          42s
hami-scheduler-7f5c5ff968-26kjc                   2/2     Running   0          42s
```

### 自定义配置 ###


> 📄 官方文档参考：[HAMi-config.cn.md](https://github.com/Project-HAMi/HAMi/blob/master/docs/config_cn.md)

你可以在安装过程中，通过 **-set** 来修改以下的客制化参数，例如：

```bash
helm install vgpu vgpu-charts/vgpu \
  --set devicePlugin.deviceMemoryScaling=5 \
  ...
  ```

- **devicePlugin.deviceSplitCount**：整数类型，预设值是 10。GPU 的分割数，每一张 GPU 都不能分配超过其配置数目的任务。若其配置为 N 的话，每个 GPU 上最多可以同时存在 N 个任务。
- **devicePlugin.deviceMemoryScaling**: 浮点数类型，预设值是 1。NVIDIA 装置显存使用比例，可以大于 1（启用虚拟显存，实验功能）。对于有 M 显存大小的 NVIDIA GPU，如果我们配置 devicePlugin.deviceMemoryScaling 参数为 S ，在部署了我们装置插件的 Kubenetes 集群中，这张 GPU 分出的 vGPU 将总共包含 S * M 显存。
- **devicePlugin.migStrategy**: 字符串类型，目前支持 "none“ 与 “mixed“ 两种工作方式，前者忽略 MIG 设备，后者使用专门的资源名称指定 MIG 设备，使用详情请参考 mix_example.yaml，默认为 "none"
- **devicePlugin.disablecorelimit**: 字符串类型，"true" 为关闭算力限制，"false" 为启动算力限制，默认为 "false"
- **scheduler.defaultMem**：整数类型，预设值为 5000，表示不配置显存时使用的默认显存大小，单位为 MB
- **scheduler.defaultCores**：整数类型（0-100），默认为 0，表示默认为每个任务预留的百分比算力。若设置为 0，则代表任务可能会被分配到任一满足显存需求的GPU 中，若设置为 100，代表该任务独享整张显卡
- **scheduler.defaultGPUNum**：整数类型，默认为 1，如果配置为 O，则配置不会生效。当用户在 pod 资源中没有设置 nvidia.com/gpu 这个 key 时，webhook 会检查 nvidia.com/gpumem 、resource-mem-percentage 、 nvidia.com/gpucores 这三个 key 中的任何一个 key 有值，webhook 都会添加 nvidia.com/gpu 键和此默认值到 resources limit 中。
- **resourceName**：字符串类型，申请 vgpu 个数的资源名，默认："nvidia.com/gpu"
- **resourceMem**：字符串类型，申请 vgpu 显存大小资源名，默认："nvidia.com/gpumem"
- **resourceMemPercentage**：字符串类型，申请 vgpu 显存比例资源名，默认：
"nvidia.com/gpumem-percentage"
- **resourceCores**：字符串类型，申请 vgpu 算力资源名，默认：
"nvidia.com/cores"
- **resourcePriority**：字符串类型，表示申请任务的任务优先级，默认：
"nvidia.com/priority"

除此之外，容器中也有对应配置

- **GPU_CORE_UTILIZATION_POLICY**：字符串类型，"default"， "force"， "disable"代表容器算力限制策略，"default“ 为默认，"force" 为强制限制算力，一般用于测试算力限制的功能，"disable" 为忽略算力限制
- **ACTIVE_OOM_KILLER**：字符串类型，"true" ，"false" 代表容器是否会因为超用显存（OOM, Out Of Memory）而被终止执行，"true" 为会，"false" 为不会

我们只是简单 Demo 就不做任何配置直接部署即可。

---

## 4. 验证
### 查看Node GPU资源 ###

类似于上一篇分享的 TimeSlicing 方案，在安装之后，Node 上可见的 GPU 资源也是增加了。环境中只有一个物理 GPU，但是 HAMi 默认会扩容 10 倍，理论上现在 Node 上能查看到 1*10 = 10 个 GPU。

<div style="border: 1px solid #ccc; padding: 10px; background-color: #f0f0f0;">
默认参数就是切分为 10 个，可以设置。
</div>

```bash
$ kubectl get node xxx -oyaml | grep capacity -A 7
  capacity:
    cpu: "4"
    ephemeral-storage: 206043828Ki
    hugepages-1Gi: "0"
    hugepages-2Mi: "0"
    memory: 15349120Ki
    nvidia.com/gpu: "10"
    pods: "110"
```

    

### 验证显存和算力限制 ###

使用以下 yaml 来创建 Pod，注意 resources.limit 除了原有的 nvidia.com/gpu 之外还新增了 nvidia.com/gpumem 和 nvidia.com/gpucores，用来指定显存大小和算力大小。

- nvidia.com/gpu：请求的 vgpu 数量，例如 1
- nvidia.com/gpumem ：请求的显存数量，例如 3000M
- nvidia.com/gpumem-percentage：显存百分百，例如 50 则是请求 50%显存
- nvidia.com/priority: 优先级，0 为高，1 为低，默认为 1。

对于高优先级任务，如果它们与其他高优先级任务共享同一 GPU 节点，则不会受到 **resourceCores** 的限制，可以充分利用节点上的所有可用资源。

同样地，低优先级任务如果独占 GPU 节点，也不会受到 **resourceCores** 的限制，能够使用节点上的全部资源。

只有当多个不同优先级的任务同时运行在同一 GPU 节点时，**resourceCores** 限制才会生效，以确保资源分配的公平性和隔离性。

完整 gpu-test.yaml 内容如下：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
    - name: ubuntu-container
      image: ubuntu:18.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          nvidia.com/gpu: 1          # 请求 1 个 vGPU
          nvidia.com/gpumem: 3000    # 每个 vGPU 申请 3000 MiB 显存（可选）
          nvidia.com/gpucores: 30    # 每个 vGPU 使用 30% 显卡算力（可选）
```

Pod 能够正常启动

```bash
root@iZj6c5dnq07p1ic04ei9vwZ:~# kubectl get po
NAME      READY   STATUS    RESTARTS   AGE
gpu-pod   1/1     Running   0          48s
```

进入 Pod 执行 nvidia-smi 命令，查看 GPU 信息，可以看到展示的限制就是 Resource 中申请的 3000M。

```bash
root@iZj6c5dnq07p1ic04ei9vwZ:~# kubectl exec -it gpu-pod -- bash
root@gpu-pod:/# nvidia-smi
[HAMI-core Msg(16:139711087368000:libvgpu.c:836)]: Initializing.....
Mon Apr 29 06:22:16 2024
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.54.14       Driver Version: 550.54.14      CUDA Version: 12.4          |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf         Pwr:Usage/Cap |        Memory-Usage   | GPU-Util  Compute M. |
|                                         |                        |              MIG M. |
|=========================================+========================+======================|
|   0  Tesla T4                       On |  00000000:00:07.0 Off |                   0 |
| N/A   33C    P8              15W /  70W |      0MiB /   3000MiB |      0%      Default |
|                                         |                        |                 N/A |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                               |
|  GPU   GI   CI        PID   Type   Process name                             GPU Memory |
|        ID   ID                                                              Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
[HAMI-core Msg(16:139711087368000:multiprocess_memory_limit.c:434)]: Calling exit handler 16
```

根据最后的日志就是 HAMi 的 CUDA 驱动打印的。

> `[HAMI-core Msg(...multiprocess_memory_limit.c:434)]: Calling exit handler 16`  
----

## 5. 小结

本文主要分享了开源 vGPU 方案 HAMi，并通过简单 Demo 进行了验证。

**为什么需要 GPU 共享、切分？**
在 k8s 中使用默认 device plugin 时，GPU 资源和物理 GPU 是一一对应的，导致一个物理 GPU 被一个 Pod 申请后，其他 Pod 就无法使用了。

为了提高资源利用率，因此我们需要 GPU 共享、切分等方案。

**HAMi 大致实现原理**

通过替换容器中的 libvgpu.so 库，实现 CUDA API 拦截，最终实现对 GPU core 和 memory 的隔离和限制。

---

**参考资料**

[1]HAMi: https://github.com/Project-HAMi/HAMi

[2]HAMi-config-cn.md: https://github.com/Project-HAMi/HAMi/blob/master/docs/config_cn.md

------

*想了解更多 HAMi 项目信息，请访问 [GitHub 仓库](https://github.com/Project-HAMi/HAMi) 或加入我们的 [Slack 社区](https://cloud-native.slack.com/archives/C07T10BU4R2)。* 

---

