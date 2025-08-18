# Helm Values

This document describes the configuration options available for the Speedscale Operator Helm [chart](https://github.com/speedscale/operator-helm). The Speedscale Operator is a Kubernetes operator that watches for deployments and can inject proxies to capture traffic or set up isolation test environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration Reference](#configuration-reference)
  - [Authentication](#authentication)
  - [Core Settings](#core-settings)
  - [Image Configuration](#image-configuration)
  - [Resource Management](#resource-management)
  - [Network Configuration](#network-configuration)
  - [Security Settings](#security-settings)
  - [Advanced Configuration](#advanced-configuration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Kubernetes 1.17+
- Helm 3+
- Appropriate network and firewall configuration for Speedscale cloud and webhook traffic

## Quick Start

```bash
# Add the Speedscale Helm repository
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo update

# Install the chart with required values
helm install speedscale-operator speedscale/speedscale-operator \
  -n speedscale \
  --create-namespace \
  --set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
  --set clusterName=<YOUR-CLUSTER-NAME>
```

## Configuration Reference

### Authentication

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `apiKey` | string | `""` | **Required.** API key to connect to Speedscale cloud. Email support@speedscale.com if you need a key. |
| `apiKeySecret` | string | `""` | Alternative to `apiKey`. Reference a Kubernetes secret containing the API key. The secret must have the format:<br/>```yaml<br/>type: Opaque<br/>data:<br/>  SPEEDSCALE_API_KEY: <base64-encoded-key><br/>  SPEEDSCALE_APP_URL: <base64-encoded-app-url><br/>``` |

### Core Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `appUrl` | string | `"app.speedscale.com"` | Speedscale domain to use for the service. |
| `clusterName` | string | `"my-cluster"` | **Required.** The name of your Kubernetes cluster. Used for identification in the Speedscale dashboard. |
| `logLevel` | string | `"info"` | Log level for Speedscale components. Valid values: `debug`, `info`, `warn`, `error`. |
| `namespaceSelector` | list | `[]` | List of namespace names to be watched by the Speedscale Operator. If empty, all namespaces are watched. |
| `dashboardAccess` | bool | `true` | Instructs the operator to deploy resources necessary to interact with your cluster from the Speedscale dashboard. |
| `filterRule` | string | `"standard"` | Filter rule to apply to the Speedscale Forwarder. |

### Image Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image.registry` | string | `"gcr.io/speedscale"` | Container registry for Speedscale components. |
| `image.tag` | string | `"v2.3.709"` | Image tag for Speedscale components. |
| `image.pullPolicy` | string | `"Always"` | Image pull policy. Valid values: `Always`, `IfNotPresent`, `Never`. |

### Resource Management

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `operator.resources.limits.cpu` | string | `"500m"` | CPU limit for the operator pod. |
| `operator.resources.limits.memory` | string | `"512Mi"` | Memory limit for the operator pod. |
| `operator.resources.requests.cpu` | string | `"100m"` | CPU request for the operator pod. |
| `operator.resources.requests.memory` | string | `"128Mi"` | Memory request for the operator pod. |
| `operator.test_prep_timeout` | string | `"10m"` | Timeout for waiting for the System Under Test (SUT) to become ready. |
| `operator.control_plane_timeout` | string | `"5m"` | Timeout for deploying and upgrading control plane components. |

### Network Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hostNetwork` | bool | `false` | If true, the operator pod and webhooks will run on the host network. Only needed if the control plane cannot connect directly to pods (e.g., when using Calico as EKS's default networking). |
| `http_proxy` | string | `""` | HTTP proxy URL for outbound connections. Translates to `HTTP_PROXY` environment variable. |
| `https_proxy` | string | `""` | HTTPS proxy URL for outbound connections. Translates to `HTTPS_PROXY` environment variable. |
| `no_proxy` | string | `""` | Comma-separated list of hosts that should not use the proxy. Translates to `NO_PROXY` environment variable. |

### Security Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `privilegedSidecars` | bool | `false` | Controls whether sidecar init containers should run with privileged mode enabled. |
| `createJKS` | bool | `true` | Controls a pre-install job that creates a JKS with standard certificates and the Speedscale certificate. This job requires a root container user. Disable if security policies forbid `runAsNonRoot: true`. |
| `disableSidecarSmartReverseDNS` | bool | `false` | Controls whether the sidecar should disable the smart DNS lookup feature (requires `NET_ADMIN` capability). |

### Advanced Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `deployDemo` | string | `"java"` | Deploy a demo app at startup. Valid values: `"java"` or `""` (empty string to disable). |
| `globalAnnotations` | object | `{}` | Set of annotations to be applied to all Speedscale-related deployments, services, jobs, pods, etc. |
| `globalLabels` | object | `{}` | Set of labels to be applied to all Speedscale-related deployments, services, jobs, pods, etc. |
| `affinity` | object | `{}` | Full affinity object for pod scheduling. See [Kubernetes affinity documentation](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity). |
| `tolerations` | list | `[]` | List of tolerations for pod scheduling. See [Kubernetes tolerations documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/). |
| `nodeSelector` | object | `{}` | Node selector object for pod scheduling. See [Kubernetes node selector documentation](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/). |

### Data Loss Prevention (DLP)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dlp.enabled` | bool | `false` | Instructs the operator to enable data loss prevention features. |
| `dlp.config` | string | `"standard"` | Configuration for data loss prevention. |

### Sidecar Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sidecar.resources.limits.cpu` | string | `"500m"` | CPU limit for sidecar containers. |
| `sidecar.resources.limits.memory` | string | `"512Mi"` | Memory limit for sidecar containers. |
| `sidecar.resources.limits.ephemeral-storage` | string | `"100Mi"` | Ephemeral storage limit for sidecar containers. |
| `sidecar.resources.requests.cpu` | string | `"10m"` | CPU request for sidecar containers. |
| `sidecar.resources.requests.memory` | string | `"32Mi"` | Memory request for sidecar containers. |
| `sidecar.resources.requests.ephemeral-storage` | string | `"100Mi"` | Ephemeral storage request for sidecar containers. |
| `sidecar.ignore_src_hosts` | string | `""` | Comma-separated list of source hosts to ignore. |
| `sidecar.ignore_src_ips` | string | `""` | Comma-separated list of source IP addresses to ignore. |
| `sidecar.ignore_dst_hosts` | string | `""` | Comma-separated list of destination hosts to ignore. |
| `sidecar.ignore_dst_ips` | string | `""` | Comma-separated list of destination IP addresses to ignore. |
| `sidecar.insert_init_first` | bool | `false` | Whether to insert the init container first in the pod. |
| `sidecar.tls_out` | bool | `false` | Whether to enable TLS outbound traffic interception. |
| `sidecar.reinitialize_iptables` | bool | `false` | Whether to reinitialize iptables rules. |

### Forwarder Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `forwarder.resources.limits.cpu` | string | `"500m"` | CPU limit for forwarder containers. |
| `forwarder.resources.limits.memory` | string | `"500M"` | Memory limit for forwarder containers. |
| `forwarder.resources.requests.cpu` | string | `"300m"` | CPU request for forwarder containers. |
| `forwarder.resources.requests.memory` | string | `"250M"` | Memory request for forwarder containers. |

## Examples

### Basic Installation

```yaml
# values-basic.yaml
apiKey: "your-api-key-here"
clusterName: "production-cluster"
logLevel: "info"
```

```bash
helm install speedscale-operator speedscale/speedscale-operator \
  -n speedscale \
  --create-namespace \
  -f values-basic.yaml
```

### Production Configuration

```yaml
# values-production.yaml
apiKey: "your-api-key-here"
clusterName: "production-cluster"
logLevel: "warn"
namespaceSelector:
  - "app-namespace"
  - "api-namespace"

# Resource limits
operator:
  resources:
    limits:
      cpu: "1000m"
      memory: "1Gi"
    requests:
      cpu: "200m"
      memory: "256Mi"

# Security settings
privilegedSidecars: false
createJKS: true
disableSidecarSmartReverseDNS: false

# Network settings
hostNetwork: false
dashboardAccess: true

# Global annotations and labels
globalAnnotations:
  environment: "production"
  team: "platform"
globalLabels:
  app.kubernetes.io/part-of: "speedscale"
  app.kubernetes.io/component: "operator"
```

### Development Configuration

```yaml
# values-development.yaml
apiKey: "your-api-key-here"
clusterName: "dev-cluster"
logLevel: "debug"
deployDemo: "java"

# Resource limits (lower for development)
operator:
  resources:
    limits:
      cpu: "250m"
      memory: "256Mi"
    requests:
      cpu: "50m"
      memory: "64Mi"

# Enable demo app
deployDemo: "java"

# Global labels
globalLabels:
  environment: "development"
  team: "dev"
```

### Custom Sidecar Configuration

```yaml
# values-sidecar.yaml
apiKey: "your-api-key-here"
clusterName: "my-cluster"

# Custom sidecar settings
sidecar:
  resources:
    limits:
      cpu: "750m"
      memory: "1Gi"
      ephemeral-storage: "200Mi"
    requests:
      cpu: "50m"
      memory: "128Mi"
      ephemeral-storage: "100Mi"
  ignore_src_hosts: "internal-service.example.com,metrics.example.com"
  ignore_dst_hosts: "external-api.example.com"
  ignore_src_ips: "10.0.0.1,10.0.0.2"
  ignore_dst_ips: "8.8.8.8,1.1.1.1"
  insert_init_first: true
  tls_out: true
  reinitialize_iptables: false
```

## Troubleshooting

### Common Issues

#### Pre-install Job Failure

If the pre-install job fails during installation, you'll see:

```
Error: INSTALLATION FAILED: failed pre-install: job failed: BackoffLimitExceeded
```

**Solution:**
1. Inspect the logs:
   ```bash
   kubectl -n speedscale logs job/speedscale-operator-pre-install
   ```

2. Uninstall and retry:
   ```bash
   helm -n speedscale uninstall speedscale-operator
   kubectl -n speedscale delete job speedscale-operator-pre-install
   helm install speedscale-operator speedscale/speedscale-operator \
     -n speedscale \
     --create-namespace \
     --set apiKey=<YOUR-API-KEY> \
     --set clusterName=<YOUR-CLUSTER-NAME>
   ```

#### API Key Issues

- Ensure your API key is valid and active
- Check that the `clusterName` is unique across your Speedscale account
- Verify network connectivity to `app.speedscale.com`

#### Resource Constraints

If pods are failing to start due to resource constraints:

1. Check available resources on your nodes
2. Adjust resource requests/limits in the values
3. Consider scaling your cluster

#### Network Issues

If using Calico networking on EKS:

```yaml
hostNetwork: true
```

### Upgrading

After upgrading the chart, restart workloads to pick up the latest sidecar:

```bash
kubectl -n <namespace> rollout restart deployment
```

**Note:** CRDs are not updated by default. Update them manually if needed.

### Support

- Documentation: [docs.speedscale.com](https://docs.speedscale.com)
- Community: [Speedscale Community Slack](https://join.slack.com/t/speedscalecommunity/shared_invite/zt-x5rcrzn4-XHG1QqcHNXIM~4yozRrz8A)
- Support: support@speedscale.com

## Related Documentation

- [Speedscale Operator Overview](https://github.com/speedscale/operator-helm)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
