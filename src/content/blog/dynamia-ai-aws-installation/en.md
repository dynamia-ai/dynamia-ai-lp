---
title: "Deploy Dynamia AI Platform on AWS with EKS"
slug: "deploy-dynamia-ai-aws"
date: "2025-09-26"
excerpt: "Follow this battle-tested checklist to prepare IAM, install cluster add-ons, and roll out the Dynamia AI Platform on Amazon EKS in about an hour."
# TODO: Confirm author attribution before publishing
author: "Dynamia AI Team"
tags: ["Dynamia AI Platform", "AWS", "EKS", "Helm", "HAMi", "NVIDIA"]
coverImage: "/images/blog/aws/aws-install-coverpage.png"
language: "en"
aiRepostLinks:
  - label: "ChatGPT Summary"
    description: "AI-generated highlights of this deployment guide"
    url: "https://chat.openai.com/"
    icon: "chatgpt"
  - label: "Claude Recap"
    description: "Quick take from Claude on AWS setup steps"
    url: "https://claude.ai/"
    icon: "claude"
  - label: "Gemini Notes"
    description: "Google Gemini walkthrough and reminders"
    url: "https://gemini.google.com/"
    icon: "gemini"
---
# Dynamia AI Platform AWS Installation Guide

Use this guide to deploy Dynamia AI Platform on AWS, including the required IAM role, supporting components, and Helm charts.

---

## Step 1. Prepare Prerequisites

Before you start, confirm you have the following in place. If you still need to install any component, use the linked instructions.

- An Amazon EKS cluster running Kubernetes 1.31 or later ([create an EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html)). Ensure the following add-ons are installed and healthy:
  - `kube-proxy`
  - `cert-manager`
  - `metrics-server`
  - `Amazon EKS Pod Identity Agent`
  - `Amazon VPC CNI`
- `kubectl` configured for that cluster ([install kubectl](https://kubernetes.io/docs/tasks/tools/))
- `eksctl` version 0.32.0 or later ([install eksctl](https://eksctl.io/installation/))
- AWS CLI configured with IAM permissions to create policies and service accounts ([install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- An OIDC identity provider already associated with the cluster ([associate an OIDC provider](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html))
- Helm version 3.6.0 or later ([install Helm](https://helm.sh/docs/intro/install/))

Verify your CLI setup:

```bash
# Confirms kubectl is installed 
kubectl version 

# Confirms the AWS CLI is installed and your credentials work.
aws --version
aws sts get-caller-identity

# Expected: 0.32.0 or later
eksctl version
```

Run `eksctl get addons --cluster <your-cluster-name>` and confirm the add-ons listed above are present and report `ACTIVE` status before continuing. Such as

```bash
~ $ eksctl get addons --cluster <your-cluster-name>
NAME                    VERSION                 STATUS  ISSUES  IAMROLE UPDATE AVAILABLE                                                                                                                        CONFIGURATION VALUES    NAMESPACE       POD IDENTITY ASSOCIATION ROLES
cert-manager            v1.18.2-eksbuild.2      ACTIVE  0                                                                                                                                                                               cert-manager
eks-pod-identity-agent  v1.3.8-eksbuild.2       ACTIVE  0                                                                                                                                                                               kube-system
kube-proxy              v1.33.0-eksbuild.2      ACTIVE  0               v1.33.3-eksbuild.6,v1.33.3-eksbuild.4                                                                                                                           kube-system
metrics-server          v0.8.0-eksbuild.2       ACTIVE  0                                                                                                                                                                               kube-system
vpc-cni                 v1.19.5-eksbuild.1      ACTIVE  0               v1.20.2-eksbuild.1,v1.20.1-eksbuild.3,v1.20.1-eksbuild.1,v1.20.0-eksbuild.1,v1.19.6-eksbuild.7,v1.19.6-eksbuild.1,v1.19.5-eksbuild.3                            kube-system     arn:aws:iam::265950574560:role/AmazonEKSPodIdentityAmazonVPCCNIRole

```

## Step 2. Configure IAM Access

Choose the namespace where Dynamia AI Platform will run. The default is `hami-system`. If you select a different namespace, replace it in all following commands.

### 2.1 Associate the OIDC identity provider (run once per cluster)

```bash
eksctl utils associate-iam-oidc-provider --cluster <your-cluster-name> --approve
```

### 2.2 Create a custom IAM policy

```bash
cat > custom-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "license-manager:CheckoutLicense",
        "license-manager:GetLicenseUsage",
        "license-manager:CheckInLicense",
        "license-manager:ExtendLicenseConsumption"
      ],
      "Resource": "*"
    }
  ]
}
JSON

aws iam create-policy \
  --policy-name DynamiaPlatformPolicy \
  --policy-document file://custom-policy.json
```

### 2.3 Create the IAM service account

```bash
eksctl create iamserviceaccount \
  --cluster=<your-cluster-name> \
  --namespace=hami-system \
  --name=dynamia-sa \
  --attach-policy-arn=arn:aws:iam::<YOUR-ACCOUNT-ID>:policy/DynamiaPlatformPolicy \
  --approve
```

## Step 3. Install Cluster Dependencies

Dynamia AI Platform relies on several open-source components. Install them before deploying the platform charts.

### 3.1 Prometheus Stack

```bash
helm install prometheus \
  oci://ghcr.io/prometheus-community/charts/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### 3.2 Envoy Gateway

```bash
helm install eg \
  oci://docker.io/envoyproxy/gateway-helm \
  --version v1.5.0 \
  --namespace envoy-gateway-system \
  --create-namespace
```

### 3.3 cert-manager

Install cert-manager from the EKS console under **Cluster → Add-ons → Community add-ons**, or follow the [AWS documentation](https://docs.aws.amazon.com/eks/latest/userguide/lbc-manifest.html#lbc-cert).

### 3.4 (Optional) DCGM exporter for NVIDIA GPU nodes

```bash
helm repo add gpu-helm-charts https://nvidia.github.io/dcgm-exporter/helm-charts
helm repo update
helm install dcgm-exporter \
  gpu-helm-charts/dcgm-exporter \
  --namespace gpu-operator \
  --create-namespace

kubectl label node <YOUR-NVIDIA-NODE> gpu=on
```

### Verify dependency readiness

Ensure the supporting namespaces and workloads are healthy before moving on to Step 4.

```bash
kubectl get ns monitoring envoy-gateway-system
helm list -n monitoring
helm list -n envoy-gateway-system
kubectl get pods -n monitoring
kubectl get pods -n envoy-gateway-system
```

If you installed the optional GPU exporter, also verify the GPU namespace:

```bash
kubectl get pods -n gpu-operator
```

Continue only after the pods report `Running` or `Completed` statuses.

## Step 4. Deploy Dynamia AI Platform

### 4.1 Install HAMi

```bash
export HELM_EXPERIMENTAL_OCI=1

aws ecr get-login-password --region us-east-1 \
  | helm registry login \
    --username AWS \
    --password-stdin 709825985650.dkr.ecr.us-east-1.amazonaws.com

rm -rf hami-chart && mkdir hami-chart && cd hami-chart
helm pull oci://709825985650.dkr.ecr.us-east-1.amazonaws.com/dynamia-intelligence/dynamia-ai-hami --version 1.0.1
tar xf dynamia-ai-hami-1.0.1.tgz
helm install hami ./dynamia-ai-hami --namespace hami-system --create-namespace
```

### Verify HAMi

Check that the base release is installed, the workloads are healthy, and GPU nodes are being prepared.

```bash
helm list -n hami-system
kubectl get pods -n hami-system
```

The pods should report `Running` or `Completed`. Then verify the node annotations and GPU resources:

```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}	{.metadata.annotations.hami\.io/node-handshake:-missing}	{.metadata.annotations.hami\.io/node-nvidia-register:-missing}	{.status.allocatable.nvidia\.com/gpu:-0}{"\n"}{end}'
# Expect non-empty handshake and nvidia-register annotations on GPU nodes, and GPU capacity values.

# Inspect any node in detail if needed.
kubectl describe node <gpu-node-name> | grep -E 'hami.io/node-(handshake|nvidia-register)|nvidia.com/gpu'
```

Proceed once the annotations are present and GPU capacity is reported.

### 4.2 Install platform components

```bash
# If the registry login from the previous step has expired, run it again before continuing.

export DYNAMIA_VERSION=0.4.4
rm -rf dynamia-chart && mkdir dynamia-chart && cd dynamia-chart
helm pull oci://709825985650.dkr.ecr.us-east-1.amazonaws.com/dynamia-intelligence/dynamia-ai --version "$DYNAMIA_VERSION"
tar xf "dynamia-ai-${DYNAMIA_VERSION}.tgz"
helm install dynamia ./dynamia-ai --namespace dynamia-system --create-namespace
```

### Verify platform component deployment

Confirm the platform release is installed and pods are healthy before moving on.

```bash
helm list -n dynamia-system
kubectl get pods -n dynamia-system
```

Proceed once the pods report `Running` or `Completed`.

## Step 5. Access the Platform

List the services to identify the Envoy load balancer name, then retrieve its hostname.

```bash
kubectl get service -n envoy-gateway-system

kubectl get service \
  -n envoy-gateway-system \
  <envoy-service-name> \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Open the hostname in a browser to reach the Dynamia AI Platform UI.

---

Need help? Reach us at <info@dynamia.ai> with any questions about this guide.
