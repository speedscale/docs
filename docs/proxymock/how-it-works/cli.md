# CLI Documentation

## Overview

proxymock is a tool that allows you to record, visualize, mock, and replay traffic on your local system. It provides desktop and CI/CD functionality for API traffic capture, replay, and testing.

proxymock can record, mock, and replay locally for free, but also works with Speedscale Enterprise to record from a remote system (like a Kubernetes cluster) or integrate into your CI/CD system.

## Architecture

proxymock uses smart proxies to intercept and record traffic between your application and external services. It operates in two main modes:

1. **Recording**: Captures traffic from your app using both inbound and outbound proxies
2. **Mocking**: Uses recorded traffic to simulate external service responses

## Global Flags

These flags are available for all commands:

- `--app-url string`: URL of the speedscale app
- `--config string`: Config file (default `${HOME}/.speedscale/config.yaml`)
- `-c, --context string`: Uses a specific context from config file
- `--exit-zero`: Always exit with status code 0
- `-h, --help`: Help for proxymock
- `-v, --verbose count`: Verbose output - pass more than once for more verbosity

## Main Workflow Commands

### record

Record traffic from your app, turning it into test and mock files.

**Usage:**
```bash
proxymock record [flags]
```

**Architecture:**
```
┌───────────┐                    ┌──────────────────┐                       ┌───────────┐
│           │──────request──────►│                  │───external request───►│           │
│ proxymock │                    │ your application │                       │ proxymock │
│(port 4143)│◄───app response────│                  │◄───────response───────│(port 4140)│
└───────────┘                    └──────────────────┘                       └───────────┘
```

**Flags:**
- `--app-port uint32`: Port your app is listening on (default 8080)
- `--health-port int`: Port to expose proxymock health check endpoint
- `--log-to string`: File path to redirect all proxymock output
- `--out string`: Directory to write recorded files (default: `proxymock/recorded-<timestamp>`)
- `--out-format string`: Output format [markdown, json] (default "markdown")
- `--proxy-in-port uint32`: Port for inbound traffic proxy (default 4143)
- `--proxy-out-port int`: Port for outbound traffic proxy (default 4140)
- `--reverse-proxy strings`: TCP reverse proxy targets
- `--svc-name string`: Service name for cloud integration (default "my-app")
- `--timeout duration`: Command timeout (default 12h0m0s)

**Examples:**
```bash
# Basic recording
proxymock record

# Write to specific directory
proxymock record --out my-recording

# Launch your application directly
proxymock record -- go run .
proxymock record -- npm start
proxymock record -- python app.py

# Setup reverse proxy for Postgres
proxymock record --reverse-proxy 65432=localhost:5432
```

**Environment Variables for Recording:**
```bash
# For HTTP(s) traffic
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
export grpc_proxy=http://$(hostname):4140

# For SOCKS (supports more protocols)
export http_proxy=socks5h://localhost:4140
export https_proxy=socks5h://localhost:4140
export tcp_proxy=socks5h://localhost:4140
export grpc_proxy=http://$(hostname):4140
```

### mock

Run the mock server to respond to outbound requests from your app with mock responses.

**Usage:**
```bash
proxymock mock [flags]
```

**Aliases:** `run`

**Architecture:**
```
┌────────┐                    ┌──────────────────┐                       ┌───────────┐
│        │──────request──────►│                  │───external request───►│           │
│ client │                    │ your application │                       │ proxymock │
│        │◄───app response────│                  │◄───────response───────│(port 4140)│
└────────┘                    └──────────────────┘                       └───────────┘
```

**Flags:**
- `--health-port int`: Port to expose proxymock health check endpoint
- `--in strings`: Directories to read mock files from (default [.])
- `--log-to string`: File path to redirect all proxymock output
- `--no-out`: Do not write observed mock requests/responses to disk
- `--out string`: Directory to write new mock files (default: `proxymock/mocked-<timestamp>`)
- `--out-format string`: Output format [markdown, json] (default "markdown")
- `--proxy-out-port int`: Port for outbound proxy (default 4140)
- `-s, --service stringToString`: Port mapping for mocked backends
- `--timeout duration`: Command timeout (default 12h0m0s)

**Examples:**
```bash
# Start mock server with data from current directory
proxymock mock --verbose

# Source mock data from one directory, write responses to another
proxymock mock --in ./my-recordings --out ./mocked-responses

# Launch your application directly
proxymock mock -- go run .
proxymock mock -- npm start
proxymock mock -- python app.py

# Set up service port mappings
proxymock mock --service mysql=3306 --service postgres=5432
```

### replay

Replay tests to make requests to your app based on test definitions.

**Usage:**
```bash
proxymock replay [flags]
```

**Architecture:**
```
┌───────────┐                       ┌──────────────────┐
│ proxymock │───recorded request───►│                  │
│    as     │                       │ your application │
│  client   │◄─────app response─────│                  │
└───────────┘                       └──────────────────┘
```

**Flags:**
- `--fail-if strings`: Fail the command if a metric check is true
- `-f, --for duration`: How long to replay (default: runs each test once)
- `--in strings`: Directories to read test files from (default [.])
- `--log-to string`: File path to redirect all proxymock output
- `--no-out`: Do not write observed replay requests/responses to disk
- `--out string`: Directory to write observed replay files (default: `proxymock/replayed-<timestamp>`)
- `--out-format string`: Output format [markdown, json] (default "markdown")
- `-o, --output string`: Output format [pretty, json, yaml, csv] (default "json")
- `--performance`: Performance mode - writes only sample of failed requests
- `--test-against string`: URI to replay against (default "localhost")
- `--timeout duration`: Command timeout (default 12h0m0s)
- `-u, --vus uint`: Number of virtual users to run in parallel (default 1)

**Examples:**
```bash
# Specify port to replay against
proxymock replay --test-against localhost:8080

# Specify scheme and port
proxymock replay --test-against http://localhost:8080

# Cycle through tests for 5 minutes
proxymock replay --test-against http://localhost:8080 --for 5m

# Run 10 virtual users in parallel
proxymock replay --test-against http://localhost:8080 --vus 10

# Launch your application directly
proxymock replay --test-against http://localhost:8080 -- go run .
proxymock replay --test-against localhost:8080 -- npm start

# Add validation checks
proxymock replay --fail-if "requests.failed != 0" --fail-if "latency.avg > 1"
```

**Validation Metrics:**
- `latency.avg`, `latency.max`, `latency.min`, `latency.p50`, `latency.p75`, `latency.p90`, `latency.p95`, `latency.p99`
- `requests.failed`, `requests.per-minute`, `requests.per-second`, `requests.response-pct`, `requests.status-code-match-pct`, `requests.succeeded`, `requests.total`

**Operators:** `==`, `!=`, `<`, `<=`, `>`, `>=`

### inspect

Inspect Speedscale traffic in a TUI (terminal user interface).

**Usage:**
```bash
proxymock inspect [flags]
```

**Flags:**
- `--demo`: Use demo data to explore the TUI
- `--in strings`: Directories to read test and mock files from (default [.])
- `--log-to string`: File path to write logs to
- `--snapshot string`: Snapshot ID to target (advanced)
- `--timeout duration`: Command timeout (default 12h0m0s)

**Examples:**
```bash
# Inspect demo data
proxymock inspect --demo

# Inspect test and mock files from a directory
proxymock inspect --in ./my-recording

# Inspect a snapshot file on disk
proxymock inspect --snapshot ~/.speedscale/data/snapshots/<uuid>/raw.jsonl

# Inspect a snapshot by ID
proxymock inspect --snapshot fcc58b94-d94e-4280-a12b-a0b140975bc7
```

## Utility Commands

### generate

Generate RRPair markdown files from an OpenAPI specification.

**Usage:**
```bash
proxymock generate [flags] <openapi-spec-file>
```

**Flags:**
- `--examples-only`: Generate only responses with explicit examples
- `--exclude-paths string`: Comma-separated path patterns to exclude
- `--host string`: Override host from OpenAPI spec
- `--include-optional`: Include optional properties in generated schemas
- `--include-paths string`: Comma-separated path patterns to include
- `-o, --out string`: Output directory for generated RRPair files
- `--port int`: Override port for mock server
- `--tag-filter string`: Only generate endpoints with specific tags

**Examples:**
```bash
# Generate from OpenAPI spec with default settings
proxymock generate api-spec.yaml

# Generate to specific output directory
proxymock generate --out ./mocks api-spec.json

# Generate only endpoints with examples
proxymock generate --examples-only api-spec.yaml

# Filter by OpenAPI tags
proxymock generate --tag-filter "users,orders" api-spec.yaml

# Override host for generated requests
proxymock generate --host api.staging.com api-spec.yaml
```

### import

Import traffic from a snapshot file into a local directory.

**Usage:**
```bash
proxymock import [flags]
```

**Flags:**
- `--file string`: File to import into the proxymock repository
- `--out string`: Directory where imported files will be written (default: `proxymock/imported-<filename>`)
- `-o, --output string`: Output format [pretty, json, yaml, csv] (default "json")

**Examples:**
```bash
# Import from a file to default directory
proxymock import --file /path/to/snapshot.json

# Specify output directory
proxymock import --file /path/to/snapshot.json --out some/local/path
```

### send-one

Send a single request based on the contents of a test or mock file.

**Usage:**
```bash
proxymock send-one [path] [URL] [flags]
```

**Examples:**
```bash
# Send a request to the orders service
proxymock send-one path/to/test.json http://orders:8080/foo/bar
```

## File Management Commands

### files

Utilities for working with test and mock files.

**Usage:**
```bash
proxymock files [command]
```

**Available Commands:**
- `compare`: Compare proxymock files
- `convert`: Convert RRPair files between formats
- `update-mocks`: Update mock signatures for RRPair files

#### files compare

Compare proxymock RRPair files for differences.

**Usage:**
```bash
proxymock files compare [flags]
```

**Flags:**
- `--in strings`: Directories or files to read from (default [.])

**Examples:**
```bash
# Compare files in current directory
proxymock files compare

# Compare files from two directories
proxymock files compare --in recorded/ --in replayed/

# Very verbose output
proxymock files compare -vvv
```

#### files convert

Convert RRPair files between different formats.

**Usage:**
```bash
proxymock files convert [flags]
```

**Flags:**
- `--in strings`: Directories or files to convert
- `--keep-original`: Keep original files after conversion
- `--out-format string`: Output format [markdown, json] (default "markdown")
- `-o, --output string`: Output format [pretty, json, yaml, csv] (default "json")

**Examples:**
```bash
# Convert all files in current directory
proxymock files convert

# Convert single JSON file to markdown
proxymock files convert --in file.json

# Convert markdown files to JSON
proxymock files convert --in proxymock --out-format json
```

#### files update-mocks

Update the mock signatures for all RRPair files, resetting the signature to match the contents of the RRPair. This is useful when you have modified the contents of an RRPair file and the signature no longer matches.

The mock signature of an RRPair determines whether a request sent to the mock server will return a matching response. For a markdown RRPair file the signature is listed under the `### SIGNATURE ###` section.

**Usage:**
```bash
proxymock files update-mocks [flags]
```

**Flags:**
- `--in strings`: Directories or files to process
- `-o, --output string`: Output format [pretty, json] (default "json")

**Examples:**
```bash
# Reset signatures for files in the current directory
proxymock files update-mocks

# Reset the signature for a single RRPair file
proxymock files update-mocks --in file.md

# Reset signatures for files in multiple directories
proxymock files update-mocks --in recorded/ --in replayed/

# Reset signatures for a JSONL file (one RRPair per line)
proxymock files update-mocks --in rrs.jsonl
```

## Cloud Integration Commands

### cloud

Manage your Speedscale Cloud resources.

**Usage:**
```bash
proxymock cloud [command]
```

**Available Commands:**
- `pull`: Pull artifacts from Speedscale cloud
- `push`: Push artifacts to Speedscale cloud

#### cloud pull

Pull downloads artifacts from Speedscale cloud and caches them locally.

**Usage:**
```bash
proxymock cloud pull [command]
```

**Available Commands:**
- `cron-job`: Pull a cron job
- `dlp`: Pull a DLP rule set
- `filter`: Pull a filter rule set
- `report`: Pull a report and its artifacts
- `snapshot`: Pull a snapshot and its artifacts
- `test-config`: Pull a test config
- `transform`: Pull a transform set
- `user-data`: Pull user defined documents

#### cloud push

Push uploads artifacts to Speedscale cloud.

**Usage:**
```bash
proxymock cloud push [command]
```

**Available Commands:**
- `cron-job`: Push a cron job
- `dlp`: Push a DLP rule
- `filter`: Push a filter
- `report`: Push a report and its artifacts
- `snapshot`: Create and push a snapshot from test and mock files
- `test-config`: Push a test-config
- `transform`: Push a transform set
- `user-data`: Push user defined documents

## System Commands

### certs

Create proxymock TLS certificates.

**Usage:**
```bash
proxymock certs [flags]
```

**Flags:**
- `--force`: Regenerate certs and overwrite existing ones
- `--jks`: Use keytool to create a Java keystore file

**Examples:**
```bash
proxymock certs
```

### init

Initialize proxymock installation and configuration.

**Usage:**
```bash
proxymock init [flags]
```

**Flags:**
- `--api-key string`: Set the API key without being prompted
- `--email string`: Email address for non-interactive registration
- `--home string`: Path of speedscale home dir (default `${HOME}/.speedscale`)
- `--overwrite`: Overwrite any existing config.yaml file
- `--rcfile string`: Shell rcfile to update (default `${HOME}/.zshrc`)
- `-y, --yes`: Answer yes to all optional prompts

### mcp

Install or run the MCP (Model Context Protocol) server.

**Usage:**
```bash
proxymock mcp [flags]
```

**Flags:**
- `--install`: Install (rather than run) the MCP server for common clients
- `--port int`: Port to run the MCP server on when using SSE transport (default 8080)
- `--sse`: Use the SSE transport (default is stdio)
- `--work-dir string`: Working directory to run MCP server in

**Examples:**
```bash
# Install stdio MCP server
proxymock mcp --install

# Install SSE MCP server
proxymock mcp --install --sse

# Run MCP server over stdio transport
proxymock mcp

# Run MCP server over SSE transport
proxymock mcp --sse --port 8080
```

### completion

Generate autocompletion scripts for various shells.

**Usage:**
```bash
proxymock completion [command]
```

**Available Commands:**
- `bash`: Generate autocompletion script for bash
- `fish`: Generate autocompletion script for fish
- `powershell`: Generate autocompletion script for powershell
- `zsh`: Generate autocompletion script for zsh

### version

Print current version of client and cloud.

**Usage:**
```bash
proxymock version [flags]
```

**Flags:**
- `--client`: Show the local client version only
- `-o, --output string`: Output format [pretty, json, yaml, csv] (default "json")

## Environment Variables

### Recording and Mocking
For applications to use proxymock's smart proxy:

**HTTP(s) traffic:**
```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
export grpc_proxy=http://$(hostname):4140
```

**SOCKS (supports more protocols):**
```bash
export http_proxy=socks5h://localhost:4140
export https_proxy=socks5h://localhost:4140
export tcp_proxy=socks5h://localhost:4140
export grpc_proxy=http://$(hostname):4140
```

## Testing with cURL

When testing mock responses with cURL, use additional flags for TLS:

```bash
# Use -k for insecure connections and -x for proxy
curl -k -x http://localhost:4140 https://example.com/path/to/resource

# Or connect directly to provider endpoints (check port when mock server starts)
curl http://localhost:<provider-port>/path/to/resource
```

## Proxy Behavior

proxymock's smart proxy behaves like Kubernetes host aliases or `/etc/hosts` entries:

- **MATCH**: Request signature matches a mock endpoint, returns mock response
- **NO_MATCH**: Request doesn't match any mock, passes through to real endpoint
- **PASSTHROUGH**: Request bypasses responder and goes directly to intended endpoint

## Common Workflows

1. **Basic Recording and Mocking:**
   ```bash
   # 1. Record traffic
   proxymock record -- your-app

   # 2. Inspect recorded traffic
   proxymock inspect

   # 3. Run mock server
   proxymock mock

   # 4. Test with your app using proxy env vars
   ```

2. **Load Testing:**
   ```bash
   # Record traffic first, then replay with multiple users
   proxymock replay --test-against localhost:8080 --vus 10 --for 5m
   ```

3. **CI/CD Integration:**
   ```bash
   # Generate mocks from OpenAPI, then test
   proxymock generate api-spec.yaml --out ./mocks
   proxymock mock --in ./mocks --no-out
   ```

This documentation covers all the main commands and functionality of the proxymock CLI tool.
