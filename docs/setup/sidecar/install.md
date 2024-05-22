---
title: Sidecar
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The Speedscale sidecar proxy, [goproxy](/reference/glossary.md#goproxy), is
used to collect data from an existing application.  To capture
[traffic](/reference/glossary.md#traffic), requests to and from your
application will need to be routed through the proxy.

## Installation

There are several ways to install the sidecar in your cluster.  See the [proxy
configuration reference](/reference/proxy_config.mdx) for proxy configuration
outside of a cluster.

<Tabs>

<TabItem value="webapp" label="Web App">

From the [Speedscale web app](https://app.speedscale.com/) click on `Add
service` to launch the add service wizard which will walk you through
configuration and verification tailored to your environment.

</TabItem>

<TabItem value="annotation" label="Kubernetes Annotation">

With cluster access you can add the sidecar with an annotation on your
workload.

Please ensure the [Kubernetes Operator](../install/kubernetes-operator.md) is
running in your cluster before moving on.

Select the workload (daemonset, deployment, statefulset, job or replicaset)
you'd like to monitor and add the following annotation:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
```

That's it. Next time you deploy you can check the pods with get pods.

```
kubectl -n <namespace> get pods
```

You should notice your container count increases by one and data should be flowing.

```
NAME                            READY   STATUS    RESTARTS   AGE
carts-xxxxxxxxxx-xxxxx          2/2     Running   0          38d
```

By default, the Speedscale init container starts after any existing init
containers in the workload.

</TabItem>

</Tabs>

## Removal

If you already have the sidecar installed, but you need for it to be removed,
you may either set the `sidecar.speedscale.com/inject` annotation to `false`,
or remove it:

```yaml
annotations:
  sidecar.speedscale.com/inject: "false"
```

After deploying or patching your deployment, you should notice your container
count decrease by one and the sidecar is no longer attached.

Use `speedctl uninstall` to remove all Speedscale components.

