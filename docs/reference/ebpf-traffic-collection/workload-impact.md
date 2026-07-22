---
description: "Understand how Speedscale's eBPF collector affects captured applications, including latency, CPU attribution, progressive delivery, and failure behavior."
sidebar_position: 2
---

# Workload Impact

This page answers the question application teams ask before enabling capture in production: what does the eBPF collector do to my workload? For the collector's own resource footprint and how to size it, see [Collector Resource Utilization](resource-utilization.md).

## Latency

`nettap` is a passive observer. It does not sit in the data path, terminate connections, or proxy traffic, so there is no additional network hop between your application and its dependencies. This is the fundamental difference from a sidecar proxy, which does sit in the path and adds a real round trip.

What the collector adds instead is a small amount of in-kernel work on the syscall path. When your application calls `send` or `recv` on a TCP socket, the kernel runs the attached eBPF program before returning. That is a function call in kernel context, not a network operation.

Measured on a production Kubernetes cluster, the programs on the hot paths cost:

| Path                          | Average cost per execution |
| ----------------------------- | -------------------------- |
| `tcp_recvmsg` entry plus exit | about 1.7 microseconds     |
| `tcp_sendmsg` entry           | about 0.8 microseconds     |
| TLS read and write probes     | 20 to 30 microseconds      |
| TLS handshake probes          | about 29 microseconds      |

The TLS probes are far more expensive per execution, but they run once per handshake or per TLS record rather than once per syscall, so they contribute very little in aggregate.

These are averages from one kernel and CPU generation. Treat them as an order of magnitude rather than a guarantee. If the number matters to a sign-off, reproduce it on your own hardware: enabling `diagnostics.bpfStats.enabled` exposes per-program execution counts and kernel time on the collector's metrics endpoint, which is exactly how the table above was produced. See [Measuring eBPF Kernel Time](resource-utilization.md#measuring-ebpf-kernel-time).

## CPU Attribution

eBPF programs execute in kernel context on behalf of whichever process made the syscall. The kernel charges that time to the calling task, which means **a small amount of the collector's cost appears in your application's CPU accounting rather than in Speedscale's.**

You can estimate the effect directly from the per-execution costs above:

```
added CPU (seconds per second) =
    (recv syscalls per second x 0.0000017) + (send syscalls per second x 0.0000008)
```

For a service handling 10,000 receives and 10,000 sends per second, that works out to roughly 25 milliseconds of CPU per second, or about 2.5% of one core. A service doing a tenth of that pays a tenth as much.

Two things are worth being precise about here:

- This is CPU, not latency. The work happens inline with a syscall your application was already making, and at these magnitudes it does not move request latency out of the noise.
- It applies to syscall volume, not captured volume. Probes attach node-wide and filter in the kernel, so a node's baseline cost is driven by its total TCP syscall rate. See [Where Capture CPU Goes](resource-utilization.md#where-capture-cpu-goes).

If you are comparing a captured workload against an uncaptured baseline, expect its measured CPU to be marginally higher rather than perfectly flat. Latency should be flat.

## Progressive Delivery and Canary Deployments

The collector runs as a DaemonSet, entirely outside your application pods. It has no admission webhook in the path of your deployments, injects nothing into your pod specs, and does not participate in rollout decisions. Your deployment tooling continues to own the rollout.

Capture targeting is evaluated by the collector against namespace and pod label selectors, which has a useful property for canary deployments: because stable and canary pods usually differ by label, you can include or exclude the canary from capture by selector alone, without touching the rollout itself.

Both stable and canary pods on the same node are observed by the same collector pod, so enabling capture does not change how traffic is routed between them.

:::note
Pods that were already running when `nettap` attached its probes will not have their connection handshakes captured. Connections established after attachment are captured normally. This matters most immediately after enabling capture or after a collector restart, and is covered under [Limitations](README.md#limitations).
:::

## Saturation and Failure Behavior

Because the collector is not in the data path, its failure modes cost you telemetry rather than traffic.

**If the collector pod stops, is evicted, or is not scheduled on a node**, applications on that node continue to serve traffic normally. Capture stops for that node until the pod returns, so the effect is a gap in captured data.

**If the capture pipeline cannot keep up**, the kernel programs cannot reserve space in the ring buffer that carries events to user space, and events are dropped at that boundary. Dropped events mean incomplete captured data. Application traffic is unaffected, because the drop happens in the observation path rather than the network path.

**If the collector is CPU-throttled**, the same thing happens for the same reason. Throttling on the capture container is the signal most worth alerting on, since it precedes data loss.

Drops are counted rather than inferred. The collector's [metrics endpoint](resource-utilization.md#monitoring) exposes `nettap_ringbuf_drops_total`, labeled by ring, so backpressure is directly observable:

```promql
sum by (pod, ring) (rate(nettap_ringbuf_drops_total[5m]))
```

A non-zero rate on the `capture_chunks` ring means captured traffic is incomplete for that node. It does not mean your application dropped anything.

## Verifying Impact in Your Own Environment

The most convincing evidence is a measurement on your own workload. The procedure mirrors the one used for [sidecar performance testing](/getting-started/installation/sidecar/performance.md), with one eBPF-specific adjustment.

1. Add monitoring for CPU, memory, and request latency on the workload you plan to capture. Record percentiles, not just averages.
2. Establish a baseline by running a consistent load test with capture disabled for that workload.
3. Record CPU, memory, and p50, p95, and p99 latency across the run.
4. Enable capture for the workload, either by adding a capture target or by annotating the deployment. See [Installation](README.md#installation).
5. Re-run the identical load test.
6. Compare.

What to expect: latency percentiles should sit inside normal run-to-run variance, and application container CPU should be marginally higher for the reason described under [CPU Attribution](#cpu-attribution) rather than unchanged.

To attribute the difference rather than just observe it, scrape the collector's [metrics endpoint](resource-utilization.md#monitoring) during both runs. `nettap_probe_calls_total` confirms the workload was actually being captured, and with `bpfStats` enabled the `nettap_bpf_program_*` series give you the kernel-side cost directly, in the same units as the CPU delta you measured on the application.

:::tip
Run the baseline twice before enabling anything. Two consecutive baseline runs tell you how much your environment varies on its own, which is the only way to know whether a difference in the third run means anything.
:::
