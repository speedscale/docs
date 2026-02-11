---
sidebar_position: 0
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CLIInstall from './getting-started/installation/install/_cli_install.mdx'
import ApiKey from './getting-started/installation/install/api-key.png'

# Quick Start

This guide walks through installing Speedscale into a new environment. After completing these steps the Speedscale Operator will be installed in your cluster and you should continue on to the [tutorial](./tutorial.md) to record, replay and view results for a demo application.

Speedscale is tested with apps hosted on the local desktop all the way up to high scale enterprise Kubernetes clusters. If this is your first time working with Speedscale, it's easiest to just run on your local desktop and record traffic from a local process. Keep in mind that it is very common to record traffic in one environment (like a production Kubernetes cluster) and replay it somewhere else (like a local mock server).

This guide will walk you through the following steps:

1. Retrieve your API Key
2. Install CLI (recommended)
3. Install Operator (if required)
4. Verify Installation
5. Capture and replay traffic against a demo app

## Retrieve your API Key

You will need to get your personal API key from your [Profile Page](https://app.speedscale.com/profile). Copy the API key and paste when prompted.

<img src={ApiKey} width="600"/>

## Install CLI (optional)

<CLIInstall />

## Install Speedscale Operator (optional)

If you are running Speedscale on your local desktop, you should continue directly to the [tutorial](./tutorial.md). The rest of this document is focused on installing a Kubernetes-based demo.

If you are using a common Kubernetes distribution (EKS, GKE, minikube, etc) then you can install using these instructions. If you are not running in Kubernetes, or are running with a more specialized enterprise distribution please select environment-specific [instructions](./getting-started/installation/install/README.md) in this section.

<Tabs>

<TabItem value="helm" label="Helm" default>

Make sure you have [Helm 3](https://helm.sh/docs/intro/install/) installed. Then,

```
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo update
helm install speedscale-operator speedscale/speedscale-operator \
	-n speedscale \
	--create-namespace \
	--set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
	--set clusterName=<YOUR-CLUSTER-NAME>
```

Navigate to the [Helm repository](https://github.com/speedscale/operator-helm/blob/main/README.md)
for all configuration options available for the Helm chart.

</TabItem>

<TabItem value="cli" label="CLI (Mac/Linux)">

Run `speedctl install`, choose "Kubernetes" and follow the prompts.

The install wizard will walk you through installing the
[Speedscale Kubernetes Operator](./getting-started/installation/install/kubernetes-operator.md)
and adding the [Speedscale Sidecar](./getting-started/installation/sidecar/install.md) to your deployment.

### (Optional) Adding Image Pull Secrets

If you need custom image pull secrets (for example, if you're re-hosting
Speedscale images in a dedicated registry), you may provide one or more secret
names with the `--imgpullsecrets` argument, and the secrets will be attached to
the service account.

```
speedctl install --imgpullsecrets my-secret1,my-secret2p
```

</TabItem>

<TabItem value="cli_windows" label="CLI (Windows)">

If using Kubernetes run `speedctl install`, choose "Kubernetes" and follow the prompts.
The install wizard will walk you through installing the
[Speedscale Kubernetes Operator](./getting-started/installation/install/kubernetes-operator.md)
and adding the [Speedscale Sidecar](./getting-started/installation/sidecar/install.md) to your deployment.

Speedscale can also be used with [Docker](./getting-started/installation/install/docker.md) and [locally](./guides/cli.md).

</TabItem>

<TabItem value="argocd" label="ArgoCD">

Use the following ArgoCD manifest as an example. Make sure to use the latest `targetRevision` as shown on the [Helm repository](https://github.com/speedscale/operator-helm/blob/main/README.md).

```
project: default
source:
  repoURL: 'https://speedscale.github.io/operator-helm/'
  targetRevision: <YOUR-VERSION>
  helm:
    parameters:
      - name: apiKeySecret
        value: speedscale-apikey
    values: |-
      apiKeySecret: speedscale-apikey
      clusterName: <YOUR-CLUSTER-NAME>
  chart: speedscale-operator
destination:
  namespace: speedscale
  name: in-cluster
syncPolicy:
  automated: {}
  syncOptions:
    - CreateNamespace=true
```

</TabItem>

<TabItem value="gitops" label="GitOps">

:::caution

Installing via `helm install` is preferred as different GitOps engines treat Helm charts differently and Helm guarantees an order of operations during the install.

:::

You can generate manifests either via Helm or our [CLI](./getting-started/installation/install/cli.md).

```
helm template speedscale-operator speedscale/speedscale-operator \
	-n speedscale \
	--create-namespace \
	--set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
	--set clusterName=<YOUR-CLUSTER-NAME> > ./speedscale-operator.yaml
```

Then store `speedscale-operator.yaml` in git so it is deployed to your cluster.

</TabItem>

</Tabs>

### Verify Installation

Make sure the operator pods are running properly:

```
kubectl -n speedscale get pods
```

Note: The Operator will start at least 2 pods (the operator itself and the Speedscale Forwarder) after it starts. On your cluster the ids of the pods will be different.

```
NAME                                    READY   STATUS    RESTARTS   AGE
speedscale-forwarder-xxxxxxxxxx-xxxxx   1/1     Running   0          5s
speedscale-operator-xxxxxxxxxx-xxxxx    1/1     Running   0          15s
```

:::tip

If you have any issues installing, check out the [troubleshooting guide](./getting-started/installation/install/troubleshooting.md) or contact support on [slack](https://slack.speedscale.com)

:::

# Next Steps

At this point Speedscale is present in your cluster and you are now ready to target workloads for record and playback. If this is your first installation please continue using our multi-platform [tutorial](./tutorial.md) for a full walkthrough.

If you're already an expert you can click the `Add Service` button in the UI to automatically add sidecars or install them [manually](./getting-started/installation/sidecar/install.md).
