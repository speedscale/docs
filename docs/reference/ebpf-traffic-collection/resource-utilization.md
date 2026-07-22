---
description: "Analyze Collector Resource Utilization in Speedscale to optimize Kubernetes DaemonSet performance and plan for capacity based on observed resource usage metrics."
sidebar_position: 1
---

# Collector Resource Utilization

The Speedscale eBPF collector (nettap) runs as a Kubernetes DaemonSet named `speedscale-nettap` with two containers per pod: **capture** (`speedscale-nettap-capture`) and **ingest** (`speedscale-nettap-ingest`). The capture container runs eBPF programs in kernel space to observe network traffic while the ingest container buffers and forwards captured data to the Speedscale cloud. This page uses the short names; the full names are what you will see in `kubectl top pod --containers` and in your monitoring labels.

Because the collector runs on every node in the cluster, understanding its resource footprint is important for capacity planning and node sizing.

If you are evaluating the effect on your applications rather than on the collector itself, see [Workload Impact](workload-impact.md).

## Observed Resource Usage

The table below shows peak resource usage per container at various request rates. Measurements were taken against a Go HTTP application making outbound TLS calls, running on a single captured workload.

| QPS  | Capture CPU | Capture Mem | Ingest CPU | Ingest Mem | **Total CPU** | **Total Mem** |
| ---- | ----------- | ----------- | ---------- | ---------- | ------------- | ------------- |
| idle | 1m          | 408Mi       | 1m         | 26Mi       | **2m**        | **434Mi**     |
| 1    | 2m          | 408Mi       | 2m         | 26Mi       | **4m**        | **434Mi**     |
| 10   | 6m          | 408Mi       | 6m         | 29Mi       | **12m**       | **437Mi**     |
| 50   | 18m         | 410Mi       | 9m         | 33Mi       | **27m**       | **443Mi**     |
| 100  | 68m         | 417Mi       | 16m        | 40Mi       | **84m**       | **457Mi**     |
| 200  | 91m         | 421Mi       | 38m        | 60Mi       | **129m**      | **481Mi**     |
| 500  | 208m        | 429Mi       | 87m        | 153Mi      | **295m**      | **582Mi**     |
| 1000 | 414m        | 487Mi       | 116m       | 340Mi      | **530m**      | **827Mi**     |

:::note
These observations were made while capturing a single workload with outbound TLS traffic. Your results will vary based on the number of captured workloads, traffic patterns, payload sizes, and protocol mix.
:::

## Key Observations

### Memory

The capture container has a relatively high baseline memory footprint at idle due to eBPF maps and kernel BTF (BPF Type Format) data that must be loaded at startup. Memory usage grows modestly with traffic volume. The ingest container starts small but grows under load as it buffers captured data for forwarding.

The practical consequence is that capture memory is close to fixed. Roughly 400Mi is resident from the moment the pod is ready, whether or not any traffic is flowing, and 1000 QPS only adds about 80Mi on top of it. Size the request against the baseline, not against the traffic.

### CPU

CPU usage scales roughly linearly with request volume. The capture container is the heavier consumer of the two.

### Where Capture CPU Goes

Nearly all of the capture container's cost comes from a small number of eBPF programs attached to the kernel's TCP send and receive paths. In a production Kubernetes cluster, three programs covering `tcp_sendmsg` and `tcp_recvmsg` accounted for roughly 96% of all kernel time spent in Speedscale eBPF programs. Individually they are very cheap, averaging under a microsecond per execution, but they run on every matching syscall on the node.

The reverse is true of the more expensive probes. TLS handshake, read, and write probes cost roughly 20-30 microseconds per execution, but they run orders of magnitude less often and contribute a negligible share of the total.

That distribution has a practical consequence for capacity planning: **collector CPU tracks the total syscall volume on the node, not the volume of traffic you have configured for capture.** Probes attach node-wide, and the decision about whether a connection is interesting is made inside the kernel program. In the same cluster, the `tcp_recvmsg` entry probe executed roughly 30,000 times for every invocation that matched an enabled capture. The rest exited early at sub-microsecond cost.

Two things follow:

- A busy node pays a small baseline cost even when only a few workloads on it are captured.
- Adding capture targets on a node you already collect from is comparatively cheap, because the filtering cost is already being paid.

Your own ratio depends on how much of the node's traffic matches an enabled capture, so treat these figures as illustrative of the shape rather than as a prediction.

### Post-Load Drain

After a high-throughput period ends, the collector may continue consuming elevated resources while it drains buffered data. Plan for this lag when evaluating resource headroom.

### Log Level Impact

The observations above were taken at the default `info` log level. Running the collector at `debug` level significantly increases CPU usage in the ingest container. Under debug logging the ingest container can become CPU-throttled at moderate traffic rates, which limits its ability to forward captured data. The capture container is largely unaffected by log level.

Avoid debug logging under production load. If debug logging is needed for troubleshooting, use it briefly during low-traffic periods or temporarily increase the ingest container's CPU limit.

## Sizing the Collector

Collector resource requests and limits are configured through the [Helm chart](/reference/helm.md). A single block of requests and limits is applied to each of the two containers, so capture and ingest always get the same values and cannot be sized independently:

| Setting           | Default |
| ----------------- | ------- |
| CPU request       | 100m    |
| Memory request    | 256M    |
| CPU limit         | 500m    |
| Memory limit      | 1G      |

:::caution Raise the memory request before running in production
The default memory request of `256M` is below the capture container's idle footprint of roughly 408Mi. Two things go wrong when a pod consistently uses more memory than it requests: the scheduler packs the node as though the collector needs less than it does, and the pod sits in the Burstable QoS class with usage above its request, which puts it among the first candidates for eviction under node memory pressure.

Set the memory request to at least `512Mi` on any cluster you care about.
:::

Use the observed usage table above to pick the rest. As a starting point, based on peak per-container usage:

| Busiest node handles | CPU request | CPU limit | Memory request | Memory limit |
| -------------------- | ----------- | --------- | -------------- | ------------ |
| Up to ~200 QPS       | 100m        | 500m      | 512Mi          | 1Gi          |
| ~200 to ~500 QPS     | 250m        | 750m      | 512Mi          | 1Gi          |
| ~500 to ~1000 QPS    | 500m        | 1000m     | 768Mi          | 1.5Gi        |

Above roughly 1000 QPS, measure on your own workload first and extrapolate from the observed usage table rather than guessing. Size against the busiest node rather than the cluster average. The DaemonSet applies the same requests and limits everywhere, and the node carrying the most traffic sets the requirement.

To override the defaults, set the values in your Helm values file:

```yaml
ebpf:
  enabled: true
  nettap:
    resources:
      requests:
        cpu: "250m"
        memory: "512Mi"
      limits:
        cpu: "750m"
        memory: "1Gi"
```

## Measuring Collector CPU Accurately

eBPF programs run in kernel context on behalf of whichever process made the syscall. That time is not charged to the collector's container cgroup, so `container_cpu_usage_seconds_total`, `kubectl top`, and anything else derived from container CPU accounting reports less than the collector's true cost. In one production cluster, kernel time spent in eBPF programs was roughly 2.6 times the capture process's own userspace CPU. The ratio varies with traffic mix and with how much of the node's traffic matches a capture.

:::note
This is a property of how the kernel attributes BPF program execution, not something specific to Speedscale. It applies to any eBPF-based tool on the node, including CNIs such as Cilium.
:::

The kernel-side cost is measurable rather than something you have to infer. See [Measuring eBPF Kernel Time](#measuring-ebpf-kernel-time) below. For the effect this accounting has on your captured applications, see [Workload Impact](workload-impact.md).

## Monitoring

The collector exposes Prometheus metrics on port `42424` at `/metrics`, served by the capture container. The older `/stats` endpoint remains available and returns the same probe counters as JSON for existing consumers.

:::caution Keep the metrics endpoint inside the cluster
The endpoint is served on the pod IP and has no authentication, the same posture as the rest of the collector's API server. Scrape it from inside a trusted or mTLS-enabled mesh. Do not expose it through an ingress or on an unmeshed interface.
:::

### Available Metrics

| Metric                                      | Labels    | What it reports                                                       |
| ------------------------------------------- | --------- | --------------------------------------------------------------------- |
| `nettap_probe_calls_total`                  | `probe`   | Probe entry invocations acting on enabled captures                    |
| `nettap_probe_returns_total`                | `probe`   | Probe return invocations acting on enabled captures                   |
| `nettap_probe_bytes_processed_total`        | `probe`   | Bytes processed by the probe                                          |
| `nettap_probe_chunks_published_total`       | `probe`   | Capture chunks published by the probe                                 |
| `nettap_ringbuf_drops_total`                | `ring`    | Events dropped because a ring buffer reserve failed                   |
| `nettap_bpf_program_runs_total`             | `program` | Executions of each eBPF program (requires `bpfStats`, see below)      |
| `nettap_bpf_program_run_time_seconds_total` | `program` | Cumulative kernel run time of each eBPF program (requires `bpfStats`) |

The scrape also includes the standard Prometheus process and Go collectors, which report the capture process's own footprint through `process_cpu_seconds_total`, `process_resident_memory_bytes`, and the usual `go_*` series.

Ring buffer drops are labeled by ring: `capture_chunks`, `capture_eof`, `obs_events`, `dns`, `dlopen`, and `logs`. The one that matters for captured data completeness is `capture_chunks`.

### Queries Worth Having

Ring buffer drops, which is the signal that captured data is being lost:

```promql
sum by (pod, ring) (rate(nettap_ringbuf_drops_total[5m]))
```

Collector self-footprint, in cores and bytes:

```promql
rate(process_cpu_seconds_total[5m])
process_resident_memory_bytes
```

Capture pipeline throughput by probe. If calls keep climbing while chunks published flattens, the pipeline is falling behind:

```promql
sum by (probe) (rate(nettap_probe_calls_total[5m]))
sum by (probe) (rate(nettap_probe_chunks_published_total[5m]))
```

Alongside these, watch for **CPU throttling** on the capture container, **memory pressure** on the ingest container under sustained throughput, and **OOMKill events**. Throttling on the capture container is worth alerting on because it precedes data loss. See [Workload Impact](workload-impact.md#saturation-and-failure-behavior) for what the collector does when it cannot keep up.

### Measuring eBPF Kernel Time

Setting `diagnostics.bpfStats.enabled` turns on the kernel's BPF run-time statistics and adds the two `nettap_bpf_program_*` series, which is how the per-program figures on this page were produced.

Enable it through the `ebpf.configuration` block in your Helm values, which renders into the `speedscale-nettap` ConfigMap. The collector watches that ConfigMap and applies the change at runtime, so no restart is required to turn it on or off:

```yaml
ebpf:
  configuration:
    diagnostics:
      bpfStats:
        enabled: true
```

```promql
# kernel CPU consumed by Speedscale eBPF programs, in cores
sum(rate(nettap_bpf_program_run_time_seconds_total[5m]))

# average kernel time per execution, by program
sum by (program) (rate(nettap_bpf_program_run_time_seconds_total[5m]))
  / (sum by (program) (rate(nettap_bpf_program_runs_total[5m])) > 0)
```

The `> 0` on the denominator matters. Programs that are loaded but never fire would otherwise divide by zero and render as empty rows.

:::caution Enable bpfStats for measurement windows, not permanently
`bpfStats` switches on the kernel's global BPF statistics collection. It is cheap but not free, and it applies to every BPF program on the node, including those belonging to your CNI and any other eBPF tooling. Turn it on when you are measuring, then turn it back off.
:::

If you observe throttling, memory pressure, or drops, increase the corresponding resource requests or limits in your Helm values.
