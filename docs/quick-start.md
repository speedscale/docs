import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacOSLinuxInstall from './setup/install/_cli_macos_linux.mdx'
import WindowsCLIInstall from './setup/install/_cli_windows.mdx'

# Quick Start

## API Key
You will need to get your API key from your [Profile Page](https://app.speedscale.com/profile). Copy the API key and paste when prompted.

![](./setup/install/api-key.png)

## Install

<Tabs>

<TabItem value="helm" label="Helm" default>

Make sure you have [Helm 3](https://helm.sh/docs/intro/install/) installed. Then,

```bash
helm install speedscale-operator speedscale/speedscale-operator \
	-n speedscale \
	--create-namespace \
	--set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
	--set clusterName=<YOUR-CLUSTER-NAME>
```

Navigate to the [Helm repository](https://github.com/speedscale/operator-helm)
for all configuration options available for the Helm chart.

</TabItem>

<TabItem value="cli" label="CLI (Mac/Linux)">

<MacOSLinuxInstall />

Then run `speedctl install`, choose "Kubernetes" and follow the prompts.  The [install wizard](./setup/install/kubernetes-operator.md#install-wizard) will
walk you through installing the [Speedscale Kubernetes Operator](./setup/install/kubernetes-operator.md)
and adding the [Speedscale Sidecar](./setup/sidecar/install.md) to your deployment.

</TabItem>

<TabItem value="cli_windows" label="CLI (Windows)">

<WindowsCLIInstall />

Then run `speedctl install`, choose "Kubernetes" and follow the prompts.  The [install wizard](./setup/install/kubernetes-operator.md#install-wizard) will
walk you through installing the [Speedscale Kubernetes Operator](./setup/install/kubernetes-operator.md)
and adding the [Speedscale Sidecar](./setup/sidecar/install.md) to your deployment.

</TabItem>

<TabItem value="gitops" label="GitOps">

:::caution

Installing via `helm install` is preferred as different GitOps engines treat Helm charts differently and Helm guarantees an order of operations during the install.

:::

You can generate manifests either via Helm or our [CLI](./setup/install/cli.md).

```bash
helm template speedscale-operator speedscale/speedscale-operator \
	-n speedscale \
	--create-namespace \
	--set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
	--set clusterName=<YOUR-CLUSTER-NAME> > ./manifests
```

or

```bash
speedctl deploy operator -e $(kubectl config current-context) --dir
```


</TabItem>

</Tabs>


## Verify Install

Once you're done, make sure the operator pods are running properly:

```
kubectl -n speedscale get pods
```
Note: The Operator will start at least 2 pods (the operator itself and the Speedscale Forwarder) after it starts. On your cluster the ids of the pods will be different.

```
NAME                                    READY   STATUS    RESTARTS   AGE
speedscale-forwarder-xxxxxxxxxx-xxxxx   1/1     Running   0          5s
speedscale-operator-xxxxxxxxxx-xxxxx    1/1     Running   0          15s
```

If you're ready to capture traffic skip ahead to [Sidecar](./setup/sidecar/install.md).

:::tip

If you have any issues installing, check out the [troubleshooting guide](./setup/install/troubleshooting.md).

:::
