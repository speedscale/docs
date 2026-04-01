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

- `certs` - Create proxymock TLS certificates
- `cloud` - Manage your Speedscale Cloud resources
- `completion` - Generate the autocompletion script for the specified shell
- `files` - Utilities for working with RRPair files
- `generate` - Generate RRPair files from OpenAPI specification
- `help` - Help about any command
- `import` - Import traffic from a snapshot file
- `init` - Initializes proxymock installation and configuration
- `inspect` - Inspect Speedscale traffic (test / mock files)
- `mcp` - Model Context Protocol (MCP) server
- `mock` - Run the mock server to respond to outbound requests from your app
- `record` - Record traffic from your app, turning it into RRPair files
- `replay` - Replay tests to make requests to your app
- `send-one` - Send a single test (RRPair) to an arbitrary URL
- `version` - Prints current version of client and cloud

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

Import traffic from a snapshot file.

**Usage**

```bash
proxymock import [flags]
```

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

## System commands

### `certs`

Create proxymock TLS certificates.

**Usage**

```bash
proxymock certs [flags]
```

**Examples**

```bash
proxymock certs
```

**Flags**

- `--force` - Regenerate certificates and overwrite the current ones if they exist
- `--jks` - Create a Java truststore file that includes proxymock certificates

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
