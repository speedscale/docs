---
title: Operator (v1)
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrade Operator v1 to v2

Speedscale operator v2 introduces new management methods for inventory, capture, and replays.
It is not backwards compatible with Speedscale operator v1.

To upgrade to Speedscale operator v2, follow these steps.

## Confirming current version

To validate you are running Speedscale operator v1, run the following command:

```
speedctl version
```

If your client _and_ cluster version are below v0.12.0, then you are running operator v1 and may proceed.


## Remove Speedscale Containers from Existing Workloads

Before starting the upgrade process, you must remove the Speedscale proxy sidecar and init containers.

To do so, annotate your workloads with `sidecar.speedscale.com/remove: "true"`. You may use `kubectl edit`,
`kubectl annotate`, or some other automation tool to accomplish this.

As an example with `kubectl annotate`:

```
kubectl annotate deployment/<your deployment> sidecar.speedscale.com/remove=true
```

To update all workloads in a namespace:

```
kubectl annotate --namespace=<your namespace> <workload type> --all sidecar.speedscale.com/remove=true
```

## Changed Annotations

With the move to operator v2, the Speedscale annotations have changed.
Please see [the table of annotation changes](../changed-annotations) for a complete list.


## Perform Upgrade

From here you can perform a standard upgrade following the
[current upgrade process](./operator.md).

