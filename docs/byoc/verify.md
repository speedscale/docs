---
title: Verify a BYOC Deployment
description: Validate capture, Forwarder export, collector receipt, and destination writes one hop at a time.
---

# Verify a BYOC Deployment

Send a known request through an annotated workload, then check the pipeline from the Forwarder outward. Running pods alone do not prove that captured traffic reached storage.

## Direct S3 replay storage

For `forwarder.primaryTransport: byoc`, verify the rendered Forwarder ConfigMap sets `SPEEDSCALE_PRIMARY_TRANSPORT=byoc` and names the intended bucket and prefix. Verify that the Forwarder service account has only the required bucket access, and that no workload outside the Speedscale namespace receives its S3 credentials.

Send a known request through a captured service. Check for a new raw RRPair object under `<PREFIX>/records/rrpairs/`; the object must contain the expected service and request. Import that same capture with `proxymock import s3 --bucket <BUCKET> --prefix <PREFIX>/records/rrpairs/ --service <SERVICE> --from now-15m --out ./proxymock/byoc-check`. For private S3-compatible storage, add `--s3-endpoint-url <URL> --s3-force-path-style` if needed. A successful import must report at least one written RRPair.

Run a local-source replay with mocks and tests, then check `<PREFIX>/snapshots/<REPORT_ID>/report.json` in the customer bucket for final status and test results, plus `<PREFIX>/snapshots/<REPORT_ID>/collector-events.json` for collector events. Restart the Forwarder and retrieve the same report through the snapshot API to confirm persistence. Block Speedscale-managed S3 and AWS credential endpoints during this test; allow only the approved customer storage route and the approved Speedscale API route. A running pod or successful health check alone does not prove these data paths.

## 1. Confirm the Forwarder configuration

```bash
kubectl -n speedscale get cm speedscale-forwarder \
  -o jsonpath='{.data.EXPORTERS}' | jq .
```

The output should contain one named entry for every configured destination. Confirm the expected collector namespace and port. A scheme is recommended for compatibility with Forwarder versions older than v2.5.617.

Check the Forwarder log for exporter startup:

```bash
kubectl -n speedscale logs deployment/speedscale-forwarder \
  | grep "starting OTLP log exporter"
```

The log identifies the endpoint and selected transport.

## 2. Confirm collector receipt

First identify the deployment created by the chart, then inspect it:

```bash
kubectl -n <BACKEND_NAMESPACE> get deployments
kubectl -n <BACKEND_NAMESPACE> logs deployment/<COLLECTOR_DEPLOYMENT>
```

Deployment names vary by chart and Helm release. For example, an S3 release normally contains `otel-collector`, while an observability chart can include the release and backend name.

Look for rejected records, authentication errors, retries, or destination throttling. Absence of errors is not sufficient; continue to the destination check.

## 3. Confirm destination writes

- **S3:** `aws s3 ls s3://<BUCKET>/byoc/ --recursive`
- **GCS:** `gcloud storage ls --recursive gs://<BUCKET>/byoc/`
- **Grafana:** open **Explore**, select Loki, and query `{exporter="OTLP"}`
- **Elasticsearch:** query the RRPair index count from the Elasticsearch service
- **Datadog:** check **Logs > Explorer** for the captured RRPair log
- **Dynatrace:** check **Logs** for the captured RRPair log
- **New Relic:** check **Logs** for the captured RRPair log

Narrow the destination query to the test workload and request time. For object storage, inspect one newly written OTLP JSON object and confirm it contains the expected service, URL, status, and response data.

The Speedscale Forwarder sends RRPairs through the **logs** pipeline. Check APM services, traces, or metrics only when the application independently sends those signals to the same collector. Their absence does not indicate a failed capture-only BYOC installation.

## 4. Confirm the reuse path

For S3 or GCS, import a small time window and require at least one parsed RRPair:

```bash
proxymock import s3 --bucket <BUCKET> --prefix byoc/ \
  --service <SERVICE> --from now-15m --out ./proxymock/byoc-check
```

Use `proxymock import gcs` for native GCS. See [Use BYOC traffic with proxymock](./use-traffic.md) for credentials, filters, DLP, MCP, and web workflows.

If any check fails, use the [troubleshooting guide](./troubleshooting.md) to isolate that hop.
