---
title: "开源协同共进，Koordinator v1.6 发布：携手 HAMi 社区打造 AI/ML 异构资源调度新篇章"
coverTitle: "Koordinator v1.6 × HAMi | 异构调度协同"
slug: "Open-source synergy: Koordinator v1.6 teams up with HAMi to redefine AI/ML resource scheduling"
date: "2025-08-05"
excerpt: "我会从这几个角度聊聊：HAMi 是什么，与 NVIDIA 的方案有何本质不同？NVIDIA 为何“不为”？是技术不能，还是商业不愿？HAMi 的核心竞争力与长期护城河到底在哪里？"
author: "密瓜智能"
tags: ["vGPU", "HAMi", "GPU 共享", "云原生", "Kubernetes", "AI 基础设施"]
coverImage: "/images/blog/Koordinator-v1.6/cover.jpg"
language: "zh"
---


> 原文作者：王建宇、曾凡松、宋涛、韩柔刚

##  前言

### 社区合作最新进展

在 AI/ML 和大模型场景快速发展的背景下，开源社区协作正在成为推动技术创新的核心力量。Koordinator 社区与 CNCF Sandbox 项目 HAMi 在 v1.6 版本中展开深度合作，联合推出了 GPU 共享强隔离能力 ，为 AI 训练和推理场景提供了更高效的资源调度与隔离方案。此次合作不仅结合了 Koordinator 在调度领域的积累与 HAMi 在设备管理中间件的技术优势，通过以下核心能力为 AI 场景提供创新支持：

- GPU 共享强隔离：基于 HAMi-Core 的 CUDA-Runtime 劫持能力，支持多容器安全共享同一 GPU 卡，允许用户按需分配 GPU 算力与显存比例，显著提升小模型或轻量级推理任务推理任务部署密度，避免其独占整卡造成的资源浪费。

这是 Koordinator 与 HAMi 社区的首次联合特性发布，也是双方共同探索异构资源调度标准化的里程碑。未来，双方将持续深化合作，推动更多端到端解决方案的落地，推动社区生态的技术融合，助力企业降本增效。

以下是 Koordinator 官方发布的 v1.6 版本完整介绍，转载于[阿里云基础设施官方文章](https://mp.weixin.qq.com/s/0NEJQUBzyvnSMQRJ7h90Kw)：

### 背景

随着DeepSeek等大模型的火爆，AI和高性能计算领域对异构设备资源调度的需求迅速增长，无论是GPU、NPU还是RDMA等设备。如何高效管理和调度这些资源成为了行业关注的核心问题。在这一背景下，Koordinator积极响应社区诉求，持续深耕异构设备调度能力，并在最新的v1.6版本中推出了一系列创新功能，帮助客户解决异构资源调度难题。

在v1.6版本中，我们完善了设备拓扑调度能力，支持感知更多机型的GPU拓扑结构，显著加速AI应用内的GPU互联性能。与开源项目HAMi合作，推出了端到端的GPU&RDMA联合分配能力以及GPU强隔离能力，有效提升了典型AI训练任务的跨机互联效率和推理任务的部署密度，从而更好地保障应用性能并提高集群资源利用率。同时，增强了Kubernetes社区的资源插件，使其可以对不同资源配置不同的节点打分策略，该功能在GPU任务和CPU任务混部在一个集群中时能有效降低GPU碎片率。

自2022年4月正式开源以来，Koordinator已迭代发布了14个大版本，吸引了来自阿里巴巴、蚂蚁科技、Intel、小红书、小米、爱奇艺、360、有赞等众多企业的优秀工程师参与贡献。他们带来了丰富的想法、代码和实际应用场景，极大地推动了项目的发展。特别值得一提的是，在v1.6.0版本中，共有10位新加入的开发者积极参与到Koordinator社区的建设中，他们是@LY-today、@AdrianMachao、@TaoYang526、@dongjiang1989、@chengjoey、@JBinin、@clay-wangzhi、@ferris-cx、@nce3xin和@lijunxin559。感谢他们的贡献，也感谢所有社区成员的持续投入和支持！

### 核心亮点功能

#### 1、GPU拓扑感知调度：加速AI应用内的GPU互联

随着深度学习和高性能计算（HPC）等领域的快速发展，GPU成为许多计算密集型工作负载的核心资源。在Kubernetes集群中，GPU的高效利用对于提升应用性能至关重要。然而，GPU资源的性能表现并不均衡，受到硬件拓扑结构和资源配置的影响。例如：

1. 在多NUMA节点的系统中，GPU、CPU和内存之间的物理连接可能会影响数据传输速度和计算效率。

2. 对于NVIDIA的L20、L40S等卡型，GPU之间的通信效率取决于它们是否属于同一个PCIE或者同一个NUMANode。

3. 对于华为的晟腾NPU以及虚拟化环境中采用 SharedNVSwitch模式的NVIDIA H系列机器，GPU的分配需要遵守一些预定义的Partition规则。

![p1](/images/blog/Koordinator-v1.6/p1.png)

Koordinator针对上述设备场景，提供了丰富的设备拓扑调度API来满足Pod对于GPU拓扑的诉求。下面是这些API的使用举例：

1. GPU、CPU、内存等分配在同一个NUMA Node

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    scheduling.koordinator.sh/numa-topology-spec: '{"numaTopologyPolicy":"Restricted","singleNUMANodeExclusive":"Preferred"}'
spec:
  containers:
  - resources:
      limits:
        koordinator.sh/gpu: 200
        cpu: 64
        memory: 500Gi
      requests:
        koordinator.sh/gpu: 200
        cpu: 64
        memory: 500Gi
```

2. GPU分配在同一个PCIE

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    scheduling.koordinator.sh/device-allocate-hint: |-
      {
        "gpu": {
          "requiredTopologyScope": "PCIe"
        }
      }
spec:
  containers:
    - resources:
        limits:
          koordinator.sh/gpu: 200
```

3. GPU分配在同一个NUMA Node

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    scheduling.koordinator.sh/device-allocate-hint: |-
      {
        "gpu": {
          "requiredTopologyScope": "NUMANode"
        }
      }
spec:
  containers:
    - resources:
        limits:
          koordinator.sh/gpu: 400
```

4. GPU需按照预定义的Partition分配

通常，GPU预定义Partition规则由特定的GPU型号或系统配置决定，也可能受到具体节点上的GPU配置的影响。调度器无法洞悉硬件型号或GPU类型的具体信息；相反，它依靠节点级别的组件将这些预定义规则上报给设备自定义资源 (CR) 来知晓，如下所示：

```yaml
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Device
metadata:
  annotations:
    scheduling.koordinator.sh/gpu-partitions: |
      {
        "1": [
          {
            "NVLINK": {
              "minors": [0],
              "gpuLinkType": "NVLink",
              "ringBusBandwidth": "400Gi",
              "allocationScore": "1"
            }
          }
        ],
        "2": [],
        "4": [],
        "8": []
      }
  labels:
    node.koordinator.sh/gpu-partition-policy: "Honor"
  name: node-1
```

当同时有多个可选的Partition方案时，Koordinator允许用户决定是否按照最优Partition分配:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hello-gpu
  annotations:
    scheduling.koordinator.sh/gpu-partition-spec: |
      {
        "allocatePolicy": "Restricted"
      }
spec:
  containers:
    - name: main
      resources:
        limits:
          koordinator.sh/gpu: 100
```

当用户不需要按照最优Partition分配时，调度器将会按照尽可能Binpack的方式分配。

想要了解关于GPU拓扑感知调度的更多细节，请参考如下设计文档：

- [NUMA Topology Schedulin](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20230415-numa-topology-scheduling.md)

- [Device Allocate Hint API](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20230803-device-allocate-hint-apis.md)

- [GPU Partition APIs](https://github.com/koordinator-sh/koordinator/blob/main/docs/proposals/scheduling/20241008-gpu-partition-api.md)

由衷感谢社区开发者 @eahydra 对该特性的贡献！

### 2、端到端GDR支持：提升跨机任务的互联性能

![p2](/images/blog/Koordinator-v1.6/p2.png)

在AI模型训练场景中，GPU之间需要进行频繁的集合通信，以同步训练过程迭代更新的权重。GDR全称叫做GPUDirect RDMA，其目的是解决多机GPU设备之间交换数据的效率问题。通过GDR技术多机之间GPU交换数据可以不经过CPU和内存，大幅节省CPU/Memory开销同时降低延时。为了实现这一目标，Koordinator v1.6.0版本中设计实现了GPU/RDMA设备联合调度特性，整体架构如下：

![p3](/images/blog/Koordinator-v1.6/p3.png)

1. Koordlet检测节点上的GPU和RDMA设备，并将相关信息上报给Device CR。

2. Koord-Manager从设备CR同步资源到node.status.allocatable。

3. Koord-Scheduler根据设备拓扑为Pod分配GPU和RDMA，并将分配结果注解到Pods上。

4. Multus-CNI访问Koordlet PodResources Proxy以获取分配给Pods的RDMA设备，并将相应的NIC附加到Pods的网络命名空间中。

5. Koordlet提供NRI插件，将设备挂载到容器中。

由于涉及到众多组件和复杂的环境，Koordinator v1.6.0提供了[最佳实践](https://koordinator.sh/docs/next/best-practices/gpu-and-rdma-joint-allocation/) 来展示如何一步步部署Koordinator、Multus-CNI和SRIOV-CNI。在部署好相关组件之后，用户可以简单采用如下的Pod协议来请求调度器为它申请的GPU和RDMA进行联合分配：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-vf01
  namespace: kubeflow
  annotations:
    scheduling.koordinator.sh/device-joint-allocate: |-
      {
        "deviceTypes": ["gpu","rdma"]
      }
    scheduling.koordinator.sh/device-allocate-hint: |-
      {
        "rdma": {
          "vfSelector": {}
        }
      }
spec:
  schedulerName: koord-scheduler
  containers:
  - name: container-vf
    resources:
      requests:
        koordinator.sh/gpu: 100
        koordinator.sh/rdma: 100
      limits:
        koordinator.sh/gpu: 100
        koordinator.sh/rdma: 100
```

想要更进一步地采用Koordinator端到端地测试GDR任务，大家可以参考[最佳实践]((https://koordinator.sh/docs/next/best-practices/gpu-and-rdma-joint-allocation/))中的样例一步步进行，在此也由衷感谢社区开发者 @ferris-cx 对该特性的贡献！

### 3、GPU共享强隔离：提高AI推理任务的资源利用率

在AI应用中，GPU是大模型训练和推理不可或缺的核心设备，能够为计算密集型任务提供强大的算力支持。然而，这种强大的算力往往伴随着高昂的成本。在实际生产环境中，我们经常会遇到这样的情况：一些小模型或轻量级推理任务仅需占用GPU的一小部分资源（例如20%的算力或GPU内存），但为了运行这些任务，却不得不独占一张高性能GPU卡。这种资源使用方式不仅浪费了宝贵的GPU算力，还显著增加了企业的成本。

这种情况在以下场景中尤为常见：

- **在线推理服务**：许多在线推理任务的计算需求较低，但对延迟要求较高，通常需要部署在高性能GPU上以满足实时性需求。

- **开发与测试环境**：开发者在调试模型时，往往只需使用少量GPU资源，但传统调度方式会导致资源利用率低下。

- **多租户共享集群**：在多用户或多团队共享的GPU集群中，每个任务独占GPU会导致资源分配不均，难以充分利用硬件能力。

为了解决这一问题，Koordinator结合HAMi为用户提供了GPU共享隔离的能力，允许多个Pod共享同一张GPU卡。通过这种方式，不仅可以显著提高GPU的资源利用率，还能降低企业成本，同时满足不同任务对资源的灵活需求。例如，在Koordinator的 GPU共享模式下，用户可以精确分配GPU核心数或显存比例，确保每个任务都能获得所需的资源，同时避免相互干扰。

![p4](/images/blog/Koordinator-v1.6/p4.png)

HAMi是CNCF Sandbox项目，旨在为Kubernetes提供一个设备管理中间件。HAMi-Core是它的核心模块，通过劫持CUDA-Runtime（libcudart.so）和CUDA-Driver（libcuda.so）之间的API调用提供GPU共享隔离能力。在v1.6.0版本中，Koordinator利用HAMi-Core的GPU隔离功能，提供端到端的GPU共享解决方案。

大家可以通过下面的YAML文件部署DaemonSet直接在对应节点上安装HAMi-core。

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: hami-core-distribute
  namespace: default
spec:
  selector:
    matchLabels:
      koord-app: hami-core-distribute
  template:
    metadata:
      labels:
        koord-app: hami-core-distribute
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-type
                operator: In
                values:
                - "gpu"
      containers:
      - command:
        - /bin/sh
        - -c
        - |
          cp -f /k8s-vgpu/lib/nvidia/libvgpu.so /usl/local/vgpu && sleep 3600000
        image: docker.m.daocloud.io/projecthami/hami:v2.4.0
        imagePullPolicy: Always
        name: name
        resources:
          limits:
            cpu: 200m
            memory: 256Mi
          requests:
            cpu: "0"
            memory: "0"
        volumeMounts:
        - mountPath: /usl/local/vgpu
          name: vgpu-hook
        - mountPath: /tmp/vgpulock
          name: vgpu-lock
      tolerations:
      - operator: Exists
      volumes:
      - hostPath:
          path: /usl/local/vgpu
          type: DirectoryOrCreate
        name: vgpu-hook
      - hostPath:
          path: /tmp/vgpulock
          type: DirectoryOrCreate
        name: vgpu-lock
```

Koordinator调度器的GPU Binpack能力是默认开启状态，在安装好Koordinator和HAMi-Core之后，用户可以通过如下方式申请GPU共享卡并启用HAMi-Core隔离。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    koordinator.sh/gpu-isolation-provider: hami-core
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
      requests:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

关于在Koordinator启用HAMi GPU共享隔离能力的使用指导，请参考：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-example
  namespace: default
  labels:
    koordinator.sh/gpu-isolation-provider: hami-core
spec:
  schedulerName: koord-scheduler
  containers:
  - command:
    - sleep
    - 365d
    image: busybox
    imagePullPolicy: IfNotPresent
    name: curlimage
    resources:
      limits:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
      requests:
        cpu: 40m
        memory: 40Mi
        koordinator.sh/gpu-shared: 1
        koordinator.sh/gpu-core: 50
        koordinator.sh/gpu-memory-ratio: 50
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
  restartPolicy: Always
```

关于在Koordinator启用HAMi GPU共享隔离能力的使用指导，请参考：

- [Device Scheduling - GPU Share With HAMi](https://koordinator.sh/docs/next/user-manuals/device-scheduling-gpu-share-with-hami/)

由衷感谢HAMi社区同学@wawa0210对该特性的支持！

### 4.差异化GPU调度策略：有效降低GPU碎片率

在现代Kubernetes集群中，多种类型资源（如CPU、内存、GPU等）通常在一个统一的平台上进行管理。然而，不同类型资源的使用模式和需求往往存在显著差异，这导致了对资源堆叠（Packing）和打散（Spreading）的不同策略需求。

例如：

- GPU资源：在AI模型训练或推理任务中，为了最大化GPU的利用率并减少碎片化，用户通常希望将GPU任务优先调度到已经分配了GPU的节点上（即“堆叠”策略）。这种策略可以避免因GPU分布过于分散而导致资源浪费。

- CPU和内存资源：相比之下，CPU和内存资源的需求更多样化。对于一些在线服务或批处理任务，用户更倾向于将任务分散到多个节点上（即“打散”策略），以避免单个节点上的资源热点问题，从而提高整体集群的稳定性和性能。

此外，在混合工作负载场景中，不同任务对资源的需求也会相互影响。例如：

- 在一个同时运行GPU训练任务和普通CPU密集型任务的集群中，如果CPU密集型任务被调度到GPU节点上并消耗了大量CPU和内存资源，可能会导致后续的GPU任务因非CPU资源不足而无法启动，最终处于Pending状态。

- 在多租户环境中，某些用户可能只申请CPU和内存资源，而另一些用户则需要GPU资源。如果调度器不能区分这些需求，可能会导致资源争用和不公平的资源分配。

![p5](/images/blog/Koordinator-v1.6/p5.png)

Kubernetes原生的NodeResourcesFit插件目前对不同资源只支持配置同样的打分策略，举例如下：

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
  - pluginConfig:
      - name: NodeResourcesFit
        args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: NodeResourcesFitArgs
          scoringStrategy:
            type: LeastAllocated
            resources:
              - name: cpu
                weight: 1
              - name: memory
                weight: 1
              - name: nvidia.com/gpu
                weight: 1
```

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
  - pluginConfig:
      - name: NodeResourcesFit
        args:
          apiVersion: kubescheduler.config.k8s.io/v1
          kind: NodeResourcesFitArgs
          scoringStrategy:
            type: LeastAllocated
            resources:
              - name: cpu
                weight: 1
              - name: memory
                weight: 1
              - name: nvidia.com/gpu
                weight: 1
```

但在生产实践中，有些场景并不适用这种设计。例如：在AI场景中，申请GPU的业务希望优先占用整个GPU机器，防止GPU碎片化；申请CPU&MEM的业务希望优先Spread，以降低CPU热点。Koordinator在v1.6.0版本中引入了NodeResourceFitPlus 插件以支持为不同资源配置差异化的打分策略，用户在安装Koordinator调度器时可配置如下：

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: NodeResourcesFitPlusArgs
      resources:
        nvidia.com/gpu:
          type: MostAllocated
          weight: 2
        cpu:
          type: LeastAllocated
          weight: 1
        memory:
          type: LeastAllocated
          weight: 1
    name: NodeResourcesFitPlus
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
  schedulerName: koord-scheduler
```

另外，申请CPU&MEM的业务会希望优先分散到非GPU机器，防止GPU机器上CPU&MEM消耗过大，导致真正的申请GPU任务因非GPU资源不足而处于Pending状态。Koordinator在 v1.6.0当中引入了ScarceResourceAvoidance插件以支持该需求，用户可配置调度器如下，表示nvidia.com/gpu是稀缺资源，当Pod没有申请该稀缺资源时尽量避免调度到上面。

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- pluginConfig:
  - args:
      apiVersion: kubescheduler.config.k8s.io/v1
      kind: ScarceResourceAvoidanceArgs
      resources:
      - nvidia.com/gpu
    name: ScarceResourceAvoidance
  plugins:
    score:
      enabled:
      - name: NodeResourcesFitPlus
        weight: 2
      - name: ScarceResourceAvoidance
        weight: 2
      disabled:
      - name: "*"
  schedulerName: koord-scheduler
```

关于GPU资源差异化调度策略的详细设计和使用指导，请参考：

- [设计文档](https://koordinator.sh/docs/next/designs/node-resource-fit-plus-scoring/)

- [用户手册](https://koordinator.sh/docs/next/user-manuals/node-resource-fit-plus-scoring/)

由衷感谢社区开发者 @LY-today 对该特性的贡献。

### 5、精细化资源预留：满足AI任务的高效运行需求

异构资源的高效利用往往依赖于与其紧密耦合的CPU和NUMA资源的精确对齐。例如：

- GPU加速任务：在多NUMA节点的服务器中，如果GPU与 CPU或内存之间的物理连接跨越了NUMA边界，可能会导致数据传输延迟增加，从而显著降低任务性能。因此，这类任务通常要求GPU、CPU和内存分配在同一NUMA节点上。

- AI推理服务：在线推理任务对延迟非常敏感，需要确保GPU和CPU的资源分配尽可能靠近，以减少跨NUMA节点的通信开销。

- 科学计算任务：一些高性能计算任务（如分子动力学模拟或天气预测）需要高带宽、低延迟的内存访问，因此必须严格对齐CPU核心和本地内存。

这些需求不仅适用于任务调度，也延伸到了资源预留场景。在生产环境中，资源预留是一种重要的机制，用于为关键任务提前锁定资源，确保其在未来的某个时间点能够顺利运行。然而，在异构资源场景下，简单的资源预留机制往往无法满足精细化的资源编排需求。例如：

- 某些任务可能需要预留特定NUMA节点上的CPU和GPU资源，以保证任务启动后能够获得最佳性能。

- 在多租户集群中，不同用户可能需要预留不同类型的资源组合（如GPU+CPU+内存），并且希望这些资源能够严格对齐。

- 当预留资源未被完全使用时，如何灵活地将剩余资源分配给其他任务，同时避免影响预留任务的资源保障，也是一个重要挑战。

为了应对这些复杂的场景，Koordinator在v1.6版本中对资源预留功能进行了全面增强，提供了更精细化和灵活的资源编排能力。具体包括以下改进：

1. 支持精细化CPU、GPU资源的预留和抢占。
2. 支持Pod对预留资源量的精确匹配。
3. 资源预留亲和性支持指定预留名称和污点容忍属性。
4. 资源预留支持Pods数限制。
5. 支持资源预留抢占低优先级Pod。

插件扩展接口变动：

1. 预留资源校验接口ReservationFilterPlugin从PreScore阶段前置到Filter阶段以确保过滤结果更准确。

2. 预留资源

以下是新功能的使用示例：

1. 预留资源量精确匹配（Exact-Match Reservation）

指定Pod精确匹配预留资源量，可以用于缩小一组Pod和一组预留资源的匹配关系，让预留资源的分配更可控。

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # 指定Pod精确匹配预留的资源类别，Pod只能匹配在这些资源类别下预留资源量和Pod规格完全相等的Reservation对象；比如指定"cpu","memory","nvidia.com/gpu"
    scheduling.koordinator.sh/exact-match-reservation: '{"resourceNames":["cpu","memory","nvidia.com/gpu"]}'
spec:
  # 其余 PodSpec 内容按需补充
  containers:
  - name: app
    resources:
      requests:
        cpu: "4"
        memory: "8Gi"
        nvidia.com/gpu: "1"
      limits:
        cpu: "4"
        memory: "8Gi"
        nvidia.com/gpu: "1"
```

2. 忽略资源预留（reservation-ignored）

指定Pod忽略资源预留，可以让Pod填充已预留但未分配的节点空闲资源，配合抢占使用可以更减少资源碎片。

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    # 指定Pod的调度可以忽略掉资源预留
    scheduling.koordinator.sh/reservation-ignored: "true"
spec:
  containers:
  - name: app
    image: busybox
    command: ["sleep", "3600"]
```

3. 指定资源预留名称的亲和性（ReservationAffinity）

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # 指定Pod匹配的资源预留名称
    scheduling.koordinator.sh/reservation-affinity: '{"name":"test-reservation"}'
spec:
  containers:
  - name: app
    image: busybox
    command: ["sleep", "3600"]
```

4. 指定资源预留的污点和容忍

```yaml
---
apiVersion: scheduling.koordinator.sh/v1alpha1
kind: Reservation
metadata:
  name: test-reservation
spec:
  # 指定Reservation的Taints，其预留资源只能分配给容忍该污点的Pod
  taints:
  - effect: NoSchedule
    key: test-taint-key
    value: test-taint-value
  # 其他 Reservation spec 字段按需补充

---
apiVersion: v1
kind: Pod
metadata:
  annotations:
    # 指定Pod对资源预留的污点容忍
    scheduling.koordinator.sh/reservation-affinity: |
      {
        "tolerations":[
          {
            "key":"test-taint-key",
            "operator":"Equal",
            "value":"test-taint-value",
            "effect":"NoSchedule"
          }
        ]
      }
spec:
  containers:
  - name: app
    image: busybox
    command: ["sleep", "3600"]
```

5. 开启reservation抢占

注：当前不支持高优Pod抢占低优Reservation的用法。

```yaml
apiVersion: kubescheduler.config.k8s.io/v1beta3
kind: KubeSchedulerConfiguration
profiles:
- pluginConfigs:
  - name: Reservation
    args:
      apiVersion: kubescheduler.config.k8s.io/v1beta3
      kind: ReservationArgs
      enablePreemption: true
  plugins:
    postFilter:
      # 关闭 DefaultPreemption，启用 Reservation 插件的抢占
      disabled:
      - name: DefaultPreemption
      enabled:
      - name: Reservation
```

由衷感谢社区开发者 @saintube 对该特性的贡献！

### 6、混部：Mid tier支持空闲资源再分配，增强Pod级别QoS配置

在现代数据中心中，混部技术已经成为提升资源利用率的重要手段。通过将延迟敏感型任务（如在线服务）与资源密集型任务（如离线批处理）混合部署在同一集群中，企业可以显著降低硬件成本并提高资源使用效率。然而，随着混部集群资源水位的不断提高，如何确保不同类型任务之间的资源隔离成为关键挑战。

在混部场景中，资源隔离能力的核心目标是：

- **保障高优先级任务的性能**：例如，在线服务需要稳定的CPU、内存和I/O资源，以满足低延迟要求。

- **充分利用空闲资源**：离线任务应尽可能利用高优先级任务未使用的资源，但不能对高优先级任务造成干扰。

- **动态调整资源分配**：根据节点负载的变化实时调整资源分配策略，避免资源争抢或浪费。

为了实现这些目标，Koordinator持续构建和完善资源隔离能力。在v1.6版本中，我们主要围绕资源超卖和混部QoS展开了一系列功能优化和问题修复，具体包括以下内容：

1. Mid资源超卖和节点画像特性优化计算逻辑，支持超卖节点未分配资源，避免对节点资源进行二次超卖。
2. 负载感知调度优化指标降级逻辑。
3. CPU QoS、Resctrl QoS支持pod维度配置。
4. 带外负载管理补充prometheus metrics，以增强可观测性。
5. Blkio QoS、资源放大等特性的bugfixes。

Mid资源超卖从Koordinator v1.3版本开始引入，提供基于[节点画像](https://koordinator.sh/docs/designs/node-prediction/)的动态资源超卖能力。但是，为了确保超卖资源的稳定性，Mid资源完全从节点上已分配的Prod pods中获取，意味着空节点一开始是没有Mid资源的，这给一些工作负载使用Mid资源带来了诸多不便，Koordinator社区也收到了一些企业用户的反馈和贡献。

![p6](/images/blog/Koordinator-v1.6/p6.png)

在v1.6版本中，Koordinator更新了超卖计算公式，如下：

> NodeAllocatable * thresholdRatio) + ProdUnallocated * unallocatedRatioProdReclaimable := min(max(0, ProdAllocated - ProdPeak * (1 + safeMargin)), NodeUnused)

计算逻辑有两点变化：

1. 支持按静态比例对未分配资源进行超卖，以改善冷启动问题。
2. 不允许超卖实际已使用的节点资源，避免因二次超卖场景导致预估值过大；例如，一些用户使用了Koordinator的节点资源放大能力以调度更多Prod pods，使得节点上ProdAllocated> NodeAllocatable，导致MidAllocatable的预估值已经偏离真实的节点负载。

此外，在混部QoS方面，Koordinator v1.6增强了Pod粒度的QoS策略配置能力，适用于例如混部节点上加黑干扰Pod以及灰度调整混部QoS的使用场景：

1. Resctrl特性，支持Pod维度的LLC和内存带宽隔离能力
2. CPU QoS特性，支持Pod维度的CPU QoS配置

Resctrl特性可通过以下方式在Pod维度启用：

1. 在Koordlet中feature-gate中启用Resctrl特性。
2. 通过Pod Annotation协议node.koordinator.sh/resctrl，配置LLC及内存带宽（MB）限制策略。例如:

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    node.koordinator.sh/resctrl: |
      {
        "llc": {"schemata": {"range": [0, 30]}},
        "mb":  {"schemata": {"percent": 20}}
      }
spec:
  containers:
  - name: app
    image: busybox
    command: ["sleep", "infinity"]
```

Pod维度的CPU QoS配置则可通过以下方式启用：

1. 启用CPU QoS，请参照：https://koordinator.sh/docs/user-manuals/cpu-qos/
2. 通过Pod Annotation协议koordinator.sh/cpuQOS，配置Pod的CPU QoS策略。例如，

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    koordinator.sh/cpuQOS: '{"groupIdentity": 1}'
spec:
  containers:
  - name: app
    image: busybox
    command: ["sleep", "3600"]
```

由衷感谢 @kangclzjc、@j4ckstraw、@lijunxin559、@tan90github、@yangfeiyu20102011 等社区开发者在混部相关特性上的贡献！

### 7、调度、重调度：持续提升的运行效率

在云原生技术持续发展的今天，越来越多的企业将核心业务迁移到Kubernetes平台，集群规模和任务数量呈现爆发式增长。这种趋势带来了显著的技术挑战，尤其是在调度性能和重调度策略方面：

- **调度性能需求**：随着集群规模的扩大，调度器需要处理的任务数量急剧增加，这对调度器的性能和扩展性提出了更高要求。例如，在大规模集群中，如何快速完成Pod的调度决策、降低调度延迟成为关键问题。

- **重调度策略需求**：在多租户环境下，资源竞争加剧，频繁的重调度可能导致工作负载在不同节点之间反复迁移，进而增加系统负担并影响集群稳定性。此外，如何在保障生产任务稳定运行的同时，合理分配资源以避免热点问题，也成为重调度策略设计的重要考量。

为了应对这些挑战，Koordinator在v1.6.0版本中对调度器和重调度器进行了全面优化，旨在提升调度性能、增强重调度策略的稳定性和合理性。以下是我们在当前版本中针对调度器性能的优化：

1. 将PodGroup的MinMember检查提前到PreEnqueue，减少不必要的调度周期。
2. 将Reservation的资源归还延迟到AfterPreFilter阶段，只在PreFilterResult允许的节点上做资源归还，降低算法复杂度。
3. 优化NodeNUMAResource、DeviceShare、Reservation等插件的CycleState分布，降低内存开销。
4. 为Koordinator额外增加的扩展点如BeforePreFilter、AfterPreFilter新增延迟指标。

随着集群规模的不断扩大，重调度过程的稳定性和合理性成为核心关注点。频繁的驱逐可能导致工作负载在节点间反复迁移，增加系统负担并引发稳定性风险。为此，我们在v1.6.0版本中对重调度器进行了多项优化：

#### 1. LowNodeLoad插件优化：

a. LowNodeLoad插件现在支持配置ProdHighThresholds和 ProdLowThresholds，结合Koordinator优先级（Priority）对工作负载的资源利用率进行差异化管理，能够减少生产应用引起的热点问题，从而实现更细粒度的负载均衡；

b. 优化了对待驱逐Pod的排序逻辑，通过分段函数打分算法选出最适合驱逐的Pod，确保合理的资源分配，避免因驱逐资源利用率最大的Pod而造成的稳定性问题；

c. 优化了Pod驱逐前的检查逻辑，LowNodeLoad在驱逐Pod前逐一检查目标节点是否会因重调度成为新的热点节点，这一优化有效避免了反复重调度的发生。

#### 2. 驱逐控制器MigrationController增强：

a. MigrationController具有ObjectLimiter的能力，能够控制某段时间内工作负载的驱逐频率。现在支持配置namespace级别的驱逐限流，对namespace下的驱逐进行更加精细化的控制；同时将ObjectLimiter从Arbitrator迁移到MigrationController 内部，修复了在并发场景下可能出现的限流失效问题；

b. 新增EvictAllBarePods配置项，允许用户开启驱逐没有OwnerRef的Pod，从而提高了重调度的灵活性；

c. 新增MaxMigratingGlobally配置项，MigrationController可以单独控制Pod的最大驱逐数量，从而降低了稳定性风险；

d. 优化了GetMaxUnavailable方法的计算逻辑，当计算工作负载的最大不可用副本数向下取整为0时，默认将其调整为1，避免导致用户对副本不可用数的控制失去预期的准确性和一致性。

#### 3. 新增重调度全局配置参数MaxNoOfPodsToEvictTotal，可以确保重调度器全局的Pod最大驱逐数量，减少对集群的负担并提升稳定性；

由衷感谢社区开发者 @AdrianMachao、@songtao98、@LY-today、@zwForrest、@JBinin、@googs1025、@bogo-y 在调度重调度优化上的贡献！

## 未来计划

Koordinator社区将继续专注于加强GPU资源管理和调度功能，提供重调度插件进一步解决资源分配不均衡导致的GPU碎片问题，并计划在下一个版本中引入更多新的功能和特性，以支持更复杂的工作负载场景；同时，在资源预留和混部方面，我们将进一步优化，以支持更细粒度的场景。

目前社区已经在规划的Proposal如下：

- [精细化设备调度支持晟腾NPU](https://github.com/koordinator-sh/koordinator/issues/2335)

- [提供重调度插件解决资源不均衡问题](https://github.com/koordinator-sh/koordinator/issues/2332)

- [Reservation支持绑定已分配Pod](https://github.com/koordinator-sh/koordinator/issues/2150)

着重解决的使用问题如下：

- [NRI插件冲突](https://github.com/koordinator-sh/koordinator/issues/2334)

长期规划的Proposal如下：

[提供一个端到端可演进的设备管理方案](https://github.com/koordinator-sh/koordinator/issues/2181)

我们鼓励用户反馈使用体验，并欢迎更多开发者参与Koordinator项目，共同推动其发展！

---

HAMi，全称是 Heterogeneous AI Computing Virtualization Middleware（异构算力虚拟化中间件），是一套为管理 k8s 集群中的异构 AI 计算设备而设计的“一站式”架构，能够提供异构 AI 设备共享能力，提供任务间的资源隔离。HAMi 致力于提升 k8s 集群中异构计算设备的利用率，为不同类型的异构设备提供统一的复用接口。HAMi 当前是 CNCF Sandbox 项目，已被 CNCF 纳入 CNAI 类别技术全景图。

社区官网：https://project-hami.io

Github：https://github.com/Project-HAMi


