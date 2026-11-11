---
title: Troubleshooting BYOC
description: Diagnose missing exporters, OTLP connection failures, destination errors, and empty proxymock imports.
---

# Troubleshooting BYOC

Start with the first failing step in [Verify a BYOC deployment](./verify.md). Avoid changing the destination until you know whether the Forwarder emitted any records.

## The named exporter is missing

Inspect the `EXPORTERS` value in the `speedscale-forwarder` ConfigMap. If the expected name is absent, the operator release did not receive the `forwarder.exporters` values. Check the Helm release values and upgrade the operator again.

Use a unique exporter name for each destination. Reusing a mapping key replaces the earlier configuration.

## The Forwarder cannot connect to the collector

Check all of the following:

- The endpoint includes `http://` when compatibility with Forwarder versions older than v2.5.617 is required. Newer Forwarders also accept scheme-less gRPC endpoints.
- The service name and namespace resolve from the `speedscale` namespace.
- The endpoint port matches the collector receiver: `4317` for OTLP/gRPC or `4318` for OTLP/HTTP.
- NetworkPolicy and security-group rules allow the connection.
- The collector Service selects ready collector pods.

A gRPC client cannot send to an HTTP receiver even though both use OTLP.

## The collector receives records but writes nothing

Read the collector logs for permission, authentication, throttling, or invalid-configuration errors. Confirm that the collector's workload identity, service account, or Secret has write access to the exact bucket, prefix, index, or API endpoint.

For object storage, also check encryption-key permissions, public-access policies, and lifecycle rules. A short lifecycle or an unexpected prefix can make successful writes appear missing.

## S3 or GCS import returns no RRPairs

- Use the current `byoc/` prefix. Omit it only for a legacy layout that wrote at the bucket root.
- Start with a small but known time range around a test request.
- Confirm the import identity can list and read objects, not only the collector identity that writes them.
- Pass the bucket name only; do not include `s3://`, `gs://`, or the prefix in `--bucket`.
- For native GCS, use Google Application Default Credentials with `proxymock import gcs`.

The `_speedscale/byoc-layout.json` manifest improves narrow discovery but is not a substitute for access to the objects it references.

## GCS S3 interoperability fails

Prefer `proxymock import gcs`. If an existing workflow requires the XML interoperability API, use GCS HMAC credentials, endpoint `https://storage.googleapis.com`, region `auto`, and path-style addressing. Do not use a bucket-qualified endpoint.

## Azure Blob does not work with `import s3`

Azure Blob is not S3-compatible. Use `proxymock import azureblob` in proxymock v2.5.1169 or later. Older clients can upgrade or use the chart repository's `azure-gather.py` script.

For an Azure import failure, check all of the following:

- The identity used by proxymock has **Storage Blob Data Reader** on the selected container. A successful `az login` or collector write does not establish reader access.
- `--azure-account-url` contains the HTTPS storage account URL only; `--bucket` contains the container name.
- Connection-string authentication uses `AZURE_STORAGE_CONNECTION_STRING` in the process environment and omits `--azure-account-url`.
- `--prefix` matches actual blob names. The reference Azure chart writes `YYYY/MM/DD/logs_*` at the container root, so omit the S3 chart's `byoc/` prefix.
- The time window includes a known captured request and the objects have not expired under storage lifecycle rules.

Azure imports use credentials on the proxymock host; Azure cluster-reader discovery is unavailable. See [Azure import setup](./use-traffic.md#azure-blob-storage).

## Imported traffic will not replay cleanly

Importing proves that stored records can be decoded; it does not guarantee that recorded values remain valid in the replay environment. Inspect the imported requests, apply transformations for environment-specific hosts or credentials, and use [recommendations](/proxymock/guides/recommendations.md) for rotating values.
