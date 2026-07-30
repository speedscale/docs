---
title: proxymock CLI reference
description: "Full command reference for the proxymock CLI."
sidebar_position: 22
---

## Usage

```bash
proxymock [flags]
proxymock [command]
```

## Global flags

- `--app-url string` - URL of the speedscale app
- `--config string` - Config file (default `${HOME}/.speedscale/config.yaml`)
- `-c, --context string` - Uses a specific context from those listed in `${HOME}/.speedscale/config.yaml`
- `--exit-zero` - always exit with status code 0
- `-h, --help` - help for proxymock
- `-v, --verbose count` - verbose output; pass more than once for more verbosity

## Top-level commands

- `admin` - Administrative and maintenance commands (certs, clean)
- `automation` - Run a proxymock web automation headlessly
- `cloud` - Manage your Speedscale Cloud resources
- `cluster` - Inspect and drive a Kubernetes cluster from the command line
- `completion` - Generate the autocompletion script for the specified shell
- `dlp` - Author and validate DLP redaction rules against local RRPair files
- `drift` - Find values that vary across two or more RRPair directories
- `export` - Export recorded traffic to a 3rd party format
- `files` - Utilities for working with RRPair files
- `filter` - Author and validate filter rules against local RRPair files
- `generate` - Generate RRPair files from OpenAPI specification
- `help` - Help about any command
- `import` - Import traffic from a snapshot file or a BYOC S3 bucket
- `init` - Initializes proxymock installation and configuration
- `inspect` - Inspect Speedscale traffic (test / mock files)
- `match-rate` - Tune the outbound mock match rate of a replay, offline
- `mcp` - Model Context Protocol (MCP) server
- `mock` - Run the mock server to respond to outbound requests from your app
- `recommendations` - Work the replay-tuning recommendations the analyzer finds
- `record` - Record traffic from your app, turning it into RRPair files
- `replay` - Replay tests to make requests to your app
- `report` - Generate a performance/reliability/security report from captured RRPairs
- `send-one` - Send a single test (RRPair) to an arbitrary URL
- `transform` - Author and validate traffic transforms against local RRPair files
- `validate` - Validate recorded HTTP responses against an OpenAPI spec
- `version` - Prints current version of client and cloud
- `web` - Start the embedded web interface

## Main workflow commands

### `record`

Record traffic from your app, turning it into RRPair files which can be used to mock responses or run a load test.

**Usage**

```bash
proxymock record [flags]
```

**Examples**

```bash
proxymock record

# write to a specific directory
proxymock record --out my-recording

# launch your application directly
proxymock record -- go run .
proxymock record -- npm start
proxymock record -- python app.py

# set up a reverse proxy for Postgres
proxymock record --map 65432=localhost:5432

# optionally include a protocol for the reverse proxy
proxymock record --map 65432=postgres://localhost:5432
proxymock record --map 1443=https://httpbin.org:443
```

**Flags**

- `--app-health-endpoint string` - Wait for an app health endpoint to return HTTP 200 before starting. Accepts a path like `/healthz` or a full URL.
- `--app-host string` - Host where your app is running (default `localhost`)
- `--app-log-to string` - File path to redirect wrapped application output to
- `--app-port uint32` - Port your app is listening on (default `8080`)
- `--health-port int` - Port to expose proxymock's own readiness endpoint
- `--log-to string` - File path to redirect all proxymock output to
- `-m, --map stringToString` - Create a reverse proxy mapping in the form `<LISTEN_PORT>=<BACKEND_HOST>:<BACKEND_PORT>` or `<LISTEN_PORT>=<PROTOCOL>://<BACKEND_HOST>:<BACKEND_PORT>`
- `--out string` - Directory to write recorded test and mock request/response files to (default `proxymock/recorded-<timestamp>`)
- `--out-format string` - Output format for files, one of `markdown` or `json` (default `markdown`)
- `--proxy-in-port uint32` - Port where proxymock listens for inbound traffic that it forwards to `--app-port` (default `4143`)
- `--proxy-out-port int` - Port where proxymock listens for outbound traffic from your app to external services (default `4140`)
- `--svc-name string` - Service name shown in snapshot details when pushed to Speedscale Cloud (default `my-app`)
- `--timeout duration` - Command timeout such as `10s`, `5m`, or `1h` (default `12h`)

### `mock`

Run the mock server to respond to outbound requests from your app with mock responses defined by mock definitions.

**Usage**

```bash
proxymock mock [flags]
```

**Aliases**

```text
mock, run
```

**Examples**

```bash
# start mock server with data from the current working directory
proxymock mock --verbose

# source mock data from one directory and write observed requests and responses to another
proxymock mock --in ./my-recordings --out ./mocked-responses

# launch your application directly
proxymock mock -- go run .
proxymock mock -- npm start
proxymock mock -- python app.py

# set up a reverse proxy for Postgres while mocking
proxymock mock --map 65432=localhost:5432
```

**Flags**

- `--app-health-endpoint string` - Wait for an app health endpoint to return HTTP 200 before starting
- `--app-log-to string` - File path to redirect wrapped application output to
- `--health-port int` - Port to expose proxymock's own readiness endpoint
- `--in strings` - Directories to read mock files from recursively (default current directory)
- `--log-to string` - File path to redirect all proxymock output to
- `-m, --map stringToString` - Create a reverse proxy mapping for backends
- `--mock-timing string` - Response timing behavior: `none`, `recorded`, or a multiplier such as `5x` or `.25x` (default `none`)
- `--no-out` - Do not write observed mock requests or responses to disk
- `--out string` - Directory to write observed `MATCH`, `NO_MATCH`, and `PASSTHROUGH` traffic to (default `proxymock/results/mocked-<timestamp>`)
- `--out-format string` - Output format for files, one of `markdown` or `json` (default `markdown`)
- `--proxy-out-port int` - Port where proxymock listens for outbound connections from your app (default `4140`)
- `--timeout duration` - Command timeout such as `10s`, `5m`, or `1h` (default `12h`)

### `replay`

Replay tests to make requests to your app.

**Usage**

```bash
proxymock replay [flags]
```

**Examples**

```bash
# specify the port to replay against but use the recorded scheme
proxymock replay --test-against localhost:8080

# specify the scheme and port to replay against
proxymock replay --test-against http://localhost:8080

# cycle through tests for 5 minutes
proxymock replay --test-against http://localhost:8080 --for 5m

# run 10 virtual users in parallel
proxymock replay --test-against http://localhost:8080 --vus 10

# direct traffic by service name
proxymock replay \
  --test-against auth=auth.example.com \
  --test-against frontend=http://localhost:8080 \
  --test-against http://localhost:9000

# launch your application directly
proxymock replay --test-against http://localhost:8080 -- go run .
proxymock replay --test-against localhost:8080 -- npm start
proxymock replay --test-against localhost:3000 -- python app.py

# produce recorded Kafka traffic to a broker so your application can consume it
proxymock replay --test-against localhost:9092
```

**Flags**

- `--app-log-to string` - File path to redirect wrapped application output to
- `--fail-if strings` - Fail with exit code `1` when a validation condition is true
- `-f, --for duration` - How long to replay in Go duration format; by default each test runs once
- `--in strings` - Directories to read test files from recursively (default current directory)
- `--log-to string` - File path to redirect all proxymock output to
- `--no-out` - Do not write observed replay requests or responses to disk
- `--out string` - Directory to write observed replay request/response files to (default `proxymock/results/replayed-<timestamp>`)
- `--out-format string` - Output format for files, one of `markdown` or `json` (default `markdown`)
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)
- `--performance` - Sample failed or non-matching requests instead of writing all replay traffic to disk
- `--rewrite-host` - Rewrite the HTTP `Host` header to match the target host and port
- `--test-against strings` - Target address to replay against. You can pass this flag multiple times and scope specific targets by service name.
- `--timeout duration` - Command timeout such as `10s`, `5m`, or `1h` (default `12h`)
- `-n, --times uint` - Number of times to replay the traffic (default `1`)
- `-u, --vus uint` - Number of virtual users to run in parallel (default `1`)

**Validation operators**

- `==`
- `!=`
- `<`
- `<=`
- `>`
- `>=`

**Validation metrics**

- `latency.avg`
- `latency.max`
- `latency.min`
- `latency.p50`
- `latency.p75`
- `latency.p90`
- `latency.p95`
- `latency.p99`
- `requests.failed`
- `requests.per-minute`
- `requests.per-second`
- `requests.response-pct`
- `requests.result-match-pct`
- `requests.succeeded`
- `requests.total`

### `inspect`

Inspect Speedscale traffic in a TUI.

**Usage**

```bash
proxymock inspect [flags]
```

**Examples**

```bash
# inspect demo data
proxymock inspect --demo

# inspect RRPair files from a directory
proxymock inspect --in ./my-recording

# inspect a snapshot file on disk
proxymock inspect --snapshot ~/.speedscale/data/snapshots/<uuid>/raw.jsonl

# inspect a snapshot from the local snapshot repository by ID
proxymock inspect --snapshot fcc58b94-d94e-4280-a12b-a0b140975bc7
```

**Flags**

- `--demo` - Use demo data to explore the TUI without recording traffic first
- `--in strings` - Directories to recursively read RRPair files from (default current directory)
- `--log-to string` - File path to write logs to
- `--snapshot string` - Snapshot ID to target
- `--timeout duration` - Command timeout such as `10s`, `5m`, or `1h` (default `12h`)

## Utility commands

### `generate`

Generate RRPair files from an OpenAPI specification.

**Usage**

```bash
proxymock generate [flags] <openapi-spec-file>
```

**Examples**

```bash
# generate mocks from OpenAPI spec, then start a mock server
proxymock generate --out ./mocks api-spec.yaml
proxymock mock --in ./mocks

# generate from OpenAPI spec with default settings
proxymock generate api-spec.yaml

# generate to a specific output directory
proxymock generate --out ./mocks api-spec.json

# generate only endpoints with examples
proxymock generate --examples-only api-spec.yaml

# filter by OpenAPI tags
proxymock generate --tag-filter "users,orders" api-spec.yaml

# override host for generated requests
proxymock generate --host api.staging.com api-spec.yaml

# include optional properties in schemas
proxymock generate --include-optional api-spec.yaml
```

**Flags**

- `--examples-only` - Generate only responses with explicit examples
- `--exclude-paths string` - Comma-separated path patterns to exclude
- `--host string` - Override the host from the OpenAPI spec
- `--include-optional` - Include optional properties in generated schemas
- `--include-paths string` - Comma-separated path patterns to include
- `-o, --out string` - Output directory for generated RRPair files
- `--port int` - Override the port for generated requests (default comes from the spec or `80` / `443`)
- `--tag-filter string` - Generate only endpoints with specific tags

### `import`

Import traffic from a Speedscale snapshot file, or from a third-party capture format with the subcommands below. Each subcommand writes RRPair files into your local workspace.

**Usage**

```bash
proxymock import [flags]
proxymock import [command]
```

**Subcommands**

- `import s3` - Import historical traffic from a BYOC S3 bucket (see below)
- `import har` - Import a HAR document into local RRPair files
- `import postman` - Import a Postman collection into local RRPair files
- `import wiremock` - Import a WireMock project into local RRPair files
- `import goreplay` - Import a GoReplay capture file into local RRPair files
- `import http-wire` - Import raw HTTP wire format files into local RRPair files

**Examples**

```bash
# import from a file, writing RRPair files to the default directory under ./proxymock
proxymock import --file /path/to/snapshot.json

# specify the output directory
proxymock import --file /path/to/snapshot.json --out some/local/path
```

**Flags**

- `--file string` - File to import into the proxymock repository
- `--out string` - Directory where imported RRPair files will be written (default `proxymock/imported-<filename>`)
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)

### `import s3`

Import historical BYOC traffic from a customer's own S3 bucket into a local proxymock directory. The BYOC OpenTelemetry `awss3` exporter writes objects under the `byoc/` prefix in hive-style `year=/month=/day=/hour=/minute=` partitions; proxymock reads `_speedscale/byoc-layout.json` when present to enumerate workload-specific prefixes directly, and the legacy Fluent Bit layout is also supported. Use `--local-dir` to read from a local directory tree with the same layout, in which case `--bucket` and AWS credentials are not used. See the [Pull traffic from a BYOC bucket](/proxymock/guides/byoc-bucket.md) guide for the full workflow.

**Usage**

```bash
proxymock import s3 [flags]
```

**Examples**

```bash
# import matching traffic from the last hour
proxymock import s3 --bucket my-bucket --prefix byoc/ \
  --filter '(service IS "checkout") AND (status IS "500")'

# import from a local directory with the same layout as the S3 bucket
proxymock import s3 --local-dir ./fixtures/byoc-traffic --prefix byoc/ --service checkout --limit 10

# redact matched traffic on the way in with a local DLP config
proxymock import s3 --bucket my-bucket --prefix byoc/ --from now-15m --dlp-config my-dlp.json
```

**Flags**

- `--bucket string` - S3 bucket containing BYOC traffic
- `--local-dir string` - Local directory with BYOC S3 layout; mutually exclusive with `--bucket`
- `--prefix string` - S3 key prefix to search; use `byoc/` for the current OTel `awss3` layout
- `--filter string` - Speedscale traffic filter string; overlapping criteria override the convenience flags below
- `--from string` - Start time when `--filter` has no timerange, e.g. `now-15m` or `2026-06-12T18:00:00Z` (default `now-1h`)
- `--to string` - End time when `--filter` has no timerange (default `now`)
- `--service strings` - Service filter (repeat or comma-separate) added when `--filter` has no service predicate
- `--endpoint string` - Endpoint/location substring filter added when `--filter` has no endpoint predicate
- `--status string` - Exact status filter added when `--filter` has no status predicate
- `--direction string` - Direction filter (`in` or `out`) added when `--filter` has no direction predicate
- `--namespace string` - Namespace filter added when `--filter` has no namespace predicate
- `--app-label string` - Kubernetes app label used to narrow BYOC layout prefixes
- `--trace-id string` - Trace ID filter added when `--filter` has no trace-related predicate
- `--dlp-config string` - Local DLP config JSON file to apply to matched RRPairs before writing
- `--limit int` - Maximum number of matched RRPairs to write; `0` means unlimited
- `-f, --follow` - Keep importing as new objects arrive; runs until interrupted
- `--poll-interval duration` - How often to re-list the source for new objects when `--follow` is set (default `30s`)
- `--concurrency int` - Maximum number of S3 objects to download and parse concurrently (default `16`)
- `--region string` - AWS region; defaults to the AWS SDK configuration
- `--s3-endpoint-url string` - Custom S3 endpoint URL for S3-compatible stores
- `--s3-force-path-style` - Use path-style S3 addressing
- `--out string` - Directory where imported RRPair files will be written (default `proxymock/imported-s3-<timestamp>`)
- `--out-format string` - Output format for files, one of `markdown` or `json` (default `markdown`)
- `--timeout duration` - Command timeout, e.g. `10s`, `5m`, `1h` (default `12h`)
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)

### `send-one`

Send a single test (RRPair) to an arbitrary URL.

**Usage**

```bash
proxymock send-one [path] [URL] [flags]
```

**Examples**

```bash
# send a request to the orders service
proxymock send-one path/to/test.json http://orders:8080/foo/bar
```

**Flags**

- `-h, --help` - help for send-one

## Replay tuning commands

These commands tune a replay offline, from RRPair files on disk. No replay run, cluster, or Speedscale account is needed. They accept the same `-o/--output` formats as the rest of the CLI. `match-rate` and `recommendations` are separate id spaces: `match-rate` works the Mocks-view outbound match-rate fixes, `recommendations` works the general replay-tuning findings. Both write filter-scoped transforms into the workspace's per-service tuning blueprint rather than rewriting RRPair files, and later replay and mock runs apply the blueprint automatically.

### `match-rate`

Report and improve the rate at which a replay's outbound requests match the recorded mocks. This is the same loop as the web UI's Mocks view and the MCP `mocks` tool, over the same workspace and blueprints. The workspace usually comes from `proxymock cloud pull report <id>`, which materializes both analysis sides as run directories. See [Improve Mock Match Rate with AI](/proxymock/guides/mock-match-rate.md) for the guided workflow.

**Subcommands**

- `match-rate analyze` - Report the match rate and list fix recommendations
- `match-rate accept` - Accept a recommendation into the tuning blueprint
- `match-rate undo` - Remove a previously accepted recommendation
- `match-rate similar` - Deep-dive one projected miss against the recorded mocks

**Examples**

```bash
# report the match rate and list fixes in the current workspace
proxymock match-rate analyze

# analyze a pulled report, naming both sides explicitly
proxymock match-rate analyze --in ./my-app \
  --mock-source snapshot-2026-07-01 --request-source report-2026-07-02

# accept one fix, or everything the analyzer found
proxymock match-rate accept --id 'my-service|body:payment.transaction_id'
proxymock match-rate accept --all

# undo a previously accepted fix
proxymock match-rate undo --id 'my-service|body:payment.transaction_id'

# rank one projected miss against the nearest recorded signatures
proxymock match-rate similar --id proxymock/report-2026-07-02/my-service/abc123.md --max 10
```

**Common flags**

- `--in string` - Workspace directory holding the traffic to analyze (default `.`)
- `--mock-source string` - Run directory supplying the recorded mock signatures (default: newest `snapshot-*`/`recorded-*`/`mocked-*` run)
- `--request-source string` - Run directory supplying the outbound requests to check (default: newest `report-*`/`replayed-*` run)
- `--id string` - Recommendation id (from `match-rate analyze`), shaped `<service>|<target>`; for `similar`, a projected-miss id
- `--all` - (`accept`) Accept every open recommendation with its default transform
- `--transform string` - (`accept`) Override the recommended transform for this id, e.g. `constant`
- `--max int` - (`similar`) How many nearest recorded candidates to return (default `3`)
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)

### `recommendations`

Analyze the RRPair files in a workspace and work the general replay-tuning recommendations the analyzer finds. `transform` recommendations are mechanical fixes the traffic needs to replay or mock cleanly (JWT re-signing, timestamp shifting, message-id rotation, data redaction); `traffic` recommendations are informational findings. Accepting merges a recommendation's transform chains into the workspace's per-service tuning blueprint. See [Fix Replay Failures with Recommendations](/proxymock/guides/recommendations.md) for the guided workflow.

**Subcommands**

- `recommendations list` - Analyze and list what the analyzer found, with the id needed to accept or reject each one
- `recommendations accept` - Merge a recommendation's transforms into the blueprint
- `recommendations reject` - Hide a recommendation from future lists

**Examples**

```bash
# list everything the analyzer finds in the current directory
proxymock recommendations list

# only the mechanical transform fixes, from another workspace
proxymock recommendations list --in ./my-app --type transform

# accept or reject one recommendation by id
proxymock recommendations accept --id 3f9a1c2e8b7d4056
proxymock recommendations reject --id 3f9a1c2e8b7d4056
```

**Common flags**

- `--in string` - Workspace directory holding the traffic to analyze (default `.`)
- `--type string` - (`list`) Restrict to one kind: `transform` or `traffic`
- `--id string` - Recommendation id to accept or reject (from `recommendations list`)
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)

## Local rule authoring commands

Author and validate DLP redaction rules, traffic filters, and transforms against local RRPair files. These commands run entirely on your local system: no Speedscale configuration, API key, or network access is required. Each config is the same JSON document Speedscale Cloud uses, so a rule developed locally can be uploaded with `proxymock cloud push <kind>` and a cloud rule can be tested locally after `proxymock cloud pull <kind>`. The `--dlp-config`, `--filter-config`, and `--transform-config` flags each accept a JSON file path or the id of a rule downloaded with the matching `cloud pull`. See [Author DLP and filter rules locally](/proxymock/guides/local-rules.md) for the guided workflow.

### `dlp`

Author and validate DLP (data loss prevention) redaction rules. The redaction pipeline is identical to what `proxymock record --dlp-config` applies at capture time, so `dlp test` reports exactly what a live recording would redact.

**Subcommands**

- `dlp test` - Report what a DLP config would redact from RRPair files, without modifying any file
- `dlp apply` - Write redacted copies of RRPair files

**Examples**

```bash
# report per-field match counts and locations
proxymock dlp test --dlp-config my-dlp.json --in ./recorded

# test a rule previously downloaded with 'proxymock cloud pull dlp standard'
proxymock dlp test --dlp-config standard --in ./recorded

# show the full before/after redaction of one file
proxymock dlp test --dlp-config my-dlp.json --show-redacted ./recorded/api/foo.md

# write redacted copies to a separate directory
proxymock dlp apply --dlp-config my-dlp.json --in ./recorded --out ./redacted
```

**Flags**

- `--dlp-config string` - DLP config JSON file, or the id of a rule downloaded with `proxymock cloud pull dlp`
- `--in strings` - Directories or RRPair files to read from (default `.`)
- `--show-redacted string` - (`test`) Print the full before/after redaction of this RRPair file instead of the summary
- `--out string` - (`apply`) Directory to write redacted copies to (must be outside `--in`)

### `filter`

Author and validate filter rules. The filter engine is identical to the one the forwarder uses: an RRPair that matches the filter is dropped, one that does not is kept.

**Subcommands**

- `filter test` - Report which RRPairs a filter would keep or drop
- `filter apply` - Write only the RRPairs a filter keeps

**Examples**

```bash
# report which RRPairs would be kept or dropped
proxymock filter test --filter-config my-filter.json --in ./recorded

# list every dropped RRPair, not just a sample
proxymock filter test --filter-config my-filter.json --in ./recorded --show-dropped

# write only the passing RRPairs to a separate directory
proxymock filter apply --filter-config my-filter.json --in ./recorded --out ./filtered
```

**Flags**

- `--filter-config string` - Filter config JSON file, or the id of a rule downloaded with `proxymock cloud pull filter`
- `--in strings` - Directories or RRPair files to read from (default `.`)
- `--show-dropped` - (`test`) List every dropped RRPair instead of a sample
- `--out string` - (`apply`) Directory to write the passing RRPairs to (must be outside `--in`)

### `transform`

Author and validate traffic transforms. The transform engine is identical to the one the cloud snapshot Transforms tab and proxymock web use, so `transform test` previews exactly what the generator and responder would apply at replay.

**Subcommands**

- `transform test` - Preview what a transform config would change in RRPair files
- `transform apply` - Write transformed copies of RRPair files

**Examples**

```bash
# preview what a transform set would change
proxymock transform test --transform-config my-transforms.json --in ./recorded

# show the full before/after of one file
proxymock transform test --transform-config my-transforms.json --show ./recorded/api/foo.md
```

**Flags**

- `--transform-config string` - Transform config JSON file, or the id of a set downloaded with `proxymock cloud pull transform`
- `--in strings` - Directories or RRPair files to read from (default `.`)
- `--show string` - (`test`) Print the full before/after transform of this RRPair file instead of the summary
- `--out string` - (`apply`) Directory to write transformed copies to (must be outside `--in`)

## File management commands

### `files`

Utilities for working with RRPair files.

**Usage**

```bash
proxymock files [command]
```

**Available subcommands**

- `compare` - Compare proxymock files
- `convert` - Convert RRPair files between formats
- `update-mocks` - Update mock signatures for RRPair files

### `files compare`

Compare proxymock RRPair files.

**Usage**

```bash
proxymock files compare [flags]
```

**Examples**

```bash
# compare files in the current directory
proxymock files compare

# compare files from two distinct directories
proxymock files compare --in recorded/ --in replayed/

# very verbose output
proxymock files compare -vvv
```

**Flags**

- `--in strings` - Directories or files to read from (default current directory)

### `files convert`

Convert RRPair files between formats.

**Usage**

```bash
proxymock files convert [flags]
```

**Examples**

```bash
# convert all files in the current directory
proxymock files convert

# convert a single JSON file to markdown
proxymock files convert --in file.json

# convert markdown files in the proxymock directory to JSON
proxymock files convert --in proxymock --out-format json
```

**Flags**

- `--in strings` - Directories or files to convert
- `--keep-original` - Keep original files after conversion
- `--out-format string` - Output file format, `markdown` or `json` (default `markdown`)
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)

### `files update-mocks`

Update mock signatures for RRPair files.

**Usage**

```bash
proxymock files update-mocks [flags]
```

**Examples**

```bash
# update mocks for files in the current directory
proxymock files update-mocks

# update a single RRPair file
proxymock files update-mocks --in file.md

# update mocks for files in multiple directories
proxymock files update-mocks --in recorded/ --in replayed/

# update mock signatures in a JSONL file
proxymock files update-mocks --in rrs.jsonl
```

**Flags**

- `--in strings` - Directories or files to process
- `--normalize` - Normalize the RRPair after updating the signature
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)

## Cloud integration commands

### `cloud`

Manage your Speedscale Cloud resources.

**Usage**

```bash
proxymock cloud [command]
```

**Available subcommands**

- `pull` - Pull artifacts from Speedscale Cloud
- `push` - Push artifacts to Speedscale Cloud

### `cloud pull`

Pull artifacts from Speedscale Cloud.

**Usage**

```bash
proxymock cloud pull [command]
```

**Aliases**

```text
pull, download
```

**Available subcommands**

- `cron-job` - Pull a cron job
- `dlp` - Pull a DLP rule set
- `filter` - Pull a filter rule set
- `report` - Pull a report and its artifacts
- `snapshot` - Pull a snapshot and its artifacts
- `test-config` - Pull a test config
- `transform` - Pull a transform set
- `user-data` - Pull user-defined documents

### `cloud push`

Push artifacts to Speedscale Cloud.

**Usage**

```bash
proxymock cloud push [command]
```

**Available subcommands**

- `cron-job` - Push a cron job to Speedscale Cloud
- `dlp` - Push a DLP rule to Speedscale Cloud
- `filter` - Push a filter to Speedscale Cloud
- `report` - Push a report and its artifacts
- `snapshot` - Create and push a snapshot from RRPair files
- `test-config` - Push a test config to Speedscale Cloud
- `transform` - Push a transform set to Speedscale Cloud
- `user-data` - Push user-defined documents

## Kubernetes cluster commands

These commands work the cluster your kubeconfig points at. Reads and writes go
straight to the cluster, so no Speedscale account or registered inspector is
needed. The one exception is `cluster replay start`, which publishes the
recordings to Speedscale Cloud so the in-cluster generator can pull them.

Use `--kube-context` to pick a context other than your current one. That is the
only connection setting most people ever need: the read and replay verbs are
served by Speedscale components running inside the cluster, and proxymock finds
them and port-forwards to them for you.

`--forwarder-addr` is available on the forwarder-served verbs for the narrow case
where you are already running your own `kubectl port-forward`, or can reach the
forwarder directly. It is never required.

This is the same surface as the `cluster` MCP tool and the Observability view in
`proxymock web`.

### `cluster`

Inspect and drive a Kubernetes cluster from the command line.

**Usage**

```bash
proxymock cluster [command]
```

**Available subcommands**

- `capture` - Turn eBPF traffic capture on or off for a workload
- `dependencies` - Show what a workload depends on
- `events` - Read Kubernetes events for a workload
- `logs` - Read pod logs for a workload
- `namespaces` - List the namespaces the cluster's forwarder can see
- `nodes` - List the cluster's nodes
- `pods` - List the pods in a namespace
- `replay` - Run a recorded snapshot against a workload inside the cluster
- `services` - List the Kubernetes Services in a namespace
- `topology` - Show the service map for a namespace
- `workloads` - List the workloads the cluster's forwarder can see

**Common flags**

- `--kube-context string` - kubeconfig context to target (default: your current-context)
- `-n, --namespace string` - Kubernetes namespace holding the workload
- `--workload string` - workload name to target
- `--workload-type string` - workload kind: deployment, statefulset, daemonset, replicaset, job or rollout

### `cluster capture`

Turn eBPF traffic capture on or off for a Kubernetes workload, and read back
whether it is currently on. These verbs patch `capture.speedscale.com/*`
annotations onto the workload, which records intent: the in-cluster Speedscale
operator and nettap daemon watch those annotations and do the actual capture.

**Usage**

```bash
proxymock cluster capture [command]
```

**Available subcommands**

- `inject` - Turn eBPF traffic capture on for a workload
- `status` - Report whether eBPF capture is on for a workload
- `uninject` - Turn eBPF traffic capture off for a workload

**Flags**

- `--java-agent` - inject only: also inject the Java agent (restarts the workload; only useful for JVM workloads)
- `--ignore-ports int32Slice` - inject only: ports to exclude from capture, comma separated

**Examples**

```bash
# capture a deployment, leaving the health-check port out
proxymock cluster capture inject -n banking-app --workload banking-user --ignore-ports 8080

# check whether capture is on, and whether the workload runs a JVM
proxymock cluster capture status -n banking-app --workload banking-user

# turn it back off
proxymock cluster capture uninject -n banking-app --workload banking-user
```

### `cluster replay`

Run recorded traffic against a workload running in your cluster. The Speedscale
operator provisions the generator that sends the traffic and, when you mock
dependencies, the responder that answers them.

**Usage**

```bash
proxymock cluster replay [command]
```

**Available subcommands**

- `cancel` - Tear down a running replay
- `logs` - Tail a running replay's logs
- `prepare` - Show what a recording can route and what it can mock
- `start` - Push the recordings and start a replay in the cluster
- `status` - Report where a replay is, or list the running ones

**Flags**

- `--in strings` - directories holding the RRPair files to replay (prepare, start)
- `--target string` - start: replay against this address instead of a cluster workload (no mocking)
- `--route strings` - start: send one inbound slice to its own workload as `SLICE=WORKLOAD`; repeatable
- `--mock strings` - start: outbound dependency key to mock, from `replay prepare`; repeatable
- `--snapshot-id string` - start: replay a snapshot already in Speedscale Cloud instead of pushing these recordings
- `--wait` - start: block until the replay reaches a terminal state, reporting each stage
- `--all` - status: include replays that are no longer running but still in the cluster
- `--source strings` - logs: only stream this component: generator, responder or collector
- `-f, --follow` - logs: keep streaming until interrupted, ignoring `--timeout`
- `--max-lines int` - logs: stop after this many lines

**Examples**

```bash
# find out what can be routed and what can be mocked, locally and without a login
proxymock cluster replay prepare --in proxymock

# replay against a workload, mocking its database, and block until it finishes
proxymock cluster replay start -n banking-app --workload banking-user \
  --mock 'postgres:banking-postgres:5432' --wait

# split the recording: one slice to its own workload, the rest to --workload
proxymock cluster replay start -n banking-app --workload banking-frontend \
  --route 'checkout:checkout.example.com:8080=banking-gateway'

# what is running right now, then follow one
proxymock cluster replay status
proxymock cluster replay status -n banking-app quiet-otter-1234

# stop one
proxymock cluster replay cancel -n banking-app quiet-otter-1234
```

Every slice goes to exactly one destination. The operator rejects a replay whose
workloads claim overlapping traffic.

`replay logs` is a live tap with no history: it delivers lines emitted while it
is subscribed, so start it while the replay is running. The complete log is the
report in Speedscale Cloud.

### `cluster` read commands

Read-only views of the cluster, each the scriptable equivalent of a panel in the
`proxymock web` Observability view. All support `-o json`.

**Usage**

```bash
proxymock cluster namespaces
proxymock cluster nodes
proxymock cluster workloads [--namespace NS]
proxymock cluster topology --namespace NS
proxymock cluster pods --namespace NS [--workload NAME]
proxymock cluster services --namespace NS
proxymock cluster dependencies --namespace NS --workload NAME
proxymock cluster logs --namespace NS --workload NAME [--container NAME] [--previous] [--tail N] [--since SECONDS]
proxymock cluster events --namespace NS --workload NAME [--limit N]
```

Two different in-cluster services back these, and the difference is visible:

- `topology`, `namespaces`, `nodes`, `workloads` and `pods` come from the
  forwarder's aggregator, which only knows about what nettap has **observed**. A
  workload or pod with no observed traffic is absent, so a freshly scaled-up
  workload can show fewer pods here than `kubectl get pods`.
- `logs`, `events`, `services` and `dependencies` come from the inspector, which
  reads the apiserver under its own ServiceAccount. Those work for any workload,
  observed or not, and work for a user whose own kubeconfig is not allowed to
  read pod logs directly.

**Examples**

```bash
# what is in this cluster
proxymock cluster namespaces
proxymock cluster workloads --namespace banking-app

# what talks to what, from traffic actually seen on the wire
proxymock cluster topology --namespace banking-app

# why is this workload unhealthy
proxymock cluster events -n banking-app --workload banking-user
proxymock cluster logs -n banking-app --workload banking-user --previous

# a pod stuck in init: read the init container the failure names
proxymock cluster logs -n banking-app --workload banking-user \
  --container speedscale-initproxy-responder
```

`--previous` reads the last terminated container, which is the only way to see
why a `CrashLoopBackOff` pod died. When a read comes back empty the output names
the pod's containers, including init containers, so you can pick the right one
with `--container`.

## System commands

### `admin`

Administrative and maintenance commands. Groups the low-traffic `certs` and `clean` commands under one noun so they stay out of the main `proxymock --help` list.

**Usage**

```bash
proxymock admin [command]
```

**Available subcommands**

- `certs` - Create proxymock TLS certificates
- `clean` - Remove regenerable proxymock directories (replay/mock output and scratch)

> The legacy top-level paths `proxymock certs` and `proxymock clean` still work as hidden aliases for one or two releases, but `proxymock admin certs` / `proxymock admin clean` are the supported paths.

### `admin certs`

Create proxymock TLS certificates.

**Usage**

```bash
proxymock admin certs [flags]
```

**Examples**

```bash
proxymock admin certs
```

**Flags**

- `--force` - Regenerate certificates and overwrite the current ones if they exist
- `--jks` - Create a Java truststore file that includes proxymock certificates

### `admin clean`

Remove regenerable proxymock directories (replay and mock output, and transient replay scratch). Recordings and transform configuration are never touched.

**Usage**

```bash
proxymock admin clean [flags]
```

**Examples**

```bash
# preview what would be removed from ./proxymock
proxymock admin clean --dry-run

# clean a specific workspace without the confirmation prompt
proxymock admin clean --in ./proxymock --yes

# also clear the .proxymock/ web-UI state directory
proxymock admin clean --cache
```

**Flags**

- `--cache` - Also remove the `.proxymock/` web-UI state directory (backups, dismissed hints, replay configs)
- `--dry-run` - Show what would be removed without deleting anything
- `--in string` - Workspace directory to clean (default current directory)
- `-y, --yes` - Skip the confirmation prompt

### `init`

Initialize proxymock installation and configuration.

**Usage**

```bash
proxymock init [flags]
```

**Flags**

- `--api-key string` - Set the API key without being prompted
- `--home string` - Path of the Speedscale home directory (default `${HOME}/.speedscale`)
- `--no-rcfile-update` - Do not automatically update your shell rc file with Speedscale environment variables
- `--overwrite` - Overwrite any existing `config.yaml` file. By default proxymock creates a backup.
- `--quiet` - Suppress all output except fatal errors
- `--rcfile string` - Shell rc file to update with Speedscale environment variables (default `${HOME}/.zshrc`)
- `-y, --yes` - Answer yes to all optional prompts

### `mcp`

Model Context Protocol (MCP) server.

**Usage**

```bash
proxymock mcp [flags]
proxymock mcp [command]
```

**Available subcommands**

- `install` - Install the MCP server configuration for IDEs
- `json` - Print MCP JSON for manual configuration
- `run` - Run the MCP server

### `mcp install`

Install the MCP server configuration for IDEs.

**Usage**

```bash
proxymock mcp install [flags]
```

**Examples**

```bash
# install the stdio MCP server
proxymock mcp install

# install the SSE MCP server
proxymock mcp install --sse
```

**Flags**

- `--port int` - Port to use when installing the SSE transport (default `8080`)
- `--sse` - Install the SSE transport instead of stdio

### `mcp json`

Print MCP JSON for manual configuration.

**Usage**

```bash
proxymock mcp json [flags]
```

**Flags**

- `--port int` - Port to use when generating SSE configuration (default `8080`)
- `--sse` - Generate JSON for the SSE transport instead of stdio

### `mcp run`

Run the MCP server.

**Usage**

```bash
proxymock mcp run [flags]
```

**Examples**

```bash
# run the MCP server over stdio
proxymock mcp run

# run the MCP server over SSE
proxymock mcp run --sse --port 8080
```

**Flags**

- `--port int` - Port to use when serving the SSE transport (default `8080`)
- `--sse` - Serve MCP over SSE instead of stdio
- `--work-dir string` - Working directory to run the MCP server in

### `completion`

Generate the autocompletion script for the specified shell.

**Usage**

```bash
proxymock completion [command]
```

**Available subcommands**

- `bash` - Generate the autocompletion script for bash
- `fish` - Generate the autocompletion script for fish
- `powershell` - Generate the autocompletion script for powershell
- `zsh` - Generate the autocompletion script for zsh

### `version`

Print the current version of client and cloud.

**Usage**

```bash
proxymock version [flags]
```

**Flags**

- `--client` - Show only the local client version
- `-o, --output string` - Console output format, one of `pretty`, `json`, `yaml`, or `csv` (default `json`)
