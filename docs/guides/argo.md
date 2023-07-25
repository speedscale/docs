---
title: Speedscale with Argo Rollouts
sidebar_position: 30
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

[Argo Rollouts](https://argoproj.github.io/argo-rollouts/) are a popular way to
gain more control over application deployment in Kubernetes but their design
requires special consideration when used in conjunction with Speedscale.

## Installation

Please ensure the [Kubernetes Operator](/setup/install/kubernetes-operator.md)
is running in your cluster before moving on.

One of the primary selling points of a rollout is the ability to perform a
partial deployment, promote it forward, or roll it back if it doesn't work. We
respect your choice to maintain this control and for that reason all rollout
modifications through Speedscale will require an extra step on your part to
fully promote the change.

<Tabs>

<TabItem value="webapp" label="Web App">

From the [Speedscale web app](https://app.speedscale.com/) click on `Add
service` and select your cluster configuration.

![add-argo-rollout](./argo/add-service-argo-rollout.png)

Once the sidecar has been added to the rollout the sidecar will be added to
some pods. The status on the wizard will spin until the rollout has been
promoted.

![service-status](./argo/verify-argo-service.png)

Promote the rollout to apply the rest:

```bash
kubectl argo rollouts promote <rollout-name>
```

The status on the wizard should complete and send a test request.

</TabItem>

<TabItem value="annotation" label="Kubernetes Annotation">

With cluster access you can add the sidecar with an annotation on your
workload.

Add the following annotation to the rollout:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
```

Unlike a deployment we need to patch the rollout to trigger the change:

```bash
now=$(date) && kubectl patch rollout rollouts-demo -p '{"spec": {"template": {"metadata": {"annotations": {"speedscale.com/restartedAt": "'$now'"}}}}}' --type merge
```

This will apply the sidecar to some pods. Verify changes and promote the
rollout to apply the rest:

```bash
kubectl argo rollouts promote <rollout-name>
```

</TabItem>

</Tabs>


