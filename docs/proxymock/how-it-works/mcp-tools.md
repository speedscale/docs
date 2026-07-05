---
title: "MCP Tools & Prompts Reference"
description: "Reference for every tool, prompt, and resource the proxymock MCP server exposes to AI coding assistants."
sidebar_position: 7
---

# MCP Tools & Prompts Reference

> **Generated file — do not edit by hand.** Run `proxymock mcp docs` to regenerate it from the MCP server's live tool registry.

This page lists everything the **proxymock** MCP server exposes to an AI coding assistant. Install it with `proxymock mcp install` (see [Model Context Protocol](./mcp.md)). You rarely call these by name — describe what you want and the assistant picks the right tool.

- **Tools** are actions the assistant invokes on its own (record, replay, analyze). Ones marked _read-only_ never change your files or services.
- **Prompts** are workflows you trigger explicitly (often as slash commands).
- **Resources** are recorded artifacts the assistant can read for context.

## Tools

### Record

#### `record_traffic_start`

Records inbound calls made to the current application. Also records outbound calls made by the application to APIs, databases and other external systems. Recorded API traffic is stored in the directory specified.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `out-directory` | array | **yes** | Directories to write recorded test and mock request/response files to. Unless otherwise instructed use 'proxymock/recorded-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `app-port` | string | no | The port on which the application is listening, e.g. 8080 |
| `log-to` | string | no | File path to redirect all proxymock output to |
| `proxy-in-port` | string | no | Port where proxymock will listen for inbound traffic to forward to your app-port (default 4143) |

#### `record_traffic_stop`

Stops the traffic recorder started by record_traffic_start

_No parameters._

### Mock

#### `mock_server_start`

Start the mock server with RRPairs from the mock files in the directory.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing the mock RRPair files. Directories are read recursively. Usually these directories end with 'proxymock' and are contained in the current repository. |
| `log-to` | string | no | File path to redirect all proxymock output to |
| `out-directory` | array | no | Directories to write new mock request/response files to. MATCH, NO_MATCH, AND PASSTHROUGH seen by mock server. If not provided, defaults to a timestamped directory. Unless otherwise instructed use 'proxymock/mocked-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |

#### `mock_server_stop`

Stop the running mock server.

_No parameters._

### Replay

#### `replay_traffic`

Replay recorded RRPairs from test files against an HTTP server URL.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing the test RRPair files. Directories are read recursively. Usually these directories end with 'proxymock' and are contained in the current repository. |
| `out-directory` | array | **yes** | Directories to write observed replay request/response files to. Unless otherwise instructed use 'proxymock/replayed-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `log-to` | string | no | File path to redirect all proxymock output to |
| `test-against` | string | no | A partial or full URL which will override some or all of the captured URL during replay. If not provided, the target depends on the traffic. The test-against address may be a full or partial URL which will override the base URL of requests during replay. - If a scheme is provided the scheme of the request will be replaced - If a hostname is provided the hostname of the request will be replaced - If a port is provided the port of the request will be replaced Example test-against addresses: \| Captured URL \| Test Against \| Replay URL \|-----------------------------\|---------------------\|----------- \|https://original.com:443/foo \| http://new.com:8080 \| http://new.com:8080/foo \|https://original.com:443/foo \| http:// \| http://original.com:443/foo \|https://original.com:443/foo \| http://new.com \| http://new.com:443/foo \|https://original.com:443/foo \| new.com \| https://new.com:443/foo \|https://original.com:443/foo \| new.com:8080 \| https://new.com:8080/foo \|https://original.com:443/foo \| :8080 \| https://original.com:8080/foo \|https://original.com:443/foo \| http://:8080 \| http://original.com:8080/foo |

### Analyze

#### `search_local_traffic`

_Read-only._

Search and filter RRPair (request/response pair) files on the local filesystem. Unlike search_traffic, which queries the Speedscale cloud, this tool reads RRPair files from local directories, so it works on traffic that was just recorded or pulled into the current repository.

Results are sorted newest first and paginated with limit/offset. Every result includes the RRPair's file path so you can read it directly, fetch it as an rrpair:// resource, or pass it to compare_rrpair_files.

Subdirectories named 'results' are skipped unless passed directly as an input directory (they contain replay/mock output, not source recordings).

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing RRPair files to search. Directories are read recursively. Usually these directories end with 'proxymock' and are contained in the current repository. |
| `direction` | string | no | Optional traffic direction filter: 'in' for inbound requests to the application, 'out' for outbound calls to dependencies. |
| `host` | string | no | Optional host filter (case-insensitive substring), e.g. 'api.example.com'. |
| `limit` | number | no | Maximum results per page (default 20, max 100). |
| `method` | string | no | Optional method/command filter (exact, case-insensitive), e.g. 'GET' or 'POST'. |
| `offset` | number | no | Number of results to skip for pagination (default 0). |
| `query` | string | no | Optional case-insensitive substring matched against each RRPair's URL, headers, and request/response bodies, e.g. 'GetCustomer' or 'error message'. |
| `status` | string | no | Optional response status filter (exact), e.g. '200' or '500'. |

#### `compare_rrpair_files`

_Read-only._

Compare RRPair files to show differences based on their reference relationships.  One RRPair references another when it has the tag 'refUuid' containing the UUID of another RRPair. This tool returns formatted diff output showing differences between recorded and replayed traffic.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in` | array | **yes** | Array of directories or files to compare. Examples: - pass ['dir'] to compare all RRPair files with a reference from the directory 'dir' with each other - pass ['dir1','dir2','dir3'] to compare all RRPair files from the directories 'dir1', 'dir2', and 'dir3' with each other - pass ['rrpair_1.md','rrpair_2.md'] to compare the files 'rrpair_1.md' and 'rrpair_2.md' directly regardless of whether they reference each other or not Directories are read recursively to extract all RRPair files. All RRPairs are added to the same pool and compared based on their relationship, except in the special case when only two files are passed. |
| `verbosity-level` | number | no | Verbosity level for output detail (0=minimal, 1=normal, 2=verbose, 3=very verbose). |

#### `generate_report`

Generate a performance/reliability/security report from a directory of RRPair files. Use this after a replay or mock session to analyze the results: the report scores three pillars (Performance, Reliability, Security), lists per-endpoint latency percentiles, and surfaces security findings.

When a baseline directory is provided the output is a Compare report showing deltas (fixed/regressed/persistent findings) between the baseline and current RRPair sets - ideal for verifying whether a code change broke anything, e.g. baseline=recorded traffic, in-directory=replayed traffic.

The report is written as a directory of small artifacts: digest.md (the markdown summary returned by this tool), one JSON file per section (scope, scores, budgets, performance, reliability, security), fix-prompts/&lt;finding-id&gt;.md with a ready-to-use AI fix prompt per security finding, and deltas.json in compare mode. Read individual section files for detail beyond the digest.

For a SQL-specific view of the same recordings (which queries ran, how the database workload changed between runs), use the sql_report tool.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing the RRPair files to report on. Directories are read recursively. Usually these directories end with 'proxymock' and are contained in the current repository. |
| `baseline-directory` | string | no | Optional directory of baseline RRPair files. When set, the output is a Compare report showing deltas between the baseline and the input directories. |
| `out-directory` | array | no | Optional directory to write the report artifacts to. Only the first entry is used. If not provided, the report is written to a temporary directory. Unless otherwise instructed use 'proxymock/report-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |

#### `sql_report`

_Read-only._

Inventory or compare the SQL workload recorded in RRPair directories. Reads the Postgres/MySQL traffic in the given directories and answers "what SQL did this app run?" and "how did the database workload change between two runs?".

With only in-directory set, returns an inventory: every unique SQL statement with its operation, tables, execution count, and latency percentiles, ranked busiest-first.

When baseline-directory is also set, returns a comparison (baseline → candidate) that surfaces new/removed/changed statements, execution-count drift (N+1 candidates), latency regressions, DB-time shift by table, and schema changes (CREATE/ALTER/DROP). This is the SQL-focused companion to generate_report.

Statements are fingerprinted: literal values and bind parameters are masked as '?', so the same query with different values counts once and no recorded data values (which may be sensitive) appear in the output. Only Postgres and MySQL traffic contributes; other protocols are ignored.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing RRPair files to inventory (or the candidate/newer run when comparing). Read recursively. Usually these end with 'proxymock' and are in the current repository. |
| `baseline-directory` | array | no | Optional baseline (older run) directories. When set, the output is a comparison showing how the input directories' SQL workload changed relative to this baseline — e.g. baseline=recorded traffic, in-directory=replayed traffic, or two recordings of different app versions. |

### Cloud

#### `pull_remote_recording`

Pull traffic from a remote service, including backend dependencies. Can accept either just a service (defaults to last 5 minutes) or full filter parameters like search_traffic.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `service` | string | **yes** | The service to capture traffic from. You may be able to determine this by inspecting the application code, or you may need to ask the user. |
| `out-directory` | array | **yes** | Directories to store the recorded traffic. Unless otherwise instructed use 'proxymock/pulled-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `end-time` | string | no | Optional end time for the time range filter in RFC3339 format (e.g., '2024-01-01T23:59:59Z'). If not provided, defaults to now. |
| `filter-query` | string | no | Optional human-readable filter query string to further filter traffic. Examples: - Filter by method: '(method IS "GET")' - Filter by status: '(status IS "200")' - Filter by URL: '(url CONTAINS "/api/users")' - Filter by cluster: '(cluster IS "production")' - Filter by namespace: '(namespace IS "default")' - Filter by session: '(session IS "session-id-value")' - Text search in request/response bodies: '(text CONTAINS "error message")' - Text search with regex: '(text REGEX "user-[0-9]+")' - Request body JSON match: '(reqbodyjson IS "&#123;\"body\": &#123;\"field\": \"value\"&#125;, \"ignore_keys\": [\"timestamp\"]&#125;")' - Request JSON field: '(req_json[field.path] CONTAINS "value")' - Response JSON field: '(resp_json[field.path] CONTAINS "value")' - Combine filters: '(method IS "GET") AND (status IS "200")' |
| `snapshot-name` | string | no | Optional custom name for the snapshot. If not provided, defaults to '&#123;service&#125;-&#123;timestamp&#125;'. |
| `start-time` | string | no | Optional start time for the time range filter in RFC3339 format (e.g., '2024-01-01T00:00:00Z'). If not provided, defaults to 5 minutes ago. |

#### `search_traffic`

_Read-only._

Search for RRPairs (request/response pairs) in recorded traffic using filters. Returns a list of matching traffic based on the filter criteria. Requires both service name and time range.

This tool is useful when doing investigations into issues with live systems such as requests with non-200 status codes.

You should:
1. Get the basic set parameters of service name and time range and optionally a cluster/namespace to start investigating the data.
2. Get additional filters such as a status code or url to filter down to the right set of traffic to investigate.
3. Use these filters to create a snapshot of the investigation scenario with the pull_remote_recording tool and use a snapshot name relevant to the original investigation query.
4. Use the rrpair resources pulled to the local filesystem to isolate the issue and map the request bodies and responses to specific areas in the source code.
5. Try to create unit test cases based on the rrpair data.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `service` | string | **yes** | Filter traffic by service name |
| `start-time` | string | **yes** | Start time for the time range filter in RFC3339 format (e.g., '2024-01-01T00:00:00Z') |
| `end-time` | string | **yes** | End time for the time range filter in RFC3339 format (e.g., '2024-01-01T23:59:59Z') |
| `filter-query` | string | no | Optional human-readable filter query string to further filter traffic. Examples: - Filter by method: '(method IS "GET")' - Filter by status: '(status IS "200")' - Filter by URL: '(url CONTAINS "/api/users")' - Filter by cluster: '(cluster IS "production")' - Filter by namespace: '(namespace IS "default")' - Filter by session: '(session IS "session-id-value")' - Text search in request/response bodies: '(text CONTAINS "error message")' - Text search with regex: '(text REGEX "user-[0-9]+")' - Request body JSON match: '(reqbodyjson IS "&#123;\"body\": &#123;\"field\": \"value\"&#125;, \"ignore_keys\": [\"timestamp\"]&#125;")' - Request JSON field: '(req_json[field.path] CONTAINS "value")' - Response JSON field: '(resp_json[field.path] CONTAINS "value")' - Combine filters: '(method IS "GET") AND (status IS "200")' |

### Process control

#### `list_running`

_Read-only._

List all running proxymock jobs (record, mock, replay).

_No parameters._

#### `read_process_logs`

_Read-only._

Read the stdout or stderr logs from a running proxymock process. Use this to debug failures or understand what a process is doing.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `process` | string | **yes** | Name of the process to read logs from. Must be one of: record, mock, replay. Use list_running tool to see active processes. |
| `log-type` | string | no | Type of log to read: 'stdout' for standard output (default), 'stderr' for error output, or 'both' for combined logs |

## Prompts

Trigger these explicitly — many clients surface them as slash commands.

#### `record_my_app`

Record inbound and outbound traffic (HTTP, gRPC, databases, and more) from your application using proxymock's recording proxy for later mocking or replay testing.

Try saying: "record traffic", "capture traffic", "record my app", "record API", "start recording", "capture requests", "proxymock record", "record outbound", "record inbound"

#### `replay_traffic`

Replay previously recorded proxymock traffic against a running or local application to detect regressions, using RRPair files as test data.

Try saying: "replay traffic", "replay recorded", "test against app", "proxymock replay", "replay RRPair", "run traffic against", "regression test", "replay my app"

#### `find_breaking_api_changes`

Detect breaking API changes by comparing recorded vs replayed proxymock RRPair traffic, with severity classification and confidence scoring.

Try saying: "find breaking changes", "detect breaking changes", "compare traffic", "compare RRPair", "what broke", "check for regressions", "diff traffic", "API regressions", "breaking API changes"

#### `add_to_cicd`

Integrate proxymock into a CI/CD pipeline (GitHub Actions, GitLab CI, etc.) for automated API regression testing with recorded traffic.

Try saying: "CI/CD", "CICD", "continuous integration", "GitHub Actions proxymock", "GitLab CI proxymock", "CI pipeline proxymock", "automate proxymock", "proxymock in CI", "add to pipeline"

#### `investigate_report`

Investigate a Speedscale replay report to understand why it failed, had low success rate, or showed unexpected behavior including mock mismatches (NO_MATCH), 4xx/5xx responses, assertion failures, or Missed Goals status.

Try saying: "investigate report", "debug report", "analyze report", "report failed", "report shows", "success rate", "why did replay fail", "replay failed", "NO_MATCH", "mocks not matching", "Missed Goals", "understand report", "what went wrong", "compare reports"

#### `investigate_snapshot`

Investigate a Speedscale snapshot - debug missing traffic, analyze captured services, diagnose quality issues, and understand snapshot processing.

Try saying: "investigate snapshot", "debug snapshot", "analyze snapshot", "what's in this snapshot", "why is my snapshot", "snapshot traffic", "debug recording", "check my capture", "snapshot quality"

## Resources

The server exposes recorded artifacts as read-only resources the assistant can read for context:

- **`rrpair://{path}`** — recorded request/response pair files from the workspace.
- **`report://{path}`** — report artifacts (digest, section JSON, fix prompts) produced by the `generate_report` tool.

## Filter query syntax

The `search_traffic` and `search_local_traffic` tools accept an optional filter query:

```
Optional human-readable filter query string to further filter traffic.
Examples:
- Filter by method: '(method IS "GET")'
- Filter by status: '(status IS "200")'
- Filter by URL: '(url CONTAINS "/api/users")'
- Filter by cluster: '(cluster IS "production")'
- Filter by namespace: '(namespace IS "default")'
- Filter by session: '(session IS "session-id-value")'
- Text search in request/response bodies: '(text CONTAINS "error message")'
- Text search with regex: '(text REGEX "user-[0-9]+")'
- Request body JSON match: '(reqbodyjson IS "{\"body\": {\"field\": \"value\"}, \"ignore_keys\": [\"timestamp\"]}")'
- Request JSON field: '(req_json[field.path] CONTAINS "value")'
- Response JSON field: '(resp_json[field.path] CONTAINS "value")'
- Combine filters: '(method IS "GET") AND (status IS "200")'
```
