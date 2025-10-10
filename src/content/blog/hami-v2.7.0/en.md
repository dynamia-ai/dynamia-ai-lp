---
title: "HAMi 2.7.0 — Of Silicon & Scheduling | Stronger, Smarter, Broader."
slug: "hami-v2.7.0-released"
date: "2025-10-09"
excerpt: "HAMi v2.7.0 is here! Featuring full support for Kunlun XPU, Enflame GCU, AWS Neuron, and MetaX, enhanced scheduler optimizations, expanded application ecosystem integration, improved WebUI functionality, and thriving community growth."
author: "Dynamia AI Team"
tags: ["HAMi", "GPU Sharing", "vGPU", "Kubernetes", "Heterogeneous Computing", "XPU", "GCU", "MetaX", "Neuron", "Release"]
coverImage: "/images/blog/hami-v2.7.0/cover-en.png"
language: "en"
---
**GPU** ecosystem & scheduling efficiency, upgraded

> A salute to Kubernetes 1.34’s ***Of Wind & Will***: there, the course is named by wind and will; here, our coordinates are ***Silicon & Scheduling*** *.*
>
> *Silicon—the many textures of compute.*
> *Scheduling—the rhythm that finds paths through complexity.*
>
> We do not promise the wind; we promise an ****order**** you can sail by.
> A release takes shape not because all is perfect, but because  ***order lets imperfection run in parallel*** *.*

# Release Highlights

* **Broader hardware coverage:** Added backends for multiple heterogeneous accelerators across whole-device, virtualization, and topology-aware modes (details in docs). **NVIDIA** topology-aware scheduling is upgraded; **AWS Neuron** is integrated from device- to core-level sharing with topology awareness.
* **Scheduler core:** Failure-event aggregation, quarantine of abnormal NVIDIA cards, and **extended ResourceQuota** that correctly accounts for multi-GPU memory/compute requests—improving observability and robustness.
* **Application ecosystem:** Enhanced **vLLM** compatibility (Production-Stack PR #579 merged), **Xinference** Helm integration with HAMi vGPU, and **Volcano Dynamic** **MIG** .
* **Community:** New maintainers/reviewers; CNCF case studies and ecosystem talks highlight real-world adoption.
* **WebUI:** Clearer heterogeneous GPU telemetry for faster triage and capacity insights.

# Community Updates

## CNCF Case Studies

HAMi continues to see real-world adoption in the cloud-native community. Recent examples include:

* **SF Technology (Effective GPU):** Large-scale pooling and scheduling of heterogeneous compute with HAMi. See the [CNCF case study](https://www.cncf.io/case-studies/sf-technology/) for details.
* **PREP-EDU:** Improved resource utilization for training workloads using HAMi. See the [CNCF case study](https://www.cncf.io/case-studies/prep-edu/) for details.

## vCluster Workshop Recognition

At a vCluster technical workshop, cloud-native experts highlighted HAMi as an innovative approach, noting its core advantage: a proxy layer that intercepts **CUDA** API calls to enable fine-grained resource control and isolation. A recording is available on [YouTube](https://youtu.be/eBbjSfxwL30?si=PcPBonbQJfN7maeh&t=1811).

## The Linux Foundation AI_dev

At the AI_dev summit, we presented how HAMi's flexible GPU slicing and software-defined isolation help mitigate compute waste in cloud-native environments. The session recording is available on [YouTube](https://youtu.be/pjHA0JfPNfw?si=djB-R71tswDn9JAq&t=875).

## Vietnam Telecom: GPUs on Kubernetes with eBPF

In Vietnam Telecom's production practice, HAMi demonstrated robust GPU resource management and observability on Kubernetes. See the [CNCF Cloud Native Hanoi Meetup](https://community.cncf.io/events/details/cncf-cloud-native-hanoi-presents-may-meetup-gpu-and-ebpf-on-kubernetes/) and [YouTube video](https://youtu.be/UtPv8P7v0YU?si=UH1uwe07IV4bT5kL) for more information.

# Core Feature Deep-Dive

## AWS Neuron — Device- and **Core-Level** Sharing with Topology Awareness

AWS-designed **Inferentia** and **Trainium** accelerators aim to deliver more efficient and cost-controlled AI infrastructure on AWS. **Inferentia** targets inference acceleration, while **Trainium** targets training. These chips are purpose-built for AI workloads, focusing not only on raw performance but also on **performance-per-watt** and overall cost efficiency. **Inferentia2** brings notable gains in perf-per-watt, and **Trainium2** is stated to reduce costs by **30–40%** versus comparable GPU instances. HAMi now provides integrated support for these AWS accelerators—covering **scheduling**, **virtualization**  **, and observability** .

**What HAMi adds for ****AWS****Neuron**
 HAMi enables **fine-grained scheduling and sharing** of AWS **Trainium** and **Inferentia** accelerators in Kubernetes.

**Key capabilities**

1. **Core-level sharing.** A Neuron device typically exposes multiple  **NeuronCores** . HAMi allows users to request resources at the **single-NeuronCore** granularity instead of pinning an entire device, substantially improving utilization of high-value accelerators.
2. **Topology-aware placement.** For workloads that require multiple NeuronCores, the scheduler places them on  **low-latency core groupings** , maximizing intra-node communication efficiency.
3. **Simplified UX.** Users declare Neuron resources in Pod YAML—just like CPU/memory—by requesting `aws.amazon.com/neuron` (device) or `aws.amazon.com/neuroncore` (core). HAMi handles the underlying mapping.

**How ****topology**** awareness works**
 HAMi’s topology-aware scheduling for AWS Neuron is based on **policy encoded from prior knowledge** of EC2 Neuron platforms rather than runtime topology discovery. Insights from AWS’s native scheduling logic for specific **EC2 ****Neuron**** instance types** are **codified** into HAMi’s internal rules.

**Implementation principles**

1. **Instance-type recognition.** The scheduler first reads the node’s **EC2 instance type** (e.g.,  **trn1** ,  **inf2** ) and uses it as the authoritative hint for the hardware topology.
2. **Linear abstraction.** All Neuron resources on a node are modeled as a **contiguous, zero-indexed list** (e.g., `[0, 1, 2, …]`), rather than a complex graph.
3. **Contiguous-block allocation (hard rule).** When a workload requests **N** devices/cores, the scheduler must find a **fully free, contiguous block of length N** within that list. If a node has enough free units but they are  **non-adjacent** , the placement  **fails** .

![1760022669789](/images/blog/hami-v2.7.0/1760022669789.png)

For Trainium instances, allocation is constrained to specific contiguous group sizes (e.g., 4/8/16) to align with the underlying high-bandwidth interconnect topology.

![1760022681536](/images/blog/hami-v2.7.0/1760022681536.png)

**Examples**

```YAML
apiVersion: v1
kind: Pod
metadata:
  name: neuron-devices
spec:
  restartPolicy: Never
  containers:
    - name: app
      image: public.ecr.aws/neuron/pytorch-inference-neuron:1.13.1-neuron-py310-sdk2.20.2-ubuntu20.04
      command: ["sleep","infinity"]
      resources:
        requests:
          cpu: "1"
          memory: 1Gi
        limits:
          cpu: "4"
          memory: 4Gi
          aws.amazon.com/neuron: 4
```

```YAML
apiVersion: v1
kind: Pod
metadata:
  name: neuron-cores
spec:
  restartPolicy: Never
  containers:
    - name: app
      image: public.ecr.aws/neuron/pytorch-inference-neuron:1.13.1-neuron-py310-sdk2.20.2-ubuntu20.04
      command: ["sleep","infinity"]
      resources:
        requests:
          cpu: "1"
          memory: 1Gi
        limits:
          cpu: "4"
          memory: 4Gi
          aws.amazon.com/neuroncore: 1
```

**Docs & PRs**
*User guide: AWS **Neuron** Device* (https://project-hami.io/docs/userguide/AWSNeuron-device/enable-awsneuron-managing)
Related PR: [https://github.com/Project-HAMi/HAMi/pull/1238](https://github.com/Project-HAMi/HAMi/pull/1238)
*Thanks to @archlitchi and the AWS Neuron team for the collaboration.*

## NVIDIA GPU — **Topology-Aware Scheduling** (NVLink-First, Fragment-Aware)

This feature targets performance bottlenecks in  **high-performance computing (**  **HPC** **)** and **large-scale** ****AI** training** . When a job needs 2, 4, 8, or more GPUs, forcing those GPUs to communicate solely over the relatively slow **PCIe** bus makes data exchange the bottleneck and degrades end-to-end training throughput. By contrast, if the GPUs are placed on **NVLink-connected** sets, communication bandwidth increases dramatically, unlocking substantially higher overall performance.

### Topology Optimization: Design Rationale

We follow one core principle: prefer the best fit for the current job while preserving large, intact ***topology** *groups for future jobs** .

The mechanism has two stages: **Topology** **Registration** and  **Scheduling Decision** .

#### Stage 1: Topology Registration — Making the Physical Layout Visible

Goal: turn each node’s otherwise invisible physical GPU interconnects into standardized data that the cluster scheduler can reason about.

1. **Discovery.** On every GPU node, the **device plugin** uses NVIDIA **NVML** to obtain the pairwise physical link type between all GPUs—accurately distinguishing **NVLink** from standard **PCIe** links.
2. **Modeling.** The results are assembled into a clear **connectivity**** matrix** (an adjacency table) that records, for any two GPUs, whether they are connected via NVLink or PCIe. This matrix is the node’s digital blueprint of its GPU topology.
3. **Publication.** The matrix is serialized to **JSON** and attached to the node as an  **annotation** . From that point, the node’s physical topology is globally visible and queryable by the scheduler.

#### Stage 2: Scheduling Decision — Selecting the Optimal Placement

When a GPU-requesting workload arrives, the scheduler reconstructs each node’s connectivity matrix from annotations and performs a two-step decision process.

1. **Filter (eligibility gate).** The scheduler checks whether the node’s currently **free GPUs** contain one or more combinations that satisfy the request. For example, for a job that requires  **4 NVLink-connected GPUs** , the node must have  **at least one free 4-** **GPU NVLink** **set** . Nodes that cannot satisfy this hard constraint are discarded.
2. **Score (choose the best among eligibles).** Remaining nodes are scored to pick the best placement—maximizing the quality of the current fit while minimizing future **fragmentation** of high-bandwidth groups.

#### **Usage**

#### Concrete Policies

* **Multi-GPU jobs — “Best-fit” principle.**

Prefer **exact-size** NVLink groups. If a job needs 4 GPUs, a node with a  **free 4-** **GPU** **NVLink set** scores higher than a node that would  **carve 4 out of an 8-GPU NVLink group** . This avoids breaking large, valuable topology blocks and reduces fragmentation.

![1760023921307](/images/blog/hami-v2.7.0/1760023921307.png)

* **Single-GPU jobs — "Least-disruption" principle.**

Prefer **standalone** GPUs that are not members of any NVLink group. Only consume GPUs from within NVLink groups when no standalone options remain. This preserves intact high-bandwidth groups for workloads that truly need them.

![1760023911556](/images/blog/hami-v2.7.0/1760023911556.png)

```YAML
apiVersion: v1
kind: Pod
metadata:
  name: gpu-topology-aware-job
  annotations:
    hami.io/gpu-scheduler-policy: "topology-aware"
spec:
  containers:
  - name: cuda
    image: nvidia/cuda:11.6.2-base-ubuntu20.04
    command: ["sleep", "infinity"]
    resources:
      limits:
        nvidia.com/gpu: "4"
```

#### **Design & How-to**

Design: [https://github.com/Project-HAMi/HAMi/blob/master/docs/proposals/gpu-topo-policy.md](https://github.com/Project-HAMi/HAMi/blob/master/docs/proposals/gpu-topo-policy.md)
Guide: [https://github.com/Project-HAMi/HAMi/blob/master/docs/proposals/nvidia-gpu-topology-scheduler_cn.md](https://github.com/Project-HAMi/HAMi/blob/master/docs/proposals/nvidia-gpu-topology-scheduler_cn.md)
Related PRs:

* [https://github.com/Project-HAMi/HAMi/pull/1018](https://github.com/Project-HAMi/HAMi/pull/1018)
* [https://github.com/Project-HAMi/HAMi/pull/1276](https://github.com/Project-HAMi/HAMi/pull/1276)

*Thanks to @lengrongfu and @fyp711.*

# Scheduler Core Enhancements

## Extended **ResourceQuota** (multi-GPU memory/compute that actually adds up)

**Gaps in stock Kubernetes**

1. **No cross-resource linkage:** For `nvidia.com/gpu: 2` with `nvidia.com/gpumem: 2000` (MB **per** **GPU** ), stock ResourceQuota miscounts total memory as **2000MB** instead of  **2×2000MB** .
2. **No dynamic values:** Percent-based requests (e.g., `gpumem-percentage: 50`) can only be resolved **after** placement, when the actual device size is known.

**HAMi’s approach**

* **Linked accounting:** Understands per-GPU semantics and computes the **true total** for quota enforcement.
* **Dynamic deduction:** Resolves percent-based/unspecified values **at scheduling time** based on the selected device.

![1760023762746](/images/blog/hami-v2.7.0/1760023762746.png)

**Example**

```YAML
apiVersion: v1
kind: ResourceQuota
metadata:
  name: gpu-quota
  namespace: default
spec:
  hard:
    limits.nvidia.com/gpu: "2"
    limits.nvidia.com/gpumem: "3000"
```

Guide: [https://project-hami.io/zh/docs/userguide/nvidia-device/using-resourcequota/](https://project-hami.io/zh/docs/userguide/nvidia-device/using-resourcequota/)
 Related PR: [https://github.com/Project-HAMi/HAMi/pull/1359](https://github.com/Project-HAMi/HAMi/pull/1359)
*Thanks to @FouoF.*

## Scheduling **Event Aggregation** (clear reasons, faster root-cause)

* Aggregates filter-stage failures into standardized tags (e.g., `CardInsufficientMemory`, `NumaNotFit`) with **counts** in `FilteringFailed` events.
* On success, **Normal** events include chosen nodes and scores; on failure, **Warning** events summarize why no nodes matched.
* Works with v4/v5 graded logs; see `docs/scheduler-event-log.md`.

Docs: [https://github.com/Project-HAMi/HAMi/blob/master/docs/scheduler-event-log.md](https://github.com/Project-HAMi/HAMi/blob/master/docs/scheduler-event-log.md)
 Related PR: [https://github.com/Project-HAMi/HAMi/pull/1333](https://github.com/Project-HAMi/HAMi/pull/1333)
*Thanks to @Wangmin362.*

# Application Ecosystem

HAMi not only advances low-level hardware support but also focuses on tight integration with the upper AI application stack to improve developer experience and operational efficiency.

## vLLM — Compatibility Enhancements

During Tensor Parallelism (TP), vLLM relies on the **NCCL** library for high-performance communication. Building on that, the latest HAMi-core brings the following improvements and fixes:

1. **Asynchronous memory request stabilization:** Fixed a bug where async allocations could occasionally exceed the **MemPool** ceiling, improving memory-management stability.
2. **Memory accounting accuracy:** Corrected cases where **`cuMemCreate`** partial allocations were not fully attributed, ensuring more accurate memory usage reporting.
3. **Symbol resolution fix:** Resolved intermittent symbol reference issues that could lead to process  **hangs** , increasing system robustness.
4. **Context management fix:** Corrected context-size accounting when contexts are recreated, preventing potential errors caused by size mismatches.

 In addition, the vLLM community has merged [[PR #579: Feat - Add Support HAMi Resources Variables]](https://github.com/vllm-project/production-stack/pull/579) enabling **native HAMi support** in vLLM. This allows users to configure resources directly via HAMi's virtualization and scheduling layer, reducing integration overhead while improving compatibility and ease of use.

![1760022750966](/images/blog/hami-v2.7.0/1760022750966.png)

![1760022756700](/images/blog/hami-v2.7.0/1760022756700.png)

**Related PRs**

* [https://github.com/vllm-project/production-stack/pull/579](https://github.com/vllm-project/production-stack/pull/579)
  *Sincere thanks to @andresd95 for the contribution.*

## Xinference

**Xinference** is an open-source multi-model inference framework from Xorbits. It adopts a **Supervisor/Worker** architecture that simplifies deploying and managing multi-model services on Kubernetes.

In enterprise practice, Xinference often encounters: (a)  **small models monopolizing full GPUs** , leading to waste; and (b) **limited quota/observability** for multi-tenant scenarios.

To address this, the community merged  **[** **PR #6]** , adding **native HAMi ****vGPU**** support** in the Helm chart. With a simple flag, users can enable HAMi and propagate resource variables such as `gpucores` and `gpumem-percentage` through to both Supervisor and Worker.

![1760022774131](/images/blog/hami-v2.7.0/1760022774131.png)

**Outcomes**

* Small models can **safely share** GPUs, resulting in  **significantly higher overall utilization** .
* **Deployment is simpler** : no custom glue code—HAMi virtualization works out-of-the-box.
* **Quota & observability ready** for multi-user, multi-job concurrency in production.

**Related** **PRs**

* [https://github.com/xorbitsai/xinference-helm-charts/pull/6](https://github.com/xorbitsai/xinference-helm-charts/pull/6)
  *Many thanks to @calvin0327 for the contribution.*

## Volcano Dynamic MIG

Volcano’s GPU virtualization supports requesting **partial GPU resources** (memory/compute) and, together with the Device Plugin, enforces **hardware isolation** to improve utilization. Traditional GPU virtualization typically intercepts CUDA API calls to limit usage. With NVIDIA Ampere, **MIG** (  **Multi-Instance GPU** **)** allows a single physical GPU to be partitioned into multiple isolated instances; however, generic MIG schemes often rely on  **pre-fixed instance sizes** , which can introduce waste and reduce flexibility.

**Volcano v1.12** introduces **dynamic** ***MIG** *creation and scheduling** . It selects MIG instance sizes **at runtime** based on requested GPU usage and applies a **best-fit** strategy to reduce waste. It also supports **binpack** and **spread** scoring to control fragmentation and boost utilization. Users request resources via a **unified ****API** (`volcano.sh/vgpu-number`, `…/vgpu-cores`, `…/vgpu-memory`) without worrying about the underlying implementation.

![1760022781830](/images/blog/hami-v2.7.0/1760022781830.png)

**Example**

```YAML
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod1
  annotations:
    volcano.sh/vgpu-mode: "mig"
spec:
  containers:
    - name: ubuntu-container1
      image: ubuntu:20.04
      command: ["bash", "-c", "sleep 86400"]
      resources:
        limits:
          volcano.sh/vgpu-number: 1
          volcano.sh/vgpu-memory: 8000
```

**Design doc:** [https://github.com/volcano-sh/volcano/blob/master/docs/design/dynamic-mig.md](https://github.com/volcano-sh/volcano/blob/master/docs/design/dynamic-mig.md)
**User guide:** [https://volcano.sh/zh/docs/gpu_virtualization/](https://volcano.sh/zh/docs/gpu_virtualization/)
**Related** **PRs** **:** [https://github.com/volcano-sh/volcano/pull/4290](https://github.com/volcano-sh/volcano/pull/4290), [https://github.com/volcano-sh/volcano/pull/3953](https://github.com/volcano-sh/volcano/pull/3953)
*Thanks to @sailorvii and @archlitchi for the contributions.*

# Engineering Improvements & Fixes

## HAMi

**Core scheduling** :

* Aggregated failure events for observability
* NVIDIA abnormal-card quarantine
* Unified device interface; fewer annotations
* Updated Ascend 910 strategy
* Extended ResourceQuota (multi-GPU correctness)

**Stability & quality** :

* Safer type conversions; CI build fixes (incl. 910B4-1 template)
* vGPU metric corrections; allocation fixes
* Linting & refactors for a cleaner codebase

## HAMi-core

* **Enhancements:** `cuMemcpy2D` hook; slimmer Dockerfiles; CI/CD + `cpplint`; contributor guidelines
* **Stability:** NVML null-pointer guards; accurate per-process utilization under concurrency; fix rare empty-record access
* **Code quality:** Remove magic numbers (use `CUDA_DEVICE_MAX_COUNT`); restructure statistics from accumulate→summarize-assign

## WebUI

* **Heterogeneous telemetry:** clearer, at-a-glance utilization for capacity planning and incident triage.

---

# Contributors & New Roles

![1760022871607](/images/blog/hami-v2.7.0/1760022871607.png)

* **HAMi Member:** @fyp711
* **HAMi Reviewers:** @lengrongfu, @chaunceyjiang, @Shouren, @ouyangluwei163
* **volcano-vgpu-device-plugin Reviewer & Approver:** @SataQiu
* **HAMi Website Owner:** @windsonsea

*Thank you to all contributors for pushing HAMi forward.*

---

# Looking Ahead

* **Kubernetes DRA:** First-class **Dynamic Resource Allocation** for finer-grained, policy-driven heterogeneous scheduling.
* **WebUI:** More analytics, custom alerts, and historical insights.
* **Ecosystem** **:** Deeper integrations across hardware and AI frameworks to broaden real-world coverage.
