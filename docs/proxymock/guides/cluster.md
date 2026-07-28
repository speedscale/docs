---
title: Work a Kubernetes Cluster from the CLI
description: "Use the proxymock cluster verbs to turn eBPF traffic capture on and off for a workload, run a recorded replay inside the cluster, and read topology, pod logs, and Kubernetes events, all from your kubeconfig. The same surface is available as the cluster MCP tool and the proxymock web Observability view."
sidebar_position: 13
---

# Work a Kubernetes Cluster from the CLI

`proxymock cluster` drives the Kubernetes cluster your kubeconfig points at without leaving the terminal. It turns eBPF traffic capture on and off for a workload, runs a recorded replay inside the cluster, and reads the service map, pod logs, and Kubernetes events.

This is the same surface three ways: the `cluster` verbs here, the grouped `cluster` MCP tool (one tool with an `action` for each verb, so an AI agent can drive it), and the [Topology and cluster visibility](./observability.md) view in `proxymock web`. Pick whichever fits the task; they read and write the same cluster state.

## How proxymock reaches the cluster

Two kinds of connection are in play, and they need different access:

- **Capture verbs write straight to the cluster from your kubeconfig.** `cluster capture` patches `capture.speedscale.com/*` annotations onto a workload. That needs no Speedscale account and no registered inspector; it records intent, and the in-cluster Speedscale operator and nettap daemon do the actual capture when they see the annotations.
- **Read verbs are served by Speedscale components running in the cluster.** proxymock finds the in-cluster forwarder and inspector and port-forwards to them using the selected kube-context. That is automatic and needs no configuration. The topology-style reads come from the forwarder's aggregator; logs, events, services, and dependencies come from the inspector.

`cluster replay start` is the one verb that also needs a Speedscale cloud login, because the in-cluster generator replays a snapshot pulled from the cloud rather than from local files. Every other verb runs from your kubeconfig alone.

Use `--kube-context` on any verb to target a context other than your current one:

```shell
proxymock cluster topology --namespace banking-app --kube-context my-other-context
```

The workload flags are shared across the verbs that target one workload: `-n/--namespace` (default `default`), `--workload`, and `--workload-type` (one of `deployment`, `statefulset`, `daemonset`, `replicaset`, `job`, or `rollout`, default `deployment`).

## Turn capture on and off {#capture}

`cluster capture` controls eBPF capture for a single workload and reports its current state.

```shell
# turn capture on for a deployment
proxymock cluster capture inject --namespace banking-app --workload banking-gateway

# check whether capture is on
proxymock cluster capture status -n banking-app --workload banking-gateway

# turn capture off
proxymock cluster capture uninject -n banking-app --workload banking-gateway
```

eBPF capture attaches to running pods, so `inject` does not restart the workload. `status` reads the annotations back and reports whether capture is on, whether the Java agent is enabled, which ports are excluded, and whether the workload looks like it runs a JVM. That JVM guess comes from the pod template and is advisory: it only tells you whether `--java-agent` would do anything.

Two flags shape what gets captured:

- `--ignore-ports` leaves ports out of capture, for example a health-check port: `--ignore-ports 8080,9090`.
- `--java-agent` also injects the Java agent for JVM workloads. Unlike eBPF injection, this **restarts the workload**, because the agent is added by the admission webhook and only loads into pods created after the change.

`inject` is idempotent, and it clears any conflicting `sidecar.speedscale.com/*` annotations first so the two capture modes never coexist. Annotating a cluster that has no operator or nettap installed has no effect: the annotations record intent, and something in the cluster has to act on them.

## Replay a recording inside the cluster {#replay}

`cluster replay` runs recorded traffic against a workload from inside the cluster. The Speedscale operator provisions the generator that sends the traffic and, when you mock dependencies, the responder that answers them.

Start with `prepare`. It analyzes local recordings with the same analyzer the cloud uses and prints the two lists a replay is configured from, entirely offline:

```shell
proxymock cluster replay prepare --in ./proxymock/recorded-2026-07-22
```

- **inbound** slices are the traffic that can be routed at a target.
- **outbound** dependencies are what can be mocked.

The keys it prints are exactly the keys `start` accepts, so run `prepare` first to find out what to pass.

`start` pushes the selected recordings to Speedscale cloud as a snapshot and creates the `TrafficReplay` that runs them in the cluster. Pick exactly one destination shape:

```shell
# replay against a workload, mocking its database
proxymock cluster replay start -n banking-app --workload banking-user \
  --mock 'postgres:banking-postgres:5432'

# replay against a plain address, and block until it finishes
proxymock cluster replay start --target http://banking-frontend.banking-app:80 --wait
```

- `--workload NAME` replays against a workload in the cluster. Only this shape can mock dependencies, and only this shape reports on the workload's own behavior.
- `--target URL` replays against a single address. Nothing in the cluster is modified and nothing is mocked.

`--mock` takes an outbound dependency key from `prepare`; repeat it to mock more than one. Mocking a dependency makes the responder answer it from the recording instead of letting the workload reach the real thing, which is what makes a replay repeatable. `--route SLICE=WORKLOAD` splits the recording so one inbound slice goes to its own workload; every slice goes to exactly one destination. To reuse a snapshot already in the cloud, pass `--snapshot-id` instead of pushing again.

Watch and tear down a running replay with the remaining verbs:

```shell
proxymock cluster replay status          # where a replay is, or what is running now
proxymock cluster replay logs            # tail the generator, responder, and SUT logs
proxymock cluster replay cancel          # tear a running replay down
```

## Read topology, logs, and events {#read}

The read verbs are for troubleshooting a workload without switching to `kubectl`. They target a namespace or a single workload and take the same `-o/--output` formats as the rest of the CLI (`pretty`, `json`, `yaml`, `csv`).

```shell
# the service map for a namespace
proxymock cluster topology --namespace banking-app

# list what the forwarder and cluster see
proxymock cluster workloads -n banking-app
proxymock cluster pods -n banking-app
proxymock cluster services -n banking-app
proxymock cluster nodes
proxymock cluster namespaces

# a workload's dependencies, logs, and events
proxymock cluster dependencies -n banking-app --workload banking-user
proxymock cluster logs -n banking-app --workload banking-frontend --tail 50 --since 300
proxymock cluster events -n banking-app --workload banking-user
```

`logs` reads every pod of a workload by default; narrow it with `--pod`, pick a container with `--container`, and read a crashed container's last output with `--previous` (the only way to see why a `CrashLoopBackOff` pod died). Because logs are served by the in-cluster inspector under its own ServiceAccount, this works even when your own kubeconfig cannot read pod logs directly.

### One distinction that trips people up

The two backends see the cluster differently, and it is worth knowing which verb reads which:

- **Topology-style reads come from the forwarder's aggregator**, built from what nettap has observed on the wire. They show real connections rather than declared ones, so a workload nettap has not seen any traffic for will not appear.
- **Logs, events, services, and dependencies come from the inspector**, which reads the apiserver.

So a freshly scaled workload can legitimately show fewer pods in the topology than in `pods` or `services`: nettap has not observed traffic to the new pods yet, but the apiserver already lists them. This is expected, not a bug.

`topology` accepts `--forwarder-addr` as a narrow escape hatch when you are already port-forwarding to a forwarder yourself; leave it unset and proxymock does the port-forward for you.

## Next steps

- [Topology and cluster visibility](./observability.md) walks the same reads in `proxymock web`, with the workload drawer and Resources views.
- [Explore and Replay Sessions Locally](./sessions.md) covers the local record-and-replay loop the in-cluster replay is built on.
- The [proxymock CLI reference](/reference/proxymock-cli-reference.md#kubernetes-cluster-commands) lists every `cluster` flag, and the [MCP Tools reference](../how-it-works/mcp-tools.md) documents the `cluster` tool's actions.
