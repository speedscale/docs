---
title: Kubernetes (Namespaced)
description: "Install Speedscale confined to a single Kubernetes namespace, with no cluster-scoped permissions, CRDs, or admission webhooks, for clusters that cannot grant the classic operator install."
sidebar_position: 1.5
---

# Kubernetes, Namespaced Install

:::caution
This workflow is currently in preview status. Please provide feedback in our
[Slack community](https://slack.speedscale.com).
:::

The namespaced install is a separate Helm chart, `speedscale-namespaced`, for
clusters where the [classic Speedscale Operator](./kubernetes-operator.md)
cannot be installed at all: environments that forbid cluster-scoped grants,
`CustomResourceDefinition`s, or admission webhooks. It renders the same
forwarder and inspector the classic install does, plus a **replay
coordinator** that drives replays from labeled `ConfigMap`s instead of a
`TrafficReplay` custom resource.

## Who this is for

Use this install if your platform or security team will not grant:

- a `ClusterRole` or cluster role binding of any kind
- a `CustomResourceDefinition`
- a `MutatingWebhookConfiguration` / `ValidatingWebhookConfiguration`
- a `DaemonSet` (which rules out [eBPF capture](/reference/ebpf-traffic-collection))

Everything this chart renders is scoped to one namespace. If your cluster has
no such restriction, install the [classic operator](./kubernetes-operator.md)
instead — it captures with eBPF by default, supports every workload the
namespaced install does plus `DaemonSet`s, and needs less day-to-day CLI
interaction.

:::info Two capture mechanisms, one flag
The namespaced install captures traffic by injecting a `goproxy` sidecar —
the same mutation the classic install's admission webhook performs, computed
and applied by `proxymock` itself with your own kubeconfig. See the
[sidecar capture guide](/guides/capture/sidecar-namespaced) for the full
`inject` / `uninject` / `status` workflow.
:::

## Prerequisites

### The namespace must already exist

The chart renders **no `Namespace` object**. Create the target namespace out
of band, with whatever process already governs namespaces in your cluster:

```bash
kubectl create namespace banking-app
```

:::warning Do not use `helm install --create-namespace`
It works, and that is the problem: it makes the install look like it needs
namespace-create rights, which is exactly the permission a namespaced install
is meant to prove it does not need. Create the namespace separately and
install into it.
:::

### An API key Secret must already exist

The chart **never creates** the API key Secret; it references one by name
(`apiKeySecret`, default `speedscale-apikey`):

```bash
kubectl -n banking-app create secret generic speedscale-apikey \
  --from-literal=SPEEDSCALE_API_KEY=<your-api-key> \
  --from-literal=SPEEDSCALE_APP_URL=app.speedscale.com
```

Point `apiKeySecret` at a different name if your platform provisions
credentials elsewhere (sealed-secrets, external-secrets, a Vault agent).

### A Pod Security exemption for the instrumented namespace

The Speedscale control plane (forwarder, inspector, replay coordinator) runs
under the **`restricted`** Pod Security Standard with no changes needed, with
one caveat: turning on `tls.createJKS` (off by default) adds a `post-install`
Job that runs as root to write a Java keystore, so a namespace enforcing
`restricted` must either leave `createJKS` off or exempt that one Job. The
namespace holding the **workloads you capture or replay against** is
different: the injected sidecar's init container needs `NET_ADMIN` and
`NET_RAW` to redirect the workload's traffic through the proxy, which neither
`restricted` nor `baseline` allows.

Label that namespace to allow it:

```yaml
pod-security.kubernetes.io/enforce: privileged
```

:::warning This is a namespace-wide exemption
`pod-security.kubernetes.io/enforce: privileged` permits every pod in the
namespace to request any capability, not only Speedscale's sidecar. If your
policy needs to scope the exemption to pods actually carrying the Speedscale
sidecar, use your admission controller instead of the built-in PSA label:

- **Gatekeeper** — a constraint that exempts pods carrying the
  `sidecar.speedscale.com/injected` label from your capability-restricting
  `ConstraintTemplate`.
- **Kyverno** — a `policy exception` (or `exclude` block, pre-1.11) scoped to
  the same label, on the policy that would otherwise reject `NET_ADMIN` /
  `NET_RAW`.

Both need the exemption authored once per cluster by whoever owns that policy
engine; Speedscale's chart does not and cannot render it.
:::

### OpenShift needs a one-time cluster-admin grant

The chart deliberately renders **no `SecurityContextConstraints`** — an SCC is
cluster-scoped, which is exactly the kind of grant this install exists to
avoid asking for. On OpenShift, a cluster administrator has to apply an SCC
allowing `NET_ADMIN` / `NET_RAW` once, out of band, before capture or replay
can inject a sidecar. See the
[SCC example in the OpenShift install guide](./openshift.md#securitycontextconstraint-example)
and scope it to the workload namespace's service accounts rather than
cluster-wide.

This is worth surfacing to your security reviewer up front: "nothing outside
your namespace" is true of everything the chart itself renders, but an
OpenShift cluster still needs this one cluster-admin action before capture
works.

### Kubernetes 1.21+, Helm 3+

## Install

The `speedscale-namespaced` chart is published to the same Helm repository as
the classic operator chart:

```bash
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo update
helm install speedscale speedscale/speedscale-namespaced \
  --namespace banking-app \
  --values values.yaml
```

A realistic `values.yaml`, modeled on a working install:

```yaml
clusterName: "banking-cluster"
appUrl: "app.speedscale.com"
apiKeySecret: "speedscale-apikey"

image:
  registry: gcr.io/speedscale
  tag: "v2.5.878"

# Cloud-issued tenant identity. The chart cannot compute these -- Speedscale
# cloud issues them in exchange for your API key. Until your install can
# resolve them automatically, pass all five together.
tenant:
  id: "00000000-1111-2222-3333-444444444444"  # from your Speedscale account
  name: "acme"
  bucket: "sstenant-000123"
  region: "us-east-1"
  stream: "sstenant-000123"
  subTenantName: "default"
```

:::danger `tenant.subTenantName` is not your tenant name
`tenant.subTenantName` is a separate, cloud-issued value — it is **not**
guaranteed to equal `tenant.name`, and guessing wrong is easy to do because
the two often look alike. In one verified install, `tenant.name` was
one tenant's name was `"acme"` while the correct `subTenantName` was `"default"`.

Worse, getting it wrong does not fail loudly: the coordinator's own startup
self-check only confirms that `tenant.subTenantName` (and the other four
tenant fields) are **non-empty**, not that they are correct, and logs
`tenant identity is known` regardless. The value flows straight through to
`SUB_TENANT_STREAM` in the forwarder and coordinator `ConfigMap`s, so a wrong
value can leave captured traffic and replay reports attributed to the wrong
stream while every readiness check reports healthy.

Get the correct value from your Speedscale account team or the tenant details
in the dashboard rather than assuming it matches `tenant.name` — and confirm
captured traffic actually lands where you expect before relying on the
install.
:::

All five `tenant.*` fields are required together: a partial set (for example,
only `tenant.id` and `tenant.name`) counts as none, because the forwarder and
replay coordinator only consider the identity resolved once the stream and
every root-tenant field is non-empty. Neither component becomes ready until
then.

## Verify

```bash
proxymock cluster status --speedscale-namespace banking-app
```

This is read-only end to end — every permission probe is a
`SelfSubjectAccessReview`, which asks the API server's authorizer a question
rather than changing anything — and it always produces a full report, even
against a cluster it cannot reach. It checks, in order:

1. which kube context and Speedscale namespace the command resolved to
2. which components (forwarder, inspector, replay coordinator) are deployed
   and whether their pods are ready
3. whether the forwarder and inspector are actually reachable over a
   port-forward, naming the failing hop when they are not
4. whether your kubeconfig has the permissions `proxymock` needs in this
   namespace (denies are reported as warnings, not failures)
5. whether Speedscale cloud is configured and reachable

When the inspector is not reachable, the report also lists what depends on
it — logs, events, Services, dependencies, capture readiness verification,
and the web UI's workload detail tabs all need it.

```bash
proxymock cluster status --speedscale-namespace banking-app -o json
```

`$SPEEDSCALE_NAMESPACE` works the same as `--speedscale-namespace`, so a
shell session or CI job can set it once instead of repeating the flag on
every command. Every capture and replay verb in the
[sidecar capture](/guides/capture/sidecar-namespaced) and
[namespaced replay](/guides/replay/namespaced) guides accepts the same flag.

## What runs, and what deliberately does not

| Runs | Does not run |
|---|---|
| **forwarder** — receives captured traffic from sidecars, ships it to Speedscale cloud | `Namespace` — installing one needs cluster-scoped write |
| **inspector** — read-only workload inventory (pods, deployments, statefulsets, logs, events) for `proxymock` and the dashboard | `CustomResourceDefinition` — cluster-scoped, and shared with every other install |
| **replay coordinator** — drives replays from labeled `ConfigMap`s, injects and restores the sidecar on the workload under test | `MutatingWebhookConfiguration` / `ValidatingWebhookConfiguration` — intercepts every API call in the cluster |
| | `ClusterRole` / cluster role bindings — the exact grant this chart exists to avoid |
| | `DaemonSet` — no eBPF (`nettap`) capture; schedules a pod on every node |
| | `SecurityContextConstraints`, `PriorityClass` — cluster-scoped policy |

Every `Role` and `RoleBinding` the chart renders is namespaced to the release
namespace, and a static test (`tests/denylist.sh` in the chart repository)
renders the chart across a matrix of values and namespaces and fails the
build if any of the above ever appears, or if any object lands outside the
release namespace. The chart's own
security review pack (shipped with the chart; ask Speedscale support for the pack matching your version) —
an RBAC summary (every `Role` rule, by identity, with the reason it exists)
and a capabilities/images/secrets/network summary — is generated from the
same templates and is the right thing to hand your security reviewer instead
of walking them through the values file by hand.

Two settings are opt-in on purpose because they can make the chart
un-installable for the exact user it is written for: `inspector.metricsEnabled`
and `replayRuntime.metricsEnabled` each add a `metrics.k8s.io/pods` read rule,
and both default to **off**. Kubernetes refuses to let an installing identity
create a `Role` granting a permission it does not itself hold, so an
unconditional rule would make `helm install` fail outright for a namespace
admin who was never granted `metrics.k8s.io/pods`. Turn either on only if the
installing identity already holds that read; leaving them off costs per-pod
CPU/memory enrichment in reports and nothing else.
