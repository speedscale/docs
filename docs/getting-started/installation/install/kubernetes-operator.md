---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Kubernetes

The operator acts like a SRE inside your own cluster, properly deploying and
configuring the various Speedscale components.

The Speedscale Kubernetes Operator works similarly to a service mesh controller
like Istio or Linkerd. It waits for deployments to be applied to the cluster
that contain specific annotations. It then automatically stands up an isolation
test environment around the deployment. The operator itself is a deployment
that will be always present on the cluster.

> Looking to install the operator? Follow the step-by-step instructions in the
> [Quick Start – Install Speedscale Operator](../../quick-start.md#install-speedscale-operator-optional).

For additional background and architecture, complete the [Quick Start](../../quick-start.md) first, then return here for conceptual details about how the operator works within your cluster.
