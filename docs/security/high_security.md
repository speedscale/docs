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

## Limiting Secret Access

In highly secure environments, you may want to restrict which Kubernetes secrets Speedscale can access during testing. Speedscale uses secrets as variables for various transforms, such as JWT resigning where secrets are referenced using the syntax `${{secret:secret_name/key_inside_the_secret}}`.

The `secretAccessList` parameter in the Speedscale Operator helm chart controls this access:

- **Empty list (default)**: Grants access to all secrets in the cluster
- **Populated list**: Limits access to only the specified secrets

### Configuration

Set the `secretAccessList` in your helm values file:

```yaml
# Allow access to all secrets (default)
secretAccessList: []

# Limit access to specific secrets only
secretAccessList:
  - "jwt-signing-secret"
  - "api-keys"
  - "database-credentials"
```

:::warning
When `secretAccessList` is populated, Speedscale will only be able to access the secrets listed. Any transforms that reference secrets not in this list will fail.
:::

This feature provides granular control over secret access while maintaining Speedscale's ability to perform necessary testing operations.

## Fully Customer Hosted

Some security environments are so restrictive that no external outbound communication is possible. Please [contact us](mailto:support@speedscale.com) if you require this deployment and support model.
