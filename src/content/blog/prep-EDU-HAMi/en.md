---
title: "【PREP EDU | HAMi Project Team】Southeast Asia's Potential AI Education Unicorn Builds an Efficient GPU Inference Platform with HAMi"
coverTitle: "PREP EDU × HAMi: Scaling AI Workloads in Southeast Asia"
slug: "PREP-EDU-HAMi"
date: "2025-08-08"
excerpt: "In the fast-growing field of AI education, PREP EDU (prepedu.com) is emerging as a focal point in Southeast Asia's EdTech sector."
author: "Dynamia AI Team"
tags: ["KubeCon", "HAMi", "GPU Sharing", "Cloud Native", "Kubernetes", "AI Infrastructure"]
coverImage: "/images/blog/PREP-EDU-HAMi/cover2.jpg"
language: "en"
---

> As an active CNCF open-source project initiated and led by Melon Intelligence, HAMi is co-maintained by over 350 contributors from more than 15 countries and has been adopted in production environments by over 120 enterprises and institutions, demonstrating its excellent scalability and support.

![1](/images/blog/PREP-EDU-HAMi/p1.png)

In the fast-growing field of AI education, PREP EDU (prepedu.com) is emerging as a focal point in Southeast Asia's EdTech sector.

Founded in 2020 and headquartered in Hanoi, Vietnam, the company is dedicated to enhancing the efficiency and experience of language learning and test preparation through artificial intelligence. To date, **hundreds of thousands of learners** have achieved substantial improvements in various exams, including **IELTS, TOEIC, the Chinese Proficiency Test (HSK), and the Vietnamese National High School Graduation Examination (THPT Quốc gia)**, through the PREP EDU platform.

PREP EDU's technological capabilities have also gained recognition from the capital market. In 2024, the company completed a **$7 million Series A funding round**, with investors including prominent firms like **Cercano Management, East Ventures, and Northstar Ventures**.

Behind this platform, supporting the high-concurrency AI inference services, is a heterogeneous GPU cluster composed of various graphics card models. The key component that enables intelligent resource orchestration and ensures system stability is **the CNCF Sandbox open-source project HAMi, initiated and led by core team members of Melon Intelligence.**

## Company Introduction: A Potential AI Education Unicorn from Southeast Asia

PREP EDU's goal is clear: to reshape test preparation with artificial intelligence. Their core products cover several major exam systems, including:

- **International Language Exams**: such as IELTS, TOEIC, and the Chinese Proficiency Test (HSK);

- **Local National Exams**: such as the Vietnamese High School Graduation Examination (THPT Quốc gia);

- **AI Virtual Classroom**: providing real-time scoring and personalized feedback for writing and speaking;

- **Teacher Bee AI Tutor**: offering 24/7 study advice, pronunciation guidance, and error analysis;

- **Web + App Multi-device Synergy**: real-time synchronization of learning progress, adapted for multi-terminal use cases.

Currently, PREP EDU not only has a large user base in its native Vietnam but has also expanded to other Southeast Asian countries like **Indonesia and the Philippines**. The company has been invited to speak at international EdTech conferences such as EdTech Asia and the Meta Summit, and has received multiple industry recognitions, including the EdTech Asia Innovation Award and the SEI Intelligent Education Initiative Award.

### Engineering Background

PREP EDU operates an **AI inference service platform based on Kubernetes (with RKE2 as the application distribution environment)**. Its GPU cluster includes various graphics cards, primarily **RTX 4070 and RTX 4090**.

![2](/images/blog/PREP-EDU-HAMi/p2.png)

But before using HAMi, the system faced the following recurring hotspots:

- Using the GPU Operator for resource allocation meant workloads were assigned based on maximum resource usage, leading to low graphics card utilization (often only 10%-20%);

- When multiple instances shared a GPU, it was common for VRAM to become fully occupied (90-95%), causing application crashes;

- It was impossible to allocate GPUs by type, making it difficult to meet the specific GPU model requirements of different projects.

### Solution: The Practical Implementation of HAMi at PREP EDU

After researching NVIDIA's various official virtualization features, PREP EDU ultimately chose to use the **CNCF Sandbox open-source project HAMi** for its GPU management.

Key features include:

- Support for **allocating GPU memory and compute power based on NLP token length or the needs of each worker process**;

- Selecting specific GPU types via annotations (e.g., running certain projects only on RTX 4070 or 4090);

- Support for precise allocation by specifying GPU UUID;

- Compatibility with the GPU Operator, with integration completed for both general containerd and high-concurrency RKE2 environments;

- Integration with Prometheus for monitoring and alerting;

- Any new node added is automatically managed by HAMi.

Additionally, the DevOps team explored self-deploying HAMi in a Docker environment to support special runtime scenarios and customized collaborative use cases with the GPU Operator.

![3](/images/blog/PREP-EDU-HAMi/p3.png)

### Results and Testimonials

After integrating HAMi, PREP EDU has successfully decoupled and automated the organization of its GPU devices:

- **1+ Year**: Stably using HAMi in a production environment for over a year.

- **90%**: Optimized 90% of the GPU infrastructure using HAMi.

- **50%**: Reduced GPU management-related operational pain points by 50%.

![4](/images/blog/PREP-EDU-HAMi/p4.png)

>“HAMi is a great option for vGPU scheduling, helping us optimize GPU usage for our AI microservices. Its monitoring and alerting features are also very helpful for long-term tracking. The documentation is clear, and the ability to assign workloads to specific GPU types is a huge advantage for us.”—— **Xeus Nguyen， DevOps Engineer， PREP EDU**

> “HAMi allows precise GPU memory and compute allocation for each project, helping optimize overall resource usage. This makes it possible to deploy more AI services on the same limited amount of GPU VRAM, improving efficiency and scalability.”—— **Nhan Phan， AI Engineer， PREP EDU**

>“HAMi helped us overcome challenges in GPU management for our on-premise AI microservices by automating workload allocation and reducing maintenance overhead. It significantly improved resource efficiency with minimal effort from our team.”—— **Phong Nguyen， AI Engineer， PREP EDU**

>“HAMi has been a game-changer for our AI engineering workflow. By virtualizing and right-sizing GPU resources at the pod level, we can pack lightweight inference services and large batch jobs onto the same hardware without noisy-neighbor issues. Deployment is practically "plug-and-play" — a Helm chart and a couple of labels. So we kept our existing manifests intact.”—— **Vu Hoang Tran， AI Engineer， PREP EDU**

📖 Want to learn more about the specific implementation details of deploying HAMi in PREP EDU's production environment?

We recommend reading the full technical blog post from PREP EDU DevOps Engineer, Xeus Nguyen:

https://wiki.xeusnguyen.xyz/Tech-Second-Brain/Personal/Kubewekend/Kubewekend-Session-Extra-2#setup-gpu-worker

---

![5](/images/blog/PREP-EDU-HAMi/p5.png)

Dynamia Melon Intelligence, focusing on the CNCF HAMi project as its core foundation, provides a global solution for flexible, reliable, on-demand, and elastic GPU virtualization and heterogeneous computing power scheduling and unified management. It can be deployed in a plug-and-play, lightweight, and non-intrusive manner in any public, private, or hybrid cloud environment, supporting heterogeneous chips from NVIDIA, Ascend, Metax, Cambricon, Hygon, Moore Threads, Tianshu Zhixin, and more.

>Website: https://dynamia.ai

>Email: info@dynamia.ai