---
title: Storage and Observability Backends
description: Choose a BYOC backend for retention, search, dashboards, and proxymock reuse.
---

# Storage and Observability Backends

Speedscale publishes reference collector charts in the [speedscale-byoc repository](https://github.com/speedscale/speedscale-byoc). Install one independent collector channel for each observability destination you need. The `iceberg` chart is not an OpenTelemetry collector: it runs the Speedscale Iceberg sink, which receives the same OTLP stream and appends rows to a table. See [Apache Iceberg tables](#iceberg). The direct customer-owned S3 replay storage mode uses the public Speedscale operator chart and does not need a separate collector chart for storage.

| Chart | Destination | Speedscale capture signal | Optional application signals | Direct proxymock import |
| --- | --- | --- | --- | --- |
| `fluentbit-s3` | Amazon S3 through the OTel `awss3` exporter | RRPair logs | None | Yes, `proxymock import s3` |
| `gcs` | Native Google Cloud Storage | RRPair logs | None | Yes, `proxymock import gcs` |
| `fluentbit-gcs` | GCS through its S3-compatible API | RRPair logs | None | Yes, native GCS or S3 interoperability |
| `grafana` | Loki and Grafana | RRPair logs | Other application logs when configured separately | Gather script |
| `elasticsearch` | Elasticsearch and Kibana | RRPair logs | Other application logs when configured separately | Gather script |
| `azureblob` | Azure Blob Storage | RRPair logs | None | Yes, `proxymock import azureblob` (v2.5.1169+) |
| `datadog` | Datadog | RRPair logs | Application traces and metrics sent independently; the Datadog connector can derive APM trace metrics | Trace recipe |
| `dynatrace` | Dynatrace | RRPair logs | Application traces and metrics sent independently | No |
| `newrelic` | New Relic | RRPair logs | Application traces and metrics sent independently | No |
| `iceberg` | Apache Iceberg table through AWS S3 Tables, AWS Glue, or a REST catalog | RRPair rows | None | No; query with any Iceberg engine |

For replay inputs and reports in customer storage, select the [direct S3 replay storage mode](./configure-kubernetes.md#customer-owned-s3-replay-storage). It supports AWS S3 with EKS workload identity and private S3-compatible storage with a customer endpoint and credentials. Captures from this mode are imported from `<PREFIX>/records/rrpairs/`, while the collector chart above writes OTLP objects under `byoc/`.

The `fluentbit-s3` name is historical; the chart writes OTLP JSON directly with the OpenTelemetry `awss3` exporter. New GCS installations should use the native `gcs` chart. Keep the legacy `fluentbit-gcs` chart only for an existing S3-interoperability and HMAC workflow.

The Forwarder itself emits RRPairs as OTLP **logs**. A collector can accept application traces and metrics on additional pipelines, but those signals appear only when the application or another agent sends them independently. For Datadog, review the [Datadog exporter and connector guidance](https://docs.datadoghq.com/opentelemetry/setup/collector_exporter/datadog_exporter/) before customizing the reference chart; Datadog recommends OTLP/HTTP and the `span_metrics` connector for new custom configurations.

## Collector versions and support boundary

The published reference charts pin collector images instead of following a floating tag. The current Amazon S3, native GCS, Azure Blob, Datadog, Dynatrace, and New Relic charts pin OpenTelemetry Collector Contrib `0.160.0` by image digest. The legacy `fluentbit-gcs` and Elasticsearch reference charts remain on `0.108.0`.

The upstream [`awss3`](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/awss3exporter), [`google_cloud_storage`](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/googlecloudstorageexporter), and [`azureblob`](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/azureblobexporter) exporters are alpha. Speedscale validates and supports the collector image and configuration pinned by each published chart. Treat an image override, unpinned upgrade, or custom collector pipeline as a custom deployment and validate retention, retries, and retrieval before relying on it for production traffic.

## Choose for replayability

Choose Amazon S3, native GCS, or Azure Blob when developers and automated agents need to pull a time-bounded capture directly into proxymock. Run an object-storage channel alongside an observability channel when you need both operational correlation and a simple replay path.

Choose Iceberg when analysts and data pipelines need to query captured traffic with SQL engines such as Athena, Spark, Trino, Snowflake, or DuckDB. It complements an object-storage channel rather than replacing it, because proxymock does not import from Iceberg tables.

Loki and Elasticsearch require backend-specific gather scripts. Datadog has a [Datadog-to-proxymock recipe](https://github.com/speedscale/speedscale-byoc/tree/main/recipes/datadog-to-replay) for retrieving one trace. Dynatrace and New Relic do not have direct proxymock importers.

## Apache Iceberg tables {#iceberg}

The `iceberg` chart runs the Speedscale Iceberg sink in its own namespace. The Forwarder sends RRPairs to it with a named OTLP exporter, like any other channel, so the Forwarder needs no Iceberg libraries or catalog credentials. The sink appends one row per RRPair to an Apache Iceberg table and commits on a time or size trigger.

The sink supports three catalog types:

| Catalog | `iceberg.catalog.type` | Table maintenance |
| --- | --- | --- |
| AWS S3 Tables | `s3tables` | S3 Tables compacts and expires snapshots. The sink's own maintenance stays off. |
| AWS Glue Data Catalog | `glue` | Glue table optimizers compact and expire snapshots once you enable them; both are off for new tables. The sink's own maintenance stays off. |
| Iceberg REST catalog, such as Polaris, Lakekeeper, Nessie, Unity, or Snowflake Open Catalog | `rest` | The sink expires snapshots and old metadata. The chart's optional CronJob compacts data files. |

Data can live in Amazon S3, Google Cloud Storage, or Azure Storage. The sink uses each cloud SDK's default credential chain, so workload identity (EKS IRSA or Pod Identity, GKE Workload Identity, Azure Workload Identity) works without a key. The [chart README](https://github.com/speedscale/speedscale-byoc/tree/main/charts/iceberg) lists every value, the IAM permissions for each catalog, and Secret-based credentials.

### Table schema

Each row has `ts`, `uuid`, `cluster`, `namespace`, `service`, `direction`, `l7protocol`, `tech`, `command`, `location`, `status`, `elapsed_us`, `is_tls`, `tags` (a map), `dlp_modified`, `rrpair` (the full RRPair as JSON), and `ingested_at`. The table is partitioned by `day(ts)` and `cluster`.

The sink creates the namespace and table when they do not exist. A table you create in advance must contain every column above.

### Install the sink

Create the table bucket, database, or catalog warehouse and the identity first. The chart does not create cloud resources or IAM grants.

For AWS S3 Tables, set the warehouse to the table bucket ARN:

```yaml
iceberg:
  catalog:
    type: s3tables
    uri: ""
    warehouse: arn:aws:s3tables:<AWS_REGION>:<ACCOUNT_ID>:bucket/<TABLE_BUCKET>
awsRegion: <AWS_REGION>
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>
```

For AWS Glue, set the warehouse to an S3 location. After the sink creates the table, [enable compaction](https://docs.aws.amazon.com/glue/latest/dg/enable-compaction.html) and [snapshot retention](https://docs.aws.amazon.com/glue/latest/dg/enable-snapshot-retention.html) on it with an optimizer IAM role. Glue turns both off for new tables, and without them small files and snapshots accumulate:

```yaml
iceberg:
  catalog:
    type: glue
    uri: ""
    warehouse: s3://<BUCKET>/<PREFIX>
awsRegion: <AWS_REGION>
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>
```

For a REST catalog, keep catalog credentials in a Secret. The Secret holds a JSON object of catalog and storage properties:

```bash
kubectl create namespace byoc-iceberg
kubectl -n byoc-iceberg create secret generic iceberg-catalog \
  --from-literal=catalog-properties.json='{"credential":"<CLIENT_ID>:<CLIENT_SECRET>","scope":"PRINCIPAL_ROLE:ALL"}'
```

```yaml
iceberg:
  catalog:
    type: rest
    uri: https://<CATALOG_HOST>/api/catalog
    warehouse: <WAREHOUSE>
    propertiesSecret:
      name: iceberg-catalog
      key: catalog-properties.json
```

Install the chart with the values file for your catalog:

```bash
helm upgrade --install byoc-iceberg speedscale-byoc/iceberg \
  -n byoc-iceberg --create-namespace \
  -f values-iceberg.yaml
```

### Point the Forwarder at the sink

Add a dedicated exporter in the Speedscale operator values:

```yaml
forwarder:
  exporters:
    byoc_iceberg:
      otel_endpoint: "http://byoc-iceberg-iceberg.byoc-iceberg.svc.cluster.local:4317"
      filter_rule: standard
      dlp_config_id: standard
```

The sink listens for OTLP/gRPC on `4317` and serves `/healthz`, `/readyz`, and Prometheus `/metrics` on `8080`. Its NetworkPolicy admits OTLP from the `speedscale` namespace by default.

### Delivery and duplicates

Delivery is at least once. When a commit is slow or the sink restarts, the Forwarder retries the export, and a retried batch can be written twice. Deduplicate on `uuid` when exact counts matter:

```sql
SELECT *
FROM speedscale.rrpairs
QUALIFY row_number() OVER (PARTITION BY uuid ORDER BY ingested_at) = 1
```

Engines without `QUALIFY` can wrap the same `row_number()` in a subquery.

### Sizing and compaction

The default sink requests 256 MiB and is limited to 512 MiB of memory, with `GOMEMLIMIT` set to 80% of the limit. A 2,000 RRPair per second stream with the default 8 MiB batch needs about 60 MiB of heap. One replica is the default; several replicas can write the same table safely.

Each commit writes about one data file per active partition, so the default 60 second interval produces about 1,440 small files per partition per day for each replica. S3 Tables compacts these automatically, and Glue does once its compaction optimizer is enabled. For a self-managed REST catalog, set `compaction.enabled: true` in the chart. The CronJob runs the sink's `compact` mode on a schedule, bin-packing each partition's small files into files near 128 MiB while the sink keeps writing. Give it at least 1 GiB of memory.

## Observability guides

- [Datadog](/guides/integrations/export/datadog.md)
- [Dynatrace](/guides/integrations/export/dynatrace.md)
- [New Relic](/guides/integrations/export/new-relic.md)

## Azure Blob imports {#azure-blob-limitation}

Native Azure Blob traffic imports are available in proxymock v2.5.1169 and later. Use `proxymock import azureblob`, `pull_byoc_bucket` with `storage-provider=azureblob`, or **Azure Blob Storage** in the proxymock web source picker. See [Azure credentials and import examples](./use-traffic.md#azure-blob-storage).

Azure Blob Storage does not expose an S3-compatible API. Use the native Azure provider instead of setting an Azure URL on `import s3`. Older clients can upgrade or use [`scripts/azure-gather.py`](https://github.com/speedscale/speedscale-byoc/blob/main/scripts/azure-gather.py) for manual retrieval.

## Next step

[Configure BYOC on Kubernetes](./configure-kubernetes.md), or use the [ECS/Fargate example](./examples/ecs.md) for a non-Kubernetes deployment.
