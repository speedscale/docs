---
title: Pull Traffic from a BYOC Bucket
description: "Bring-your-own-cloud keeps captured traffic in your own S3 bucket. Use proxymock import s3 or the pull_byoc_bucket MCP tool to pull historical traffic from that bucket into a local workspace you can search, mock, and replay, without the traffic leaving your account through Speedscale."
sidebar_position: 14
---

# Pull Traffic from a BYOC Bucket

In a bring-your-own-cloud (BYOC) deployment, captured traffic never leaves your account: the in-cluster Speedscale collector writes it to an object-store bucket you own, in your own cloud. proxymock pulls historical traffic from that bucket into a local workspace, so you can search, mock, and replay real production traffic without routing it through Speedscale.

The pull runs entirely locally against your bucket. Credentials come from the standard AWS environment chain, and the traffic lands as ordinary RRPair files, so every proxymock workflow works on it unchanged.

There are three ways to run the pull, over the same bucket layout:

- **CLI** with `proxymock import s3`.
- **MCP** with the `pull_byoc_bucket` tool, so an AI agent can fetch its own production context.
- **Web** through the source picker in `proxymock web`.

## How the bucket is laid out

The BYOC OpenTelemetry `awss3` exporter writes OTLP-JSON objects under the `byoc/` prefix, in hive-style `year=/month=/day=/hour=/minute=` partitions. When the bucket contains `_speedscale/byoc-layout.json`, proxymock reads it to enumerate workload-specific `namespace=/app=/…` prefixes directly, which makes a narrow pull cheap. The legacy Fluent Bit layout, with objects at the bucket root and hour-granularity partitions, is also supported.

Point `--prefix` at `byoc/` for the current layout. proxymock prunes the object listing by the time window before it downloads anything, so a tight `--from`/`--to` keeps the pull fast even against a large bucket.

## Before you begin

- `proxymock` [installed](../getting-started/quickstart/quickstart-cli.md).
- Read access to the BYOC bucket, via the standard AWS credential chain: `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, `AWS_PROFILE`, or an instance role. No Speedscale account or API key is required for the pull.

## Pull with the CLI {#cli}

Pull matching traffic from the last hour, narrowing by service and status:

```shell
proxymock import s3 --bucket my-bucket --prefix byoc/ \
  --filter '(service IS "checkout") AND (status IS "500")'
```

The `--filter` string uses the Speedscale [traffic filter language](/reference/filters/structure.md). Convenience flags (`--from`, `--to`, `--service`, `--endpoint`, `--status`, `--namespace`, `--direction`, `--trace-id`) are added only when the filter does not already cover that criterion; where they overlap, the filter wins. `--status` is an exact match and `--endpoint` is a substring match, so use `--filter` for anything more specific.

The imported RRPairs land in `proxymock/imported-s3-<timestamp>/` by default. From there, replay or mock them like any recording:

```shell
proxymock replay --in ./proxymock/imported-s3-<timestamp> --test-against http://localhost:8080
```

### Test the layout with a local directory

`--local-dir` reads from a local directory tree with the same layout as a BYOC bucket, which is useful for air-gapped work and for testing a pull without touching S3. When it is set, `--bucket` and AWS credentials are not used:

```shell
proxymock import s3 --local-dir ./fixtures/byoc-traffic --prefix byoc/ --service checkout --limit 10
```

### Redact on the way in

Pass `--dlp-config` to apply a local DLP config to matched RRPairs before they are written to disk, so sensitive values never land in your workspace unredacted. This is the air-gap-friendly path: the redaction happens locally, against a rule you author locally.

```shell
proxymock import s3 --bucket my-bucket --prefix byoc/ --from now-15m --dlp-config my-dlp.json
```

See [Author DLP and filter rules locally](./local-rules.md) for how to build and test that config.

### Keep pulling as traffic arrives

`--follow` keeps the import running, re-listing the bucket for new objects until you interrupt it. Tune the cadence with `--poll-interval` (default `30s`):

```shell
proxymock import s3 --bucket my-bucket --prefix byoc/ --service checkout --follow
```

### S3-compatible stores

For MinIO, DigitalOcean Spaces, or another S3-compatible store, set `--s3-endpoint-url` and usually `--s3-force-path-style`. Set `--region` when the SDK cannot infer it. The full flag list is in the [CLI reference](/reference/proxymock-cli-reference.md#import-s3).

## Pull with the MCP tool {#mcp}

The `pull_byoc_bucket` MCP tool gives an AI coding assistant the same pull. It runs locally with no Speedscale account; credentials come from the AWS environment chain. Describe what you need and the assistant fills in the parameters:

> Pull the last 15 minutes of checkout 500s from the `my-bucket` BYOC bucket and replay them against my local build.

The tool takes `bucket` plus the same narrowing parameters as the CLI (`prefix`, `from`, `to`, `service`, `namespace`, `status`, `trace-id`, or a full `filter`), returns the import summary, and writes RRPair files to `./proxymock/imported-s3-<timestamp>/`. This is distinct from `pull_remote_recording`, which pulls from Speedscale-managed cloud; use `pull_byoc_bucket` when the traffic lives in your own bucket. See the [MCP Tools reference](../how-it-works/mcp-tools.md) for the full parameter list.

## Pull from proxymock web {#web}

In `proxymock web`, the import source picker offers a BYOC bucket as a source alongside local files. Give it the bucket, prefix, and a time window, and the imported run appears in the Run selector like any other recording, ready to explore in the Requests grid or replay.

## Next steps

- [Author DLP and filter rules locally](./local-rules.md) redacts or trims the pulled traffic before you use it.
- [Explore and Replay Sessions Locally](./sessions.md) walks the record-and-replay loop the imported traffic feeds into.
- [Fix Replay Failures with Recommendations](./recommendations.md) correlates rotating values so imported traffic replays cleanly.
