---
title: "Virtualizing Any GPU on AWS with HAMi: Free Memory Isolation"
coverTitle: "Virtualizing Any GPU on AWS with HAMi: Free Memory Isolation"
slug: "virtualizing-gpu-aws-hami-free-memory-isolation"
date: "2025-09-16"
excerpt: "This article takes the PR as an entry point, combined with community Issues and mailing records, to fully restore a 'HAMi × vLLM' landing path from deployment to verification, helping you quickly achieve multi-model deployment and resource reuse in Kubernetes."
author: "Dynamia"
tags: ["HAMi", "GPU Virtualization", "AWS", "Kubernetes", "vLLM", "GPU Memory Isolation", "Multi-Model Inference", "Cloud AI", "GPU Binpacking", "EKS", "Terraform", "AI Infrastructure"]
coverImage: "/images/blog/Demystifying-the-Reservation-Pod/cover.jpg"
language: "en"
---

# Virtualizing Any GPU on AWS with HAMi: Free Memory Isolation

**TL;DR:** This guide spins up an AWS EKS cluster with two GPU node groups (T4 and A10G), installs HAMi automatically, and deploys three vLLM services that share a single physical GPU per node using free memory isolation. You’ll see GPU‑dimension binpack in action: multiple Pods co‑located on the same GPU when limits allow.

---

## Why HAMi on AWS?

HAMi brings GPU‑model‑agnostic virtualization to Kubernetes — spanning consumer‑grade to data‑center GPUs. On AWS, that means you can take common NVIDIA instances (e.g.,  **g4dn.12xlarge**  with T4s,  **g5.12xlarge**  with A10Gs), and then  **slice GPU memory**  to safely pack multiple Pods on a single card — no app changes required.

**In this demo:**
- **Two node** s: one T4 node, one A10G node (each with 4 GPUs).
- **HAMi**  is installed via Helm as part of the Terraform apply.
- **vLLM**  workloads request fractions of GPU memory so two Pods can run on one GPU.

---

## One‑Click Setup
**Repo:** [github.com/dynamia-ai/hami-ecosystem-demo](https://github.com/dynamia-ai/hami-ecosystem-demo)

### 0) Prereqs
- Terraform or OpenTofu
- AWS CLI v2 (and `aws sts get-caller-identity` succeeds)
- kubectl, jq

### 1) Provision AWS + Install HAMi
```bash
git clone https://github.com/dynamia-ai/hami-ecosystem-demo.git
cd infra/aws
terraform init
terraform apply -auto-approve
```
When finished, configure kubectl using the output:
```bash
terraform output -raw kubectl_config_command
# Example:
# aws eks update-kubeconfig --region us-west-2 --name hami-demo-aws
```

### 2) Verify Cluster & HAMi
Check that HAMi components are running:
```bash
kubectl get pods -n kube-system | grep -i hami
```
Example output:
```
hami-device-plugin-mtkmg             2/2     Running   0          3h6m
hami-device-plugin-sg5wl             2/2     Running   0          3h6m
hami-scheduler-574cb577b9-p4xd9      2/2     Running   0          3h6m
```
List registered GPUs per node (HAMi annotates nodes with inventory):
```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}\t{.metadata.annotations.hami\\.io/node-nvidia-register}\n{end}'
```
Example output:
```
ip-10-0-38-240.us-west-2.compute.internal	GPU-f8e75627-86ed-f202-cf2b-6363fb18d516,10,15360,100,NVIDIA-Tesla T4,0,true,0,hami-core:GPU-7f2003cf-a542-71cf-121f-0e489699bbcf,10,15360,100,NVIDIA-Tesla T4,0,true,1,hami-core:GPU-90e2e938-7ac3-3b5e-e9d2-94b0bd279cf2,10,15360,100,NVIDIA-Tesla T4,0,true,2,hami-core:GPU-2facdfa8-853c-e117-ed59-f0f55a4d536f,10,15360,100,NVIDIA-Tesla T4,0,true,3,hami-core:
ip-10-0-53-156.us-west-2.compute.internal	GPU-bd5e2639-a535-7cba-f018-d41309048f4e,10,23028,100,NVIDIA-NVIDIA A10G,0,true,0,hami-core:GPU-06f444bc-af98-189a-09b1-d283556db9ef,10,23028,100,NVIDIA-NVIDIA A10G,0,true,1,hami-core:GPU-6385a85d-0ce2-34ea-040d-23c94299db3c,10,23028,100,NVIDIA-NVIDIA A10G,0,true,2,hami-core:GPU-d4acf062-3ba9-8454-2660-aae402f7a679,10,23028,100,NVIDIA-NVIDIA A10G,0,true,3,hami-core:
```

---

## Deploy the Demo Workloads
Apply the manifests (two A10G services, one T4 service):
```bash
kubectl apply -f demo/workloads/a10g.yaml
kubectl apply -f demo/workloads/t4.yaml
kubectl get pods -o wide
```
Example output:
```
NAME                                       READY   STATUS    RESTARTS   AGE    IP            NODE                                        NOMINATED NODE   READINESS GATES
vllm-a10g-mistral7b-awq-5f78b4c6b4-q84k7   1/1     Running   0          172m   10.0.50.145   ip-10-0-53-156.us-west-2.compute.internal   <none>           <none>
vllm-a10g-qwen25-7b-awq-6d5b5d94b-nxrbj    1/1     Running   0          172m   10.0.49.180   ip-10-0-53-156.us-west-2.compute.internal   <none>           <none>
vllm-t4-qwen25-1-5b-55f98dbcf4-mgw8d       1/1     Running   0          117m   10.0.44.2     ip-10-0-38-240.us-west-2.compute.internal   <none>           <none>
vllm-t4-qwen25-1-5b-55f98dbcf4-rn5m4       1/1     Running   0          117m   10.0.37.202   ip-10-0-38-240.us-west-2.compute.internal   <none>           <none>
```

---

## What the Two Key Annotations Do
In the Pod templates you’ll see:
```yaml
metadata:
  annotations:
    nvidia.com/use-gputype: "A10G"   # or "T4" on the T4 demo
    hami.io/gpu-scheduler-policy: "binpack"
```
- `nvidia.com/use-gputype` restricts scheduling to the named GPU model (e.g., A10G, T4).
- `hami.io/gpu-scheduler-policy: binpack` tells HAMi to co‑locate Pods on the  **same physical GPU**  when memory/core limits permit (GPU‑dimension binpack).

---

## How the Memory Isolation is Requested
Each container sets GPU memory limits via HAMi resource names so multiple Pods can safely share one card:
- On T4: `nvidia.com/gpumem: "7500"` (MiB) with 2 replicas ⇒ both fit on a 16 GB T4.
- On A10G: `nvidia.com/gpumem-percentage: "45"` for each Deployment ⇒ two Pods fit on a 24 GB A10G.

HAMi enforces these limits inside the container and on the host, so Pods can’t exceed their assigned GPU memory.

---

## Expected Results: GPU Binpack
- **T4 deployment** (`vllm-t4-qwen25-1-5b` with replicas: 2): both replicas are scheduled to the same T4 GPU on the T4 node.
- **A10G deployments** (`vllm-a10g-mistral7b-awq` and `vllm-a10g-qwen25-7b-awq`): both land on the same A10G GPU on the A10G node (45% + 45% < 100%).

---

## How to Verify Co‑location & Memory Caps
### In‑pod verification (`nvidia-smi`)

```bash
#A10G pair
for p in $(kubectl get pods -l app=vllm-a10g-mistral7b-awq -o name; \
           kubectl get pods -l app=vllm-a10g-qwen25-7b-awq -o name); do
  echo "== $p =="
  # Show the GPU UUID (co‑location check)
  kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=uuid --format=csv,noheader
  # Show memory cap (total) and current usage inside the container view
  kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader
  echo
done
```
**Expected:**
- The two A10G Pods print the **same GPU UUID**  → confirms **co‑location on the same physical A10G** .
- `memory.total` inside each container **≈ 45% of A10G VRAM**  (slightly less due to driver/overhead; e.g., **~10,3xx MiB**), and `memory.used` stays below that cap.

Example output:
```
== pod/vllm-a10g-mistral7b-awq-5f78b4c6b4-q84k7 ==
GPU-d4acf062-3ba9-8454-2660-aae402f7a679
NVIDIA A10G, 10362 MiB, 7241 MiB

== pod/vllm-a10g-qwen25-7b-awq-6d5b5d94b-nxrbj ==
GPU-d4acf062-3ba9-8454-2660-aae402f7a679
NVIDIA A10G, 10362 MiB, 7355 MiB
```

```bash
# T4 pair (2 replicas of the same Deployment)
for p in $(kubectl get pods -l app=vllm-t4-qwen25-1-5b -o name); do
  echo "== $p =="
    kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=uuid --format=csv,noheader
    kubectl exec ${p#pod/} -- nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader
  echo
done
```
**Expected:**
- Both replicas print the **same T4 GPU UUID**  → confirms **co‑location on the same T4**.
- `memory.total = 7500 MiB` (from `nvidia.com/gpumem: "7500"`) and `memory.used` stays under it.

Example output:
```
== pod/vllm-t4-qwen25-1-5b-55f98dbcf4-mgw8d ==
GPU-f8e75627-86ed-f202-cf2b-6363fb18d516
Tesla T4, 7500 MiB, 5111 MiB

== pod/vllm-t4-qwen25-1-5b-55f98dbcf4-rn5m4 ==
GPU-f8e75627-86ed-f202-cf2b-6363fb18d516
Tesla T4, 7500 MiB, 5045 MiB
```

---

## Quick Inference Checks
Port‑forward each service locally and send a tiny request.

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
      "content": "Summarize this email in 2 bullets and draft a one-sentence reply:\n\nSubject: Renewal quote & SSO\n\nHi team, we want a renewal quote, prefer monthly billing, and we need SSO by the end of the month. Can you confirm timeline?\n\n— Alex"
    }
  ]
}
JSON
```
Example output:
```
Summary:
- Request for renewal quote with preference for monthly billing.
- Need Single Sign-On (SSO) by the end of the month.

Reply:
Thank you, Alex. I will ensure that both the renewal quote and SSO request are addressed promptly. We aim to have everything ready before the end of the month.
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
      "content": "Write a 3-sentence weekly update about improving GPU sharing on EKS with memory capping. Audience: non-technical executives."
    }
  ]
}
JSON
```
Example output:
```
In our ongoing efforts to optimize cloud resources, we're pleased to announce significant progress in enhancing GPU sharing on Amazon Elastic Kubernetes Service (EKS). By implementing memory capping, we're ensuring that each GPU-enabled pod on EKS is allocated a defined amount of memory, preventing overuse and improving overall system efficiency. This update will lead to reduced costs and improved performance for our GPU-intensive applications, ultimately boosting our competitive edge in the market.
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
      "content": "You are a customer support assistant for an e-commerce store.\n\nTask:\n1) Read the ticket.\n2) Return ONLY valid JSON with fields: intent, sentiment, order_id, item, eligibility, next_steps, customer_reply.\n3) Keep the reply friendly, concise, and action-oriented.\n\nTicket:\n\"Order #A1234 — Hi, I bought running shoes 26 days ago. They’re too small. Can I exchange for size 10? I need them before next weekend. Happy to pay the price difference if needed. — Jamie\""
    }
  ]
}
JSON
```
Example output:
```
{
  "intent": "Request for exchange",
  "sentiment": "Neutral",
  "order_id": "A1234",
  "item": "Running shoes",
  "eligibility": "Eligible for exchange within 30 days",
  "next_steps": "We can exchange your shoes for size 10. Please ship back the current pair and we'll send the new ones.",
  "customer_reply": "Thank you! Can you please confirm the shipping details?"
}
```

---

## Clean Up
```bash
cd infra/aws
terraform destroy -auto-approve
```

---

## Coming next (mini-series)
- **Deeper scheduling: GPU & Node**  binpack/spread, anti‑affinity, **NUMA‑aware**  and **NVLink‑aware**  placement, UUID pinning.
- **Container‑level monitoring** : simple, reproducible checks for allocation & usage; shareable dashboards.
- **Under the hood** : HAMi scheduling flow & HAMi‑core memory/compute capping (concise deep dive).
- **DRA** : community feature under active development; we’ll cover **support progress & plan** .
- **Ecosystem demos** : Kubeflow, vLLM Production Stack, Volcano, Xinference, JupyterHub. (**vLLM Production Stack, Volcano** , and **Xinference**  already have native integrations.)


---

HAMi, short for Heterogeneous AI Computing Virtualization Middleware, is a “one-stop” architecture designed to manage heterogeneous AI computing devices in Kubernetes clusters, providing sharing capabilities and task-level resource isolation for heterogeneous AI devices. HAMi is committed to improving the utilization of heterogeneous computing devices in Kubernetes clusters, providing a unified reuse interface for different types of heterogeneous devices. Currently, it is a CNCF Sandbox project and has been included in the CNCF CNAI category technology landscape.

![p5](/images/blog/PREP-EDU-HAMi/p5.png)

Dynamia focuses on CNCF HAMi as the core foundation, providing flexible, reliable, on-demand, and elastic GPU virtualization and heterogeneous computing scheduling, and unified management global solutions. It can be deployed in a plug-in, lightweight, non-intrusive way in any public cloud, private cloud, or hybrid cloud environment, and supports heterogeneous chips such as NVIDIA, Ascend, Muxi, Cambricon, Hygon, Moore Threads, and Biren.

> Website: [https://dynamia.ai](https://dynamia.ai)
> Email: [info@dynamia.ai](mailto:info@dynamia.ai)