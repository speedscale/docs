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
These observations were made while capturing a single workload with outbound TLS traffic. Your results will vary based on the number of captured workloads, traffic patterns, payload sizes, and protocol mix.
:::

## Key Observations

### Memory

The capture container has a relatively high baseline memory footprint at idle due to eBPF maps and kernel BTF (BPF Type Format) data that must be loaded at startup. Memory usage grows modestly with traffic volume. The ingest container starts small but grows under load as it buffers captured data for forwarding.

### CPU

CPU usage scales roughly linearly with request volume. The capture container is the heavier consumer of the two.

### Post-Load Drain

After a high-throughput period ends, the collector may continue consuming elevated resources while it drains buffered data. Plan for this lag when evaluating resource headroom.

### Log Level Impact

The observations above were taken at the default `info` log level. Running the collector at `debug` level significantly increases CPU usage in the ingest container. Under debug logging the ingest container can become CPU-throttled at moderate traffic rates, which limits its ability to forward captured data. The capture container is largely unaffected by log level.

Avoid debug logging under production load. If debug logging is needed for troubleshooting, use it briefly during low-traffic periods or temporarily increase the ingest container's CPU limit.

## Default Configuration

Collector resource requests and limits are configured through the [Helm chart](/reference/helm.md). The defaults are applied per container (capture and ingest):

| Setting           | Default |
| ----------------- | ------- |
| CPU request       | 100m    |
| Memory request    | 256M    |
| CPU limit         | 500m    |
| Memory limit      | 1G      |

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

## Monitoring

Monitor collector pod resource usage through your cluster monitoring solution. Watch for:

- **CPU throttling** on the capture container, which can cause dropped traffic.
- **Memory pressure** on the ingest container under sustained high throughput.
- **OOMKill events** if limits are set too low for the observed traffic volume.
- **Scheduling issues** where the default memory request is below the actual idle footprint of the capture container.

The collector exposes a `/stats` endpoint that reports probe call counts, bytes processed, and chunks published. Use this for application-level monitoring of the capture pipeline.

If you observe any of these issues, increase the corresponding resource requests or limits in your Helm values.
