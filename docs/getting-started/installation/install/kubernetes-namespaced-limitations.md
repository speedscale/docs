---
title: Namespaced Limitations & Compatibility
description: "What the namespaced Speedscale install does not do: supported workload kinds, replay resource contention, opt-in metrics enrichment, mesh support, and image pinning."
sidebar_position: 1.7
---

# Namespaced Install: Limitations & Compatibility

The [namespaced install](./kubernetes-namespaced.md) holds no permission or component outside one namespace. The constraints below follow from that scope; the final sections record behavior tested with released chart 2.5.1145. If your workload needs a cluster-scoped component, use the [classic operator install](./kubernetes-operator.md).

## Workload kinds: Deployments and StatefulSets only

Both [sidecar capture](/guides/capture/sidecar-namespaced) and [namespaced replay](/guides/replay/namespaced) support `Deployment` and `StatefulSet` workloads only. The replay coordinator's RBAC enforces this: its `Role` grants `create`/`delete` on `deployments`, but only `get`/`list`/`watch`/`update`/`patch` on `statefulsets`; there is **no create or delete** on a `StatefulSet`, so the coordinator can patch and restore one but can never destroy a customer workload of that kind. `DaemonSet`s, `ReplicaSet`s (managed indirectly, through their owning `Deployment`) and `Job`/`CronJob`-managed pods are not supported targets for injection or replay.

## Replay runs in the application namespace

A namespaced install has nowhere else to run a replay: the generator, responder and collector all land in the **same namespace as the workload under test**, sharing its `ResourceQuota` and `LimitRange` if it has one, and competing for the same node capacity as the production traffic that namespace serves.

- **Check quota headroom before replaying.** A `ResourceQuota` rejection mid-provisioning can leave a replay's responder or generator half-created; `proxymock cluster status` reports permissions but does not currently preflight quota headroom, so check it yourself (`kubectl -n banking-app describe resourcequota`) before a replay large enough to matter.
- **There is no `PriorityClass`.** `pdb.enabled` is also off by default: at the chart's assumed `replicas: 1`, a `PodDisruptionBudget` would block node drains rather than protect anything. Nothing in this install signals to the scheduler that a replay's pods matter less than the application's; under node pressure, eviction is decided the same way it would be for any other pod in the namespace.
- **Start in a staging namespace.** Because replay pods share fate with the application they're testing, run your first namespaced replays against a staging or pre-production copy of the workload before pointing one at a namespace that also carries live production traffic.

## Metrics enrichment is opt-in, everywhere

Per-pod CPU/memory enrichment in replay reports depends on a `metrics.k8s.io/pods` read, which is **off by default** in both places that can grant it: `namespaced.inspector.metricsEnabled` and `namespaced.replayRuntime.metricsEnabled`. This isn't a conservative default you're expected to flip on right away: Kubernetes RBAC's escalation-prevention rule means the API server refuses to let an installing identity create a `Role` granting a permission it does not itself hold, so an *unconditional* rule would make `helm install` fail outright for a namespace admin who was never granted that read (this was observed directly in end-to-end testing). A cluster with no metrics-server at all has no such API regardless. Turn either value on only if the identity installing the chart already holds `metrics.k8s.io/pods` read in the namespace; leaving both off costs per-pod resource enrichment in reports and nothing else. The collector and report reader degrade on a 403 or a missing API rather than failing the replay.

## No eBPF capture, and no cluster-wide topology

[eBPF capture](/reference/ebpf-traffic-collection) needs a `DaemonSet` on every node plus node-level access, both of which are exactly what this chart exists to avoid asking for. It is not available on a namespaced install at any settings. Capture is [sidecar-only](/guides/capture/sidecar-namespaced).

That has a second-order effect worth knowing about: several `proxymock cluster` read commands (`topology`, `namespaces`, `nodes`, `workloads`, `pods`) are served by the forwarder's aggregator, which only knows about workloads and pods `nettap` has **observed**. With no `nettap` running, those commands report little or nothing useful on a namespaced install. The commands served by the **inspector** instead (`logs`, `events`, `services`, `dependencies`, and capture/replay readiness) read the API server directly under their own `ServiceAccount` and are unaffected.

## Service mesh: Istio only, and ambient/CNI mode must be stated explicitly

The sidecar mutation the namespaced install performs models exactly two mesh signals: Istio, and Cilium's node-address exclusions. Interactions with Linkerd, Consul Connect, and other service meshes have not been validated; their traffic interception may conflict with Speedscale's `iptables` rules.

Within Istio, only the **classic sidecar** data plane is auto-detected, from an `istio-init` container already present on the pod template, which needs no cluster-scoped read. Istio's **CNI/ambient** data plane leaves no such container to detect, and the cluster-wide, namespace-label-based Istio discovery the classic install can use (`kube.DetectIstio` / `kube.DiscoverIstio`) is deliberately not available on this path; it is a `Namespace` read, which a namespaced install's RBAC does not extend to. State ambient/CNI mode explicitly instead:

```bash
proxymock cluster capture inject --sidecar --istio-cni \
  --namespace banking-app --speedscale-namespace banking-app \
  --workload banking-api
```

Cilium works the same way: node addresses that health probes arrive from cannot be enumerated (that's a `CiliumNode` cluster-scoped read too), so pass them explicitly with `--cilium-exclusion-cidrs` on a Cilium cluster.

## Image pinning

Every image the chart itself renders (`forwarder`, `inspector`, and `operator` for the replay coordinator and the uninstall hook) is pulled from `namespaced.image.registry` at `namespaced.image.tag`, one version pin for the whole install. The replay coordinator additionally pulls `generator`, `responder`, `collector`, `goproxy`, and `redis` **at replay time**. Redis uses its own version tag, currently `7.4`, unless you configure an image override. If your registry is air-gapped or allowlisted, mirror all of those (not only the three the chart deploys continuously) before your first namespaced replay, or it will fail trying to pull an image your registry doesn't have. `namespaced.image.pullSecrets` references pre-existing pull Secrets the same way `namespaced.apiKeySecret` does; the chart never creates one.

`namespaced.tls.jks.image` (`amazoncorretto:23` by default, only rendered when `namespaced.tls.createJKS` is set) is prefixed with the same `namespaced.image.registry`, so an air-gapped mirror needs no separate setting for it.

## Restricted egress in 2.5.1145

The public 2.5.1145 chart passed a minikube test with Calico default-deny egress and a namespace-local proxy allowing only `app.speedscale.com`, `staging.speedscale.com`, and `dev.speedscale.com`. With `namespaced.forwarder.primaryTransport=cloud`, sidecar capture and full replay with mocks completed. The proxy recorded Speedscale Pod calls to `dev.speedscale.com` and no AWS CONNECT from those Pods, including after the replay coordinator restarted. The test workload's direct external call timed out; deliberate S3 and Firehose calls through the proxy received 403. In 2.5.1133, the replay coordinator still attempted Firehose under the same policy, so upgrade before using this egress configuration.

After the dev tenant's forwarder registration limit was raised, a fresh restricted-egress test with the same released chart confirmed Cloud persistence through the proxy. Three sidecar-captured requests produced six records in dev Cloud: three inbound requests and three outbound dependency calls. Retrieving the full records confirmed the application and dependency response bodies. This verifies the Cloud API storage path in minikube; the Cloud dashboard UI and customer-owned BYOC storage were not tested. The test policy allowed any Pod in the namespace to reach the proxy, so a customer policy must separately restrict that access to approved Speedscale Pods.

## Mocked replay on RollingUpdate Deployments in 2.5.1145

Full replay with a mocked outbound dependency passed at 100% on a default RollingUpdate Deployment in both the plain and default-deny firewall minikube tests. The real dependency had zero replicas; the replayed app received the recorded mock response, and cleanup restored sidecar capture. The 2.5.1145 coordinator waited for the old Pod to leave before starting the generator. The same workload intermittently failed on 2.5.1133 while old and new Pods overlapped. Namespace-only replay and customer-owned BYOC report storage remain separate workflows.
