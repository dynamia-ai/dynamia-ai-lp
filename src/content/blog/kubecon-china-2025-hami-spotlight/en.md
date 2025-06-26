---
title: "From SF Technology to AWS | Dynamia AI's HAMi Project Gains Industry Giant Attention at KubeCon China"
slug: "kubecon-china-2025-hami-spotlight"
date: "2025-06-26"
excerpt: "KubeCon China 2025 concluded successfully, where Dynamia AI's HAMi project, as a CNCF Sandbox open-source project, shined brightly and gained high recognition from industry giants from SF Technology to AWS."
author: "Dynamia AI Team"
tags: ["KubeCon", "HAMi", "GPU Sharing", "Cloud Native", "Kubernetes", "AI Infrastructure"]
coverImage: "/images/blog/kubecon-china-2025/kubecon-china-2025.png"
language: "en"
---

# From SF Technology to AWS | Dynamia AI's HAMi Project Gains Industry Giant Attention at KubeCon China

KubeCon China 2025 concluded magnificently in Hong Kong, bringing together global technical experts, developers, and open-source enthusiasts in this premier cloud-native event. In this wave of technological innovation, HAMi - initiated and led by Dynamia AI's core team as the industry's only CNCF Sandbox open-source project focused on heterogeneous GPU resource sharing - not only made a strong voice in technical sessions but also demonstrated vibrant vitality through interactions with the global community.

This article will take you through the highlights of Dynamia AI team and HAMi at KubeCon, share exciting behind-the-scenes stories, and provide an in-depth analysis of the present and future of GPU technology ecosystem in cloud-native environments based on overall conference trends.


## Highlight Moments: HAMi's Two Core Sessions at KubeCon China

As an innovative force in GPU sharing and scheduling, Dynamia AI team shared two core topics at the conference, directly addressing the GPU resource management pain points faced by Kubernetes users in the AI era.

### Session 1: K8s Issue #52757: Multi-Container GPU Sharing

This session stemmed from an eight-year-old challenge in the Kubernetes community: how to efficiently share expensive physical GPUs among multiple containers while providing isolation. Traditional GPU allocation methods (such as exclusive allocation, Time-slicing, MPS, MIG, etc.) each have limitations, making it difficult to balance isolation, flexibility, hardware compatibility, and cost.

One of HAMi's core missions is to provide an open-source, fine-grained (supporting compute percentage and memory MB-level) flexible GPU sharing solution that is non-intrusive and requires zero application modifications. It works through scheduler and device plugin coordination, intercepting CUDA API calls within containers to achieve expected control over compute and memory allocation, ensuring both sharing and isolation. Additionally, HAMi has broad compatibility with domestic AI chips and other heterogeneous hardware, enabling unified scheduling.

![Speaker Yin Yu](/images/blog/kubecon-china-2025/speaker-yin-yu.png)
*Yin Yu (Dynamia AI Product Manager, Core Maintainer @HAMi) delivering presentation*

### Session 2: Intelligent GPU Management: Dynamic Pooling, Sharing and Scheduling for AI Workloads

This session deeply explored the "impossible triangle" dilemma faced by GPU management in K8s clusters - the difficulty in simultaneously achieving high performance, strong flexibility, and high reusability, resulting in typically extremely low GPU utilization rates in clusters because K8s tends to allocate GPUs exclusively. Existing NVIDIA solutions are often complex to configure or lack flexibility.

HAMi's proposed solution aims to achieve intelligent GPU management, dynamic pooling, sharing, and scheduling. It greatly simplifies user experience, requiring users to only declare the needed memory size without worrying about underlying hardware or specific partitioning technologies. The core lies in intercepting CUDA API calls through HAMi Core to achieve hard isolation of memory allocation, and innovatively introducing dynamic MIG functionality. Combined deeply with Volcano scheduler and HAMi device plugin, it can dynamically generate MIG slices based on task requirements, solving MIG pre-configuration pain points while balancing performance and isolation. This solution significantly improves GPU utilization and largely solves the "impossible triangle" problem.

![Team Presentation](/images/blog/kubecon-china-2025/team-presentation.png)
*(From left to right) Li Mengxuan (Dynamia AI Co-Founder & CTO & HAMi Initiator), Chen Wei (China Unicom Cloud Data Center Technical Expert)*

## Behind the Scenes: Community Power and Thought Collision

Beyond excellent session sharing, Dynamia AI team and HAMi also received overwhelming recognition and valuable suggestions at KubeCon. These moments represent the most authentic warmth of the community beyond technology.

### Story 1: From Audience to Peers

After the morning Lightning Talk ended, several audience members immediately approached us, not only expressing strong interest in HAMi but also asking about the specific time and location of the afternoon deep-dive session, anticipating more in-depth exchanges. This immediate feedback is the most direct affirmation of our project's value!

### Story 2: Deep Dialogue with CNCF CTO

![Meeting with CNCF CTO](/images/blog/kubecon-china-2025/cncf-cto-meeting.png)
*(From left to right) Keith Chan (Linux Foundation APAC, CNCF China Director), Chris Aniszczyk (CNCF CTO), Li Mengxuan, Yin Yu, Chen Wen*

Dynamia AI's HAMi Maintainer team had in-depth exchanges with CNCF CTO Chris Aniszczyk. Chris expressed high recognition and support for the HAMi project and provided extremely valuable suggestions from a strategic community development perspective:

- **Build Systematic User Cases**: Emphasized the critical role of detailed, systematic user cases in improving project credibility and dissemination.

- **Explore Global Developer Participation**: Recommended actively utilizing CNCF's LFX Mentorship program as an excellent way to attract global university and individual developers.

- **Active Participation in CNCF Global Events**: Encouraged more participation in KCD (Kubernetes Community Days) and online/offline activities in regions like Korea, Japan, and India. Chris specifically mentioned our Vietnam telecom user case shared in Slack, considering it a good start. This inspired us to be more proactive in connecting with developers in these regions, encouraging them to share their practical stories on stage.

- **Establish Professional Security Response Mechanisms**: Emphasized that when projects move from Sandbox to higher maturity levels, establishing standardized vulnerability disclosure and security response processes is the foundation for building community trust.

- **Clear Incubation Roadmap**: Helped us further organize key timelines and preparations needed to enter the CNCF incubation stage.

### Story 3: High-Profile Recognition from Official Keynote

On the second day's conference Keynote, an exciting moment occurred. Linux Foundation APAC and CNCF China Director Keith Chan dedicated a separate slide to introduce our HAMi project in his opening remarks! He referenced SF Technology's recently published "Effective GPU Technical White Paper," showcasing HAMi's engineering practices in GPU pooling and scheduling. This was undoubtedly extremely high-level official recognition.

![Keynote Display](/images/blog/kubecon-china-2025/keynote-hami.png)
*Keith Chan showcasing HAMi project in Keynote*

### Story 4: Thought Collision at Independent Booth

In the open-source project independent booth area, HAMi attracted many visitors. Among them, Frank Fan, Senior Container Solutions Architect from AWS, had an extended in-depth exchange with us. He inquired in detail about HAMi's virtualization implementation principles and conducted detailed comparative discussions with other technical solutions. At the end, our team's HAMi author Li Mengxuan was invited on the spot to participate in the next day's AWS Pioneer Forum to share more possibilities for cloud-native and AI innovation.

![AWS Discussion](/images/blog/kubecon-china-2025/aws-discussion.png)

### Story 5: "Manual Likes" at the Lunch Table

Fate works in wonderful ways. During lunch, we coincidentally met friends from SF Technology's AI team. They expressed high praise for HAMi's application effects in their actual production environment and gave the project "manual likes" in person. This kind of real feedback from frontline users is our greatest motivation to continue forward.

## KubeCon Insights: Present and Future of GPU Technology Ecosystem

Looking at KubeCon overall, GPU-related topics reached unprecedented popularity. Against the backdrop of AI and Large Language Models (LLM) sweeping globally, how to more efficiently, economically, and flexibly utilize these expensive computing resources has become a common focus for the entire industry. Dynamia AI HAMi's exploration is not an isolated case, but a key wave in the entire technological tide.

### Core Challenges: The "Impossible Triangle" of Cost and Efficiency

![GPU Utilization Challenge](/images/blog/kubecon-china-2025/gpu-utilization-challenge.png)

Almost all discussions revolved around several core pain points:

- **High Cost and Low Utilization**: GPU hardware is expensive, but in actual production, low utilization and resource fragmentation cause shocking waste, seriously affecting return on investment.

- **Specificity of LLM Workloads**: Large models have variable input/output lengths, causing traditional metrics like QPS and concurrency to become distorted, making resource assessment and elastic scaling extremely difficult. Tools like DCGM expose low-level utilization metrics that also struggle to truly reflect GPU "space occupancy."

- **Scheduling and Scaling Delays**: From metric collection to container startup and model loading, the entire pipeline has delays of several minutes, often resulting in resources being ready after traffic peaks have passed, causing system response lag.

### Technology Trends: Moving Toward Refinement, Automation, and Full-Stack Optimization

![Technology Development Trends](/images/blog/kubecon-china-2025/tech-trends.png)

Facing challenges, the community is seeking breakthroughs from multiple levels, forming a combination approach:

**Kubernetes as the Absolute Core of AI Infrastructure**: Whether using Kubespray to build high-performance clusters on bare metal or implementing automated operations through Operators (like Vivo's internal KubeOps practice), K8s provides a unified, portable, highly available foundation.

**Refinement and Virtualization of GPU Resource Management**:

- *Hardware Layer*: MIG and MPS as basic partitioning technologies provided by NVIDIA, suitable for training and inference scenarios respectively.

- *Software Layer*: API interception technology becomes mainstream. HAMi's CUDA API interception achieves hard isolation and control of compute and memory. The conference also introduced new approaches, such as elevating interception to the Python level (intercepting at PyTorch/TensorFlow framework layer), which is more flexible and theoretically hardware-agnostic, providing new directions for solving "GPU monopoly" and heterogeneous support.

**Intelligent Scheduling and Orchestration**:

- *Batch Processing and Gang Scheduling*: Batch schedulers represented by Volcano ensure related tasks "live and die together" through Gang Scheduling mechanisms, effectively solving resource fragmentation and significantly reducing queue times.

- *LLM-Specific Orchestration*: For LLM inference P/D separation (Prefill/Decode) architecture, more complex Role Group Orchestration is needed to coordinate different role Pods and perceive topology structures to optimize performance.

**Full-Stack Optimization for LLM Inference Performance**:

The AIBrix project demonstrated the power of full-stack optimization, reducing GPU high-bandwidth memory (HBM) usage through KVCache Offloading to lower-cost storage (like DRAM), optimizing time-to-first-token (TTFT), reducing subsequent generation latency (TPOT) through P/D separation, especially improving performance stability when processing long outputs. It also implements token-based and cache-aware intelligent routing through AIGateway. LoRA's high-density deployment solution provides cost-effective tools for managing massive fine-tuned models, especially suitable for long-tail models.

### Future Outlook: Integration, Simplification, and Openness

![Future Development Direction](/images/blog/kubecon-china-2025/future-outlook.png)

- **"Less is More"**: Basic tools like Kubespray are streamlining functions, focusing on generating standardized K8s clusters, reducing complexity and maintenance costs.

- **Deep Cloud-Native Integration**: AI infrastructure will deeply integrate with cloud-native components like Envoy and vLLM, forming full-stack solutions from traffic ingress to compute cores.

- **Embracing Hardware Diversity**: Unified support for non-NVIDIA GPUs will be key to the future, with abstraction layers and flexible virtualization technologies playing important roles.

- **From Reactive to Proactive**: Prediction-based data-driven auto-scaling will replace reactive responses to handle LLM workload burstiness.

## Conclusion

KubeCon China 2025 was a feast of ideas and an important milestone on the growth path of Dynamia AI's core team and HAMi community.

Through in-depth exchanges with global developers and insights into overall technology trends, we are increasingly convinced of a judgment about the future: in the AI Infrastructure field, the era of optimizing single links or components is passing, and the real key to success lies in full-stack optimization.

HAMi currently has deep experience in the core area of GPU sharing and scheduling, but this is just the beginning. We firmly believe that to go further in the AI Infra long march, we must break down barriers and embrace a broader ecosystem.

In the future, we will proactively explore more cooperation possibilities with excellent upstream and downstream ecosystem projects, working with the entire cloud-native community to provide users with seamless end-to-end solutions from resources to underlying infrastructure, from scheduling to applications. This is not only HAMi's future path but also Dynamia AI team's sincere invitation to all community partners.

---

*To learn more about the HAMi project, please visit our [GitHub repository](https://github.com/Project-HAMi/HAMi) or join our [Slack community](https://cloud-native.slack.com/archives/C07T10BU4R2).* 