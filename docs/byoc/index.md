---
title: Bring Your Own Cloud
description: Choose direct customer-owned storage or collector export on Kubernetes or ECS, then capture and replay traffic within your data boundary.
slug: /byoc/
---

# Bring Your Own Cloud

<span id="what-is-byoc"></span>

Speedscale Bring Your Own Cloud (BYOC) keeps captured request and response pairs (RRPairs) in destinations you control. Choose direct storage when captures, replay inputs, and reports must live in your object storage. Choose collector export when you want to send captured traffic through OpenTelemetry to a storage or observability backend.

Already have captured traffic? [Import it into proxymock](./use-traffic.md) for analysis, dependency mocking, and replay.

:::info

BYOC requires a Speedscale Enterprise plan and Speedscale API connectivity for registration, configuration, and operational telemetry. It is not a self-hosted or air-gapped Speedscale platform. Contact [support@speedscale.com](mailto:support@speedscale.com) to enable BYOC on your account.

:::

## Choose a path {#choose-a-path}

<span id="how-it-works"></span>
<span id="reference-architectures"></span>
<span id="install"></span>

| Setup | Capture and storage | Replay |
| --- | --- | --- |
| [Direct storage](#direct-storage) | Namespaced Kubernetes capture; the Forwarder writes directly to S3, S3-compatible storage, GCS, or Azure Blob. | Stage a local snapshot and run a namespaced cluster replay; artifacts stay in customer storage. |
| [Collector export on Kubernetes](#collector-export-on-kubernetes) | Captured traffic goes from the Forwarder to your OpenTelemetry Collector, then to your chosen destination. | Import stored traffic and replay locally with proxymock. |
| [Collector export on ECS/Fargate](#collector-export-on-ecs-fargate) | goproxy captures ECS traffic; the Forwarder and collector deliver it to your bucket. | Import stored traffic and replay locally with proxymock. |

### Direct storage {#direct-storage}

This path requires `namespaced.enabled: true` and `namespaced.forwarder.primaryTransport: byoc`. The classic operator does not support direct storage. No OpenTelemetry Collector is needed for storage.

Operator chart v2.5.1169 exposes `namespaced.forwarder.byoc.provider` with `s3`, `gcs`, and `azureblob` providers. S3-compatible services use the `s3` provider with a customer endpoint.

Capture uses `proxymock cluster capture inject --sidecar`. Replay uses `proxymock cluster replay start --namespaced --snapshot-source local`, which prevents a Cloud upload if local staging fails. Captured RRPairs live under `<PREFIX>/records/rrpairs/`.

Start with [direct storage on Kubernetes](./configure-kubernetes.md#customer-owned-s3-replay-storage), then [verify storage and replay](./verify.md#direct-s3-replay-storage).

### Collector export on Kubernetes {#collector-export-on-kubernetes}

Each named Forwarder exporter sends captured traffic as OTLP logs to your collector with its own filter and DLP configuration. You can also add collector export alongside direct storage.

The classic operator enables capture through workload annotations; a namespaced installation uses proxymock sidecar injection. The default S3 and GCS collector layouts use the `byoc/` prefix. Azure Blob supports [native imports](./use-traffic.md#azure-blob-storage) in proxymock v2.5.1169 and later; its reference collector writes blobs at the container root under `YYYY/MM/DD/logs_*`. Observability destinations use the retrieval paths in the [backend guide](./backends.md).

Start with [Kubernetes collector export](./configure-kubernetes.md#1-add-the-helm-repositories) after completing the [checks below](#before-you-capture).

<span id="1-add-the-helm-repos"></span>
<span id="2-create-the-api-key-secret"></span>
<span id="3-install-your-chosen-backend"></span>
<span id="4-install-the-speedscale-operator-wired-to-each-backend"></span>
<span id="5-annotate-a-workload-to-capture-its-traffic"></span>

### Collector export on ECS/Fargate {#collector-export-on-ecs-fargate}

goproxy sends captured traffic to a Forwarder task. A collector in that task writes to S3 using the ECS task role. Tenant configuration comes from Speedscale; secrets come from AWS Secrets Manager.

Follow [BYOC on ECS/Fargate](./examples/ecs.md) to configure Cloud filtering before starting capture, verify an S3 object, and import the capture for a local replay.

## Before you capture

<span id="prerequisites"></span>

1. **Prepare your tenant.** Use the dashboard or speedctl for tenant values, filters, and DLP configuration IDs. Direct storage can use local Forwarder rule files; named collector exporters fetch their own filter and DLP configurations from the tenant.
2. **Prevent Cloud export before capture.** Direct storage uses `primaryTransport: byoc`. Collector export needs a drop-all Cloud filter assigned to the Forwarder's `filterRule`, or `SPEEDSCALE_FILTER_RULE` on ECS. The default `standard` filter sends RRPairs to Cloud. Keep the named exporter's own filter configured to retain traffic.
3. **Choose where to redact.** Configure DLP before export for each destination. Direct storage uses a tenant configuration ID or local Forwarder files; collector export uses each named exporter's DLP configuration ID. `proxymock import --dlp-config` redacts local imports without changing bucket objects. See [DLP](/guides/dlp/) and [local rules](/proxymock/guides/local-rules.md).
4. **Keep replay in your data boundary.** Use a local-source namespaced replay for direct storage, or import and replay locally for collector export. Dashboard and Cloud replays upload snapshots to Speedscale Cloud.

## What you operate

You operate destination credentials, workload identity, encryption, retention, network policy, and access controls. Collector export also requires you to operate the collector. Plan access to customer storage separately from the required Speedscale API route.

## Typical workflow

<span id="verify"></span>
<span id="replay-captured-traffic-with-proxymock"></span>

1. Complete your selected setup, including Cloud export configuration.
2. Enable capture on one workload and send a known request.
3. [Verify the deployment](./verify.md) and inspect the captured request in your destination.
4. Run a replay and inspect its results. See [traffic import](./use-traffic.md) for bucket access or [troubleshooting](./troubleshooting.md) for a failed check.

## Related resources

<span id="azure-blob-storage"></span>
<span id="otlp-transport-grpc-vs-http"></span>
<span id="further-reading"></span>
<span id="continue-from-the-previous-byoc-guide"></span>

- [How BYOC works](./how-it-works.md): components, data boundaries, and OTLP transport.
- [Storage and observability backends](./backends.md): destination capabilities and collector support.
- [Speedscale BYOC reference charts](https://github.com/speedscale/speedscale-byoc): backend configuration and credentials.
- [Kubernetes installation options](/getting-started/installation/install/kubernetes.md): classic and namespaced permission scopes.
