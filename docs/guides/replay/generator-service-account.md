---
title: Generator Service Account
description: "Run the Speedscale replay generator as an existing Kubernetes service account so it carries that account's cloud workload identity, such as GKE Workload Identity, and can fetch real tokens during replay."
sidebar_position: 7.6
---

# Run the Generator as Your Own Service Account

By default, the generator runs under a service account Speedscale manages, usually one created for that replay and deleted afterward. A cloud workload identity cannot be bound to an account whose name changes every replay, so the generator has no cloud identity of its own. Set `cluster.generatorServiceAccount` in the test config to run the generator as an existing service account instead. The generator then carries that account's workload identity, and a [`token_fetch`](/guides/transformation/transforms/token_fetch.md) transform can request tokens from the cloud metadata server during the replay.

- **Requires:** Speedscale v2.5.1322 or later, including the operator in the replay cluster.
- **Applies to:** the generator only. The responder and collector keep the accounts Speedscale creates for them.
- **Tested with:** GKE Workload Identity.

The operator only reads the account. It never labels, binds, owns or deletes it, so replay cleanup leaves the account, its annotations and its RBAC as they were.

## Allow the account in Helm

This feature is off by default. The operator accepts only service accounts whose labels match a selector in its Helm values. With no selectors, it rejects every account a test config names.

On the classic operator:

```yaml
replayComponents:
  generator:
    serviceAccountSelectors:
      - matchLabels:
          speedscale.com/replay-generator: "true"
```

On a [namespaced install](/getting-started/installation/install/kubernetes-namespaced):

```yaml
namespaced:
  replayRuntime:
    generatorServiceAccountSelectors:
      - matchLabels:
          speedscale.com/replay-generator: "true"
```

- Each entry is a standard Kubernetes label selector, with `matchLabels`, `matchExpressions` or both.
- An account that matches any one entry is allowed.
- An empty selector (`{}`) allows every service account in every replay namespace.
- On a namespaced install, setting any selector adds a read-only `get` on `serviceaccounts` to the replay coordinator's Role.

:::warning
Anyone who can edit test configs can run the generator as any allowed account and use its cloud permissions. Keep the selectors narrow, and label only accounts you are willing to lend to replays.
:::

## Label the account

The account must already exist in the replay namespace, which is the namespace of the workload under test. Add the label your selector matches:

```bash
kubectl -n <replay-namespace> label serviceaccount <account> speedscale.com/replay-generator=true
```

If your application already runs under a service account bound to the identity you need, the generator can use that same account.

## Name the account in the test config

Set `generatorServiceAccount` in the test config's `cluster` section:

```json
{
  "cluster": {
    "generatorServiceAccount": "<account>"
  }
}
```

Leave it unset to keep the default account. On a namespaced install, the replay coordinator reads this field only from a test config carried inline in the replay request. A request that names its test config only by ID runs the generator under the default account.

## Bind the account on GKE

The account needs the standard GKE Workload Identity setup and nothing specific to Speedscale. Link the Kubernetes service account to a Google service account, then allow the link:

```bash
kubectl -n <replay-namespace> annotate serviceaccount <account> \
  iam.gke.io/gcp-service-account=<gsa-name>@<project-id>.iam.gserviceaccount.com

gcloud iam service-accounts add-iam-policy-binding \
  <gsa-name>@<project-id>.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:<project-id>.svc.id.goog[<replay-namespace>/<account>]"
```

Workload Identity must be enabled on the cluster and on the node pool the generator runs on. See [Google's Workload Identity guide](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity).

## Fetch a token as the account

Add a `token_fetch` chain that requests an access token from the GKE metadata server and sends it in place of the recorded one:

```json
{
  "extractor": { "type": "http_req_header", "config": { "name": "Authorization" } },
  "transforms": [
    {
      "type": "token_fetch",
      "config": {
        "grant": "request",
        "method": "GET",
        "url": "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        "headers": "{\"Metadata-Flavor\":\"Google\"}"
      }
    }
  ]
}
```

The transform reads `access_token` and `expires_in` from the response by default, so the token is refreshed before it expires. To present a Google ID token to another identity provider, such as Microsoft Entra ID, see [Chain token requests](/guides/transformation/transforms/token_fetch.md#chain-token-requests).

If the generator reaches the internet through an egress proxy, add `metadata.google.internal` to the `no_proxy` Helm value so the metadata request does not go to the proxy.

## Troubleshooting

When the operator cannot use the account, the replay fails before the generator starts. On the classic operator, the replay shows a `GeneratorServiceAccountRejected` event. The error names the account and the reason:

| Error contains | Fix |
|---|---|
| `matches none of the installation's generator service account selectors` | Label the account to match a selector, or add a selector to the Helm values. |
| `invalid selector` | Fix the selectors in the Helm values. |
| `not found` | Create the account in the replay namespace, or fix `cluster.generatorServiceAccount`. |
| `is being deleted` | Recreate the account once its deletion finishes, or name another account. |
| `is not a valid name` | Fix `cluster.generatorServiceAccount`. It must be a valid Kubernetes object name. |

If the replay runs but the metadata server or your API rejects the token, check the account's annotation and IAM binding, and that the Google service account has the permissions your API requires.

## Related

- [`token_fetch`](/guides/transformation/transforms/token_fetch.md): request tokens during replay, including chained requests.
- [Helm values](/reference/helm#security-settings): the operator's `replayComponents.generator.serviceAccountSelectors` value.
- [Cluster test config](/reference/configuration/cluster.md): other cluster settings for replay components.
