---
title: Operator
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Use this guide to upgrade the Speedscale operator in your cluster to the latest version.

## Perform Upgrade

Your process for upgrading depends on how you manage your Kubernetes environments.

<Tabs>

<TabItem value="helm" label="Helm">

Upgrading the Speedscale via helm is as easy as:

```
helm repo update
helm -n speedscale upgrade speedscale-operator speedscale/speedscale-operator
```

For additional details please refer to the
[helm chart repository](https://github.com/speedscale/operator-helm/blob/main/README.md)
for details and follow the README instructions for upgrading.

</TabItem>

<TabItem value="argocd" label="ArgoCD">

Go to your ArgoCD manifest and update `targetRevision` to the specific version you want to upgrade to from the [Helm repository](https://github.com/speedscale/operator-helm/blob/main/README.md).

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

If you are using a GitOps engine to manage your Kubernetes resources, you will need to update your git repository with the new manifests.

First generate a new template:

```
helm template speedscale-operator speedscale/speedscale-operator \
    -n speedscale \
    --create-namespace \
    --set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
    --set clusterName=<YOUR-CLUSTER-NAME> > ./speedscale-operator.yaml
```

Then merge this `speedscale-operator.yaml` with the one you already have in git.

</TabItem>

</Tabs>

### Rollback/Install a specific version

<Tabs>

<TabItem value="helm" label="Helm">

To rollback to the previously installed version use the helm rollback command

```
helm -n speedscale rollback speedscale-operator
```

or install a specific version

```
helm -n speedscale upgrade speedscale-operator speedscale/speedscale-operator --version v2.3.x
```

</TabItem>

<TabItem value="argocd" label="ArgoCD">

Similar to an upgrade, simply choose the `targetRevision` you'd like to downgrade to.

</TabItem>

<TabItem value="gitops" label="GitOps">

Similar to an upgrade, generate the template but include a `--version` in your flags for eg.

```
helm template speedscale-operator speedscale/speedscale-operator \
    --version v2.3.x \
    -n speedscale \
    --create-namespace \
    --set apiKey=<YOUR-SPEEDSCALE-API-KEY> \
    --set clusterName=<YOUR-CLUSTER-NAME> > ./speedscale-operator.yaml
```

Then merge this `speedscale-operator.yaml` with the one you already have in git.

</TabItem>

</Tabs>

## Validate

Once your deployment has been upgraded, run the following to ensure the Speedscale control plane is healthy:

```
speedctl check operator
```

## Restart Sidecars

After an upgrade the next step is to restart your services to get the latest
version of the Speedscale goproxy sidecar. The easiest way to do this is to
run a rolling deploy, allowing the Speedscale operator to inject the latest
version of the proxy as they come up.

```shell
kubectl -n <namespace> rollout restart deploy
```

## Add Speedscale to Workloads

You can now install Speedscale on new workloads. You may use the
`speedctl install` wizard, or a
[GitOps](/getting-started/installation/sidecar/install.md)
tool.

## Frequency of Upgrades

Speedscale typically releases new customer-side components weekly or more. By default, the Speedscale [helm](https://github.com/speedscale/operator-helm/blob/main/README.md) chart uses a pinned patch version that will not automatically upgrade. However, if you would like to always use the latest version you can instead pin to the minor version and set your image pull policy to pull more frequently. This will ensure you have the latest non-breaking version installed.

If you plan to manually upgrade, we recommend doing so at least monthly.
