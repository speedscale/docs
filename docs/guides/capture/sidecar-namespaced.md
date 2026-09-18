---
title: Sidecar Capture (Namespaced Installs)
description: "Turn traffic capture on and off with the proxymock CLI's --sidecar flow, the mechanism a namespaced Speedscale install uses in place of the cluster-wide admission webhook."
sidebar_position: 5
---

# Sidecar Capture for Namespaced Installs

:::caution
This workflow is currently in preview status. Please provide feedback in our
[Slack community](https://slack.speedscale.com).
:::

A [namespaced install](/getting-started/installation/install/kubernetes-namespaced)
has no cluster-wide admission webhook, so nothing in the cluster mutates a
workload for you. Instead, `proxymock cluster capture` computes the same
`goproxy` sidecar mutation the webhook would perform and applies it directly
with your own kubeconfig, when you pass `--sidecar`.

```bash
proxymock cluster capture inject --sidecar \
  --namespace banking-app --speedscale-namespace banking-app \
  --workload banking-api

proxymock cluster capture status --sidecar \
  --namespace banking-app --speedscale-namespace banking-app \
  --workload banking-api

proxymock cluster capture uninject --sidecar \
  --namespace banking-app --speedscale-namespace banking-app \
  --workload banking-api
```

`--namespace` (the workload's namespace) and `--speedscale-namespace` (where
the Speedscale data plane lives) must be the same namespace on a namespaced
install — `proxymock` rejects the command otherwise, since there is no
cluster-wide data plane left to serve a mismatched request. `$SPEEDSCALE_NAMESPACE`
works in place of the flag. `--workload-type` defaults to `deployment`;
sidecar capture supports **Deployments and StatefulSets only**.

:::info Two capture mechanisms, one flag
Without `--sidecar`, these same three verbs patch `capture.speedscale.com/*`
annotations instead — that's eBPF capture, which needs the classic install's
cluster-wide `nettap` `DaemonSet` and has no effect on a namespaced install
with no such `DaemonSet` running. `--sidecar` is what makes capture work with
no cluster-wide component at all.
:::

## Rollout implications

Injecting or removing a sidecar **restarts the workload**, because a sidecar
container only joins a pod at creation — there is no way to add or remove one
from a pod that is already running. `inject --java-agent` on a non-sidecar
capture also restarts the workload for the same reason (the agent is injected
by the webhook and only loads into pods created after the change); every
other eBPF verb attaches to running pods without a restart.

Both mutating verbs default to `--wait=true`: the command blocks until the
rollout finishes, and for `inject`, until the sidecar is verified up in every
pod, before returning. A command that returned before the rollout completed
would report success for a workload that has not started capturing anything
yet — and might never, if the rollout is stuck. Pass `--wait=false` for a
fire-and-forget change, and `--timeout` (default `5m`) to change how long
`--wait` waits before reporting the rollout as still in progress.

Both verbs are also **idempotent**: injecting an already-captured workload
with the same configuration changes nothing and triggers no rollout;
uninjecting a workload that was never captured is a no-op.

## Readiness verification

`capture status --sidecar` and a waited `inject --sidecar` both report
per-pod sidecar readiness — how many of the workload's pods are running a
*ready* Speedscale sidecar, not just how many carry the container. That
signal comes from the in-cluster **inspector**, never from this process
directly. Three alternatives were considered and rejected because they need a
privilege or network path a namespaced-install user cannot be assumed to
have:

- `pods/exec` into the workload is a near-root permission on someone else's
  application container, and most namespaced installs deliberately withhold
  it.
- Scraping the `goproxy` log means matching message text that is not a
  contract and changes between releases.
- Dialing the sidecar's readiness port from your workstation needs a route to
  the pod IP that only exists inside the cluster, and is blocked outright
  under a service mesh — exactly where verifying injection matters most.

When the inspector is not reachable, readiness reports as **unknown**, which
is a different fact from "not ready" — check it with
[`proxymock cluster status`](/getting-started/installation/install/kubernetes-namespaced#verify)
first.

## GitOps detection

A workload under continuous reconciliation by Argo CD or Flux is not
`proxymock`'s to edit: the controller sees an injected sidecar as drift and
reverts it, usually within a minute — stripping the sidecar without touching
the inventory `ConfigMap`, so a later `uninject` finds a workload it no
longer recognizes and reports conflicts you did nothing to cause.

Both `inject` and `uninject` detect Argo CD and Flux ownership from the
workload's own labels and annotations (no CRD read, no controller discovery)
and **refuse** rather than half-apply:

```
refusing to inject: this workload is managed by Argo CD (Application
"banking-api"), which will revert this inject on its next sync. pause
auto-sync first (`argocd app set banking-api --sync-policy none`), then re-run,
or pass --force to inject anyway.
```

`capture status --sidecar` prints the same warning proactively, so you can
find out a controller owns the workload without attempting a mutation first.
Pass `--force` to proceed anyway — for example, immediately after you've
paused the controller yourself. The bare `app.kubernetes.io/instance` label
is *not* treated as Argo CD ownership on its own: it's a standard label Helm
and Kustomize both set, so treating it as ownership would refuse to inject
into workloads no GitOps controller actually touches. It only counts
alongside Argo CD's own tracking annotation.

## The inventory ConfigMap

Every field `inject --sidecar` changes is recorded in a `ConfigMap` in the
**workload's own namespace** — never in the Speedscale namespace, and never
as an annotation on the workload itself. Two things drive that:

- An `uninject` may happen months later, from a different machine, with no
  Speedscale cloud in the picture. The only thing guaranteed to still be
  there is the namespace the workload is in.
- Writing the inventory onto the workload it describes would make the
  object's own digest self-referential, and annotations share a single
  256 KiB budget with everything else on the object.

The join key is the workload's UID, not its name — a delete-and-recreate
reuses the name but never the UID, so a revert never applies to a workload
that no longer exists. `uninject --sidecar` reads this `ConfigMap` and puts
every recorded field back exactly as it found it, then deletes the inventory.
**If anything has changed since injection, `uninject` refuses** rather than
guessing, and reports each conflicting field with what to do about it:

```bash
proxymock cluster capture uninject --sidecar -n banking-app --workload banking-api
# refusing to uninject banking-app/banking-api: it has changed since injection
#   spec.template.spec.containers[0].resources (containerResources, owned by kubectl)
#       someone changed this field after injection; reverting would discard their
#       change. Restore the field to the value Speedscale wrote, or remove the
#       sidecar by hand and delete the inventory ConfigMap.
```

`capture status --sidecar` reports drift before you attempt an `uninject`, so
you can see it coming.

## Coexisting with the classic webhook

`inject` (without `--sidecar`) always clears any conflicting
`sidecar.speedscale.com/*` annotations first, so the two capture modes never
end up fighting over the same workload. Going the other direction — `inject
--sidecar` on a workload a **classic** install's webhook also watches — is
worth knowing about even though it isn't the namespaced install's normal
case: the webhook re-evaluates the workload on the very `Update` that applies
the mutation, and a workload carrying a sidecar with no matching
`sidecar.speedscale.com/inject: "true"` annotation is one the webhook strips.
`proxymock` accounts for this by writing that annotation itself as part of
`--sidecar` injection (and restoring whatever value — or absence — it found
there on `uninject`), so the mutation survives the webhook's own
re-evaluation rather than being immediately undone by it.
