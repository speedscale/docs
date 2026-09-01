---
title: Namespaced Uninstall & Recovery Runbooks
description: "Runbooks for the namespaced Speedscale install: an uninstall blocked by active capture or replay, forceCleanupOnUninstall, uninstall bypasses, coordinator-absent recovery, and a stuck uninstall hook Job."
sidebar_position: 1.6
---

# Namespaced Install: Uninstall & Recovery Runbooks

:::caution
This workflow is currently in preview status. Please provide feedback in our
[Slack community](https://slack.speedscale.com).
:::

These runbooks cover the ways an uninstall of the
[namespaced install](./kubernetes-namespaced.md) can go wrong, and how to
recover. They assume you've read the
[installation guide](./kubernetes-namespaced.md), the
[sidecar capture guide](/guides/capture/sidecar-namespaced), and the
[namespaced replay guide](/guides/replay/namespaced).

## Why uninstall can block at all

`helm uninstall` runs a `pre-delete` hook Job (`speedscale-uninstall`) before
Helm removes anything. That Job cancels any in-flight replays, waits for them
to finish tearing down, then scans for workloads still carrying an injected
sidecar — both the capture inventory `ConfigMap`s and the live pod template.
If either check fails, **the Job exits non-zero, `helm uninstall` fails, and
the release stays in place** — nothing is removed.

This exists because deleting the release out from under an instrumented
workload is a delayed outage, not an immediate one: the workload keeps
running until its **next restart**, at which point its pod template still
references a Secret volume (`speedscale-certs`, and the API key Secret) that
no longer exists, and the pod fails to schedule. See
[the Secrets-outlive-injection hazard](#the-secrets-outlive-injection-hazard)
below for the full mechanism.

## Runbook: uninstall blocked by active capture or replay

```bash
helm -n banking-app uninstall speedscale
# Error: resource Job/banking-app/speedscale-uninstall not ready. status:
# Failed, message: Job Failed. failed: 2/1
```

Helm's own error names the failed Job, not the reason. Read the Job's pod
logs for that:

```bash
kubectl -n banking-app logs job/speedscale-uninstall
```

```
speedscale pre-delete check FAILED for namespace banking-app

Traffic capture is still injected into 1 workload(s):
  - deployment/banking-api  (found via: inventory, sidecar)

Remove capture from each one, then run the uninstall again:

  proxymock cluster capture uninject --sidecar --namespace banking-app --speedscale-namespace banking-app --workload banking-api --workload-type deployment

The uninstall was stopped. Uninstalling now would delete the forwarder these sidecars
send traffic to and the coordinator that knows how to restore these workloads, and neither
comes back with a reinstall.

Resolve the items above and run the uninstall again, or set forceCleanupOnUninstall=true
to proceed anyway. Forcing records what it abandons in a ConfigMap named speedscale-uninstall-recovery
in this namespace, which survives the uninstall.
```

The output names the **exact command** to run for each affected workload —
copy it verbatim rather than reconstructing it. Run every command it lists,
confirm with
[`capture status --sidecar`](/guides/capture/sidecar-namespaced#readiness-verification)
that each workload is clean, cancel or wait out any replay still running
(`replay list` / `replay cancel --namespaced` /
[`replay wait`](/guides/replay/namespaced#reading-a-namespaced-replay)), then
retry:

```bash
helm -n banking-app uninstall speedscale
```

A workload found only `via: sidecar` (no inventory) or only `via: inventory`
(no live sidecar) still blocks the uninstall — the check treats either kind
of evidence as "still instrumented," because either one means a workload
still depends on something the uninstall is about to remove.

## `forceCleanupOnUninstall` and the recovery ConfigMap

Sometimes the right call is to proceed anyway — a workload the check flags
that you know is being decommissioned along with the namespace, for example.
Set `uninstall.forceCleanupOnUninstall=true` (or pass `--force` to the
underlying cleanup Job by upgrading the release with that value first) to let
`helm uninstall` proceed even though the check would otherwise refuse:

```bash
helm upgrade speedscale ./speedscale-namespaced -n banking-app \
  --reuse-values --set uninstall.forceCleanupOnUninstall=true
helm -n banking-app uninstall speedscale
```

:::warning Forcing does not clean anything up
`forceCleanupOnUninstall` does not remove sidecars, restore workloads, or
finish in-flight replays — it only permits the uninstall to proceed with all
of that left behind. Every workload the check would have blocked on keeps its
injected sidecar and its now-orphaned inventory `ConfigMap`, unaware that the
forwarder it sends traffic to and the coordinator that knows how to restore
it are both gone.
:::

Before it lets the uninstall proceed, force mode writes a
`speedscale-uninstall-recovery` `ConfigMap` in the namespace, listing exactly
what it abandoned. That `ConfigMap` is **not Helm-managed**, so it survives
the uninstall on purpose — it's the only record of what to go clean up by
hand afterward (removing sidecars with `capture uninject --sidecar` against
each workload it names, even though the coordinator that would normally
verify the revert is gone).

## Uninstall bypasses and their consequences

Two paths skip the `pre-delete` hook entirely, and neither one is blocked by
anything:

### `helm uninstall --no-hooks`

Skips the hook Job outright — no cancellation of in-flight replays, no
capture scan, no recovery `ConfigMap`. Equivalent to force mode with no
record left behind of what was abandoned.

### Deleting the namespace

`kubectl delete namespace banking-app` (or any process that deletes the
namespace directly, bypassing Helm) removes every object in it, hook Job
included, with no pre-delete check running at all.

### The Secrets-outlive-injection hazard

Either bypass leaves any workload still carrying an injected sidecar in the
**worst** state: still running, still configured to mount
`speedscale-certs` and the API key Secret as volumes and environment
sources — Secrets that the uninstall just deleted along with everything
else. The running pod keeps working, because Kubernetes does not tear down a
running pod when a Secret it mounted disappears. The failure arrives
later and looks unrelated to the uninstall: the **next** restart of that
workload — a routine rollout, a node drain, an OOM kill, anything — recreates
the pod from the same template, the kubelet cannot resolve the missing Secret
volume, and the pod fails to schedule.

Treat "no workload anywhere in this namespace still carries a Speedscale
sidecar" as a hard precondition for `--no-hooks` or a namespace deletion,
verified with
[`capture status --sidecar`](/guides/capture/sidecar-namespaced#readiness-verification)
against every workload first — the same check the hook Job would have made
for you.

## Coordinator-absent recovery {#coordinator-absent-recovery}

If the replay coordinator itself is gone — crashed, evicted, or removed —
before it could finish tearing down a replay, that replay's request is left
holding a cleanup finalizer with no coordinator left to remove it. This also
blocks a subsequent uninstall, because the finalizer keeps the `ConfigMap`
from ever being deleted.

```bash
proxymock cluster replay recover-finalizers --speedscale-namespace banking-app
```

By default this is a dry run: it lists every replay request still holding
the finalizer and, for each, what the coordinator may not have finished
(workload not yet restored, generator/responder/collector not yet torn
down) — derived from how far that replay actually got. Review that list,
clean up anything it names by hand (typically
`capture uninject --sidecar` against the affected workload), then confirm:

```bash
proxymock cluster replay recover-finalizers --speedscale-namespace banking-app --confirm
```

See the [namespaced replay guide](/guides/replay/namespaced#recovering-from-a-departed-coordinator)
for the full command reference. Against a healthy install this finds nothing.

## Cleaning up a failed hook Job

The Job carries `ttlSecondsAfterFinished: 60`, which the Kubernetes TTL
controller applies only to a Job that **succeeded**. A failed Job is left in
place on purpose — its pod logs are the only record of why the uninstall
refused — and Helm will not remove it either, because the release it belongs
to was never actually deleted. Retrying the uninstall without cleaning up
first fails again, on the same stale Job:

```bash
kubectl -n banking-app logs job/speedscale-uninstall   # read why it failed, and fix that
kubectl -n banking-app delete job speedscale-uninstall  # then clear it
helm -n banking-app uninstall speedscale                # retry
```

The Job's `helm.sh/hook-delete-policy` includes `before-hook-creation`, so a
retry would replace the old Job automatically anyway — deleting it by hand
just makes the next attempt's logs unambiguous rather than mixed with a
previous run's.

:::note An image without the cleanup subcommand also blocks uninstall
The hook Job invokes the operator image's `namespaced-cleanup` subcommand. An
older image that predates it exits non-zero the same way an active-capture
check does, and blocks the uninstall identically. If the logs show a
`StartError` with no further output rather than one of the messages above,
confirm `image.tag` in your values points at an image that actually ships
`namespaced-cleanup`.
:::
