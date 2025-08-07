---
title: "【HAMi Project Team | User Case】A Leading Autonomous Driving Company Achieves Fine-Grained GPU Management and Maximizes Resource Utilization with HAMi"
slug: "A leading autonomous-driving company"
date: "2025-8-9"
excerpt: "In its core model training scenarios, a leading autonomous driving company utilizes multi-machine distributed training with scheduling frameworks like Ray and Volcano."
author: "HAMi Project Team"
tags: ["KubeCon", "HAMi", "GPU Sharing", "Cloud Native", "Kubernetes", "AI Infrastructure"]
coverImage: "/images/blog/A leading autonomous-driving company/cover2.jpg"
language: "en"
---

# 【Melon Intelligence | User Case】A Leading Autonomous Driving Company Achieves Fine-Grained GPU Management and Maximizes Resource Utilization with HAMi

> As an active open-source project, HAMi is co-maintained by over 350 contributors from more than 15 countries and has been adopted in production environments by over 120 enterprises and institutions, demonstrating its excellent scalability and support.

## User Profile

In its core model training scenarios, a leading autonomous driving company utilizes multi-machine distributed training with scheduling frameworks like Ray and Volcano. At the same time, it also provides a cloud desktop environment for internal R&D, testing, and product teams, supporting convenient remote work and model development.

In the cloud desktop cluster, each user can create a virtual workstation with a graphical interface for model compilation, offline data replay, or running lightweight PyTorch experiments from any location. This scenario is more sensitive to resources, and with a limited number of GPU cards, the scheduling and utilization of GPU resources have become key factors for the platform's stable operation.

## Project Challenges

Due to the relatively limited number of graphics cards in the cloud desktop cluster, traditional solutions like NVIDIA Time-Slicing, vGPU, or KubeVirt's GPU passthrough method have some limitations in terms of resource scheduling flexibility and cost:

• **Limited Granularity of MIG Mode**: Although MIG (Multi-Instance GPU) supports resource partitioning, it is only applicable to specific high-end models, and the partitioning configurations are fixed, lacking the flexibility to meet diverse business needs.

• **Weak Compatibility of Cloud Vendor Solutions**: Kernel-space virtualization solutions from cloud providers, such as Alibaba Cloud's cGPU and Tencent Cloud's QGPU, have strict requirements for the operating system kernel version, limiting environmental freedom. They are also difficult to deploy and manage uniformly in multi-cloud or hybrid-cloud environments, reducing the overall platform's flexibility and portability.

• **Coarse-grained Scheduling with Time-Slicing**: While NVIDIA's native Time-Slicing is usable, its resource isolation does not meet the requirements, and its performance and stability are not guaranteed, failing to satisfy the need for fine-grained computing power.

• **Resource Waste with Passthrough Mode**: When using GPU passthrough solutions like KubeVirt exclusively, GPUs are allocated to virtual machines at the full-card level, making fine-grained utilization difficult. This leads to resource idling in light-load scenarios and low overall efficiency.

These limitations made it difficult for the company to balance flexibility and cost-effectiveness in its GPU cluster management, creating an urgent need for a more efficient solution.

## Solution

![1](/images/blog/A leading autonomous-driving company/p1.jpg)

Facing the complex demands of GPU resource scheduling, the company innovatively adopted a **HAMi + KubeVirt** hybrid architecture, achieving flexible and efficient GPU management in its cloud desktop platform. The core design of this solution lies in:

**HAMi: Container-level GPU Virtualization to Enhance Resource Utilization**
HAMi is responsible for GPU scheduling in the container environment, supporting on-demand allocation of vGPU resources. When users log in via remote desktop, the experience is indistinguishable from a local machine. Through a single-card, 3x virtualization configuration, GPU resource utilization has been significantly improved, effectively alleviating the strain on computing power.

**KubeVirt: Passthrough Mode to Guarantee High-Specification Computing Needs**
For training tasks that require full GPU computing power or stronger isolation, KubeVirt provides GPU passthrough capabilities, ensuring that virtual machines have exclusive access to physical graphics cards to meet high-performance computing demands.

Users can freely choose between a container desktop or a GPU passthrough virtual machine, with both modes sharing the same GPU cluster. The platform divides nodes into two resource pools managed by HAMi and KubeVirt, dynamically allocating resources based on task requirements to maximize the computing power of every GPU.

## Why Choose HAMi?

Among the many GPU virtualization solutions, HAMi ultimately became the technology of choice for this leading autonomous driving company, primarily based on the following key considerations:

![2](/images/blog/A leading autonomous-driving company/p2.png)

1.  **Precise Match for Business Scenarios**
    The cloud desktop scenario mainly relies on container isolation and does not require complex batch co-scheduling. HAMi's lightweight design perfectly meets these needs, and it can also be integrated with Volcano for more advanced use cases in the future.

2.  **Mature and Stable vCUDA Technology**
    Adopting the industry-proven vCUDA virtualization technology, HAMi has been running stably to date, with only occasional scheduling failures caused by host resource contention, far exceeding stability expectations.

3.  **Significant Reduction in TCO (Total Cost of Ownership)**
    Compared to other solutions, HAMi has no high-end hardware restrictions and does not add extra kernel maintenance costs. Compared to in-house development, it also significantly reduces development and maintenance investment.

4.  **Cloud-Native Friendly Architecture**
    Based on Kubernetes' native scheduling extensions and device plugin system, the R&D team can quickly get up to speed. Future expansion and maintenance are relatively friendly, and they receive timely and strong support from the Melon Intelligence core team and the HAMi community.

5.  **Future-Proof Heterogeneous Compatibility**
    It not only supports NVIDIA graphics cards but also offers compatibility with domestic GPUs, leaving room for a diversified computing infrastructure layout in the future.

## Results and Benefits

By introducing **HAMi** and building a **dual-track GPU management architecture**, the company has transformed its cloud desktop scenario from resource contention to efficient scheduling. The specific results include:

![3](/images/blog/A leading autonomous-driving company/p3.png)

-   **GPU utilization increased from over 20% to 60-70%, an improvement of about 200%**: Through single-card virtualization technology, idle resource occupation was effectively eliminated, allowing each graphics card to deliver its maximum value.
-   **Virtual GPU resource pool expanded by 3 times**: The scheduling bottleneck, previously limited by the number of physical cards, was broken, allowing the R&D team to apply for computing resources at any time.
-   **Significant cost optimization**: Compared to the MIG mode, which is only supported on some high-end cards, has fixed partitioning schemes, and limited granularity, single-card virtualization allows for flexible, fine-grained resource partitioning on a wider range of models. This fully unlocks the value of existing hardware, avoids the need to purchase additional graphics cards or expand capacity due to resource fragmentation, and reduces the overall TCO.

***"Previously, GPUs were often monopolized by a few virtual machines, leading to resource deadlocks that required manual coordination. Now, after implementing single-card, multi-container sharing with HAMi, the same number of cards can support three times as many desktops, and our R&D colleagues can get the computing resources they need at any time." — Senior R&D Engineer, AI Platform at the user company***

## Future Outlook

As its business scale expands, the company is extending the application of HAMi from cloud desktops to more scenarios, with key exploration directions including:

-   **Testing the integration of HAMi with frameworks like Ray and Volcano in model training clusters**:
    To improve the scheduling efficiency and resource utilization of training tasks, the platform is evaluating the feasibility of introducing HAMi into the model training cluster. It is exploring the synergy between HAMi and existing distributed computing frameworks and batch scheduling systems to address pain points such as resource fragmentation and scheduling queues.
-   **Supporting the integration and unified scheduling of heterogeneous acceleration devices**:
    As the variety of accelerator chip types grows, the platform's need for unified management of heterogeneous resources is becoming more apparent. HAMi natively supports the management and scheduling of multiple types of computing devices. In the future, it will further expand its support for heterogeneous accelerator cards to build a flexible and scalable heterogeneous computing power management platform that can support various AI task scenarios.

## Conclusion

The Melon Intelligence team and the HAMi community have helped this leading autonomous driving company evolve from "resource contention" to "on-demand allocation" in its cloud desktop scenario. HAMi's own cloud-native DNA has also shown its potential to extend to core scenarios like training within the company. Against the backdrop of continuous iteration in autonomous driving algorithms, this efficient and elastic computing power management approach is becoming an indispensable part of AI infrastructure.

---

![5](/images/blog/PREP EDU-HAMi/p5.png)

Dynamia Melon Intelligence, focusing on the CNCF HAMi project as its core foundation, provides a global solution for flexible, reliable, on-demand, and elastic GPU virtualization and heterogeneous computing power scheduling and unified management. It can be deployed in a plug-and-play, lightweight, and non-intrusive manner in any public, private, or hybrid cloud environment, supporting heterogeneous chips from NVIDIA, Ascend, Metax, Cambricon, Hygon, Moore Threads, Tianshu Zhixin, and more.

>Website: https://dynamia.ai
>Email: info@dynamia.ai