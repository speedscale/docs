---
sidebar_position: 9
---

# Replay With `speedctl`

`speedctl` gives you the options of running a replay locally or against a deployment in a cluster.

### Replay in a Cluster

Whether it's the same cluster where you captured traffic or a different one, you need an active [inspector](/reference/glossary.md#inspector) in your cluster.

```bash
speedctl infra replay --snapshot-id {snapshot_id} --cluster {cluster_name} --service {workload_name}
```

This runs a replay against your workload in the specified cluster. Run `speedctl infra replay --help` to see all available flags.

:::tip Namespace inference
If `--namespace` is omitted and the snapshot was captured from a single namespace, that namespace is inferred automatically. If the snapshot spans multiple namespaces you must pass `--namespace`.
:::

### Targeting Specific Services (`--test-against`)

You can map replay traffic to different endpoints. This is useful when you want to test a sub-system or a newer version of a service.

```bash
# Redirect all traffic to a single URL
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --test-against http://example.com

# Override specific services while using a default
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --service my-service \
  --test-against auth=auth.example.com \
  --test-against frontend=http://localhost:8080
```

Note: `--test-against` is mutually exclusive with specifying a positional `{workload_name}` argument.

---

## Controlling Outbound Mocks

By default, `speedctl infra replay` mocks **all** outbound dependencies recorded in the snapshot. The flags below let you customize which outbound services are mocked.

### `--no-mocks`

Disable all outbound mocking. Real outbound traffic is sent to downstream services.

```bash
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --service my-service \
  --no-mocks
```

### `--mocks <mode>`

Set a base mocking mode. Accepted values:

| Mode | Behaviour |
|------|-----------|
| `all` | Mock all outbound services (default when flag is omitted) |
| `none` | Disable all mocks (same as `--no-mocks`) |
| `external-only` | Mock only external (non-cluster) services _(not yet supported; falls back to `all`)_ |
| `internal-only` | Mock only internal (cluster) services _(not yet supported; falls back to `all`)_ |

### `--mock-only <selector>`

Repeatable. Mock **only** the outbound services that match the given selectors — everything else is called live.

```bash
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --service my-service \
  --mock-only 'svc:payments' \
  --mock-only 'host:api.stripe.com'
```

### `--mock-except <selector>`

Repeatable. Start from the base mock mode (`--mocks` or `all` by default) and **exclude** matching services from being mocked.

```bash
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --service my-service \
  --mock-except 'svc:db' \
  --mock-except 'glob:payments:*:443'
```

### Selector syntax

`--mock-only`, `--mock-except`, and `--exclude-in` all accept the same selector formats:

| Selector | Example | Matches |
|----------|---------|---------|
| Exact key | `payments:grpc:443` | Exact out-service key |
| `svc:<substring>` | `svc:payments` | Keys containing the substring (case-insensitive) |
| `host:<hostname>` | `host:api.stripe.com` | Services with a matching recorded hostname |
| `glob:<pattern>` | `glob:payments:*:443` | Shell-style glob on the out-service key |

:::tip Shell quoting
Wrap selectors in single quotes to prevent your shell from expanding globs or interpreting colons, e.g. `--mock-only 'glob:payments:*:443'`.
:::

---

## Excluding Inbound Services (`--exclude-in`)

Repeatable. Exclude specific **inbound** services from being replayed. All other inbound services are replayed normally.

```bash
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --namespace staging \
  --service my-service \
  --exclude-in 'svc:frontend' \
  --exclude-in 'auth:auth.example.com:443'
```

Selectors use the same syntax as `--mock-only`/`--mock-except` (see table above).

---

## Previewing the Mock Plan (`--dry-run-mocks`)

Resolve and print the mocking plan **without** starting a replay. Combine with `-o pretty` or `-o json` to control output format.

```bash
speedctl infra replay \
  --snapshot-id {snapshot_id} \
  --cluster {cluster_name} \
  --service my-service \
  --mock-only 'svc:payments' \
  --dry-run-mocks -o pretty
```

Example output:

```
Mocks: 2 out-service(s)
  - payments:grpc:443
  - payments:http:80
```

---

## Advanced Mock Attachments

By default all mocks are attached to the workload specified by `--service`. The flags below allow mocks to be split across multiple workloads — useful in multi-service replay scenarios.

### `--mock-attach-default <workloadRef>`

Override the default attachment workload for all mocks. Format: `[<namespace>/]<type>/<name>`.

```bash
--mock-attach-default staging/deployment/payments-sidecar
```

### `--mock-attach <selector>=<workloadRef>`

Repeatable. Route mocks matching a selector to a specific workload.

```bash
--mock-attach 'svc:payments=staging/deployment/payments-sidecar' \
--mock-attach 'host:api.stripe.com=staging/deployment/stripe-proxy'
```

### `--mock-attach-file <path>`

Load attachment rules from a YAML or JSON file. Accepts either a wrapper format or a bare array:

```yaml
# wrapper format
mocks:
  - selector: "svc:payments"
    attach: "staging/deployment/payments-sidecar"
  - selector: "host:api.stripe.com"
    attach: "staging/deployment/stripe-proxy"
```

```json
[
  { "selector": "svc:payments", "attach": "staging/deployment/payments-sidecar" }
]
```

---

## Replay Locally

See the full guide on the [CLI](/guides/cli.md#terminal-2-1) page.
