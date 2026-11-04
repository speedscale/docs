---
title: Install the standard Kubernetes operator
sidebar_label: Standard operator
description: "Install and verify the Speedscale Kubernetes operator with Helm, speedctl, Argo CD, or rendered manifests."
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import AgentInstall from './_agent_install.mdx';

# Install the standard Kubernetes operator

The Speedscale operator runs in your cluster and manages the components used to capture and replay traffic. This installation creates cluster-scoped RBAC, a Speedscale CRD, and admission webhooks. If your installer can write only in one existing namespace, use the [namespace-scoped installation](./kubernetes-namespaced.md). See [Kubernetes installation options](./kubernetes.md) to compare both modes.

## Prerequisites

- A Kubernetes cluster and `kubectl` access with permission to install cluster-scoped resources.
- A service account API key from [Tenant Settings](https://app.speedscale.com/tenant). Ask a tenant administrator to create one if needed.
- [Helm 3](https://helm.sh/docs/intro/install/) for the Helm and rendered-manifest methods, or [speedctl](./cli.md) for the CLI method.
- The network access described in [Evaluation prerequisites](../../evaluation.md).

Check [platform requirements](./kubernetes.md#check-your-platform-requirements) before installing on OpenShift, GKE Autopilot, EKS Auto Mode, or a cluster running Istio. The Helm and manifest examples below enable eBPF capture; confirm the [eBPF system requirements](/reference/ebpf-traffic-collection#system-requirements) first. Use the platform-specific values where required.

## Install with your coding agent {#install-with-ai-agent}

<AgentInstall />

## Retrieve your API key

For manual installation, use a service account API key so the cluster's access is independent of an employee's account. With the Helm, Argo CD, and rendered-manifest methods, create the namespace and load the key from a protected file into a Secret. Write the file without a trailing newline, for example `printf %s "$KEY" > /secure/path/to/key`; a newline becomes part of the key and authentication fails:

```bash
kubectl create namespace speedscale
kubectl -n speedscale create secret generic speedscale-apikey \
  --from-file=SPEEDSCALE_API_KEY=/secure/path/to/key \
  --from-literal=SPEEDSCALE_APP_URL=app.speedscale.com
```

If the namespace or Secret already exists, use your platform's provisioning process to manage it. For `speedctl install`, supply the service account key when prompted by the wizard.

## Choose an installation method {#install-method}

For Helm and rendered manifests, add the public chart repository:

```bash
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo update
```

Create `speedscale-values.yaml` with your cluster name and any required platform settings. The key itself stays in the Secret:

```yaml
apiKeySecret: speedscale-apikey
clusterName: YOUR-CLUSTER-NAME
ebpf:
  enabled: true
```

Use `ebpf.enabled: false` if your cluster cannot run eBPF and follow the [sidecar fallback](../sidecar/install.md). Review the chart's [install and upgrade lifecycle](/reference/helm#install-and-upgrade-lifecycle) for resource ownership, hooks, and CRD handling.

<Tabs groupId="kubernetes-install-method" queryString="method">
<TabItem value="helm" label="Helm" default>

Install with the values file:

```bash
helm install speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale \
  --values speedscale-values.yaml
```

Keep this values file for upgrades. See the [Helm values reference](/reference/helm) for additional configuration.

</TabItem>
<TabItem value="cli" label="speedctl">

[Install speedctl](./cli.md), then run:

```bash
speedctl install
```

Choose **Kubernetes** and follow the prompts. This wizard is available on macOS, Linux, and Windows. After installation, follow [Enable eBPF capture](/reference/ebpf-traffic-collection#installation), or use the [sidecar fallback](../sidecar/install.md) if your cluster cannot run eBPF.

### Image pull secrets {#optional-adding-image-pull-secrets}

If your images require existing image pull Secrets, pass their names to the wizard:

```bash
speedctl install --imgpullsecrets my-secret1,my-secret2
```

</TabItem>
<TabItem value="argocd" label="Argo CD">

Create the API key Secret in the destination cluster before syncing the application. If Argo CD creates the namespace, add `CreateNamespace=true` to `syncPolicy.syncOptions`, and make sure the Secret (for example a SealedSecret or ExternalSecret) syncs before this Application, such as in an earlier sync wave, because the operator needs it at startup. Apply the same cluster name and platform values to `source.helm.values`. Set `targetRevision` to the chart version you reviewed in the [Helm repository](https://github.com/speedscale/operator-helm/blob/main/README.md).

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: speedscale-operator
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://speedscale.github.io/operator-helm/
    targetRevision: YOUR-CHART-VERSION
    chart: speedscale-operator
    helm:
      values: |-
        apiKeySecret: speedscale-apikey
        clusterName: YOUR-CLUSTER-NAME
        ebpf:
          enabled: true
  destination:
    namespace: speedscale
    name: in-cluster
  syncPolicy:
    automated: {}
```

Review [rendered manifests and GitOps](/reference/helm#rendered-manifests-and-gitops) before enabling automated sync. Argo CD handles chart hooks and CRDs differently from a Helm CLI installation.

</TabItem>
<TabItem value="gitops" label="Rendered manifests">

Helm runs on your workstation; it does not need to run in the cluster. Render the chart to Kubernetes YAML using your values file:

```bash
helm template speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale \
  --values speedscale-values.yaml > speedscale-operator.yaml
```

Manage the output through your GitOps process or use it as a Kustomize resource:

```yaml title="kustomization.yaml"
resources:
  - speedscale-operator.yaml
```

:::caution Hook ordering
Applying rendered YAML does not reproduce Helm's hook ordering. Review [rendered manifests and GitOps](/reference/helm#rendered-manifests-and-gitops) before applying the output or enabling automated sync.
:::

Re-render when upgrading so chart changes and image versions stay current. The output can contain generated TLS private keys; handle it according to your secret-management policy. If your organization prohibits Helm tooling entirely, [contact Speedscale Support](mailto:support@speedscale.com) for help producing custom manifests.

</TabItem>
</Tabs>

## Verify installation

Check that the operator and forwarder pods are running:

```bash
kubectl -n speedscale get pods
```

Expect at least the operator and forwarder pods in `Running` state; the suffixes differ on your cluster:

```text
NAME                                    READY   STATUS    RESTARTS   AGE
speedscale-forwarder-xxxxxxxxxx-xxxxx   1/1     Running   0          5s
speedscale-operator-xxxxxxxxxx-xxxxx    1/1     Running   0          15s
```

When eBPF is enabled, also check the collector pods:

```bash
kubectl -n speedscale get pods -l app=speedscale-nettap
```

If proxymock is installed, check component readiness, connectivity, and your kubeconfig permissions:

```bash
proxymock cluster status --speedscale-namespace speedscale
```

For failures, see [installation troubleshooting](./troubleshooting.md) or ask in the [Speedscale Community](https://slack.speedscale.com).

## Kerberos cloud proxy

If your outbound proxy requires Kerberos, follow [Kerberos proxy authentication](/reference/proxy_config#kubernetes-operator-setup) to configure the operator override and mount credentials. The operator propagates these settings to forwarder and inspector.

## Private registry images

If your organization requires approved Redis or Java runtime images, configure `replayComponents.redis.image` and `jks.image` in your Helm values. The [Helm values reference](/reference/helm#bring-your-own-redis-and-java-runtime-images) covers runtime requirements and truststore behavior, with a [private registry example](/reference/helm#private-registry-example) for Artifactory.

## Next steps

Use the [tutorial](../../tutorial.md) to record and replay a demo application, or follow [cluster capture and replay with proxymock](/proxymock/guides/cluster/). See [eBPF capture targets](/reference/ebpf-traffic-collection#enabling-via-helm) to select workloads for capture.
