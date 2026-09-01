---
title: Namespaced Replay
description: "Run a replay against a workload from a namespaced Speedscale install using ConfigMap-driven replay requests instead of the TrafficReplay CRD."
sidebar_position: 2.5
---

# Replay on a Namespaced Install

:::caution
This workflow is currently in preview status. Please provide feedback in our
[Slack community](https://slack.speedscale.com).
:::

A [namespaced install](/getting-started/installation/install/kubernetes-namespaced)
cannot have the `TrafficReplay` [CRD](/reference/replay-crd) — CRDs are
cluster-scoped, and shared with every other install on the cluster. Instead,
the in-cluster **replay coordinator** drives replays from a labeled
`ConfigMap`, addressed by `--namespaced` on `replay start` and
`replay cancel`. `replay get`, `replay list`, `replay wait` and
`replay recover-finalizers` address these ConfigMap-driven replay requests
only, so they need no `--namespaced` flag of their own — the classic
`replay status` and plain `replay cancel` (for a `TrafficReplay`) are
untouched by any of this.

## Starting a replay

The classic `replay start` pushes your recordings to Speedscale cloud as a
snapshot. `--namespaced` never leaves the cluster: it takes its traffic from
a snapshot document already staged locally, so it needs no login.

```bash
proxymock cluster replay start --namespaced \
  --speedscale-namespace banking-app \
  --namespace banking-app --workload banking-api \
  --snapshot-id d6b13639-a93b-472e-b2fd-f397d1c37018 \
  --snapshot-file ~/.speedscale/data/snapshots/d6b13639-a93b-472e-b2fd-f397d1c37018.json \
  --wait
```

- `--snapshot-file PATH` stages a snapshot document as a `ConfigMap` alongside
  the replay request.
- `--snapshot-id ID` alone (no `--snapshot-file`) references a snapshot
  already staged in the cluster; the coordinator resolves it.
- `--mode` selects `full-replay`, `responder-only` or `generator-only`
  (default `full-replay`).
- `--test-config-id` picks the generator/responder configuration to run with
  (default: the platform default).
- `--request-name` names the replay request object (default: generated).
- `--wait` blocks until the replay reaches a terminal state, printing each
  stage as it's reached; `--timeout` bounds how long it waits.

`--target` is **not available** with `--namespaced`: the coordinator injects
one workload and restores it afterward, and a bare address is not something
it can inject into. A namespaced replay drives exactly one workload — routes
aimed elsewhere are refused rather than half-applied.

## Snapshot staging and its size budget

A snapshot staged with `--snapshot-file` is serialized into a `ConfigMap`,
which the Kubernetes API server caps at 1 MiB for the whole object.
`proxymock` enforces a tighter **900 KiB** budget on the snapshot document
itself, leaving headroom for the object's own metadata:

```
snapshot d6b13639-a93b-472e-b2fd-f397d1c37018 serializes to 1048201 bytes, over
the 921600 byte ConfigMap budget. Trim the recording (fewer services, a
shorter window) and push again, or stage the snapshot outside the request and
pass --snapshot-id alone so the coordinator resolves it
```

Trim the recording (fewer services in scope, a shorter capture window) and
try again, or stage the snapshot by another means and pass `--snapshot-id`
alone. In practice, small stub or synthetic snapshots (well under a few
kilobytes) are the ones most likely to fail for the *opposite* reason: a
generator with too little real traffic to run against fails fast with
`Job has reached the specified backoff limit` rather than a size error. Give
the generator a snapshot with real recorded traffic in it, not just a minimal
placeholder.

## Reading a namespaced replay

```bash
proxymock cluster replay get replay-quiet-otter --speedscale-namespace banking-app
proxymock cluster replay list --speedscale-namespace banking-app
proxymock cluster replay wait replay-quiet-otter --timeout 15m
```

- **`get <name>`** prints one replay request's current state, the
  coordinator's condition history, and its last progress message. Everything
  is read from the cluster, so this is also how you pick a replay back up
  after losing the process that started it — nothing about a namespaced
  replay is remembered on your machine.
- **`list`** shows every replay request in the Speedscale namespace, running
  or finished, scoped by a replay-request label rather than a name prefix —
  so an unrelated `ConfigMap` sharing the namespace is never reported as a
  replay. Unlike a `TrafficReplay`, a replay request has **no TTL garbage
  collection**: a finished one stays until someone deletes it, which is what
  makes its terminal state readable long after the fact.
- **`wait <name>`** blocks until the request reaches `Succeeded`, `Failed` or
  `Cancelled`, printing each condition as the coordinator appends it. The
  exit status is the verdict — zero for `Succeeded`, nonzero otherwise — so a
  CI job can wait on a replay without parsing its output. There is no
  client-side cursor: each poll rebuilds the picture from the request itself,
  so interrupting `wait` and re-running it just re-prints the history.

## Cancelling

```bash
proxymock cluster replay cancel --namespaced \
  --speedscale-namespace banking-app -n banking-app \
  replay-quiet-otter --wait
```

This writes `cancelled` into the replay request's `desiredState` — the only
field a client owns — rather than deleting anything. The coordinator sees it
and runs the same teardown it would run at the end of a successful replay, so
the workload is **restored**, not abandoned. Cancel is valid from every
non-terminal state and is one-way: to run the replay again, start a new one.

## What the coordinator does

The replay coordinator is the single component that turns a replay request
into a running replay:

1. **Admits** the request — acquires the target workload by UID, so two
   requests can never patch the same workload at once.
2. **Provisions** the replay's own components: a responder `Deployment` (when
   you're mocking dependencies) and its `Service`, and a generator `Job`.
3. **Injects** the same sidecar mutation
   [sidecar capture](/guides/capture/sidecar-namespaced) performs, recording
   it in the same per-workload inventory `ConfigMap`.
4. Watches the generator to completion (or failure), reporting progress as
   conditions on the request.
5. **Restores** the workload from the inventory and deletes the components it
   created, whether the replay succeeded, failed, or was cancelled.

Only one coordinator replica is assumed: the workload lease that keeps two
replays from patching one workload at once lives in the coordinator's memory
(`replayCoordinator.leaseEnabled` opts into a `coordination.k8s.io` `Lease`
for a leader-elected, multi-replica coordinator instead).

## Replay-over-capture

Running a replay against a workload that already has sidecar capture
injected does not stack a second sidecar on top, and it does not leave the
workload in the replay's sidecar configuration once the replay ends. The
coordinator's inventory covers whatever state it found when the replay
started — including a workload already carrying an `inject --sidecar` from
the [capture guide](/guides/capture/sidecar-namespaced) — so tearing down at
the end of the replay restores the workload to that pre-replay captured
state, not to its uninstrumented original. A replay never undoes a capture
session it didn't start.

## Recovering from a departed coordinator

`replay recover-finalizers` exists for one situation: the coordinator that
was running a replay is gone (crashed, evicted, uninstalled) and a replay
request is stuck holding its cleanup finalizer, which blocks the request from
being deleted.

```bash
proxymock cluster replay recover-finalizers --speedscale-namespace banking-app
```

Run with no flags, this is a **dry run** — it reports what it finds and
changes nothing. That default is deliberate: the finalizer is the guarantee
that an interrupted teardown gets another chance, and stripping it by hand is
an admission that no coordinator is coming back to finish restoring the
workload. Each item in the report names what may be stranded, derived from
how far that replay actually got — so you know what to check by hand before
confirming. Only pass `--confirm` once you've reviewed that:

```bash
proxymock cluster replay recover-finalizers --speedscale-namespace banking-app --confirm
# scope to one request instead of the whole namespace:
proxymock cluster replay recover-finalizers --speedscale-namespace banking-app \
  --request-name replay-quiet-otter --confirm
```

Against a healthy install this finds nothing and changes nothing — it only
ever touches labeled replay requests, so other finalizer-bearing objects in
the namespace are never in scope. See
[Coordinator-absent recovery](/getting-started/installation/install/kubernetes-namespaced-runbooks#coordinator-absent-recovery)
for the fuller recovery runbook this command is part of.
