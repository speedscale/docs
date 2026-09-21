---
title: Bring Your Own Cloud
description: Keep captured API traffic in storage and observability systems that you control.
slug: /byoc/
---

# Bring Your Own Cloud

Speedscale Bring Your Own Cloud (BYOC) routes captured request and response pairs (RRPairs) to storage and observability systems in your cloud account. The Speedscale Forwarder sends the captured traffic to an OpenTelemetry Collector that you operate, and the collector writes to the destinations you choose.

Use BYOC when your organization needs to control where captured traffic is stored, apply its own retention and access policies, or connect traffic capture to an existing observability platform.

:::info

BYOC requires a Speedscale Enterprise plan. Contact [support@speedscale.com](mailto:support@speedscale.com) to enable Forwarder BYOC exporters on your account.

:::

## Choose a path

| Goal | Start here |
| --- | --- |
| Understand the components and data boundaries | [How BYOC works](./how-it-works.md) |
| Choose S3, GCS, Loki, Elasticsearch, Azure, or an observability backend | [Storage and observability backends](./backends.md) |
| Install BYOC on Kubernetes | [Configure BYOC on Kubernetes](./configure-kubernetes.md) |
| Confirm traffic reaches the destination | [Verify a BYOC deployment](./verify.md) |
| Pull stored traffic into a local workspace | [Use BYOC traffic with proxymock](./use-traffic.md) |
| Deploy without Kubernetes | [BYOC on ECS/Fargate](./examples/ecs.md) |
| Diagnose missing traffic or connection failures | [Troubleshooting](./troubleshooting.md) |

## What you operate

You operate the collector, destination credentials, storage lifecycle, network policy, and access controls. Speedscale supplies the capture components, Forwarder exporters, public reference charts, and product updates.

BYOC export keeps captured RRPairs in destinations you control. It does not, by itself, make the Speedscale installation offline: account registration, configuration downloads, and operational telemetry can still use the Speedscale API. Configure the cloud exporter separately if captured RRPairs must not be sent to Speedscale Cloud.

## Typical workflow

1. [Choose a backend](./backends.md) based on retention, query, and replay requirements.
2. [Install its collector and configure the Forwarder](./configure-kubernetes.md).
3. Enable capture on a workload and [verify each hop](./verify.md).
4. Query traffic in the destination or [import it into proxymock](./use-traffic.md) for analysis, mocking, and replay.

## Related resources

- [Speedscale BYOC reference charts](https://github.com/speedscale/speedscale-byoc)
- [Data Loss Prevention](/guides/dlp/)
- [Traffic capture](/guides/capture/traffic/)
- [proxymock](/proxymock/)
