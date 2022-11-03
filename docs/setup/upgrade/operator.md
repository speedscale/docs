---
title: Operator
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Use this guide to upgrade the Speedscale operator in your cluster to the latest version.

## Update speedctl

You will need to get the latest speedctl client to perform the upgrade:

```
speedctl update
```

## Perform Upgrade

Your process for upgrading depends on how you manage your Kubernetes environments.

 * Run the Upgrade Wizard
 * GitOps

<Tabs>
<TabItem value="wizard" label="Wizard" default>

If you use `speedctl` to manage your enviroment, you may begin the upgrade wizard,
which will replace your Speedscale Operator with the latest version.

```shell
speedctl upgrade operator
```

</TabItem>

<TabItem value="gitops" label="GitOps">

If you are using a GitOps engine to manage your Kubernetes resources, you will need to update your git
repository with the new manifests.

1. Regardless of how your GitOps engine works, you must save the contents of
   the Speedscale certificates in your cluster prior to upgrading. If the
   secrets are currently in git, no action is needed. To save the secrets
   locally, you can run `kubectl -n speedscale get secrets speedscale-certs -o
   yaml > speedscale-certs.yaml`
1. Generate new operator manifests, but don’t push them to git yet: `speedctl
   deploy operator -e $(kubectl config current-context) >
   speedscale-operator.yaml`
1. Replace the `data` entry of the `speedscale-certs` Secrets in
   `speedscale-operator.yaml` with the data of the certs you saved in step 1.
1. If your workloads are stored with Speedscale annotations, **be sure to
   [review the changed annotations](../changed-annotations/) before
   proceeding.**
1. Commit the contents of speedscale-operator.yaml to git

:::caution

   If your GitOps engine does not delete resources when removed from git, run `kubectl delete mutatingwebhookconfiguration.admissionregistration.k8s.io speed-operator-mutating-webhook-configuration`
:::

</TabItem>

<TabItem value="helm" label="Helm">

If you use helm please refer to the
[helm chart repository](https://github.com/speedscale/operator-helm)
for details and follow the README instructions for upgrading.

</TabItem>

</Tabs>

## Validate

Once your deployment has been upgraded, run the following to ensure the Speedscale control plane is healthy:

```
speedctl check operator
```

## Restart Sidecars

After an upgrade the next step is to restart your services to get the latest
version of the Speedscale goproxy sidecar.  The easiest way to do this is to
run a rolling deploy, allowing the Speedscale operator to inject the latest
version of the proxy as they come up.

```shell
kubectl -n <namespace> rollout restart deploy
```

## Add Speedscale to Workloads

You can now install Speedscale on new workloads. You may use the
`speedctl install` wizard, or a
[GitOps](../sidecar/install.md)
tool.
