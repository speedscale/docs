---
sidebar_position: 1
---

# Collector Resource Utilization

The Speedscale eBPF collector (nettap) runs as a Kubernetes DaemonSet with two containers per pod: **capture** and **ingest**. The capture container runs eBPF programs in kernel space to observe network traffic while the ingest container buffers and forwards captured data to the Speedscale cloud.

Because the collector runs on every node in the cluster, understanding its resource footprint is important for capacity planning and node sizing.

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
These observations were made with the eBPF collector capturing a single workload with outbound TLS traffic. Your results will vary based on the number of captured workloads, traffic patterns, payload sizes, and protocol mix.
:::

## Key Observations

### Memory

The capture container has a baseline memory footprint of approximately 408Mi at idle. This is due to eBPF maps and kernel BTF (BPF Type Format) data that must be loaded at startup. Memory usage grows modestly with traffic volume.

:::tip
Monitor collector memory usage so you know when a resource increase is necessary. At higher traffic volumes the combined memory usage can approach the default limits.
:::

### CPU

CPU usage scales roughly linearly with request volume. If you are capturing high-throughput workloads, monitor for CPU throttling and increase the CPU limit as needed to maintain reliable collection.

### Post-Load Drain

After a high-throughput period ends, the collector may continue consuming elevated resources while it drains buffered data. During testing, the pod was still at 501m capture CPU and 400Mi ingest memory after a 1000 QPS test concluded. Plan for this lag when evaluating resource headroom.

## Default Configuration

Collector resource requests and limits are configured through the [Helm chart](/reference/helm.md). The defaults are applied per container (capture and ingest):

| Setting           | Default |
| ----------------- | ------- |
| CPU request       | 100m    |
| Memory request    | 256M    |
| CPU limit         | 500m    |
| Memory limit      | 1G      |

:::caution
The default memory request of 256M is below the observed idle memory usage of 408Mi for the capture container. On nodes with tight resource budgets, this mismatch can cause scheduling issues where the Kubernetes scheduler places the pod on a node that cannot actually support it.
:::

To override these defaults, set the appropriate values in your Helm values file. For example:

```yaml
ebpf:
  enabled: true
  resources:
    requests:
      cpu: "200m"
      memory: "512M"
    limits:
      cpu: "1000m"
      memory: "2G"
```

## Recommendations

### Memory Requests

Set memory requests to at least **512M** per container to reflect the actual idle footprint and avoid scheduling problems. This is especially important in clusters where nodes are close to capacity.

### High-Throughput Workloads

For nodes running workloads above 500 QPS:

- Increase the CPU limit to **1000m** or higher to prevent throttling of the capture container.
- Increase the memory limit to **2G** to accommodate ingest buffering under sustained load.
- Monitor for post-load drain lag to ensure the pod has time to process buffered data before resources are reclaimed.

### Monitoring

Monitor collector pod resource usage through your cluster monitoring solution (Prometheus, Datadog, etc.) or with tools like [k9s](https://k9scli.io/). Watch for:

- **CPU throttling** on the capture container, which can cause dropped traffic.
- **Memory pressure** on the ingest container under sustained high throughput.
- **OOMKill events** if limits are set too low for the observed traffic volume.

The collector exposes a `/stats` endpoint that reports probe call counts, bytes processed, and chunks published. Use this for application-level monitoring of the capture pipeline.
