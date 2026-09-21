---
title: Storage and Observability Backends
description: Choose a BYOC backend for retention, search, dashboards, and proxymock reuse.
---

# Storage and Observability Backends

Speedscale publishes reference Helm charts in the [speedscale-byoc repository](https://github.com/speedscale/speedscale-byoc). Install one independent collector channel for each destination you need.

| Chart | Destination | Best for | Direct proxymock import |
| --- | --- | --- | --- |
| `fluentbit-s3` | Amazon S3 through the OTel `awss3` exporter | Durable object storage, Athena/Glue, EKS IAM roles | Yes, `proxymock import s3` |
| `gcs` | Native Google Cloud Storage | Durable object storage, BigQuery, GKE Workload Identity | Yes, `proxymock import gcs` |
| `fluentbit-gcs` | GCS through its S3-compatible API | Existing HMAC-based deployments | Yes, native GCS or S3 interoperability |
| `grafana` | Loki and Grafana | Live dashboards and ad hoc log queries | Gather script |
| `elasticsearch` | Elasticsearch and Kibana | Full-text search and existing Elastic operations | Gather script |
| `azureblob` | Azure Blob Storage | Azure-native archival and retention | No; use `azure-gather.py` |
| `datadog` | Datadog | APM, traces, metrics, and correlated RRPair logs | Trace recipe |
| `dynatrace` | Dynatrace | Services, distributed traces, metrics, and logs | No |
| `newrelic` | New Relic | APM, distributed traces, metrics, and logs | No |

The `fluentbit-s3` name is historical; the chart writes OTLP JSON directly with the OpenTelemetry `awss3` exporter. New GCS installations should use the native `gcs` chart. Keep the legacy `fluentbit-gcs` chart only for an existing S3-interoperability and HMAC workflow.

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
