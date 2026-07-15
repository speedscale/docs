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

By default each request is replayed once, which acts as a regression test. To run a performance / load test instead, set 'vus' (concurrency) together with 'for' (run for a duration) or 'times' (run a number of iterations), and optionally 'performance' mode for high-throughput runs. Use 'fail-if' to encode a pass/fail condition such as a latency budget.

The replay runs in the background: use the list_running tool to see when it finishes and the read_process_logs tool to inspect results, including whether any 'fail-if' condition triggered. After completion, run the generate_report tool on the output directory for latency percentiles and quality scores.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing the test RRPair files. Directories are read recursively. Usually these directories end with 'proxymock' and are contained in the current repository. |
| `out-directory` | array | **yes** | Directories to write observed replay request/response files to. Unless otherwise instructed use 'proxymock/replayed-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `fail-if` | string | no | Condition expression that marks the replay as failed (exit code 1) when true, e.g. 'latency.p99 &gt; 100' or 'requests.result-match-pct &lt; 95.5'. Check the process logs to see whether the condition triggered. |
| `for` | string | no | How long to run the replay, as a Go duration string (e.g. '30s', '5m'). Traffic is replayed continuously, on a loop, until the duration expires. Mutually exclusive with 'times'. Omit both to replay each request exactly once. |
| `log-to` | string | no | File path to redirect all proxymock output to |
| `performance` | boolean | no | Performance mode only writes a sample of failed or non-matching requests to disk, trading granular data collection for replay speed. Recommended for high-throughput load tests (many vus or long durations). |
| `rewrite-host` | boolean | no | Rewrite the HTTP Host header to match the target hostname:port. Set this when the target server routes requests by Host header (e.g. virtual hosts, ingress controllers). |
| `test-against` | string | no | A partial or full URL which will override some or all of the captured URL during replay. If not provided, the target depends on the traffic. The test-against address may be a full or partial URL which will override the base URL of requests during replay. - If a scheme is provided the scheme of the request will be replaced - If a hostname is provided the hostname of the request will be replaced - If a port is provided the port of the request will be replaced Example test-against addresses: \| Captured URL \| Test Against \| Replay URL \|-----------------------------\|---------------------\|----------- \|https://original.com:443/foo \| http://new.com:8080 \| http://new.com:8080/foo \|https://original.com:443/foo \| http:// \| http://original.com:443/foo \|https://original.com:443/foo \| http://new.com \| http://new.com:443/foo \|https://original.com:443/foo \| new.com \| https://new.com:443/foo \|https://original.com:443/foo \| new.com:8080 \| https://new.com:8080/foo \|https://original.com:443/foo \| :8080 \| https://original.com:8080/foo \|https://original.com:443/foo \| http://:8080 \| http://original.com:8080/foo |
| `times` | number | no | Number of times to replay the full traffic set (default 1). Mutually exclusive with 'for'. |
| `vus` | number | no | Number of concurrent virtual users generating load (default 1). Set higher (e.g. 10) together with 'for' or 'times' to run a load test. Each virtual user replays the full traffic set independently. |

#### `send_one`

Send a single RRPair's request to an arbitrary URL and return the live response (status line, headers, and body). The RRPair file is not modified.

Use this to spot-check one endpoint after a code or RRPair change without running a full replay, e.g. after fixing a body with edit_rrpair. The URL overrides the recorded scheme/host/port; the request path comes from the RRPair.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | **yes** | Path to the RRPair file (.json or .md) to send, relative to the working directory. Use a test (inbound) RRPair rather than a mock. |
| `url` | string | **yes** | URL to send the request to, e.g. 'http://localhost:8080'. |

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

#### `response_diff`

_Read-only._

Compare the HTTP/gRPC response payloads of two recorded runs and report only the differences that matter. First learns which response fields are volatile (timestamps, ids, counters) from within-run evidence, then diffs the paired responses on the remaining stable fields — so a real regression (a total going to 0, a field disappearing, a type change) surfaces while noise is filtered out.

in-directory is the candidate/newer run; baseline-directory is the baseline/older run — e.g. baseline=recorded traffic, candidate=replayed traffic, or two recordings of different app versions. Twins are paired by refUuid then endpoint+sequence.

Findings are classified (value change, magnitude/sign shift, null flip, type change, field added/removed, endpoint added/removed) and ranked with regressions first. This catches content regressions a status-code or latency monitor cannot: a 200 OK whose body silently changed. Only HTTP/gRPC responses are compared; other protocols are skipped. Companion to generate_report.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories of RRPair files for the candidate (newer) run. Read recursively. Usually end with 'proxymock' and live in the current repository. |
| `baseline-directory` | array | **yes** | Directories of RRPair files for the baseline (older/expected) run to compare the candidate against. |

#### `detect_drift`

_Read-only._

Find values that drift (vary) across two or more RRPair directories, e.g. a recording vs. a replay, or several replay runs. Returns a JSON DriftReport listing every field whose value changed between sources, with prefilled transform recommendations for stabilizing mock matching.

Each source is a directory of RRPair files or a single jsonl file (raw.jsonl from a snapshot, raw_rr.jsonl from a report); the formats can be mixed. Sensitivity controls noise filtering:
- 'permissive': any field that took on more than one value, anywhere
- 'normal' (default): drift sustained across multiple equivalence classes
- 'strict': multiple distinct values across multiple classes

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `sources` | array | **yes** | Two or more RRPair directories (or jsonl files) to compare, relative to the working directory. |
| `sensitivity` | string | no | Drift sensitivity: 'permissive', 'normal' (default), or 'strict'. |

### Tune

#### `list_recommendations`

_Read-only._

Analyze the RRPair (request/response pair) files in a local directory and list tuning recommendations. Two kinds are returned:

- transform: mechanical fixes needed for the traffic to replay or mock cleanly — JWT re-signing, timestamp shifting, message-id rotation, data redaction. Each carries transform chains that apply_recommendation can merge into the workspace's tuning blueprint.
- traffic: informational findings about the recorded traffic itself.

Recommendation ids are stable content hashes: the same recommendation keeps its id across analysis runs, so an id from this call can be passed to apply_recommendation later. Recommendations the user already rejected are filtered out.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directory containing RRPair files to analyze. Exactly one directory; the tuning blueprint and rejection state are stored under it. Usually ends with 'proxymock' and is contained in the current repository. |
| `type` | string | no | Optional filter: 'transform' or 'traffic'. Default is both. |

#### `apply_recommendation`

Accept or reject one tuning recommendation by id (from list_recommendations).

Accepting a transform recommendation merges its transform chains into the workspace's per-service tuning blueprint on disk — no RRPair files are rewritten; replay and mock runs in this workspace apply the blueprint automatically. Rejecting records the id in the workspace so the recommendation stops appearing. Both actions are idempotent and match what the proxymock web UI's Accept/Reject buttons do.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | The same single directory that was analyzed by list_recommendations. The tuning blueprint and rejection state are stored under it. |
| `id` | string | **yes** | Recommendation id as returned by list_recommendations. |
| `action` | string | no | 'accept' (default) merges the recommendation into the tuning blueprint; 'reject' hides it from future lists. |

#### `mocks`

Tune a replay's OUTBOUND mock match rate offline, from RRPair files in one workspace — no replay or cluster needed. Select the operation with 'action':

- 'analyze' (read-only): report how well the replay's outbound requests match the recorded mocks, and list impact-sorted fix recommendations grouped by the filter that would collapse them. Reports two rates over the same denominator — the report (ground-truth) rate recorded at replay time, and the projected rate with the workspace's active tuning blueprints applied.
- 'accept' (writes blueprint): accept one recommendation by 'id' (from analyze), or every open one with 'all'=true. Writes a filter-scoped transform into the workspace's per-service tuning blueprint; no RRPair files are rewritten. The response reports the projected-rate movement immediately.
- 'undo' (writes blueprint): remove a previously accepted recommendation by 'id'. Idempotent, so accepts and undos can be tried and reverted freely.
- 'similar' (read-only): deep-dive one projected miss ('id'), ranking it against the recorded mock corpus with per-field drift, likely cause, and any pending recommendation — to reason about ambiguous misses before accepting fixes.

The workspace usually comes from 'proxymock cloud pull report &lt;id&gt;', which materializes both analysis sides (snapshot-* and report-* run directories). This is the Mocks-view match-rate loop; it is a different id space from apply_recommendation, which handles general replay-tuning recommendations.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which mocks operation to run: 'analyze' and 'similar' are read-only; 'accept' and 'undo' write the tuning blueprint. |
| `in-directory` | array | **yes** | Exactly one workspace directory holding both analysis sides as run directories (usually snapshot-* and report-*). The tuning blueprint is stored under it. |
| `all` | boolean | no | action=accept only: accept every open recommendation with its default transform (the web UI's 'Accept all'). |
| `id` | string | no | A recommendation id (shaped '&lt;service&gt;\|&lt;target&gt;') for action=accept/undo, or a projected-miss id for action=similar — both as returned by action=analyze. Required for accept (unless all=true), undo, and similar. |
| `max` | number | no | action=similar only: how many nearest candidates to return (default 3). |
| `mock-source` | string | no | Optional run-directory name (or absolute RRPair directory) supplying the recorded mock signatures. Auto-discovered when omitted: the newest snapshot-*/recorded-*/mocked-* run. |
| `request-source` | string | no | Optional run-directory name (or absolute RRPair directory) supplying the outbound requests to check. Auto-discovered when omitted: the newest report-*/replayed-* run. |
| `transform` | string | no | action=accept only: transform type overriding the recommendation's default (e.g. 'constant' to mask). Ignored for URL id-segment fixes, which always wildcard. |

#### `analyze_mock_matches`

_Read-only._

DEPRECATED — use the `mocks` tool with action=analyze instead. This alias forwards to the same implementation and will be removed in a future release.

Analyze how well a replay's outbound requests match the recorded mocks, and list tuning recommendations. Works entirely from RRPair files on disk — no replay or cluster needed. Reports two rates over the same outbound denominator:

- Report match rate: the ground-truth verdicts recorded at replay time (what the report showed).
- Projected match rate: what the rate WOULD be on the next replay with the workspace's active tuning blueprints applied. Always &gt;= the report rate; it climbs as fixes are accepted.

The remaining projected misses are grouped by the fix that would collapse them: each group is a FILTER (the scope — e.g. an endpoint whose URL rotates an id segment) carrying RECOMMENDATIONS (transforms to accept, each with a stable id). Accepting writes one filter-scoped rule into the tuning blueprint via accept_mock_recommendation; re-running this tool then shows the improved projected rate. Iterate until the projected rate stops climbing.

The workspace usually comes from 'proxymock cloud pull report &lt;id&gt;', which materializes both sides (report-* and snapshot-* run directories).

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Exactly one workspace directory holding both analysis sides as run directories (usually snapshot-* and report-*). The tuning blueprint is stored under it. |
| `mock-source` | string | no | Optional run-directory name (or absolute RRPair directory) supplying the recorded mock signatures. Auto-discovered when omitted: the newest snapshot-*/recorded-*/mocked-* run. |
| `request-source` | string | no | Optional run-directory name (or absolute RRPair directory) supplying the outbound requests to check. Auto-discovered when omitted: the newest report-*/replayed-* run. |

#### `accept_mock_recommendation`

DEPRECATED — use the `mocks` tool with action=accept|undo instead. This alias forwards to the same implementation and will be removed in a future release.

Accept or undo one mock-match tuning recommendation by id (from analyze_mock_matches), or accept every open recommendation at once with all=true.

Accepting writes the recommendation's transform as a FILTER-SCOPED rule into the workspace's per-service tuning blueprint — no RRPair files are rewritten; the scope filter (e.g. the endpoint whose URL rotates an id) decides which requests it applies to, and replay/mock runs in this workspace apply the blueprint automatically. Undo removes the rule. Both directions are idempotent, so combinations can be tried and reverted freely; re-accepting with a different transform replaces the prior rule.

The response includes the projected match rate before and after the change, so the improvement (or regression) is visible immediately. This is a different id space from apply_recommendation, which handles the general replay-tuning recommendations; this tool handles the Mocks-view match-rate fixes.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | The same single workspace directory that was analyzed by analyze_mock_matches. |
| `action` | string | no | 'accept' (default) writes the fix into the tuning blueprint; 'undo' removes a previously accepted fix. |
| `all` | boolean | no | Accept every open recommendation with its default transform (the web UI's 'Accept all'). Only valid with action=accept. |
| `id` | string | no | Recommendation id as returned by analyze_mock_matches (shaped '&lt;service&gt;\|&lt;target&gt;'). Required unless all=true. |
| `mock-source` | string | no | Optional explicit mock source, as in analyze_mock_matches. |
| `request-source` | string | no | Optional explicit request source, as in analyze_mock_matches. |
| `transform` | string | no | Optional transform type overriding the recommendation's default (e.g. 'constant' to mask instead of the recommended transform). Ignored for URL id-segment fixes, which always wildcard. |

#### `similar_candidates`

_Read-only._

DEPRECATED — use the `mocks` tool with action=similar instead. This alias forwards to the same implementation and will be removed in a future release.

Deep-dive on a single projected miss from analyze_mock_matches: rank it against the recorded mock corpus and explain, field by field, why the nearest recorded requests don't match.

Each candidate lists its drifting fields with a classification (drift / volatile / url-param / missing-key), the likely CAUSE of the drift (datetime, uuid, jwt, trace-id, ip, pii, random, opaque), both values, whether an active blueprint already covers the field, and any pending analyzer recommendation for it. 'opaque' causes are flagged low-confidence — the value may be a real discriminator, so review before masking.

Use this to reason about ambiguous misses before accepting fixes with accept_mock_recommendation — e.g. a drifting auth header is a credential to surface to the user, not a field to blindly mask.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | The same single workspace directory that was analyzed by analyze_mock_matches. |
| `id` | string | **yes** | A projected miss's id — a group member id or miss id from analyze_mock_matches (the workspace-relative RRPair path). |
| `max` | number | no | How many nearest candidates to return (default 3). |
| `mock-source` | string | no | Optional explicit mock source, as in analyze_mock_matches. |
| `request-source` | string | no | Optional explicit request source, as in analyze_mock_matches. |

### Author configs

#### `config`

Author and validate Speedscale config against local RRPair files, entirely offline (no Speedscale account, API key, or network). Select the operation with 'action':

- 'filter-test' (read-only): report which RRPairs a filter rule keeps versus drops. Matches the engine the forwarder uses: an RRPair that matches the filter is dropped, one that does not is kept.
- 'transform-test' (read-only): preview what a transform config would change - per-chain match counts, how many RRPairs change, and the before/after of a sampled RRPair. Matches the engine the cloud snapshot Transforms tab and proxymock web use.
- 'transform-apply' (writes files): write transformed copies of the RRPairs to 'out-directory', mirroring the input layout. Input files are never modified.

The 'config' is the same JSON document 'proxymock cloud pull/push filter|transform' read and write, so a rule authored locally round-trips to and from Speedscale Cloud. To write only the RRPairs a filter keeps, use the 'proxymock filter apply' CLI command.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which config operation to run: 'filter-test' and 'transform-test' are read-only previews; 'transform-apply' writes transformed copies to out-directory. |
| `config` | string | **yes** | Path to a filter/transform config JSON file, or the id of a config downloaded with 'proxymock cloud pull filter\|transform'. |
| `in-directory` | array | **yes** | Directories or RRPair files to read, relative to the working directory. Directories are read recursively. |
| `out-directory` | array | no | Required for 'transform-apply': directory to write transformed copies to (must be outside the input directories). Only the first entry is used. Ignored by the read-only actions. Unless otherwise instructed use 'proxymock/transform-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |

#### `dlp`

Author and validate DLP (data loss prevention) redaction rules against local RRPair files, entirely offline (no Speedscale account, API key, or network). The redaction pipeline is identical to what 'proxymock record --dlp-config' applies at capture time, so this reports exactly what a live recording would redact. Select the operation with 'action':

- 'test' (read-only): report what a DLP config would redact without modifying any file - per-location match counts and the file and location of each match. Set 'show-redacted' to a single RRPair file to print its full before/after redaction instead of the summary.
- 'apply' (writes files): write redacted copies of the RRPairs to 'out-directory', mirroring the input layout. Input files are never modified.

The 'config' is the same JSON document 'proxymock cloud pull/push dlp' read and write, so a rule authored locally round-trips to and from Speedscale Cloud.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which DLP operation to run: 'test' is a read-only report; 'apply' writes redacted copies to out-directory. |
| `config` | string | **yes** | Path to a DLP config JSON file, or the id of a rule downloaded with 'proxymock cloud pull dlp'. |
| `in-directory` | array | **yes** | Directories or RRPair files to read, relative to the working directory. Directories are read recursively. |
| `out-directory` | array | no | Required for 'apply': directory to write redacted copies to (must be outside the input directories). Only the first entry is used. Ignored by 'test'. Unless otherwise instructed use 'proxymock/redacted-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `show-redacted` | string | no | For 'test' only: path to a single RRPair file to print its full before/after redaction instead of the summary. |

### Edit traffic

#### `edit_rrpair`

Replace the request or response body of an RRPair markdown file in the local workspace. Content-Length on the edited side is recomputed automatically and the file is rewritten atomically.

Use this to fix stale recorded data before mocking or replaying, e.g. after search_local_traffic or compare_rrpair_files points you at the file. Only .md RRPair files are editable.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | **yes** | Path to the .md RRPair file, relative to the working directory, e.g. 'proxymock/recorded-2026-01-01/my-host/rr.md'. |
| `side` | string | **yes** | Which body to replace: 'request' or 'response'. |
| `body` | string | **yes** | The new body content as a UTF-8 string. For binary content prefix with 'base64:' followed by standard base64. An empty string clears the body. |

#### `delete_rrpairs`

Delete RRPair files from the local workspace by explicit path list. There are no wildcard or directory deletes: every file to remove must be named individually, and each file must decode as a valid RRPair before it is deleted.

Paths that fail validation are reported as skipped with a reason and do not abort the rest of the batch. Use search_local_traffic to find the files first.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `files` | array | **yes** | Paths of the .json or .md RRPair files to delete, relative to the working directory. |

### Convert

#### `generate`

Turn an OpenAPI specification into local RRPair files. Parses an OpenAPI 3.0+ spec (JSON or YAML) and writes one or more RRPair files per endpoint with realistic synthesized data. Runs entirely locally with no Speedscale account.

Use 'direction' to pick what to emit:
- outbound (default): OUTBOUND mock definitions — serve them with 'mock_server_start' (proxymock mock) to stand up a mock of the spec's API, or use them as dependency mocks during 'replay_traffic'.
- inbound: INBOUND test definitions — drive them at a running implementation of the spec with 'replay_traffic' (proxymock replay).
- both: an inbound test and an outbound mock per endpoint.

Returns the number of RRPair files generated and the output directory.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `spec` | string | **yes** | Path to the OpenAPI 3.0+ specification file (JSON or YAML), relative to the working directory. |
| `out-directory` | string | **yes** | Directory to write the generated RRPair files to, relative to the working directory. |
| `direction` | string | no | Which RRPairs to generate: 'outbound' (mocks for the mock server, default), 'inbound' (tests for replay), or 'both'. |
| `examples-only` | boolean | no | Only generate responses that have an explicit example in the spec, skipping schema-synthesized ones. Defaults to false. |
| `exclude-paths` | string | no | Comma-separated path patterns to exclude; matching endpoints are skipped. |
| `host` | string | no | Override the host recorded on generated requests. Defaults to the host from the spec's server URL. |
| `include-optional` | boolean | no | Include optional schema properties in generated request/response bodies. Defaults to false. |
| `include-paths` | string | no | Comma-separated path patterns to include; only matching endpoints are generated. |
| `port` | number | no | Override the port recorded on generated requests. Defaults to the port from the spec, or 80/443. |
| `tag-filter` | string | no | Only generate endpoints carrying one of these OpenAPI tags (comma-separated). |

#### `import_traffic`

Convert a third-party traffic capture into local RRPair files that proxymock can mock and replay. This is the INBOUND direction: an external artifact becomes RRPairs on disk. Runs entirely locally with no Speedscale account.

Choose the format that matches the source artifact:
- postman: a Postman collection JSON file (v2.1). Every request becomes an inbound test; requests with a saved example response also become outbound mocks.
- har: a HAR (HTTP Archive) JSON file. Every entry becomes an inbound test and, because HAR carries the response, an outbound mock.
- goreplay: a GoReplay capture file (.gor). Every request becomes an inbound test.
- wiremock: a WireMock project directory or .zip. Every stub mapping becomes an outbound mock.
- http-wire: a directory or .zip of raw HTTP wire-format files (Req&lt;n&gt;.txt / Res&lt;n&gt;.txt). Every request/response pair becomes an outbound mock.

Returns the number of tests and mocks written and a sample of the RRPair file paths. To go the other way (RRPairs to a third-party format) use export_traffic.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `format` | string | **yes** | Format of the source artifact: 'postman', 'har', 'goreplay' (single file), or 'wiremock', 'http-wire' (directory or .zip). |
| `source` | string | **yes** | Path to the input artifact, relative to the working directory. A file for postman/har/goreplay; a directory or .zip for wiremock/http-wire. |
| `out-directory` | string | no | Directory to write RRPair files to. Defaults to ./proxymock/imported-&lt;source-name&gt;. |
| `service-name` | string | no | Service name recorded on all imported RRPairs. Defaults to 'localhost'. |
| `target-host` | string | no | wiremock/http-wire only: hostname recorded on each imported mock (for http-wire, a fallback when the request has no Host header). |
| `target-port` | number | no | wiremock/http-wire only: port recorded on each imported mock. Defaults to 80. |

#### `export_traffic`

Convert local RRPair files into a third-party format. This is the OUTBOUND direction: recorded RRPairs on disk become an artifact another tool can consume. Runs entirely locally (file output only, no publishing to any service).

Choose the target format:
- postman: a Postman collection JSON file, for driving requests from Postman.
- k6: a k6 load-test JavaScript file.
- gatling: a Gatling simulation Java file.
- datadog-synthetics: a Datadog Synthetics test bundle written to disk (local files only; this tool never publishes to Datadog).

Reads RRPair files from one input directory and writes a single output artifact. To go the other way (a third-party artifact to RRPairs) use import_traffic.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `format` | string | **yes** | Format to export to: 'postman', 'k6', 'gatling', or 'datadog-synthetics'. |
| `in-directory` | string | **yes** | Directory of recorded RRPair files to export, relative to the working directory (read recursively). |
| `out` | string | no | Output file (or bundle directory for datadog-synthetics). Defaults per format: collection.json, k6.js, LoadSimulation.java, or a datadog-synthetics-&lt;dir&gt; bundle. |

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

#### `pull_report`

Pull a Speedscale cloud replay report AND the snapshot it was generated from into a local workspace — the equivalent of 'proxymock cloud pull report &lt;id&gt;'.

The report's RRPairs (carrying the HIT/MISS mock-match verdicts) land in &lt;out-directory&gt;/report-&lt;id&gt;/ and the source snapshot's recorded traffic in a sibling snapshot-&lt;id&gt;/ — exactly the two sides the mocks tool needs, so this tool is step one of the mock match-rate tuning loop: pull_report -&gt; mocks action=analyze -&gt; mocks action=accept -&gt; repeat.

Report ids come from the Speedscale dashboard's report URL, or from the user. Requires Speedscale cloud credentials (run 'proxymock init' once to register). Distinct from pull_remote_recording, which records fresh traffic by service and time range rather than fetching an existing replay report.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `report-id` | string | **yes** | The report's id, e.g. c54ae6fc-947a-4991-a9c1-4d7c32e00b9a. |
| `out-directory` | array | **yes** | Workspace directory the report-&lt;id&gt;/ and snapshot-&lt;id&gt;/ trees are created under. Unless otherwise instructed use 'proxymock/pulled-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |

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

#### `push_snapshot`

Publish local RRPair (request/response pair) directories to Speedscale cloud as a named snapshot. Every RRPair under the given directories is consolidated into one snapshot, uploaded, and analyzed by the cloud, making the traffic available to teammates, CI replays, and the dashboard.

Curate the directories first — no filtering is applied. Active tuning blueprints in the workspace are uploaded with the snapshot, so recommendations accepted via apply_recommendation travel with the traffic. Requires Speedscale cloud credentials (run 'proxymock init' once to register).

Returns the new snapshot id and dashboard URL. Use list_cloud_snapshots to confirm the upload or pull_remote_recording to bring a snapshot back down.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing the RRPair files to publish. Read recursively; all RRPairs are consolidated into a single snapshot. |
| `name` | string | no | Optional display name for the snapshot in the dashboard. |

#### `list_cloud_snapshots`

_Read-only._

List traffic snapshots stored in Speedscale cloud, newest first. Use this to find a snapshot id for pull_remote_recording, or to confirm a push_snapshot upload landed. Requires Speedscale cloud credentials (run 'proxymock init' once to register).

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | number | no | Maximum snapshots to return (default 20, max 100). |
| `search` | string | no | Optional search term matched against snapshot names. |
| `service` | string | no | Optional filter: only snapshots containing traffic for this service. |
| `tag` | string | no | Optional filter: only snapshots with this build tag. |

### BYOC bucket

#### `pull_byoc_bucket`

Pull historical traffic from the customer's OWN BYOC object-store bucket (S3 or S3-compatible) into local RRPair files that proxymock can search, mock, and replay. Runs entirely locally with no Speedscale account: credentials come from the standard AWS environment credential chain (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_PROFILE, etc.).

This is distinct from pull_remote_recording, which pulls from Speedscale-managed cloud. Use this tool when the traffic lives in the customer's own bucket — for example a BYOC deployment where the in-cluster OTel collector's awss3 exporter writes OTLP-JSON objects under the "byoc/" prefix.

Narrow the pull with a time window (from/to) and filters (service, namespace, status, trace-id, or a full filter expression) so you download only what you need. Returns the import summary: RRPair files written, keys scanned, objects downloaded, and malformed records skipped.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `bucket` | string | **yes** | Name of the S3 (or S3-compatible) bucket that holds the BYOC traffic. |
| `filter` | string | no | Speedscale traffic filter string, for example '(service IS "checkout") AND (status IS "500")'. Overlapping criteria override the convenience filters below. |
| `from` | string | no | Start of the time window when the filter has no timerange, for example now-15m or 2026-06-12T18:00:00Z. Defaults to now-1h. |
| `limit` | number | no | Maximum number of matched RRPairs to write. 0 (default) means unlimited. |
| `namespace` | string | no | Kubernetes namespace to match when the filter has no namespace predicate. |
| `out-directory` | string | no | Directory to write RRPair files to. Defaults to ./proxymock/imported-s3-&lt;timestamp&gt;. |
| `prefix` | string | no | Object key prefix to search. Use 'byoc/' for the current OTel awss3 layout. Defaults to the whole bucket. |
| `region` | string | no | AWS region of the bucket. Defaults to the AWS SDK configuration (AWS_REGION). |
| `s3-endpoint-url` | string | no | Custom endpoint URL for an S3-compatible store (MinIO, DigitalOcean Spaces, GCS S3-interop). Leave empty for AWS S3. |
| `s3-force-path-style` | boolean | no | Use path-style S3 addressing (bucket in the path, not the host). Often required for MinIO and other S3-compatible stores. |
| `service` | string | no | Service name to match when the filter has no service predicate. |
| `status` | string | no | Exact response status to match when the filter has no status predicate, for example 500. |
| `to` | string | no | End of the time window when the filter has no timerange, for example now or 2026-06-12T19:00:00Z. Defaults to now. |
| `trace-id` | string | no | Trace ID to match when the filter has no trace predicate. |

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

#### `improve_mock_match_rate`

Pull a replay report and iteratively tune the workspace's mock blueprints — analyze, accept filter-scoped fixes, re-analyze — until the projected mock match rate is as high as it can get.

Try saying: "improve match rate", "mock match rate", "tune mocks", "fix mock matching", "increase match rate", "improve mocks", "tune blueprints"

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
