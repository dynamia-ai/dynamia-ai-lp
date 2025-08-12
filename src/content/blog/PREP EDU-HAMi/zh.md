---
title: "【PREP EDU | 密瓜智能】东南亚 AI 教育潜力独角兽，用 HAMi 构建高效 GPU 推理平台"
slug: "PREP EDU-HAMi"
date: "2025-08-08"
excerpt: "在 AI 教育快速发展的当下，PREP EDU（prepedu.com） 正逐渐成为东南亚教育科技领域的关注焦点。"
author: "密瓜智能"
tags: ["KubeCon", "HAMi", "GPU共享", "云原生", "Kubernetes", "AI基础设施"]
coverImage: "/images/blog/PREP-EDU-HAMi/cover.jpg"
language: "zh"
---

> 作为一个由密瓜智能发起并主导的 CNCF 活跃开源项目，HAMi 由来自 15+ 国家、350+ 贡献者共同维护，已被 120+ 企业与机构在实际生产环境中采纳，具备良好的可扩展性与支持保障。

![p1](/images/blog/PREP-EDU-HAMi/p1.png)

在 AI 教育快速发展的当下，PREP EDU（prepedu.com） 正逐渐成为东南亚教育科技领域的关注焦点。

这家公司成立于 2020 年，总部位于越南河内，致力于通过人工智能提升语言学习与考试备考的效率与体验。如今，已有 **数十万名学习者** 通过 PREP EDU 平台，在 **雅思（IELTS）、托业（TOEIC）、汉语水平考试[HSK](https://baike.weixin.qq.com/v157465.htm?scene_id=132&sid=17049289953840609596&ch=s1s&fromTitle=HSK)以及越南全国高中毕业考试（THPT Quốc gia）**等多个考试中取得实质性提升。

PREP EDU 的技术能力也获得了资本市场的认可。2024 年，公司完成 **700 万美元 A 轮融资**，投资方包括 **Cercano Management、[East Ventures](https://mp.weixin.qq.com/s/hCOJaeW4_OfZVcuCQkAq_g)、Northstar Ventures** 等知名机构。

在这套平台背后，支撑起高并发 AI 推理服务的，是一套由多型号显卡组成的异构 GPU 集群。而完成资源智能编排、保障系统稳定运行的关键组件，正是**由密瓜智能核心团队成员发起并主导的 CNCF Sandbox 开源项目 HAMi。**

## 公司介绍：来自东南亚的 AI 教育潜力独角兽

PREP EDU 的目标明确：用人工智能重塑考试备考方式。他们的核心产品覆盖多个主流考试体系，包括：

- **国际语言考试**：如雅思（IELTS）、[托业（TOEIC)](https://baike.weixin.qq.com/v7558706.htm?scene_id=132&sid=17791638696238039579&ch=s1s)和汉语水平考试（HSK）；

- **本地国家考试**：如越南高中毕业考试（THPT Quốc gia）；

- **AI 虚拟教室**：提供写作与口语的实时评分和个性化反馈；

- **Teacher Bee 智能陪练**：全天候学习建议、发音指导、错题讲解；

- **Web + App 多端联动**：学习进度实时同步，适配多终端使用场景。

目前，PREP EDU 不仅在越南本土拥有大量用户，也已拓展至**印尼、菲律宾**等东南亚国家。公司曾受邀出席 EdTech Asia、Meta Summit 等国际教育科技峰会，并获得 EdTech Asia 教育创新奖、SEI 智能教育倡议奖等多项行业认可。

### 工程背景

PREP EDU 操作一套**基于 Kubernetes （分发应用环境为 RKE2） 的 AI 推理服务平台**，其 GPU 集群包含多种显卡，其中以 **RTX 4070 和 RTX 4090** 为主。

![p2](/images/blog/PREP-EDU-HAMi/p2.png)


但在使用 HAMi 之前，这套系统为下列维护随时热点:

- 用 GPU Operator 对于不同工作资源进行给定占用，都是按最大资源使用，导致显卡利用率低（大部分时候仅 10%～20%）；

- 多个实例共用 GPU 时，容易出现显存被占满 （90-95%） 导致应用 Crash 情况；

- 无法按类分配 GPU 类型，不同项目对 GPU 类型有具体选择需求，却难以实现；

### 解决方案：HAMi 在 PREP EDU 中的实际落地

经过调研 NVIDIA 官方的各种虚拟化功能后，PREP EDU 仍然最终选择使用 **CNCF Sandbox 开源 HAMi** 进行 GPU 管理。

重要功能包括：

- 支持**按照 NLP token 长度或每个工作进程需求分配 GPU 的显存和算力**；

- 通过 annotation 选择指定 GPU 类型（如仅在 RTX 4070 或 4090 上运行某些项目）；

- 支持指定 GPU UUID 进行精精分配；

- 兼容 GPU Operator，且已完成 containerd 通用与 RKE2 高并发环境集成；

- 集成 Prometheus，支持监控和告警；

- 任何新节点插入即可被 HAMi 自动管理；

同时，DevOps 团队还探索了 HAMi 在 Docker 环境中自行部署以支持特殊运行场景，并定制了和 GPU Operator 的协同使用案例。

![p3](/images/blog/PREP-EDU-HAMi/p3.png)

### 效果和评价

在接入 HAMi 后，PREP EDU 已完成 GPU 设备的解耦和自动组织：

- **1+ 年**：在生产环境中稳定使用 HAMi 超过 1 年。

- **90%**：通过 HAMi 优化了 90% 的 GPU 基础设施。

- **50%**：减少了 50% 由 GPU 管理引发的运维痛点。

![p4](/images/blog/PREP-EDU-HAMi/p4.png)

>“HAMi is a great option for vGPU scheduling, helping us optimize GPU usage for our AI microservices. Its monitoring and alerting features are also very helpful for long-term tracking. 

>The documentation is clear, and the ability to assign workloads to specific GPU types is a huge advantage for us.”—— **Xeus Nguyen， DevOps Engineer， PREP EDU**

**「HAMi 是非常适合 vGPU 调度的方案，帮助我们优化了 AI 微服务的 GPU 使用率。其监控和告警功能对长期追踪也非常有帮助，文档清晰明确，支持将任务分配给特定 GPU 类型是我们非常看重的一大优势。」**

> “HAMi allows precise GPU memory and compute allocation for each project, helping optimize overall resource usage. This makes it possible to deploy more AI services on the same limited amount of GPU VRAM, improving efficiency and scalability.”—— **Nhan Phan， AI Engineer， PREP EDU**

**「HAMi 让我们可以为每个项目精准分配 GPU 显存和算力，从而整体优化资源利用率。这样我们就能在有限的 GPU 显存上部署更多 AI 服务，提升了效率和平台可扩展性。」**

>“HAMi helped us overcome challenges in GPU management for our on-premise AI microservices by automating workload allocation and reducing maintenance overhead. It significantly improved resource efficiency with minimal effort from our team.”—— Phong Nguyen， AI Engineer， PREP EDU

**「HAMi 通过自动分配工作负载，帮助我们解决了私有部署 AI 微服务中 GPU 管理的难题，也显著减少了维护工作量，仅需极少的人力投入就提升了资源效率。」**

>“HAMi has been a game-changer for our AI engineering workflow. By virtualizing and right-sizing GPU resources at the pod level, we can pack lightweight inference services and large batch jobs onto the same hardware without noisy-neighbor issues. 

>Deployment is practically "plug-and-play"  — a Helm chart and a couple of labels. So we kept our existing manifests intact.”—— Vu Hoang Tran， AI Engineer， PREP EDU

**「HAMi 彻底改变了我们的 AI 工程工作流程。通过在 Pod 层面虚拟化和精细划分 GPU 资源，我们能将轻量推理服务与大批量任务共部署在同一硬件上，且无“邻居干扰”问题。整个部署过程近乎开箱即用，只需一个 Helm chart 和几个 label，原有 manifest 完全无须修改。」**

📖 想了解 PREP EDU 在生产环境中部署 HAMi 的具体实践细节？

推荐阅读来自 PREP EDU DevOps 工程师 Xeus Nguyen 的完整技术博客：

https://wiki.xeusnguyen.xyz/Tech-Second-Brain/Personal/Kubewekend/Kubewekend-Session-Extra-2#setup-gpu-worker

---

![p5](/images/blog/PREP-EDU-HAMi/p5.png)

Dynamia 密瓜智能,  专注以 CNCF HAMi 项目为核心底座，提供 灵活、可靠、按需、弹性的 GPU 虚拟化 与异构算力调度、统一管理的全球化解决方案。可以插拔式、轻量化、无侵入地部署在任意公有云、私有云、混合云环境中，可支持 NVIDIA、昇腾、沐曦、寒武纪、海光、摩尔线程，天数智芯等异构芯片。

>官网：https://dynamia.ai

>邮箱：info@dynamia.ai




