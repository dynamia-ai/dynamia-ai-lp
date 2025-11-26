---
title: "Kubernetes GPU 调度：一个 2x2 的实践模型 (节点 × GPU 的紧凑与分散策略)"
coverTitle: "Kubernetes GPU 调度 ｜ 一个2x2的实践模型节点xGPU的紧凑与分散策略"
slug: "device-aware-gpu-binpack-spread-on-k8s-with-hami"
date: "2025-09-19"
excerpt: "深入探讨 Kubernetes GPU 调度的 2×2 实践模型：结合节点和 GPU 两个维度的紧凑/分散策略。通过 HAMi 实现超越原生 K8s 的设备感知调度能力，包含四种调度模式的实战演示，帮助您在成本效率、GPU 可用性和 AI 工作负载性能之间找到最佳平衡。"
author: "密瓜智能"
tags: ["GPU 调度", "HAMi", "设备感知调度", "GPU 虚拟化", "DRA", "GPU 管理", "资源优化", "最佳实践"]
coverImage: "/images/blog/device-aware-gpu-binpack-spread-on-k8s-with-hami/cover-zh.png"
language: "zh"
---
## Kubernetes GPU 调度：一个 2x2 的实践模型 (节点 × GPU 的紧凑与分散策略)

Pod 不仅仅是落在节点 (Node) 上——对于 GPU 类型的 Pod 来说，它们还落在具体的 **GPU** 上。如今的 Kubernetes 提供了可靠的**节点层面 (node-level)** 的调度策略（比如 `MostAllocated` 或拓扑分布），但**设备层面 (GPU-level)** 的调度策略仍需要一个**设备感知 (device-aware)** 的实现。Kubernetes 1.34 版本中的 **DRA (动态资源分配)** 让设备的*描述和分配*成为了一等公民，甚至通过**扩展资源 (extended resources)** 的方式为平滑迁移搭建了桥梁——但**通用的设备评分机制**（即实现内置 GPU 紧凑/分散策略的关键部分）仍在开发中。

### 为什么是“两个维度”？

- **节点维度 (Node axis):**

  - **紧凑打包 (Binpack)** (例如 `MostAllocated`, `RequestedToCapacityRatio` 策略)：有助于资源整合，让**集群自动伸缩器 (Cluster Autoscaler)** 更容易缩容，从而控制成本。
  - **分散部署 (Spread)** (Pod 拓扑分布)：通过避免单点故障域，提高**可用性**并稳定尾部延迟。
- **GPU 维度 (GPU axis):**

  - **紧凑打包 (Binpack)**：将小型任务打包到更少的**物理 GPU** 上，从而释放出**完整的 GPU** 用于模型训练或未来的突发流量。
  - **分散部署 (Spread)**：减少 **GPU 内部的资源竞争** (如 HBM/SM/PCIe/NVLink)，为在线推理服务平滑 **P99 延迟**。

目前，Kubernetes 在第二个维度（GPU）上的原生调度能力有限。默认的节点评分器无法“看到”一个 Pod 将会使用*哪一个*具体的 GPU。DRA 为设备分配添加了必要的结构，但**针对 DRA 的设备/节点评分机制**仍在进行中。并且，`NodeResourcesFit` 评分策略**不适用于**由 DRA 在背后支持的**扩展资源**（这是 1.34 版本中新增的迁移桥梁）。

### DRA 解决了什么（以及尚未解决什么）

- **解决了什么：** 提供了一个标准化的模型来**描述设备** (`ResourceSlice`)、**声明请求** (`ResourceClaim`) 和**对设备分类** (`DeviceClass`)。Kubernetes 可以据此分配匹配的设备，并将 Pod 调度到能够访问这些设备的节点上。在 1.34 版本中，**KEP-5004** 允许 `DeviceClass` 将 DRA 管理的设备映射回一个**扩展资源**名称，这样现有的应用清单 (manifests) 可以在迁移期间继续使用经典的 `vendor.com/gpu: N` 语法。
- **尚未解决什么：** 一个**通用的调度器评分器**，它能为设备/节点打分，从而实现“内置的 GPU 紧凑/分散策略”。社区已经创建了 issue 来添加一个 **`dynamicresources` 评分器**以实现正确的紧凑打包；在此功能落地之前，设备层面的调度策略仍需依赖驱动程序或外部的、具备设备感知能力的调度器。此外，**`NodeResourcesFit` 评分机制对于由 DRA 代理的扩展资源无效**。

### 可实际感知的 2×2 模型：节点 × GPU = 四种调度模式

下面我将使用一个最小化的、可复现的环境来展示这四种模式。重点不是推销任何特定的技术栈，而是为了**观察你在生产环境中可能遇到的不同权衡**。

#### 一键部署环境

所有的 YAML 文件和 Terraform 配置都在这里：

- 仓库: `https://github.com/dynamia-ai/hami-ecosystem-demo`
- Demos: [`demo/binpack-spread`](https://github.com/dynamia-ai/hami-ecosystem-demo/tree/main/demo/binpack-spread) (四个 YAML 文件对应四种模式)。每个 YAML 都是一个最小化的 `Deployment`，只调整了两个参数：

**通过 `annotations` 设置策略（两个维度）:**

```yaml
template:
  metadata:
    annotations:
      hami.io/node-scheduler-policy: "binpack"  # 或 "spread"
      hami.io/gpu-scheduler-policy:  "binpack"  # 或 "spread"
```

**通过 [HAMi](https://github.com/Project-HAMi/HAMi) 强制执行 GPU 配额:**

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
    nvidia.com/gpumem: "7500"  # 约 7.5GB 显存，这样两个 Pod 就可以共享一张 GPU
```

除以上配置外，四个文件中的其他部分（如镜像、启动参数）完全相同。

**启动 EKS 环境：**

```bash
git clone https://github.com/dynamia-ai/hami-ecosystem-demo
cd hami-ecosystem-demo/infra/aws
terraform init
terraform apply -auto-approve
```

这会创建两个 GPU 节点（一个配备 **4×T4**，另一个配备 **4×A10G**）。

---

### A) 节点**紧凑打包** × GPU **紧凑打包** — *“成本优先，并保留完整的 GPU”*

- **适用场景:** 大量小型的推理或批处理任务；希望为自动缩容留出空间，并保留完整的 GPU 用于后续的训练任务。
- **优势:** 活跃节点数更少；**获得完整 GPU** 的可能性更高。
- **代价:** GPU 内部资源竞争加剧，对延迟敏感的服务存在 **P99 延迟风险**。

![binpack-spread-1.png](/images/blog/device-aware-gpu-binpack-spread-on-k8s-with-hami/binpack-spread-1.png)

Run:

**运行:**

```bash
kubectl apply -f demo/binpack-spread/a-node-binpack-gpu-binpack.yaml

# 使用以下脚本查看 Pod 分布
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

**观察结果 (示例):**

```
POD                                                NODE                                           UUIDS
demo-a-node-binpack-gpu-binpack-6899f6dfdd-8z8rx   ip-10-0-52-161.us-west-2.compute.internal      GPU-b0e94721-ad7c-6034-4fc8-9f0d1ac7d60d
demo-a-node-binpack-gpu-binpack-6899f6dfdd-nfbz4   ip-10-0-52-161.us-west-2.compute.internal      GPU-b0e94721-ad7c-6034-4fc8-9f0d1ac7d60d
demo-a-node-binpack-gpu-binpack-6899f6dfdd-dtx7b   ip-10-0-52-161.us-west-2.compute.internal      GPU-85caf98e-de2d-1350-ed83-807af940c199
demo-a-node-binpack-gpu-binpack-6899f6dfdd-wtd47   ip-10-0-52-161.us-west-2.compute.internal      GPU-85caf98e-de2d-1350-ed83-807af940c199
```

> **分析:** 所有 Pod 都被调度到了**单个节点**上，并且它们被**紧凑地打包**到了满足其资源限制的**最少数 GPU** 上（这里是 2 个 GPU）。

---

### B) 节点**分散部署** × GPU **紧凑打包** — *“跨节点高可用，同时保留完整的 GPU”*

- **适用场景:** 需要**跨区/跨节点**部署以实现高可用的多副本服务，但同时希望将节点内的小任务打包到少数 GPU 上。
- **优势:** 实现了高可用性，同时也能**保留完整的 GPU**。
- **代价:** 集群缩容变得更加困难。

![binpack-spread-2.png](/images/blog/device-aware-gpu-binpack-spread-on-k8s-with-hami/binpack-spread-2.png)

**运行:**

```bash
kubectl delete -f demo/binpack-spread/a-node-binpack-gpu-binpack.yaml
kubectl apply -f demo/binpack-spread/b-node-spread-gpu-binpack.yaml
# ... 使用相同的脚本查看，只需将 app label 改为 app=demo-b
```

**观察结果 (示例):**

```
POD                                                NODE                                           UUIDS
demo-b-node-spread-gpu-binpack-548cb55c7d-8tg22    ip-10-0-52-161.us-west-2.compute.internal      GPU-dedbdfb2-408f-9ded-402f-e3dc22c08f66
demo-b-node-spread-gpu-binpack-548cb55c7d-h9ds6    ip-10-0-61-248.us-west-2.compute.internal      GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
demo-b-node-spread-gpu-binpack-548cb55c7d-ncwdl    ip-10-0-61-248.us-west-2.compute.internal      GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
demo-b-node-spread-gpu-binpack-548cb55c7d-stx67    ip-10-0-52-161.us-west-2.compute.internal      GPU-dedbdfb2-408f-9ded-402f-e3dc22c08f66
```

> **分析:** Pod 被**分散到了不同的节点**上，但在**每个节点内部**，它们仍然被**打包到了同一张 GPU** 上。

---

### C) 节点**紧凑打包** × GPU **分散部署** — *“节约部分成本，同时保护尾部延迟”*

- **适用场景:** 在线推理服务；希望在合理整合资源的同时，避免将所有负载都堆积到同一张 GPU 上。
- **优势:** 仍在节点级别进行了资源整合；**GPU 间的竞争更低**。
- **代价:** 不如模式 A 成本效益高。

![binpack-spread-3.png](/images/blog/device-aware-gpu-binpack-spread-on-k8s-with-hami/binpack-spread-3.png)

**运行:**

```bash
kubectl delete -f demo/binpack-spread/b-node-spread-gpu-binpack.yaml
kubectl apply -f demo/binpack-spread/c-node-binpack-gpu-spread.yaml
# ... 使用相同的脚本查看，只需将 app label 改为 app=demo-c
```

**观察结果 (示例):**

```
POD                                                NODE                                           UUIDS
demo-c-node-binpack-gpu-spread-d5f686b67-8zbz9    ip-10-0-61-248.us-west-2.compute.internal      GPU-041286d5-ed3d-4823-096e-a4c80fe17fb9
demo-c-node-binpack-gpu-spread-d5f686b67-hn2md    ip-10-0-61-248.us-west-2.compute.internal      GPU-b639414c-f867-90c3-dd3b-a2bd094a703e
demo-c-node-binpack-gpu-spread-d5f686b67-rrpzb    ip-10-0-61-248.us-west-2.compute.internal      GPU-4bfe5899-5368-2e73-de03-d34894b6d75c
demo-c-node-binpack-gpu-spread-d5f686b67-sv8fg    ip-10-0-61-248.us-west-2.compute.internal      GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
```

> **分析:** 所有 Pod 都位于**同一个节点**上，但被**分散到了该节点上的多张不同 GPU** 上。

---

### D) 节点**分散部署** × GPU **分散部署** — *“尾部延迟优先”*

- **适用场景:** 对服务等级协议 (SLA) 有严格要求的场景（如搜索、广告、聊天），其中 **P99 延迟**是关键指标。
- **优势:** 在节点和 GPU 两个维度上的干扰都最低。
- **代价:** 成本最高；资源碎片化最严重。

![binpack-spread-4.png](/images/blog/device-aware-gpu-binpack-spread-on-k8s-with-hami/binpack-spread-4.png)

**运行:**

```bash
kubectl delete -f demo/binpack-spread/c-node-binpack-gpu-spread.yaml
kubectl apply -f demo/binpack-spread/d-node-spread-gpu-spread.yaml
# ... 使用相同的脚本查看，只需将 app label 改为 app=demo-d
```

**观察结果 (示例):**

```
POD                                                NODE                                           UUIDS
demo-d-node-spread-gpu-spread-c4555d97c-5gqkf    ip-10-0-52-161.us-west-2.compute.internal      GPU-b0e94721-ad7c-6034-4fc8-9f0d1ac7d60d
demo-d-node-spread-gpu-spread-c4555d97c-666dc    ip-10-0-61-248.us-west-2.compute.internal      GPU-5f432a79-775e-db04-1e15-82307fdb5a1b
demo-d-node-spread-gpu-spread-c4555d97c-8xjbh    ip-10-0-61-248.us-west-2.compute.internal      GPU-4bfe5899-5368-2e73-de03-d34894b6d75c
demo-d-node-spread-gpu-spread-c4555d97c-k727x    ip-10-0-52-161.us-west-2.compute.internal      GPU-dedbdfb2-408f-9ded-402f-e3dc22c08f66
```

> **分析:** Pod 被**同时分散到了不同的 GPU 和不同的节点**上。

---

### DRA 的现状与未来

- **现状：** DRA 标准化了*分配什么*以及*可以在哪里运行*。如果你同时启用了 **KEP-5004**，应用程序可以继续请求扩展资源，而底层的**驱动和 `ResourceSlice`** 会完成实际的分配工作——这对于从 DevicePlugin 迁移非常有用。**但是**：原生的 **`NodeResourcesFit` 评分机制不适用于由 DRA 支持的扩展资源**，而用于为动态资源提供**正确紧凑打包**的 **`dynamicresources` 评分器**仍在开发中。
- **未来：** 一旦 DRA 的**设备/节点评分机制**落地，更多这类调度逻辑就可以在 Kubernetes “核心”中实现（至少对于通用场景）。但对于**显卡内部拓扑**（如 NUMA/NVLink）和更细致的策略，具备设备感知能力的实现方案仍然至关重要。

### 代码复现与参考资料

* **环境与四种 Demo**
  * `https://github.com/dynamia-ai/hami-ecosystem-demo`
  * `https://github.com/dynamia-ai/hami-ecosystem-demo/tree/main/demo/binpack-spread`
* **背景资料**
  * [Virtualizing Any GPU on AWS with HAMi: Free Memory Isolation](https://medium.com/@nimbus-nimo/virtualizing-any-gpu-on-aws-with-hami-free-memory-isolation-bbd3c598b9fa) (《使用 HAMi 在 AWS 上虚拟化任意 GPU：实现免费的显存隔离》，详见其中的“一键部署”部分)
  * [A Quick Take on K8s 1.34 GA DRA: 7 Questions You Probably Have](https://medium.com/@nimbus-nimo/a-quick-take-on-k8s-1-34-ga-dra-7-questions-you-probably-have-e981966f06c7) (《速览 K8s 1.34 GA 版本的 DRA：你可能关心的 7 个问题》)
* **DRA 相关背景 (v1.34)**
  * [Kubernetes PR **#130653**](https://github.com/kubernetes/kubernetes/pull/130653) (kubelet/scheduler 支持由 DRA 代理的扩展资源；注意：`NodeResourcesFit` 评分机制不适用于这类资源)
  * [KEP **#5004**](https://github.com/kubernetes/enhancements/blob/3ffc27b7413e285d429025a422dd79473d3e9b50/keps/sig-scheduling/5004-dra-extended-resource/README.md) (DRA: 通过 DRA 驱动处理扩展资源请求)
  * [Issue **#133669**](https://github.com/kubernetes/kubernetes/issues/133669) (添加 `dynamicresources` 评分器；作为 Beta 阶段的要求，需要实现正确的紧凑打包)

![p5](/images/blog/PREP-EDU-HAMi/p5.png)

Dynamia 密瓜智能,  专注以 CNCF HAMi 项目为核心底座，提供 灵活、可靠、按需、弹性的 GPU 虚拟化 与异构算力调度、统一管理的全球化解决方案。可以插拔式、轻量化、无侵入地部署在任意公有云、私有云、混合云环境中，可支持 NVIDIA、昇腾、沐曦、寒武纪、海光、摩尔线程，天数智芯等异构芯片。

> 官网：https://dynamia.ai
> 邮箱：info@dynamia.ai
