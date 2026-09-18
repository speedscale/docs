---
description: "Stream OpenTelemetry traces, metrics, and Speedscale captures to New Relic, then correlate APM behavior with replayable API traffic."
sidebar_position: 3
---

# New Relic

The New Relic integration sends application OpenTelemetry traces and metrics alongside Speedscale RRPair logs. New Relic APM shows the application topology, latency, throughput, and errors. When the captured request contains a valid W3C `traceparent` header, the matching RRPair log carries the trace ID needed for correlation. Requests without that header still appear in Logs but are not linked to an APM trace.

## How it works

```mermaid
flowchart LR
    app[OTel-instrumented application] -->|traces and metrics| collector[New Relic channel collector]
    forwarder[Speedscale Forwarder] -->|RRPair logs| collector
    collector -->|OTLP over HTTP| nr[(New Relic account)]
    nr --> apm[APM and Services]
    nr --> traces[Distributed tracing]
    nr --> logs[Logs]
```

The collector sends all signals to New Relic's native OTLP endpoint with an ingest license key. It also:

- marks spans with HTTP 5xx responses or exception events as errors;
- identifies the source workload with `service.name` and `speedscale.workload`;
- identifies the remote destination with `hostname`, `server.address`, and `network.peer.address`;
- emits a readable message and `speedscale.protocol`, `speedscale.command`, and `speedscale.status` for HTTP, PostgreSQL, Kafka, and other captured protocols;
- extracts W3C trace context from captured request headers;
- keeps records without W3C trace context searchable instead of discarding them.

No New Relic account ID is needed for OTLP ingest. Keep account IDs, license keys, and partner tenant details out of values files and source control.

## Why use it

New Relic APM identifies the service and span involved in an error. The matching capture log identifies the source workload, remote destination, protocol, command, and status at that point in the trace. Retain the full traffic in Speedscale Cloud or a BYOC object-storage channel when developers need to turn it into a regression test or dependency mock.

## Install the channel

Create an ingest license key in the destination account and store it in a Kubernetes Secret:

```bash
kubectl create namespace byoc-newrelic
kubectl -n byoc-newrelic create secret generic newrelic-license-key \
  --from-literal=license-key='<NEW_RELIC_LICENSE_KEY>'

helm upgrade --install byoc-newrelic speedscale-byoc/newrelic \
  --namespace byoc-newrelic \
  --set newrelic.credentialsSecret=newrelic-license-key
```

The default endpoint is New Relic's US OTLP endpoint. Set `newrelic.endpoint` to the documented EU, Japan, or FedRAMP base URL when required. Do not add a signal path.

Add one Forwarder exporter for this channel:

```yaml
forwarder:
  exporters:
    byoc_newrelic:
      otel_endpoint: http://byoc-newrelic-newrelic.byoc-newrelic.svc.cluster.local:4317
      filter_rule: standard
      dlp_config_id: standard
```

Send application OTLP data to the same collector service on port `4317` for gRPC or `4318` for HTTP.

## Verify in New Relic

1. Open **APM & Services > Services** and find the application's `service.name`.
2. Open **Distributed tracing** and filter for that service.
3. Open **Logs** and filter for `msgType = 'rrpair'` and `speedscale.direction = 'OUT'`.
4. Add `message`, `hostname`, `service.name`, `speedscale.workload`, `speedscale.protocol`, `speedscale.command`, `speedscale.status`, and `trace.id` as table columns.
5. Confirm the source and destination are distinct. For example, an LLM call can show `banking-ai` as `service.name` and `api.anthropic.com` as `hostname`. PostgreSQL and Kafka records should show their cluster hostnames and protocols even when `trace.id` is empty.
6. Open an HTTP trace and confirm a matching RRPair log has the same `trace.id`.
7. Trigger an HTTP 5xx response and confirm the transaction and span appear as errors.
8. Use **Metrics and events** to confirm application metrics are arriving.

![New Relic APM service overview with populated throughput and transaction charts](./new-relic/apm-overview.png)

## Use the capture with proxymock

New Relic is the observability view, not the portable RRPair archive. There is no direct `proxymock import newrelic` command. Retain the same traffic in Speedscale Cloud, Amazon S3, or Google Cloud Storage if developers need to turn a trace into local tests and mocks.

Pull a Speedscale snapshot by ID:

```bash
proxymock cloud pull snapshot '<SNAPSHOT_ID>' --out ./newrelic-capture
proxymock mock --in ./newrelic-capture
proxymock replay --in ./newrelic-capture \
  --test-against http://localhost:8080
```

For an S3 or GCS BYOC channel, retrieve recent RRPairs by service and time range:

```bash
proxymock import s3 --bucket '<BUCKET>' --prefix byoc/ \
  --service '<SERVICE_NAME>' --from now-1h --out ./newrelic-capture

# Native GCS uses Google Application Default Credentials.
proxymock import gcs --bucket '<GCS_BUCKET>' --prefix byoc/ \
  --service '<SERVICE_NAME>' --from now-1h --out ./newrelic-capture
```

See [Pull traffic from a BYOC bucket](/proxymock/guides/byoc-bucket.md) for authentication, filtering, and cluster discovery.

## Evidence

The BYOC chart is rendered and validated with the pinned OpenTelemetry Collector image in CI, including the logs, traces, and metrics pipelines and Secret-backed `api-key` header. A runtime test sends HTTPS, PostgreSQL, and Kafka RRPairs through the rendered collector in one mixed batch and verifies readable messages, source-service isolation, real upstream hostnames, protocol metadata, and trace behavior.

## One-time report export

The live OTLP channel is separate from `speedctl export newrelic`, which sends a completed Speedscale report to New Relic as custom events:

```bash
speedctl export newrelic '<REPORT_ID>' \
  --accountId '<ACCOUNT_ID>' \
  --insightsKey '<INSERT_KEY>'
```

Use the live channel for APM and trace correlation. Use the report export when you only need completed replay results in a New Relic dashboard.

![A completed Speedscale report in New Relic](./new-relic/new-relic-dashboard.png)

## References

- [Speedscale BYOC New Relic chart](https://github.com/speedscale/speedscale-byoc/tree/main/charts/newrelic)
- [New Relic OTLP endpoint](https://docs.newrelic.com/docs/opentelemetry/best-practices/opentelemetry-otlp/)
