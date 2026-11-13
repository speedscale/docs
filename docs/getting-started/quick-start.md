---
description: "Get started with Speedscale in Kubernetes using the Operator, with eBPF collection as the default path and goproxy sidecars as a fallback when needed."
sidebar_position: 2
---
import CLIInstall from './installation/install/_cli_install.mdx'
import AgentInstall from './installation/install/_agent_install.mdx'

# Quick Start

Planning an evaluation? Review the [prerequisites and evaluation plan](./evaluation.md) before installing.

:::info Local installation
For local development and testing without a cloud cluster, use **proxymock** to run a local mock server and generate tests from your traffic. Follow [Install proxymock CLI](/proxymock/getting-started/installation/) and the [proxymock CLI quickstart](/proxymock/getting-started/quickstart/quickstart-cli/). For help choosing between proxymock and speedctl, see [Command-line tools](/getting-started/command-line-tools/).
:::

:::tip Security options
- **Local-first:** proxymock keeps recording local by default for desktop workflows. See [Data and Privacy](/proxymock/how-it-works/data_and_privacy/).
- **Enterprise isolation:** use [Bring Your Own Cloud (BYOC)](/byoc/) when data residency and cloud boundary control are required.
- **Sensitive data controls:** enable [DLP](/guides/dlp/) so sensitive fields are redacted before data leaves your network.
:::

This guide walks through installing Speedscale into a Kubernetes (cloud or on-prem) environment. After completing these steps the Speedscale Operator will be installed in your cluster and you should continue on to the [tutorial](./tutorial.md) to record, replay and view results for a demo application.

:::warning Sidecar capture is deprecated
For standard Kubernetes traffic collection, follow [Kubernetes capture with eBPF and Java Agent](/guides/capture/kubernetes). Use goproxy sidecars only for an existing deployment or when your environment does not meet the eBPF requirements.
:::

Speedscale is tested with apps hosted on the local desktop all the way up to high scale enterprise Kubernetes clusters. Keep in mind that it is very common to record traffic in one environment (like a production Kubernetes cluster) and replay it somewhere else (like a local mock server).

## Install with your coding agent (recommended) {#install-with-ai-agent}

<AgentInstall />

## Prefer to install manually? {#install-manually}

Follow the [standard operator installation](./installation/install/kubernetes-operator.md) for the full procedure, then return here to start the tutorial. If cluster policy prevents cluster-scoped grants, choose the [namespace-scoped installation](./installation/install/kubernetes-namespaced.md) instead. Compare both paths in [Kubernetes installation options](./installation/install/kubernetes.md).

## Install speedctl CLI (optional) {#install-cli-optional}

<CLIInstall />

## Install Speedscale Operator (optional)

<a id="retrieve-your-api-key"></a><a id="optional-adding-image-pull-secrets"></a><a id="verify-installation"></a>

Use a service account API key from [Tenant Settings](https://app.speedscale.com/tenant), then choose [Helm](./installation/install/kubernetes-operator.md?method=helm#install-method), [speedctl](./installation/install/kubernetes-operator.md?method=cli#install-method), [Argo CD](./installation/install/kubernetes-operator.md?method=argocd#install-method), or [rendered manifests](./installation/install/kubernetes-operator.md?method=gitops#install-method) in the [operator guide](./installation/install/kubernetes-operator.md#retrieve-your-api-key). Review [platform requirements](./installation/install/kubernetes.md#check-your-platform-requirements) before installing on a specialized Kubernetes platform. For private registries, see [image pull secrets](./installation/install/kubernetes-operator.md?method=cli#install-method) and [private registry images](./installation/install/kubernetes-operator.md#private-registry-images). Follow [Verify installation](./installation/install/kubernetes-operator.md#verify-installation) before proceeding to the tutorial.

# Next Steps

For the proxymock CLI path, continue with [cluster capture and replay commands](/proxymock/guides/cluster/). If proxymock is not installed yet, [install it first](/proxymock/getting-started/installation/); the platform agent install already installs it.

At this point Speedscale is present in your cluster and you are now ready to target workloads for record and playback. If this is your first installation please continue using our multi-platform [tutorial](./tutorial.md) for a full walkthrough.

If you're already an expert you can click the `Add Service` button in the UI to target workloads for capture. Follow [Kubernetes capture with eBPF and Java Agent](/guides/capture/kubernetes) to configure and verify capture. If your environment cannot run eBPF, use the [sidecar fallback](./installation/sidecar/install.md).
