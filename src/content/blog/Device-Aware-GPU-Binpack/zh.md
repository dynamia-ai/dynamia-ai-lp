---
title: "双维度·四种策略：借助 HAMi 在 K8s 实现设备感知的 GPU Binpack 和 Spread 调度"
slug: "Device-Aware GPU Binpack/Spread on K8s with HAMi"
date: "2025-09-18"
excerpt: "Pod 不只是“部署到节点上”——GPU Pod 还会部署到 GPU 上。如今的 Kubernetes 能提供完善的节点级装箱/分散能力（例如 MostAllocated、拓扑分散）。但 GPU级的装箱/分散仍需要设备感知的实现。Kubernetes 1.34 的 DRA 让设备描述和分配成为一等公民，甚至能与扩展资源衔接以实现平滑迁移——不过通用的设备评分（能实现内置 GPU 装箱/分散的关键部分）仍在推进中。"
author: "Dynamia AI 团队"
tags: ["Kubernetes", "GPU 调度", "DRA", "装箱", "HAMi", "云 AI", "设备感知", "GPU 分散", "集群自动扩缩器", "AI 工作负载"]
coverImage: "/images/blog/Device-Aware-GPU-Binpack/binpack-covepage.png"
language: "zh"
---

# 双维度·四种策略：借助 HAMi 实现 K8s 上设备感知的 GPU 装箱与分散


Pod 不只是“部署到节点上”——GPU Pod 还会部署到 **GPU** 上。如今的 Kubernetes 能提供完善的**节点级**装箱/分散能力（例如 MostAllocated、拓扑分散）。但 **GPU级**的装箱/分散仍需要**设备感知的实现**。Kubernetes 1.34 的 **DRA（设备运行时接口）** 让设备描述和分配成为一等公民，甚至能与**扩展资源**衔接以实现平滑迁移——不过**通用的设备评分**（能实现内置 GPU 装箱/分散的关键部分）仍在推进中。

## 为何是“双维度”？
### 节点轴：
- **装箱**（例如 MostAllocated、RequestedToCapacityRatio）有助于资源整合，让**集群自动扩缩器**更易缩容 → 成本控制。
- **分散**（Pod 拓扑分散）通过避免单一故障域，提升**可用性**并稳定尾部延迟。

### GPU 轴：
- 设备上的**装箱**可将小工作负载挤到更少的**物理 GPU** 上，为训练或未来的突发需求腾出**整块 GPU**。
- 设备上的**分散**可减少**GPU 内部竞争**（HBM/SM/PCIe/NVLink），并平滑在线推理的 **P99** 延迟。

第二根轴（GPU 轴）是当前“原生”调节手段有限的地方。Kubernetes **节点**评分无法知晓 Pod 会使用哪块 GPU。DRA 为设备分配提供了结构，但 **DRA 的设备/节点评分**是一项正在推进的增强功能，而且 **NodeResourcesFit 评分不适用于** DRA 支持的扩展资源（1.34 中新增的迁移桥接）。

## DRA 解决了什么（以及尚未解决的）
- **解决的问题**：提供标准化模型来**描述设备**（ResourceSlice）、**声明请求**（ResourceClaim）和**分类类型**（DeviceClass）。Kubernetes 可分配匹配的设备，并将 Pod 调度到能访问这些设备的节点上。在 1.34 中，**KEP-5004** 允许 DeviceClass 将 DRA 管理的设备映射到**扩展资源**名称，因此现有清单在迁移期间仍可使用传统的 `vendor.com/gpu: N` 语法。
- **尚未解决的问题（目前）**：缺乏用于设备/节点的**通用调度评分器**，而这是实现“内置 GPU 装箱/分散”的关键。社区已提出问题，要添加 **`dynamicresources` 评分器**以实现正确的装箱；在该功能落地前，设备级策略来自驱动程序或外部/设备感知的调度器。此外：**NodeResourcesFit 评分不适用于** DRA 支持的扩展资源。

## 切实可感的 2×2：节点 × GPU = 四种策略
下面我用一个极简且可复现的设置来展示这四种模式。重点不是推销某一特定技术栈，而是**观察生产环境中可能遇到的权衡**。

## 一键部署
所有清单和 Terraform 代码都在这里：

- **代码库**：[https://github.com/dynamia-ai/hami-ecosystem-demo](https://github.com/dynamia-ai/hami-ecosystem-demo)
- **演示**：`demo/binpack-spread`（四个 YAML 文件对应四种模式）。每个 YAML 都是一个极简的 Deployment；只有两个参数会变化：

  - **通过注解设置的策略（双轴）**：
    ```yaml
    template:
      metadata:
        annotations:
          hami.io/node-scheduler-policy: "binpack"  # 或 "spread"
          hami.io/gpu-scheduler-policy:  "binpack"  # 或 "spread"
    ```

  - **HAMi 强制实施的 GPU 配额**：
    ```yaml
    resources:
      limits:
        nvidia.com/gpu: 1
        nvidia.com/gpumem: "7500"  # ≈7.5GB 限制，因此两个 Pod 可共置在一块 GPU 上
    ```

其余部分（镜像/参数）在四个文件中都相同。

## 启动 EKS 环境：
```bash
git clone https://github.com/dynamia-ai/hami-ecosystem-demo
cd hami-ecosystem-demo/infra/aws
terraform init
terraform apply -auto-approve
```
这会创建两个 GPU 节点（一个配备 **4×T4**，一个配备 4×A10G）。如果希望逐步了解并带有说明，可参考“一键部署”《[借助 HAMi 虚拟化 AWS 上的任意 GPU：自由显存隔离](https://medium.com/@nimbus-nimo/virtualizing-any-gpu-on-aws-with-hami-free-memory-isolation-bbd3c598b9fa)》。

## A) 节点装箱 × GPU 装箱 —— “低成本且保留整块 GPU 空闲”
- **场景**：存在许多小型推理或批处理作业；希望为自动扩缩器保留空间，且为后续训练保留完整的 GPU。
- **优势**：活跃节点更少；**整块 GPU 可用**的概率更高。
- **成本**：GPU 内部竞争 → 对延迟敏感的流量存在 **P99 风险**。

![P1](/images/blog/Device-Aware-GPU-Binpack/image1-Node-binpack.png)

### 运行：
```bash
kubectl apply -f demo/binpack-spread/a-node-binpack-gpu-binpack.yaml

{
  printf "POD\tNODE\tUUIDS\n";
  kubectl get po -l app=demo-a -o json \
  | jq -r '.items[] | select(.status.phase=="Running") | [.metadata.name,.spec.nodeName] | @tsv' \
  | while IFS=$'\t' read -r pod node; do
      uuids=$(kubectl exec "$pod" -c vllm -- nvidia-smi --query-gpu=uuid --format=csv,noheader | paste -sd, -);
      printf "%s\t%s\t%s\n" "$pod" "$node" "$uuids";
    done;
} | column -t -s $'\t'
```

### 观察（示例）：
```
POD                                               NODE                                       UUIDS
demo-a-node-binpack-gpu-binpack-6899f6dfdd-8z8rx  ip-10-0-52-161.us-west-2.compute.internal  GPU-b0e94721-ad7c-6034-4fc8-9f0d1ac7d60d
demo-a-node-binpack-gpu-binpack-6899f6dfdd-nfbz4  ip-10-0-52-161.us-west-2.compute.internal  GPU-b0e94721-ad7c-6034-4fc8-9f0d1ac7d60d
demo-a-node-binpack-gpu-binpack-6899f6dfdd-dtx7b  ip-10-0-52-161.us-west-2.compute.internal  GPU-85caf98e-de2d-1350-ed83-807af940c199
demo-a-node-binpack-gpu-binpack-6899f6dfdd-wtd47  ip-10-0-52-161.us-west-2.compute.internal  GPU-85caf98e-de2d-1350-ed83-807af940c199
```
单个 **节点** 上，Pod 被**打包到能满足其每 GPU 限制的最少数量的 GPU** 上（此处为 2 块 GPU）。

## B) 节点分散 × GPU 装箱 —— “跨节点高可用，同时保留整块 GPU 空闲”
- **场景**：多副本服务需要**可用区/节点多样性**，但又希望小作业能挤在 GPU 上。
- **优势**：高可用 + **整块 GPU 可用**。
- **成本**：集群缩容更困难。

![P2](/images/blog/Device-Aware-GPU-Binpack/image2-Node-spread.png)

### 运行：
```bash
kubectl delete -f demo/binpack-spread/a-node-binpack-gpu-binpack.yaml
kubectl apply -f demo/binpack-spread/b-node-spread-gpu-binpack.yaml
# ... 相同的打印脚本，标签为 app=demo-b
```

### 观察（示例）：
```
POD                                              NODE                                       UUIDS
demo-b-node-spread-gpu-binpack-548cb55c7d-8tg22  ip-10-0-52-161.us-west-2.compute.internal  GPU-dedbdfb2-408f-9ded-402f-e3dc22c08f66
demo-b-node-spread-gpu-binpack-548cb55c7d-h9ds6  ip-10-0-61-248.us-west-2.compute.internal  GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
demo-b-node-spread-gpu-binpack-548cb55c7d-ncwdl  ip-10-0-61-248.us-west-2.compute.internal  GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
demo-b-node-spread-gpu-binpack-548cb55c7d-stx67  ip-10-0-52-161.us-west-2.compute.internal  GPU-dedbdfb2-408f-9ded-402f-e3dc22c08f66
```
**跨节点** 部署，但**每个节点上打包到同一块 GPU**。

## C) 节点装箱 × GPU 分散 —— “节省部分成本，保障尾部延迟”
- **场景**：在线推理；希望有较好的资源整合，同时不堆到同一块 GPU 上。
- **优势**：仍有节点级的整合；**跨 GPU 的竞争更低**。
- **成本**：不如（A）省钱。

![P3](/images/blog/Device-Aware-GPU-Binpack/image3-Node-binpack-GPU-spread.png)

### 运行：
```bash
kubectl delete -f demo/binpack-spread/b-node-spread-gpu-binpack.yaml
kubectl apply -f demo/binpack-spread/c-node-binpack-gpu-spread.yaml
# ... 打印脚本，标签为 app=demo-c
```

### 观察（示例）：
```
POD                                             NODE                                       UUIDS
demo-c-node-binpack-gpu-spread-d5f686b67-8zbz9  ip-10-0-61-248.us-west-2.compute.internal  GPU-041286d5-ed3d-4823-096e-a4c80fe17fb9
demo-c-node-binpack-gpu-spread-d5f686b67-hn2md  ip-10-0-61-248.us-west-2.compute.internal  GPU-b639414c-f867-90c3-dd3b-a2bd094a703e
demo-c-node-binpack-gpu-spread-d5f686b67-rrpzb  ip-10-0-61-248.us-west-2.compute.internal  GPU-4bfe5899-5368-2e73-de03-d34894b6d75c
demo-c-node-binpack-gpu-spread-d5f686b67-sv8fg  ip-10-0-61-248.us-west-2.compute.internal  GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
```
**单个节点上，分散到该节点的多块 GPU** 上。

## D) 节点分散 × GPU 分散 —— “尾部延迟优先”
- **场景**：严格的 SLA（搜索、广告、聊天）场景，其中 **P99** 延迟是关键。
- **优势**：双轴上的干扰都低。
- **成本**：成本最高；碎片化最严重。

![P4](/images/blog/Device-Aware-GPU-Binpack/image4-tail-latency-first.png)

### 运行：
```bash
kubectl delete -f demo/binpack-spread/c-node-binpack-gpu-spread.yaml
kubectl apply -f demo/binpack-spread/d-node-spread-gpu-spread.yaml
# ... 打印脚本，标签为 app=demo-d
```

### 观察（示例）：
```
POD                                            NODE                                      UUIDS
demo-d-node-spread-gpu-spread-c4555d97c-5gqkf  ip-10-0-52-161.us-west-2.compute.internal  GPU-b0e94721-ad7c-6034-4fc8-9f0d1ac7d60d
demo-d-node-spread-gpu-spread-c4555d97c-666dc  ip-10-0-61-248.us-west-2.compute.internal  GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
demo-d-node-spread-gpu-spread-c4555d97c-8xjbh  ip-10-0-61-248.us-west-2.compute.internal  GPU-4bfe5899-5368-2e73-de03-d34894b6d75c
demo-d-node-spread-gpu-spread-c4555d97c-k727x  ip-10-0-52-161.us-west-2.compute.internal  GPU-dedbdfb2-408f-9ded-402f-e3dc22c08f66
```
**跨 GPU 且跨节点** 部署。

## DRA 如今（和未来）的定位
- **如今**：DRA 标准化了要分配的资源以及资源可运行的位置。如果同时启用 **KEP-5004**，应用可继续请求扩展资源，而**驱动程序和分片**在底层完成实际工作——这对从 DevicePlugin 迁移很有用。**但**：原生的 NodeResourcesFit 评分**不适用于** DRA 支持的扩展资源，且 **`dynamicresources` 评分器**正处于跟踪中，以实现动态资源的**正确装箱**。

- **未来**：一旦 DRA 的**设备/节点评分**落地，更多功能可在“核心”中实现（至少对于通用场景）。设备感知的实现对于**卡内拓扑**（NUMA/NVLink）和策略细节仍然很重要。

## 复现与参考
### 环境 + 四个演示
- [GitHub - dynamia-ai/hami-ecosystem-demo](https://github.com/dynamia-ai/hami-ecosystem-demo)

### 背景知识
- [借助 HAMi 虚拟化 AWS 上的任意 GPU：自由显存隔离](https://medium.com/@yourusername/virtualizing-any-gpu-on-aws-with-hami-free-memory-isolation-xyz123)
- [关于 K8s 1.34 GA DRA 的快速解读：你可能关心的 7 个问题](https://medium.com/@yourusername/a-quick-take-on-k8s-1-34-ga-dra-7-questions-you-probably-have-abc456)

### DRA 背景（v1.34）
- Kubernetes PR [#130653](https://github.com/kubernetes/kubernetes/pull/130653)（kubelet/scheduler 支持 DRA 托管的 extended resources，注意 NodeResourcesFit 打分不适用）

KEP #5004 ([3ffc27b7413e285d429025a422dd79473d3e9b50](https://github.com/kubernetes/enhancements/blob/3ffc27b7413e285d429025a422dd79473d3e9b50/keps/sig-scheduling/5004-dra-extended-resource/README.md))（DRA：通过 DRA 驱动处理 extended resource 请求）

Issue #133669 (https://github.com/kubernetes/kubernetes/issues/133669)（增加 dynamicresources 打分项，Beta 阶段需实现正确的紧凑调度）


---

HAMi，全称是 Heterogeneous AI Computing Virtualization Middleware（异构算力虚拟化中间件），是一套为管理 k8s 集群中异构 AI 计算设备设计的“一站式”架构，能提供异构 AI 设备共享能力与任务间资源隔离。HAMi 致力于提升 k8s 集群异构计算设备利用率，为不同类型异构设备提供统一复用接口，当前是 CNCF Sandbox 项目，已被纳入 CNCF CNAI 类别技术全景图。


![p5](/images/blog/PREP-EDU-HAMi/p5.png)

Dynamia 密瓜智能,  专注以 CNCF HAMi 项目为核心底座，提供 灵活、可靠、按需、弹性的 GPU 虚拟化 与异构算力调度、统一管理的全球化解决方案。可以插拔式、轻量化、无侵入地部署在任意公有云、私有云、混合云环境中，可支持 NVIDIA、昇腾、沐曦、寒武纪、海光、摩尔线程，天数智芯等异构芯片。

>官网：https://dynamia.ai
>邮箱：info@dynamia.ai


