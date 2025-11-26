---
title: "Xinference × HAMi | Native GPU Sharing Support for Cost-Effective AI Model Services"
coverTitle: "Xinference × HAMi | Cost-Effective vGPU Sharing"
slug: "hami-xinference-vgpu-integration"
date: "2025-11-06"
excerpt: "Xinference natively supports HAMi vGPU through Helm Chart, enabling multi-model inference platforms to achieve secure GPU sharing, fine-grained quotas, and unified governance. This article details how to enable HAMi vGPU with one click and implement best practices for cost reduction in production environments."
author: "Dynamia AI Team"
tags: ["HAMi", "Xinference", "vGPU", "GPU Sharing", "AI Inference", "Multi-Model", "Kubernetes", "Cost Optimization"]
coverImage: "/images/blog/hami-xinference-vgpu/cover-en.png"
language: "en"
---
# Xinference × HAMi | Native GPU Sharing Support for Cost-Effective AI Model Services

## Key Highlights

* **Xinference** is Xorbits' open-source multi-model inference platform (LLM/Embedding/Image/Audio/TTS/Rerank, etc.), featuring a **Supervisor/Worker** architecture and providing **OpenAI-compatible APIs**, making it easy to replace and integrate with existing applications.
* In enterprise deployments, Xinference **does not provide compute isolation itself**, leading to waste from "small models monopolizing entire cards" and gaps in quota and observability for multi-tenant scenarios.
* The newly merged **Helm PR #6** provides native support for **HAMi vGPU** in the Chart: with simple parameter switches, you can pass resources like `nvidia.com/gpucores` and `nvidia.com/gpumem-percentage` to **Supervisor/Worker**, enabling secure GPU sharing, improved utilization, and unified quota and monitoring.

![Xinference and HAMi Integration Architecture](/images/blog/hami-xinference-vgpu/architecture.png)

## What is Xinference: User-Friendly Interface, Versatile Formats, Distributed and Scalable

* **Multi-Model Capabilities**: Supports chat/generation, Embedding, Vision, Images, Audio (ASR/TTS/voice conversion/cloning), Rerank, and common engines (vLLM, Transformers, llama.cpp, SGLang, MLX).
* **OpenAI-Compatible API**: Seamlessly switch existing calls to local or self-hosted clusters.
* **Supervisor/Worker Architecture**: Supervisor handles coordination and management, while Workers handle actual execution and use CPU/GPU resources; in distributed scenarios, multiple Workers connect to the same Supervisor.
* **Performance Enhancements**: Supports continuous batching and provides the **Xavier** mechanism for sharing KV Cache across multiple vLLM instances, reducing redundant prefix computation overhead.

## Why Integrate with HAMi: From "Can Run" to "Shareable, Measurable, Governable"

In enterprise production, two common problems arise:

1. **Lightweight models monopolizing entire cards** → causing significant waste;
2. **Lack of multi-tenant governance** → difficulty in applying fine-grained quotas and observability across different teams/tasks.

**HAMi vGPU** addresses these shortcomings:

* Use **percentage/capacity** to limit the **GPU cores and memory** available to a single task (e.g., `nvidia.com/gpucores`, `nvidia.com/gpumem-percentage`), safely splitting one card for multiple tasks to share.
* After integration, **scheduling/quota/observability** all work through the Kubernetes system, facilitating unified management.

## One-Click Enablement: Native HAMi vGPU Support in Helm

PR #6 has been merged into the official Helm Charts. Enabling vGPU only requires turning on switches in the values (Supervisor/Worker can be enabled separately).

The example below focuses on "allocating vGPU only to Workers" (more aligned with common practice):

```yaml
# values.yaml (excerpt)
xinferenceWorker:
  worker:
    vgpu:
      enabled: true
    resources:
      limits:
        nvidia.com/gpu: 1
        nvidia.com/gpucores: 20            # Use 20% GPU cores
        nvidia.com/gpumem-percentage: 10   # Use 10% memory
      requests:
        cpu: "2"
        memory: "8Gi"

xinferenceSupervisor:
  supervisor:
    vgpu:
      enabled: false                       # Generally doesn't need GPU, change to true if needed
```

Helm installation:

```bash
helm repo add xinference https://xorbitsai.github.io/xinference-helm-charts
helm repo update

# Prepare values.yaml as shown in the example above
helm install xinference xinference/xinference -n xinference -f values.yaml
```

## Verified Small Model Concurrency: Running 5 Qwen3-0.6B on a Single L4

In the PR comments, the contributor provided a **tested example**:

![Multi-Model Demo](/images/blog/hami-xinference-vgpu/multi-model-demo.png)

On an **NVIDIA L4 (24 GB)**, HAMi was used to split the memory into multiple portions, allocating approximately **2GB** of memory to each of 5 Workers, thereby supporting **5 Qwen3-0.6B** model inference processes simultaneously, verifying the feasibility of "safely sharing an entire card with small models."

> This scenario is particularly suitable for: Embedding/Rerank/small audio/lightweight Agent tool models—high concurrency but low per-model consumption.

## Monitoring and Multi-Tenant Governance

* **Xinference-side metrics**: Supervisor/Worker expose independent metric dashboards for observing model count, request throughput, latency, etc.
* **HAMi-side observability/quotas**: Through Kubernetes native resources and HAMi's vGPU metrics, combined with namespace-quota policies, build hierarchical "project-task" governance.

## Conclusion and Acknowledgments

Combining Xinference's "multi-model ease-of-use + OpenAI compatibility" with HAMi's "fine-grained vGPU quotas + unified governance" enables shifting GPUs **from exclusive to shared** and capabilities **from runnable to manageable**, all **without changing business code**.

**Related PR**: [xorbitsai/xinference-helm-charts #6](https://github.com/xorbitsai/xinference-helm-charts/pull/6)

Sincere thanks to community developer **@calvin0327** for the contribution!

---

## About Xinference

Xinference is an enterprise-grade large model inference platform launched by Hangzhou Future Speed Technology Co., Ltd., dedicated to providing enterprises with efficient, stable, and secure one-stop model deployment and inference services. The platform's core advantages lie in its excellent heterogeneous computing support and multi-engine inference capabilities.

The platform fully supports mainstream computing chips from both domestic and international sources, including NVIDIA, Huawei Ascend, Hygon DCU, and Cambricon, enabling unified management and scheduling of heterogeneous hardware. Its unique multi-engine parallel inference capability can simultaneously run various optimized engines such as vLLM and SGLang, providing optimal performance for different application scenarios. Based on the high-performance distributed framework Xoscar, Xinference has stable operation capabilities for ultra-large-scale clusters, supporting multi-node distributed inference, dynamic load balancing, and automatic fault recovery, effectively ensuring high availability of enterprise-level services.
