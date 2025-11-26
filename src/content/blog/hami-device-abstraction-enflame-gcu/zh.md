---
title: "【架构解析】HAMi 设备抽象层：以燧原 GCU 为例看异构算力快速集成"
coverTitle: "【架构】HAMi设备抽象层 | 以燧原GCU为例看异构算力快速集成"
slug: "hami-device-abstraction-enflame-gcu-integration"
date: "2025-10-22"
excerpt: "HAMi 通过精心设计的设备抽象层，为异构算力的快速集成提供了优雅的解决方案。本文深入解析这一核心架构，并以 v2.7.0 版本中集成的燧原 GCU 为例，展示厂商或社区开发者如何基于此架构快速实现对新硬件的支持。"
author: "Dynamia AI Team"
tags: ["HAMi", "Device Abstraction", "Enflame GCU", "vGCU", "Architecture", "Heterogeneous Computing", "Kubernetes", "Integration"]
coverImage: "/images/blog/hami-device-abstraction-gcu/cover-zh.png"
language: "zh"
---
# 【架构解析】HAMi 设备抽象层：以燧原 GCU 为例看异构算力快速集成

在云原生时代，AI 和高性能计算场景下的硬件呈现出百花齐放的态势，调度系统如何高效、快速地适配层出不穷的异构算力，成为了衡量其扩展性的关键。

HAMi 通过其精心设计的**设备抽象层**，为这一挑战提供了优雅的解决方案。本文将深入解析这一核心架构，并以 v2.7.0 版本中集成的**燧原 GCU**为例，具体展示厂商或社区开发者如何基于此架构，以极低的成本快速实现对一款新硬件的支持。

## 一、HAMi 的设备抽象与核心接口

HAMi 调度器为了能够统一处理不同厂商、不同类型的硬件，定义了一套标准的设备接口（`Devices` interface）。任何一种新的硬件，只要实现了这套接口，就能无缝地被纳入 HAMi 的调度体系，而无需改动任何核心调度逻辑。

这种分层抽象的设计，将通用的调度逻辑与特定的硬件实现解耦，其关系如下：

![HAMi设备抽象层架构](/images/blog/hami-device-abstraction-gcu/architecture.png)

这套接口的核心在于将硬件相关的复杂逻辑"本地化"在各个设备的实现中，对上层调度器屏蔽了底层差异。关键接口函数如下：

### 核心接口详解

#### `GetNodeDevices()`

- **职责**：解析由厂商 `device-plugin` 上报到节点（`corev1.Node`）对象上的资源信息，并将其转换为 HAMi 内部统一的设备列表（`[]*device.DeviceInfo`）。
- **作用**：这是 HAMi 感知和初始化节点算力资源的入口。

#### `GenerateResourceRequests()`

- **职责**：将用户在 Pod YAML 中定义的资源请求（如 `enflame.com/vgcu-percentage: 25`）转换为调度器内部可以理解的、标准化的 `ContainerDeviceRequest` 结构。
- **作用**：作为"翻译官"，统一了所有异构资源的内部表达。

#### `Fit()`

- **职责**：在单个节点上，根据 `ContainerDeviceRequest` 和节点当前设备的使用情况，判断该节点是否能满足 Pod 的资源需求，并找出具体的设备分配方案。
- **作用**：这是**节点内**调度的核心决策逻辑，包含了资源匹配、拓扑寻优等所有设备相关的复杂判断。

![核心接口调用流程](/images/blog/hami-device-abstraction-gcu/interface-flow.png)

#### `ScoreNode()`

- **职责**：当有多个节点都能通过 `Fit()` 的检查时，为这些候选节点打分，以供调度器进行择优。
- **作用**：这是**节点间**调度的关键，通常用于实现 `binpack`（打分倾向于资源使用率高的节点）或 `spread`（打分倾向于空闲节点）等策略。

## 二、案例研究：集成燧原 vGCU

燧原 vGCU 的集成工作，正是对上述接口的一次标准实现。由于其调度逻辑相对直接，不涉及复杂的拓扑计算，因此适配工作得以非常高效地完成。

### 1. 实现 `GenerateResourceRequests`：翻译用户请求

这一步将用户 YAML 中的 `enflame.com/vgcu-percentage` 转换为内部的 `Memreq`（显存请求）字段。由于 vGCU 将一张卡抽象为 100 个百分比单元，这里的转换是一个简单的映射关系。

```go
// File: pkg/device/enflame/device.go (logic simplified)

func (dev *EnflameDevices) GenerateResourceRequests(ctr *corev1.Container) ContainerDeviceRequest {
    // ...
    // 从 Pod spec.containers.resources.limits 中读取 "enflame.com/vgcu-percentage" 的值
    percentage := ctr.Resources.Limits[EnflameResourceNameVGCUPercentage]

    return device.ContainerDeviceRequest{
        // ...
        Memreq: int32(percentage.Value()), // 将百分比作为内部的 Memreq
        Coresreq: 0,
        // ...
    }
}
```

### 2. 实现 `Fit`：执行节点内资源校验

这是燧原 GCU 适配逻辑的核心。它实现为一个简洁的"前置校验器"，在 `Fit` 函数中执行以下步骤：

1. **过滤设备**：根据 `use-gpuuuid`/`nouse-gpuuuid` 注解，筛选出候选物理设备。
2. **遍历检查**：循环遍历候选设备，检查其剩余的 `Mem`（即百分比单元）是否满足请求。
3. **快速返回**：找到第一个满足条件的设备后，立即返回成功。

```go
// File: pkg/device/enflame/device.go (logic simplified)

func (dev *EnflameDevices) Fit(nodeInfo *util.NodeInfo, pod *corev1.Pod) (bool, ...) {
        // ...
        request := dev.GenerateResourceRequests(&pod.Spec.Containers[0])

        // 1. 根据 Pod Annotation (use-gpuuuid/nouse-gpuuuid) 生成候选设备列表
        candidates := buildCandidateDevices(nodeInfo, pod)

        // 2. 遍历候选设备，寻找第一个满足资源的设备
        for _, devID := range candidates {
                availableMem := nodeInfo.Devices[devID].Totalmem - nodeInfo.Devices[devID].Usedmem
                if availableMem >= request.Memreq {
                        // 3. 找到即成功
                        return true, ...
                }
        }

        return false, ...
}
```

### 3. 实现 `ScoreNode`：提供默认评分

由于 vGCU 的调度不涉及跨节点的拓扑或亲和性策略，`ScoreNode` 的实现非常简单，只需返回一个中性的默认分值（`0`）即可，不影响调度器的 `binpack` 或 `spread` 决策。

### 使用方式

用户可以通过以下 YAML 配置来使用燧原 vGCU：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gcu-shared-pod-with-uuid
  annotations:
    # 指定使用 UUID 为 node1-enflame-0 的 GCU 设备
    enflame.com/use-gpuuuid: "node1-enflame-0"
spec:
  containers:
    - name: my-shared-gcu-app
      image: ubuntu:20.04
      command: ["sleep", "3600"]
      resources:
        limits:
          enflame.com/vgcu: 1
          enflame.com/vgcu-percentage: 25
```

## 三、总结

HAMi 的设备抽象层设计，是其能够快速响应硬件生态变化、保持强大的异构算力纳管能力的核心。通过定义一套清晰、责权分明的接口，它将硬件适配的复杂性"下沉"并"封装在各自的设备实现中。

燧原 GCU 的集成案例有力地证明了该架构的优越性：开发者无需理解 HAMi 调度器的内部循环和复杂状态，只需聚焦于实现几个定义明确的函数，即可将一款新的异构硬件快速、可靠地接入到云原生调度体系中。这不仅降低了厂商的适配成本，也极大地激发了社区的贡献热情。

---

**参考资料**

* **使用文档**：[Enflame GCU/GCUshare 支持](https://github.com/Project-HAMi/HAMi/blob/master/docs/enflame-vgcu-support_cn.md)
* **相关 PRs**：
  * [https://github.com/Project-HAMi/HAMi/pull/1013](https://github.com/Project-HAMi/HAMi/pull/1013)
  * [https://github.com/Project-HAMi/HAMi/pull/1334](https://github.com/Project-HAMi/HAMi/pull/1334)

再次由衷感谢社区开发者 @archlitchi，@zhaikangqi331 对该特性的贡献！
