---
sidebar_position: 5
---

# Highly Secure Environments

Speedscale's default security settings are sufficient for most situations. However, highly secure environments may require disabling some functionality to achieve compliance. Fortunately, Speedscale was architectured around the principle of separation of concerns so functionality can be turned off selectively.

## Disabling Remote Control

Speedscale is able to remotely trigger workloads and data collection from its UI. This capability is extremely useful for engineering or test teams that do not have direct access to the test Kubernetes cluster. However, it may be undesirable to give that level of control in production recording clusters.

:::note
Remote control is a Kubernetes-specific feature. It is not currently offered for other environments and does not need to be disabled.
:::

To turn this capability off, the `inspector` container needs to be disabled and removed from the cluster. This is achieved by setting the `WITH_INSPECTOR` flag to false in the Speedscale Operator's config map. The following `kubectl` command will affect this change on a running cluster:

```bash
kubectl -n speedscale patch configmap/speedscale-operator --type merge -p '{"data":{"WITH_INSPECTOR":"false"}}'
kubectl -n speedscale rollout restart deployment speedscale-operator
```

Once the operator is restarted with these commands, the code necessary to run any remote control actions will not be present in the cluster. The `inspector` is not simply turned off, it is removed entirely.

## Customer Managed Encryption Keys (CMEK)

Speedscale allows the use of customer-managed encryption keys (CMEK) on a case-by-case basis. This provides a security middle ground whereby customers have complete control but Speedscale continues to maintain the infrastructure. Please see the [guide](../guides/cmek.md) to get started.

## Fully Customer Hosted

Some security environments are so restrictive that no external outbound communication is possible. Please [contact us](mailto:support@speedscale.com) if you require this deployment and support model.
