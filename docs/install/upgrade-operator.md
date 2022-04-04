# Upgrade Speedscale Operator v1 to Operator v2

Speedscale Operator v2 introduces new management methods for inventory, capture, and replays. It is not backwards compatible with Speedscale Operator v1.

To upgrade to Speedscale Operator v2, follow these steps.

## Remove Speedscale Containers from Existing Workloads

Before starting the upgrade process, you must remove the Speedscale proxy sidecar and init containers.

To do so, annotate your workloads with `sidecar.speedscale.com/remove: true`. You may use `kubectl edit`, `kubectl annotate`, or some other automation tool to accomplish this.

## Run the Upgrade Wizard

Once the sidecar and init containers are removed from your workloads, you may begin the upgrade wizard, which will remove the operator v1 installation and replace it with operator v2.

```shell
 speedctl upgrade operator
```

## Add Speedscale to Your Desired Workloads

You may now install Speedscale on your target workload. You may use the `speedctl install` wizard, or a [GitOps]() tool.

