---
title: Storage and Observability Backends
description: Choose a BYOC backend for retention, search, dashboards, and proxymock reuse.
---

# Storage and Observability Backends

Speedscale publishes reference Helm charts in the [speedscale-byoc repository](https://github.com/speedscale/speedscale-byoc). Install one independent collector channel for each destination you need.

| Chart | Destination | Speedscale capture signal | Optional application signals | Direct proxymock import |
| --- | --- | --- | --- | --- |
| `fluentbit-s3` | Amazon S3 through the OTel `awss3` exporter | RRPair logs | None | Yes, `proxymock import s3` |
| `gcs` | Native Google Cloud Storage | RRPair logs | None | Yes, `proxymock import gcs` |
| `fluentbit-gcs` | GCS through its S3-compatible API | RRPair logs | None | Yes, native GCS or S3 interoperability |
| `grafana` | Loki and Grafana | RRPair logs | Other application logs when configured separately | Gather script |
| `elasticsearch` | Elasticsearch and Kibana | RRPair logs | Other application logs when configured separately | Gather script |
| `azureblob` | Azure Blob Storage | RRPair logs | None | No; use `azure-gather.py` |
| `datadog` | Datadog | RRPair logs | Application traces and metrics sent independently; the Datadog connector can derive APM trace metrics | Trace recipe |
| `dynatrace` | Dynatrace | RRPair logs | Application traces and metrics sent independently | No |
| `newrelic` | New Relic | RRPair logs | Application traces and metrics sent independently | No |

The `fluentbit-s3` name is historical; the chart writes OTLP JSON directly with the OpenTelemetry `awss3` exporter. New GCS installations should use the native `gcs` chart. Keep the legacy `fluentbit-gcs` chart only for an existing S3-interoperability and HMAC workflow.

The Forwarder itself emits RRPairs as OTLP **logs**. A collector can accept application traces and metrics on additional pipelines, but those signals appear only when the application or another agent sends them independently. For Datadog, review the [Datadog exporter and connector guidance](https://docs.datadoghq.com/opentelemetry/setup/collector_exporter/datadog_exporter/) before customizing the reference chart; Datadog recommends OTLP/HTTP and the `span_metrics` connector for new custom configurations.

## Collector versions and support boundary

The published reference charts pin collector images instead of following a floating tag. The current Amazon S3, native GCS, Azure Blob, Datadog, Dynatrace, and New Relic charts pin OpenTelemetry Collector Contrib `0.160.0` by image digest. The legacy `fluentbit-gcs` and Elasticsearch reference charts remain on `0.108.0`.

The upstream [`awss3`](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/awss3exporter), [`google_cloud_storage`](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/googlecloudstorageexporter), and [`azureblob`](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/azureblobexporter) exporters are alpha. Speedscale validates and supports the collector image and configuration pinned by each published chart. Treat an image override, unpinned upgrade, or custom collector pipeline as a custom deployment and validate retention, retries, and retrieval before relying on it for production traffic.

## Choose for replayability

Choose Amazon S3 or native GCS when developers and automated agents need to pull a time-bounded capture directly into proxymock. Run an object-storage channel alongside an observability channel when you need both operational correlation and a simple replay path.

Loki, Elasticsearch, and Azure Blob require backend-specific gather scripts. Datadog has a [Datadog-to-proxymock recipe](https://github.com/speedscale/speedscale-byoc/tree/main/recipes/datadog-to-replay) for retrieving one trace. Dynatrace and New Relic do not have direct proxymock importers.

## Observability guides

- [Datadog](/guides/integrations/export/datadog.md)
- [Dynatrace](/guides/integrations/export/dynatrace.md)
- [New Relic](/guides/integrations/export/new-relic.md)

## Azure Blob limitation

Azure Blob Storage does not expose an S3-compatible API. Changing `--s3-endpoint-url` to an Azure Blob URL does not make `proxymock import s3`, the `pull_byoc_bucket` MCP tool, or the proxymock web source picker compatible with it.

For manual retrieval, use [`scripts/azure-gather.py`](https://github.com/speedscale/speedscale-byoc/blob/main/scripts/azure-gather.py). Choose S3 or GCS if direct proxymock bucket import is a requirement.

## Next step

[Configure BYOC on Kubernetes](./configure-kubernetes.md), or use the [ECS/Fargate example](./examples/ecs.md) for a non-Kubernetes deployment.
