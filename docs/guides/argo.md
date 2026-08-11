---
title: Speedscale with Argo Rollouts
description: "Capture traffic from Argo Rollouts with the Speedscale eBPF collector without modifying rollout pods."
sidebar_position: 30
---

[Argo Rollouts](https://argoproj.github.io/argo-rollouts/) are a popular way to
gain more control over application deployment in Kubernetes but their design
requires special consideration when used in conjunction with Speedscale.

## Installation

Please ensure the [Kubernetes Operator](/getting-started/installation/install/kubernetes-operator.md)
is running in your cluster before moving on.

:::important Inspector Restart Required
If you install Argo Rollouts after Speedscale is already running in your cluster, you must restart the Speedscale inspector pod for it to detect and watch Argo Rollouts resources:

```bash
kubectl rollout restart deployment/speedscale-inspector -n speedscale
```

This restart is necessary because the inspector only creates watchers for Argo Rollouts if they're detected at startup.
:::

## Capture rollout traffic with eBPF

The eBPF collector observes traffic from the node and does not inject a container into rollout pods. Enabling capture therefore does not create a new ReplicaSet, pause a rollout, or require promotion.

Enable eBPF in the Operator Helm values and target the stable label shared by the rollout pods:

```yaml title="ebpf-values.yaml"
ebpf:
  enabled: true
  configuration:
    capture:
      targets:
        - name: rollouts-demo
          namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: my-namespace
          podSelector:
            matchLabels:
              app: rollouts-demo
```

Apply the values:

```bash
helm upgrade speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale \
  --reuse-values \
  -f ebpf-values.yaml
```

Use an application label that remains stable across canary and stable ReplicaSets. Do not target `rollouts-pod-template-hash`, because that value changes with each rollout revision.

Verify that nettap is running and both rollout revisions match the target:

```bash
kubectl -n speedscale get daemonset nettap
kubectl -n my-namespace get pods -l app=rollouts-demo
```

See [eBPF Traffic Collection](/reference/ebpf-traffic-collection) for TLS support, system requirements, and additional target options.

:::warning Legacy sidecar deployments
Existing deployments that intentionally use sidecar capture can continue to use `speedctl infra sidecar` and `sidecar.speedscale.com/inject`. Sidecar injection changes the rollout pod template and must be promoted through Argo Rollouts. New deployments should use eBPF capture.
:::

## Remove a sidecar from a rollout

To remove a sidecar from an existing rollout, set the inject annotation to `false`:

```yaml
annotations:
  sidecar.speedscale.com/inject: "false"
```

Depending on how the rollout is configured it may not cycle right away. Patch the pod template to force it:

```bash
now=$(date) && kubectl patch rollout rollouts-demo -p '{"spec": {"template": {"metadata": {"annotations": {"speedscale.com/restartedAt": "'$now'"}}}}}' --type merge
```

The rollout cycles and the sidecar is removed. This does not affect eBPF capture, which is controlled separately by the capture targets.
