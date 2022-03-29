---
sidebar_position: 1
---

# Overview

There are a few different ways to get up and running with Speedscale.  Installing Speedscale
next to your running application is required to [observe](../intro.md#observe) your service's traffic.

 - [Quick install for Kubernetes](#quick-install-for-kubernetes)
 - [Quick install for VM or local via Docker Compose](#quick-install-for-vm-or-local)
 - [GitOps install for Kubernetes via manifests](#gitops-install-for-kubernetes-via-manifests)
 - [GitOps install for Kubernnetes via Helm](#gitops-install-for-kubernetes-via-helm)

## Quick install for Kubernetes

Start by installing `speedctl` the Speedscale CLI-based API.

```
sh -c "$(curl -Lfs https://downloads.speedscale.com/speedctl/install)"
```

Then run `speedctl install`, choose "Kubernetes" and follow the prompts.  The install wizard will
walk you through installing the [Speedscale Kubernetes Operator](./kubernetes-operator.md)
and adding the [Speedscale Sidecar](./kubernetes-sidecar/README.md) to your deployment.

## Quick install for VM or local

Start by installing `speedctl` the Speedscale CLI-based API.

```
sh -c "$(curl -Lfs https://downloads.speedscale.com/speedctl/install)"
```

Then run `speedctl install`, choose "Docker" and follow the prompts.  The install wizard will
walk you through creating Docker Compose files which can be used to record your traffic,
stand up Speedscale Responders to mock your dependencies, and replay traffic against
your service for load or contract testing.

## GitOps install for Kubernetes via manifests

Start by installing `speedctl` the Speedscale CLI-based API.

```
sh -c "$(curl -Lfs https://downloads.speedscale.com/speedctl/install)"
```

Then apply manifests to your cluster.

```
speedctl deploy operator -e $(kubectl config current-context) | kubectl apply -f -
```

Or write locally and inspect or commit to version control first.

```
speedctl deploy operator -e $(kubectl config current-context) --dir
```

Once the Speedscale Operator is installed you will need to add annotations to
your application's deployment.  This can be done once via the [install
wizard](./install-wizard.md) or by adding
[Speedscale annotations](./kubernetes-sidecar/sidecar-annotations.md) to your
application's deployment.

## GitOps install for Kubernetes via Helm

Navigate to the [Helm repository](https://github.com/speedscale/operator-helm)
for instructions on installing the [Speedscale Kubernetes Operator](./kubernetes-operator.md).

Once the Speedscale Operator is installed you will need to add annotations to
your application's deployment.  This can be done once via the [install
wizard](./install-wizard.md) or by adding
[Speedscale annotations](./kubernetes-sidecar/sidecar-annotations.md) to your
application's deployment.

