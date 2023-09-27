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

Please complete the [quick start](../../quick-start.md) for detailed instructions on installing Speedscale into Kubernetes.