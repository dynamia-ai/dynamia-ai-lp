# Dynamia AI Landing Page Helm Chart

This Helm chart deploys the Dynamia AI Landing Page application on a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Ingress controller (e.g., NGINX)
- Cert-manager (for TLS)

## Installing the Chart

```bash
# Add image pull secret for GitHub Container Registry
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL

# Install the chart
helm install dynamia-ai-lp ./charts/dynamia-ai-lp
```

## Configuration

The following table lists the configurable parameters of the chart and their default values.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `ghcr.io/dynamia-ai/dynamia-ai-lp` |
| `image.tag` | Image tag | `latest` |
| `imagePullSecrets` | Image pull secrets | `[{name: ghcr-secret}]` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `3000` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.hosts` | Ingress hosts | `[{host: landing.dynamia-ai.com, paths: [{path: /, pathType: Prefix}]}]` |
| `resources` | Resource limits and requests | Check `values.yaml` |
| `autoscaling.enabled` | Enable autoscaling | `true` |
| `env` | Environment variables | Check `values.yaml` |

## Upgrading

```bash
helm upgrade dynamia-ai-lp ./charts/dynamia-ai-lp
```

## Uninstalling

```bash
helm uninstall dynamia-ai-lp
``` 