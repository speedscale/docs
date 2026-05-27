---
title: Connect Topology to a cluster
description: "How proxymock web's Topology view connects to a Speedscale forwarder via auto port-forward or Speedscale Cloud, and how to troubleshoot when it can't."
sidebar_position: 9
---

# Connect Topology to a cluster

The **Topology** and **Nodes** tabs in `proxymock web` read live cluster
telemetry from a Speedscale **forwarder** running inside your Kubernetes
cluster. The forwarder itself is the same in both viewing paths — only
the transport between it and your screen differs.

`proxymock web` does the local plumbing for you: by default, it
auto-port-forwards to `speedscale-forwarder` in the `speedscale`
namespace using your current kube-context. When that works, you don't
need to do anything. When it doesn't, the in-app chooser lets you fall
back to Speedscale Cloud, or surfaces what to fix.

## Path 1 — Auto port-forward (default)

```
[Forwarder pod] ◀── kubectl port-forward (auto) ──▶ [proxymock web] ──▶ [Your browser]
```

On startup, `proxymock web` opens a stable local listener, port-forwards
through your kubeconfig to the `speedscale-forwarder` pod's gRPC port
(`8888`), and tells the embedded server to dial that listener. The
supervisor reconnects with exponential backoff if the SPDY connection
dies (pod restart, apiserver blip, transient network failure).

Best when: you have authenticated `kubectl` access to the cluster.

### Pick a different kube-context

```bash
proxymock web --kube-context=my-other-context
```

Defaults to the current context if omitted. Ignored when
`--forwarder-addr` is set explicitly (see below).

### Skip the auto port-forward

Pass an explicit address:

```bash
proxymock web --forwarder-addr=localhost:8888
```

This is what you want when something else is already exposing the
forwarder (a tunnel, an SSH port-forward, a previously running
`kubectl port-forward`, a forwarder reachable directly on a flat
network, etc.). When `--forwarder-addr` is set, auto port-forward and
`--kube-context` are both ignored.

### Disable the Observability surface entirely

```bash
proxymock web --forwarder-addr=""
```

Explicit empty value opts out. Use this on a machine without cluster
access where you only want the local replay/mock workflows.

## Path 2 — Speedscale Cloud

```
[Forwarder pod] ──egress──▶ [Speedscale Cloud] ──▶ [Your browser]
```

The forwarder ships telemetry to Speedscale Cloud, and you view it at
[app.speedscale.com](https://app.speedscale.com). No connection between
your laptop and the cluster is needed — just cluster egress to
Speedscale Cloud.

Best when: you don't have direct cluster credentials on the machine
you're viewing from.

In the in-app chooser, **Open Dashboard** takes you straight there.

## Troubleshooting

The chooser appears whenever the local view can't reach the forwarder.
It distinguishes two states:

- **"Topology is offline"** — the auto port-forward is in place but the
  upstream gRPC dial is failing. The supervisor is reconnecting in the
  background; **Retry connection** re-pings immediately. Common causes:
  the forwarder pod is restarting, the apiserver dropped the SPDY
  connection, the cluster lost connectivity. Usually self-heals.

- **"Topology isn't connected"** — auto port-forward failed at startup,
  or you opted out with `--forwarder-addr=""`. The fix is a process
  restart, so the card is muted and there is no Retry button. Check the
  `proxymock web` stderr for the exact failure — typical messages
  include "load kubeconfig", "no such context", or "no pods matched
  app=speedscale-forwarder".

### Diagnostic command

Both states show:

```bash
kubectl get svc speedscale-forwarder -n speedscale
```

If this succeeds, you have credentials to the cluster and the forwarder
service exists. If it fails, fix the access problem first — restart
`proxymock web` afterward if you're in the "not connected" state.

### Switching paths

Both paths can coexist. If your machine loses cluster credentials, fall
back to Speedscale Cloud; if Cloud is unreachable from your network,
fall back to the local auto port-forward. The chooser appears whenever
the local view can't reach the forwarder, so you can always switch.
