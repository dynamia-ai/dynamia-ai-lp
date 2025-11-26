---
title: "在 AWS 上虚拟化任意 GPU：HAMi 实现自由显存隔离"
coverTitle: "在 AWS 上虚拟化任意 GPU：HAMi 实现自由显存隔离"
slug: "virtualizing-gpu-aws-hami-free-memory-isolation"
date: "2025-09-16"
excerpt: "本文以 PR 为切入点，结合社区 Issue 和邮件记录，完整还原一条 'HAMi × vLLM' 的落地路径，帮助你在 Kubernetes 中快速实现多模型部署与资源复用。"
author: ""
tags: ["HAMi", "GPU 虚拟化", "AWS", "Kubernetes", "vLLM", "GPU 内存隔离", "多模型推理", "云端 AI", "GPU 紧凑调度", "EKS", "Terraform", "AI 基础设施"]
coverImage: "/images/blog/aws/aws-coverpage.png"
language: "zh"
---

# 在 AWS 上使用 HAMi 虚拟化任意 GPU：实现自由显存隔离

**摘要**：本指南在 AWS EKS 集群中创建两个 GPU 节点组（T4 和 A10G），自动安装 HAMi，并部署三个 vLLM 服务，借助自由显存隔离让每个节点上的多个服务共享同一块物理 GPU。你将看到 GPU 维度的装箱（binpack）效果：当资源允许时，多个 Pod 会共置在同一块 GPU 上。

---


## 为何在 AWS 上使用 HAMi？

HAMi 为 Kubernetes 带来了与 GPU 型号无关的虚拟化能力，覆盖从消费级到数据中心级的 GPU。在 AWS 上，这意味着你可以利用常见的 NVIDIA 实例（例如搭载 T4 的 **g4dn.12xlarge**、搭载 A10G 的 **g5.12xlarge**），然后**切分 GPU 显存**，在无需修改应用的情况下，安全地将多个 Pod 打包到同一块显卡上。


**本演示中**：
- **两个节点**：一个 T4 节点，一个 A10G 节点（每个节点有 4 块 GPU）。
- **HAMi** 在 Terraform apply 阶段通过 Helm 自动安装。
- **vLLM** 工作负载仅申请部分 GPU 显存，因此两个 Pod 可在一块 GPU 上运行。

---

## 一键部署
**代码库**：[github.com/dynamia-ai/hami-ecosystem-demo](https://github.com/dynamia-ai/hami-ecosystem-demo)

### 0）前置条件
- Terraform 或 OpenTofu
- AWS CLI v2（且 `aws sts get-caller-identity` 能成功执行）
- kubectl、jq

### 1）配置 AWS 并安装 HAMi
```bash
git clone https://github.com/dynamia-ai/hami-ecosystem-demo.git
cd infra/aws
terraform init
terraform apply -auto-approve
```
完成后，使用输出配置 kubectl：
```bash
terraform output -raw kubectl_config_command
# 示例：
# aws eks update-kubeconfig --region us-west-2 --name hami-demo-aws
```

### 2）验证集群与 HAMi
检查 HAMi 组件是否在运行：
```bash
kubectl get pods -n kube-system | grep -i hami
```
示例输出：
```
hami-device-plugin-mtkmg             2/2     Running   0          3h6m
hami-device-plugin-sg5wl             2/2     Running   0          3h6m
hami-scheduler-574cb577b9-p4xd9      2/2     Running   0          3h6m
```
列出每个节点上已注册的 GPU（HAMi 会为节点添加库存注解）：
```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}\t{.metadata.annotations.hami\\.io/node-nvidia-register}\n{end}'
```
示例输出：
```
ip-10-0-38-240.us-west-2.compute.internal	GPU-f8e75627-86ed-f202-cf2b-6363fb18d516,10,15360,100,NVIDIA-Tesla T4,0,true,0,hami-core:GPU-7f2003cf-a542-71cf-121f-0e489699bbcf,10,15360,100,NVIDIA-Tesla T4,0,true,1,hami-core:GPU-90e2e938-7ac3-3b5e-e9d2-94b0bd279cf2,10,15360,100,NVIDIA-Tesla T4,0,true,2,hami-core:GPU-2facdfa8-853c-e117-ed59-f0f55a4d536f,10,15360,100,NVIDIA-Tesla T4,0,true,3,hami-core:
ip-10-0-53-156.us-west-2.compute.internal	GPU-bd5e2639-a535-7cba-f018-d41309048f4e,10,23028,100,NVIDIA-NVIDIA A10G,0,true,0,hami-core:GPU-06f444bc-af98-189a-09b1-d283556db9ef,10,23028,100,NVIDIA-NVIDIA A10G,0,true,1,hami-core:GPU-6385a85d-0ce2-34ea-040d-23c94299db3c,10,23028,100,NVIDIA-NVIDIA A10G,0,true,2,hami-core:GPU-d4acf062-3ba9-8454-2660-aae402f7a679,10,23028,100,NVIDIA-NVIDIA A10G,0,true,3,hami-core:
```

---

## 部署演示工作负载
应用清单（两个 A10G 服务，一个 T4 服务）：
```bash
kubectl apply -f demo/workloads/a10g.yaml
kubectl apply -f demo/workloads/t4.yaml
kubectl get pods -o wide
```
示例输出：
```
NAME                                       READY   STATUS    RESTARTS   AGE    IP            NODE                                        NOMINATED NODE   READINESS GATES
vllm-a10g-mistral7b-awq-5f78b4c6b4-q84k7   1/1     Running   0          172m   10.0.50.145   ip-10-0-53-156.us-west-2.compute.internal   <none>           <none>
vllm-a10g-qwen25-7b-awq-6d5b5d94b-nxrbj    1/1     Running   0          172m   10.0.49.180   ip-10-0-53-156.us-west-2.compute.internal   <none>           <none>
vllm-t4-qwen25-1-5b-55f98dbcf4-mgw8d       1/1     Running   0          117m   10.0.44.2     ip-10-0-38-240.us-west-2.compute.internal   <none>           <none>
vllm-t4-qwen25-1-5b-55f98dbcf4-rn5m4       1/1     Running   0          117m   10.0.37.202   ip-10-0-38-240.us-west-2.compute.internal   <none>           <none>
```

---

## 两个关键注解的作用
在 Pod 模板中，你会看到：
```yaml
metadata:
  annotations:
    nvidia.com/use-gputype: "A10G"   # T4 演示中为 "T4"
    hami.io/gpu-scheduler-policy: "binpack"
```
- `nvidia.com/use-gputype` 会限制调度到指定的 GPU 型号（例如 A10G、T4）。
- `hami.io/gpu-scheduler-policy: binpack` 告知 HAMi，当内存/核心限制允许时，将 Pod 共置在 **同一块物理 GPU**  上（GPU 维度的装箱）。

---

## 显存隔离的请求方式
每个容器通过 HAMi 资源名称设置 GPU 内存限制，以便多个 Pod 能安全共享一块显卡：
- 在 T4 上：`nvidia.com/gpumem: "7500"`（MiB），且有 2 个副本 ⇒ 两者都能在 16 GB 的 T4 上运行。
- 在 A10G 上：每个部署的 `nvidia.com/gpumem-percentage: "45"` ⇒ 两个 Pod 能在 24 GB 的 A10G 上运行。

HAMi 会在容器内部和主机上强制执行这些限制，因此 Pod 不会超出分配的 GPU 内存。

---

## 预期结果：GPU 装箱
- **T4 部署**（`vllm-t4-qwen25-1-5b`，副本数为 2）：两个副本都调度到 T4 节点上的同一块 T4 GPU。
- **A10G 部署**（`vllm-a10g-mistral7b-awq` 和 `vllm-a10g-qwen25-7b-awq`）：两者都部署在 A10G 节点上的同一块 A10G GPU（45% + 45% < 100%）。

---

## 如何验证共置与内存限制
### 容器内验证（`nvidia-smi`）

```bash
# A10G 组
for p in $(kubectl get pods -l app=vllm-a10g-mistral7b-awq -o name; \
           kubectl get pods -l app=vllm-a10g-qwen25-7b-awq -o name); do
  echo "== $p =="
  # 显示 GPU UUID（共置检查）
  kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=uuid --format=csv,noheader
  # 显示容器内的内存限制（总量）和当前使用情况
  kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader
  echo
done
```
**预期**：
- 两个 A10G Pod 会打印 **相同的 GPU UUID**  → 确认 **共置在同一块物理 A10G**  上。
- 每个容器内的 `memory.total` **约为 A10G 显存的 45%** （由于驱动/开销会略少，例如 **约 10,3xx MiB**），且 `memory.used` 保持在该限制以下。

示例输出：
```
== pod/vllm-a10g-mistral7b-awq-5f78b4c6b4-q84k7 ==
GPU-d4acf062-3ba9-8454-2660-aae402f7a679
NVIDIA A10G, 10362 MiB, 7241 MiB

== pod/vllm-a10g-qwen25-7b-awq-6d5b5d94b-nxrbj ==
GPU-d4acf062-3ba9-8454-2660-aae402f7a679
NVIDIA A10G, 10362 MiB, 7355 MiB
```

```bash
# T4 组（同一部署的 2 个副本）
for p in $(kubectl get pods -l app=vllm-t4-qwen25-1-5b -o name); do
  echo "== $p =="
    kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=uuid --format=csv,noheader
    kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader
  echo
done
```
**预期**：
- 两个副本会打印 **相同的 T4 GPU UUID**  → 确认 **共置在同一块 T4** 上。
- `memory.total = 7500 MiB`（来自 `nvidia.com/gpumem: "7500"`），且 `memory.used` 保持在其以下。

示例输出：
```
== pod/vllm-t4-qwen25-1-5b-55f98dbcf4-mgw8d ==
GPU-f8e75627-86ed-f202-cf2b-6363fb18d516
Tesla T4, 7500 MiB, 5111 MiB

== pod/vllm-t4-qwen25-1-5b-55f98dbcf4-rn5m4 ==
GPU-f8e75627-86ed-f202-cf2b-6363fb18d516
Tesla T4, 7500 MiB, 5045 MiB
```

---

## 快速推理检查
在本地端口转发每个服务并发送一个小请求。

### T4 / Qwen2.5‑1.5B
```bash
kubectl port-forward svc/vllm-t4-qwen25-1-5b 8001:8000
```

```bash
curl -s http://127.0.0.1:8001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  --data-binary @- <<'JSON' | jq -r '.choices[0].message.content'
{
  "model": "Qwen/Qwen2.5-1.5B-Instruct",
  "temperature": 0.2,
  "messages": [
    {
      "role": "user",
      "content": "用 2 个要点总结这封邮件，并草拟一句回复：\n\n主题：续费报价和单点登录\n\n嗨，团队，我们需要续费报价，倾向于月度账单，而且我们需要在本月底前完成单点登录。你们能确认时间安排吗？\n\n——亚历克斯"
    }
  ]
}
JSON
```
示例输出：
```
总结：
- 要求提供续费报价，倾向于月度账单。
- 需要在本月底前完成单点登录（SSO）。

回复：
谢谢你，亚历克斯。我会确保续费报价和单点登录请求都能及时处理。我们的目标是在本月底前准备好一切。
```

### A10G / Mistral‑7B‑AWQ
```bash
kubectl port-forward svc/vllm-a10g-mistral7b-awq 8002:8000
curl -s http://127.0.0.1:8002/v1/chat/completions \
  -H 'Content-Type: application/json' \
  --data-binary @- <<'JSON' | jq -r '.choices[0].message.content'
{
  "model": "solidrust/Mistral-7B-Instruct-v0.3-AWQ",
  "temperature": 0.3,
  "messages": [
    {
      "role": "user",
      "content": "写一段 3 句话的每周更新，内容是关于借助内存限制改进 EKS 上的 GPU 共享。受众：非技术高管。"
    }
  ]
}
JSON
```
示例输出：
```
在我们持续优化云资源的过程中，很高兴地宣布，在增强 Amazon Elastic Kubernetes Service（EKS）上的 GPU 共享方面取得了重大进展。通过实施内存限制，我们确保 EKS 上每个支持 GPU 的 Pod 都被分配了一定量的内存，防止过度使用，提高了整体系统效率。此次更新将为我们的 GPU 密集型应用降低成本并提升性能，最终增强我们在市场上的竞争优势。
```

### A10G / Qwen2.5‑7B‑AWQ
```bash
kubectl port-forward svc/vllm-a10g-qwen25-7b-awq 8003:8000
```

```bash
curl -s http://127.0.0.1:8012/v1/chat/completions \
  -H 'Content-Type: application/json' \
  --data-binary @- <<'JSON' | jq -r '.choices[0].message.content'
{
  "model": "Qwen/Qwen2.5-7B-Instruct-AWQ",
  "temperature": 0.2,
  "messages": [
    {
      "role": "user",
      "content": "你是一家电子商务商店的客户支持助理。\n\n任务：\n1) 阅读工单。\n2) 仅返回包含以下字段的有效 JSON：intent（意图）、sentiment（情绪）、order_id（订单号）、item（商品）、eligibility（资格）、next_steps（后续步骤）、customer_reply（客户回复）。\n3) 回复需友好、简洁且注重行动性。\n\n工单：\n\"订单 #A1234 — 你好，我26天前买了一双跑鞋。鞋太小了。可以换成10码吗？我下周末前需要用到。如有差价，我愿意支付。——杰米\""
    }
  ]
}
JSON

```
示例输出：
```
{
  "intent": "请求换货",
  "sentiment": "中性",
  "order_id": "A1234",
  "item": "跑鞋",
  "eligibility": "30天内可换货",
  "next_steps": "我们可以为你更换10码的鞋子。请寄回当前的鞋子，我们会寄出新的。",
  "customer_reply": "谢谢！能请你确认一下邮寄详情吗？"
}
```

---

## 清理环境
```bash
cd infra/aws
terraform destroy -auto-approve
```

---

## 后续内容（系列短文）
- **深入调度：GPU 与节点** 装箱/分散、反亲和性、**NUMA 感知**和**NVLink 感知**部署、UUID 固定。
- **容器级监控**：简单可复现的分配与使用情况检查；可共享的仪表盘。
- **底层原理**：HAMi 调度流程与 HAMi 核心的内存/计算限制（简明深入解析）。
- **DRA**：社区积极开发中的功能；我们将介绍**支持进展与计划**。
- **生态演示**：Kubeflow、vLLM 生产栈、Volcano、Xinference、JupyterHub。（**vLLM 生产栈、Volcano**和**Xinference**已具备原生集成。）


---

HAMi 是异构 AI 计算虚拟化中间件（Heterogeneous AI Computing Virtualization Middleware）的缩写，是一种“一站式”架构，旨在管理 Kubernetes 集群中的异构 AI 计算设备，为异构 AI 设备提供共享能力和任务级资源隔离。HAMi 致力于提高 Kubernetes 集群中异构计算设备的利用率，为不同类型的异构设备提供统一的复用接口。目前，它是 CNCF 沙箱项目，并已被纳入 CNCF CNAI 类别技术图谱。

![p5](/images/blog/PREP-EDU-HAMi/p5.png)

Dynamia 以 CNCF HAMi 为核心基础，提供灵活、可靠、按需、弹性的 GPU 虚拟化和异构计算调度及统一管理全球解决方案。它可以以插件化、轻量级、非侵入的方式部署在任何公有云、私有云或混合云环境中，并支持 NVIDIA、昇腾、沐曦、寒武纪、海光、摩尔线程、壁仞等异构芯片。

> 网站：[https://dynamia.ai](https://dynamia.ai)
> 邮箱：[info@dynamia.ai](mailto:info@dynamia.ai)