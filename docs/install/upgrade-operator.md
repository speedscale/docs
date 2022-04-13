import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrade Operator v1 to v2

Speedscale Operator v2 introduces new management methods for inventory, capture, and replays.
It is not backwards compatible with Speedscale Operator v1.

To upgrade to Speedscale Operator v2, follow these steps.

## Remove Speedscale Containers from Existing Workloads

Before starting the upgrade process, you must remove the Speedscale proxy sidecar and init containers.

To do so, annotate your workloads with `sidecar.speedscale.com/remove: "true"`. You may use `kubectl edit`,
`kubectl annotate`, or some other automation tool to accomplish this.

As an example with `kubectl annotate`:

```shell
kubectl annotate deployment/<your deployment> sidecar.speedscale.com/remove=true
```

## Update speedctl

You will need to get the latest speedctl client to perform the upgrade:

```
speedctl update
```

Also, you will need to edit your `~/.speedscale/config.yaml` and update the `container_type` value to `v0.12`.


## Perform Upgrade

Once you have removed Speedscale from existing workloads, your process for upgrading depends on
how you manage your Kubernetes environments.

 * Run the Upgrade Wizard
 * GitOps

<Tabs>
<TabItem value="wizard" label="Wizard" default>

If you use `speedctl` to manage your enviroment, you may begin the upgrade wizard,
which will remove the operator v1 installation and replace it with operator v2.

```shell
speedctl upgrade operator
```

</TabItem>

<TabItem value="gitops" label="GitOps">

If you are using a GitOps engine to manage your Kubernetes resources, you will need to update your git
repository with the new manifests.

1. Regardless of how your GitOps engine works, you must save the contents of the Speedscale certificates in your cluster prior to upgrading. If the secrets are currently in git, no action is needed. To save the secrets locally, you can run `kubectl -n speedscale get secrets ss-certs -o yaml > speedscale-certs.yaml`
1. Generate new operator manifests, but don’t push them to git yet: `speedctl deploy operator -e $(kubectl config current-context) > speedscale-operator.yaml`
1. Replace the `data` entry of the `speedscale-certs` Secrets in `speedscale-operator.yaml` with the data of the certs you saved in step 1.
1. Commit the contents of speedscale-operator.yaml to git

:::caution

   If your GitOps engine does not delete resources when removed from git, run `kubectl delete mutatingwebhookconfiguration.admissionregistration.k8s.io speed-operator-mutating-webhook-configuration`
:::

</TabItem>

</Tabs>

## Check that the deployment was successful

Once your deployment has been upgraded, run the following to ensure the Speedscale control plane is healthy:

```
speedctl check operator
```

## Add Speedscale to Your Desired Workloads

You may now install Speedscale on your target workload. You may use the `speedctl install` wizard, or a [GitOps](overview.md/#gitops-install-for-kubernetes-via-manifests) tool.
 
