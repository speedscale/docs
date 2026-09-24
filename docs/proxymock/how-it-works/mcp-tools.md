---
title: "MCP Tools & Prompts Reference"
description: "Reference for every tool, prompt, and resource the proxymock MCP server exposes to AI coding assistants."
sidebar_position: 7
---

# MCP Tools & Prompts Reference

> **Generated file: do not edit by hand.** Run `proxymock mcp docs` to regenerate it from the MCP server's live tool registry.

This page lists everything the **proxymock** MCP server exposes to an AI coding assistant. Install it with `proxymock mcp install` (see [Model Context Protocol](./mcp.md)). You rarely call these by name. Describe what you want and the assistant picks the right tool.

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
| `chaos` | array | no | Repeatable '&lt;filter query&gt;:&lt;effect&gt;=&lt;value&gt;[,...]' specs, for example '(location REGEX "^/api/checkout"): latency=2s,percent=25'. The scope is the same filter query language as the search_traffic filter-query param ('*' matches everything). Effects are latency=2s\|3x\|100ms-2s, status=500\|503, connection=refuse\|reset\|stall\|drop, body=corrupt\|truncate[:&lt;bytes&gt;], header=Name:Value, no-response, plus the knobs percent=, seed=, sticky, max-latency=. Suffix an effect with '@&lt;percent&gt;' to give it its own probability. Prefer this over 'fault' for scoped, reproducible chaos. |
| `fault` | array | no | Repeatable '&lt;regexp&gt;:action=value[,action=value...]' specs. Rate alone injects intermittent 503s; body=corrupt\|truncate\|truncate:&lt;bytes&gt; returns a well-formed shorter body; connection=refuse\|reset\|stall\|drop faults the socket (drop cuts the stream mid-response). |
| `log-to` | string | no | File path to redirect all proxymock output to |
| `mock-reload-interval` | string | no | Hot-reload check interval such as '1s'. Omit to disable. |
| `mock-timing` | string | no | Response timing: 'none', 'recorded', or a multiplier such as '5x'. |
| `out-directory` | array | no | Directories to write new mock request/response files to. MATCH, NO_MATCH, AND PASSTHROUGH seen by mock server. If not provided, defaults to a timestamped directory. Unless otherwise instructed use 'proxymock/mocked-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `response-selection` | string | no | Duplicate-signature response selection: 'round-robin' (default) or weighted-by-copy-count 'random'. |

#### `mock_server_stop`

Stop the running mock server.

_No parameters._

### Replay

#### `replay_traffic`

Replay recorded RRPairs from test files against an HTTP server URL, on this machine. This is 'proxymock replay'; every parameter maps onto its flag of the same name.

By default each request is replayed once, which acts as a regression test. Shape load with 'vus' (concurrency) and 'for' or 'times', with 'sessions' (replay recorded actors' sessions), with 'stages' (a multi-stage ramp), or with 'load-plan' (independent load groups); add 'load-test' for high-throughput runs. Use 'fail-if' to encode pass/fail conditions such as a latency budget.

Regression checks for a code change: pass 'baseline' with an earlier replay's output directory and 'fail-on-new-mismatch' to fail only on mismatches that are new since then; 'verify-fix' (with 'expect') to confirm that recorded errors now succeed; 'ignore-body-changes' to score status codes only; 'semantic' to score response bodies by similarity instead of failing on any field change; 'require-blueprint' to fail unless a blueprint's transforms ran.

The replay is held to a test config's goals, as a cloud replay is: the built-in regression config by default (assertions must all pass, and no virtual user may fail), or the workspace config named by 'test_config'. Goals with a local source (match rate, response rate, request counts, throughput, latency, failed virtual users, and assertion percentages, computed by running the config's assertion groups) are evaluated; goals on mock match statistics or container CPU and memory are reported by name as not evaluated locally. A missed goal fails the replay with exit code 1, the same code a triggered 'fail-if' condition uses; either one fails the run.

The replay runs in the background: use the list_running tool to see when it finishes and the read_process_logs tool to inspect results, which include the exit code, a TEST CONFIG GOALS section naming each goal as PASS, FAIL or NOT EVALUATED, and whether any 'fail-if' condition triggered. The verdict, including the goal verdict under "goals", is written to replay-verdict.json in the output directory. After completion, run the generate_report tool on the output directory for latency percentiles and quality scores.

Set 'test_config' to run a test config authored in this workspace as the base config for the replay (author one with the test_config tool); the parameters above still override its load settings, and its goals still apply.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories containing the test RRPair files. Directories are read recursively. Usually these directories end with 'proxymock' and are contained in the current repository. |
| `baseline` | string | no | Output directory of an earlier replay of the same recording. Pairs are matched by refUuid, so the verdict can tell a mismatch that already existed there from a new one. |
| `expect` | string | no | Regular expression selecting the recorded-error endpoints 'verify-fix' expects to be fixed. Requires 'verify-fix'. |
| `fail-if` | array | no | Condition expressions that mark the replay as failed (exit code 1) when any is true, e.g. ["latency.p99 &gt; 100", "requests.result-match-pct &lt; 95.5"]. A single string is still accepted. Applies in addition to the test config's goals. Check the process logs to see whether a condition triggered. |
| `fail-on-new-mismatch` | boolean | no | Exit 3 when a pair fails differently than it failed in 'baseline' (a pair that already failed there is exempt only from that same failure). Requires 'baseline'; cannot be combined with 'verify-fix'. |
| `for` | string | no | How long to run the replay, as a Go duration string (e.g. '30s', '5m'). Traffic is replayed continuously, on a loop, until the duration expires. Mutually exclusive with 'times'. Omit both to replay each request exactly once. |
| `ignore-body-changes` | boolean | no | Score only response status codes, not response bodies, when building the verdict. Cannot be combined with 'semantic'. |
| `load-plan` | string | no | Path to an experimental JSON load plan (a generator config of independent HTTP load groups), the file 'proxymock replay --load-plan' reads. Cannot be combined with 'vus', 'sessions', 'stages', 'for', 'times' or 'no-out'. |
| `load-test` | boolean | no | Load test mode only writes a sample of failed or non-matching requests to disk, trading granular data collection for replay speed. Recommended for high-throughput load tests (many vus or long durations). Responses are not scored, so 'requests.result-match-pct' is not reported and cannot be used in 'fail-if', and the verdict checks and 'require-blueprint' are refused with it. When the app runs behind 'proxymock mock', start the mock without an output directory. |
| `log-to` | string | no | File path to redirect all proxymock output to |
| `no-out` | boolean | no | Do not write observed requests/responses to disk. Mutually exclusive with 'out-directory'. Verdict checks ('baseline', 'verify-fix', 'semantic', 'fail-on-new-mismatch') and 'load-plan' need the output, so they are refused with it. |
| `out-directory` | array | no | The one directory to write observed replay request/response files to, as a single-element array (a replay writes to exactly one output directory; more than one is refused). Required unless 'no-out' is set. Unless otherwise instructed use 'proxymock/replayed-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `require-blueprint` | array | no | Fail if a named blueprint is not loaded, or if none of its transform chains run during the replay. Cannot be combined with 'load-test'. |
| `rewrite-host` | boolean | no | Rewrite the HTTP Host header to match the target hostname:port. Set this when the target server routes requests by Host header (e.g. virtual hosts, ingress controllers). |
| `semantic` | boolean | no | Score response-body similarity (0..1) instead of failing on any stable-field change: at or above 'semantic-pass' a pair matches, below 'semantic-fail' it fails, and between the two it is reported as divergent without failing the run. Uses the built-in offline scorer unless the user's proxymock config chooses another. |
| `semantic-fail` | number | no | Similarity score (0..1) below which a pair fails. Requires 'semantic'. |
| `semantic-pass` | number | no | Similarity score (0..1) at or above which a pair matches. Requires 'semantic'. |
| `sessions` | number | no | Replay recorded sessions as the unit of load instead of virtual users: each slot replays one recorded actor's requests in order, preserving recorded think-time. Overrides 'vus'. |
| `stages` | array | no | A multi-stage load ramp, one entry per stage run in order, each as comma-separated key=value: vus=N, sessions=N (wins over vus), for=D (hold the stage for D; default runs the traffic once), ramp=D (spend the first D of 'for' climbing to the target; min 5s). E.g. ["sessions=5,for=30s", "sessions=50,for=2m,ramp=1m"]. Cannot be combined with 'vus', 'sessions', 'for', 'times' or 'load-plan'. |
| `test-against` | array | no | Where to send the replayed requests. Each entry is a partial or full URL that overrides some or all of the captured URL, and may be scoped to one service as SERVICE=ADDRESS; several entries route several services, the same as repeating 'proxymock replay --test-against'. If not provided, the target depends on the traffic. A single string is still accepted. - If a scheme is provided the scheme of the request will be replaced - If a hostname is provided the hostname of the request will be replaced - If a port is provided the port of the request will be replaced Example test-against addresses: \| Captured URL \| Test Against \| Replay URL \|-----------------------------\|---------------------\|----------- \|https://original.com:443/foo \| http://new.com:8080 \| http://new.com:8080/foo \|https://original.com:443/foo \| http:// \| http://original.com:443/foo \|https://original.com:443/foo \| http://new.com \| http://new.com:443/foo \|https://original.com:443/foo \| new.com \| https://new.com:443/foo \|https://original.com:443/foo \| new.com:8080 \| https://new.com:8080/foo \|https://original.com:443/foo \| :8080 \| https://original.com:8080/foo \|https://original.com:443/foo \| http://:8080 \| http://original.com:8080/foo |
| `test_config` | string | no | A test config authored in this workspace (proxymock/testconfigs/&lt;name&gt;.json; create and edit one with the test_config tool), or a path to a config JSON file. It is the base config this replay runs: load shape, chaos and generator behaviour come from it, and the replay is held to its goals and assertion groups. Precedence: the parameters on this tool win over the named config, which wins over the built-in regression config used when this is omitted. Fields a local replay does not honour are reported rather than silently dropped. |
| `times` | number | no | Number of times to replay the full traffic set (default 1). Mutually exclusive with 'for'. |
| `verify-fix` | boolean | no | Read recorded-error to observed-success mismatches as a confirmed fix rather than a regression. Narrow which endpoints count with 'expect'. |
| `vus` | number | no | Number of concurrent virtual users generating load (default 1). Set higher (e.g. 10) together with 'for' or 'times' to run a load test. Each virtual user replays the full traffic set independently. |

#### `send_one`

Send a single RRPair's request to an arbitrary URL and return the live response (status line, headers, and body). The RRPair file is not modified.

Use this to spot-check one endpoint after a code or RRPair change without running a full replay, e.g. after fixing a body with edit_rrpair. The URL overrides the recorded scheme/host/port; the request path comes from the RRPair.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | **yes** | Path to the RRPair file (.json or .md) to send, relative to the working directory. Use a test (inbound) RRPair rather than a mock. |
| `url` | string | **yes** | URL to send the request to, e.g. 'http://localhost:8080'. |

#### `cloud_replay`

Replay recorded traffic in a Kubernetes cluster THROUGH Speedscale cloud: the same request the Speedscale dashboard's replay wizard, 'speedctl infra replay' and 'proxymock cloud replay' send. The recordings are pushed to Speedscale cloud as a snapshot, then Speedscale cloud tells the inspector registered for the chosen cluster to run the replay there, and the report lands in Speedscale cloud with a dashboard link. Select the operation with 'action'.

proxymock has three independent replay paths and this tool is the third. Choose by what the user has access to:
1. On this machine: replay_traffic against a URL, with mock_server_start for the dependencies. No cluster and no login.
2. In a cluster straight from the kubeconfig: the cluster tool's action='replay-start'. It stages the snapshot in the in-cluster forwarder with no Speedscale cloud round-trip (its 'snapshot_source' parameter decides whether it may fall back to a cloud push). Needs a kubeconfig, not a login.
3. In a registered cluster via Speedscale cloud: this tool. Needs a Speedscale cloud login ('proxymock init') and a cluster whose Speedscale inspector is registered with the tenant. It never uses the kubeconfig, so it also reaches clusters the user cannot reach directly.

Discover a target (read-only; answered by Speedscale cloud from what each registered inspector reports, not from the kubeconfig):
- 'clusters': the clusters registered with the tenant, with inspector id and version. Their names are what 'cluster' takes.
- 'namespaces': the namespaces one cluster reports. Needs 'cluster' or 'inspector_id'.
- 'workloads': the workloads and Services in one namespace of that cluster. Needs 'cluster' or 'inspector_id', and 'namespace'. The workload names are what 'workload' and 'routes' take.

Run:
- 'start' (mutates): push the recordings in 'in_directories' (or reuse 'snapshot_id'), then start the replay in 'cluster' and 'namespace'. Give it a destination: 'workload' (every inbound slice goes to that workload), 'routes' (send individual slices to their own workload, in any namespace, or address; combine with 'workload' for the rest), or 'target' (replay against an address; nothing in the cluster is modified and nothing is mocked). Set 'dry_run' to resolve the cluster, routes, mocks and test config and report them without pushing or starting anything, like 'proxymock cloud replay --dry-run'. Omitting both 'mocks' and 'mock_enabled' mocks nothing, so the workload reaches its real dependencies: the same default as the cluster tool and the proxymock web Replay tab. Set 'mock_enabled' to mock every recorded outbound dependency, which is what makes a replay repeatable, or list keys in 'mocks' (from the cluster tool's action='replay-prepare') to mock only those. A parameter that does not apply to the replay shape you picked (for example 'snapshot_name' with 'snapshot_id') is refused rather than ignored. Returns as soon as Speedscale cloud accepts the replay, with the report id and dashboard URL. It does NOT wait for the replay to finish.
- 'cancel' (mutates, destructive): stop the replay behind 'report_id', the call 'speedctl infra replay cancel' makes. The inspector tears the replay down and the report ends Canceled.
- 'status' (read-only): one report's status as Speedscale cloud sees it (Initializing, Testing, Analyzing, then a terminal verdict such as Passed, Missed Goals or Error), whether it is done, and its success rate. Poll it with the 'report_id' that 'start' returned, a few seconds apart, until done is true; then pull_report downloads the report and its snapshot for analysis.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which operation to run. Read-only: 'clusters', 'namespaces', 'workloads', 'status'. Mutating: 'start', 'cancel'. |
| `build_tag` | string | no | action=start: build tag recorded on the report. |
| `cluster` | string | no | action=namespaces, workloads and start: the cluster to use, by the name action='clusters' lists. Pass this or 'inspector_id'. |
| `dry_run` | boolean | no | action=start: resolve and report the cluster, namespace, routes, mocks, snapshot source and test config without pushing a snapshot or a test config, or starting anything. The same check as 'proxymock cloud replay --dry-run'. |
| `in_directories` | array | no | action=start: directories holding the RRPair files to push as the snapshot. Defaults to the working directory. With 'snapshot_id' nothing is pushed, so it is refused there unless it locates the workspace a 'test_config' name is read from. |
| `inspector_id` | string | no | action=namespaces, workloads and start: the cluster to use, by its inspector id. Pass this or 'cluster'. |
| `mock_enabled` | boolean | no | action=start: true mocks every recorded outbound dependency of the workload (narrow it with 'mocks'); false or omitted mocks nothing unless 'mocks' lists keys. The same switch as the proxymock web Replay tab's 'Mock dependencies' checkbox and the cluster tool's 'mock_enabled'. |
| `mocks` | array | no | action=start: outbound dependency keys to mock, taken verbatim from the cluster tool's action='replay-prepare'. Only applies to a workload replay. Omitting both 'mocks' and 'mock_enabled' mocks nothing, so the workload reaches its real dependencies - the default of the proxymock web Replay tab on both paths and of 'proxymock cluster replay start'. Set 'mock_enabled' to mock every recorded outbound dependency, or list keys in 'mocks' to mock only those. Mocking needs a workload to attach a responder to, so neither applies to a 'target' replay. |
| `namespace` | string | no | action=workloads and start: the Kubernetes namespace of the workload in that cluster. Required for both. |
| `no_mocks` | boolean | no | action=start: mock nothing. This is now the default, so it only remains for existing callers; it is refused together with 'mocks' or mock_enabled=true. |
| `report_id` | string | no | action=status and cancel: the report id action='start' returned. |
| `routes` | array | no | action=start: send one inbound slice to its own destination, each entry as SLICE=WORKLOAD, SLICE=NAMESPACE/WORKLOAD, SLICE=NAMESPACE/KIND/WORKLOAD or SLICE=scheme://host:port (an address). Slice keys come from the cluster tool's action='replay-prepare'; each slice may be routed once. Combine with 'workload', which takes every slice not routed here; mutually exclusive with 'target'. The same vocabulary as the cluster tool's 'routes' and the proxymock web Replay tab. Speedscale cloud attaches mocks to the first workload route only. |
| `snapshot_id` | string | no | action=start: replay a snapshot already in Speedscale cloud instead of pushing the local recordings. |
| `snapshot_name` | string | no | action=start: display name for the pushed snapshot. Omit for a timestamp. Refused with 'snapshot_id', which pushes nothing. |
| `target` | string | no | action=start: replay against this address instead of a workload. Nothing in the cluster is modified and nothing can be mocked. Mutually exclusive with 'workload' and 'routes'. |
| `test_config` | string | no | action=start: a test config authored in this workspace (proxymock/testconfigs/&lt;name&gt;.json; create and edit one with the test_config tool), or a path to a config JSON file. It is pushed to Speedscale cloud under the same name, then named by id on the replay, so there is no separate push step. Omit for the built-in regression config, which Speedscale cloud already has, so nothing is pushed. |
| `workload` | string | no | action=start: replay every inbound slice against this workload (the system under test). Mutually exclusive with 'target'. List the options with action='workloads'. |
| `workload_type` | string | no | action=start: kind of 'workload' and of every 'routes' workload: deployment (default), statefulset, daemonset, replicaset, rollout or service. There is no job: the cloud resolves a system under test to a long-running workload or a Service (the cluster tool, which references the object itself, takes job and not service). An unknown kind is refused rather than treated as a deployment, and so is a kind with only a 'target', which has no workload. |

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
| `baseline-directory` | array | no | Optional baseline (older run) directories. When set, the output is a comparison showing how the input directories' SQL workload changed relative to this baseline, e.g. baseline=recorded traffic, in-directory=replayed traffic, or two recordings of different app versions. |

#### `response_diff`

_Read-only._

Compare the HTTP/gRPC response payloads of two recorded runs and report only the differences that matter. First learns which response fields are volatile (timestamps, ids, counters) from within-run evidence, then diffs the paired responses on the remaining stable fields, so a real regression (a total going to 0, a field disappearing, a type change) surfaces while noise is filtered out.

in-directory is the candidate/newer run; baseline-directory is the baseline/older run, e.g. baseline=recorded traffic, candidate=replayed traffic, or two recordings of different app versions. Twins are paired by refUuid then endpoint+sequence.

Findings are classified (value change, magnitude/sign shift, null flip, type change, field added/removed, endpoint added/removed) and ranked with regressions first. This catches content regressions a status-code or latency monitor cannot: a 200 OK whose body silently changed. Only HTTP/gRPC responses are compared; other protocols are skipped. Companion to generate_report.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `in-directory` | array | **yes** | Directories of RRPair files for the candidate (newer) run. Read recursively. Usually end with 'proxymock' and live in the current repository. |
| `baseline-directory` | array | **yes** | Directories of RRPair files for the baseline (older/expected) run to compare the candidate against. |
| `semantic` | boolean | no | Additionally score each compared response pair's semantic similarity (0..1) over its stable fields and report per-endpoint scores plus an overall divergence rate. Use for prose or LLM-generated responses, where field-level findings can't say whether a change altered meaning. |

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

#### `recommendations`

Analyze the RRPair (request/response pair) files in a local directory and work the general replay-tuning recommendations the analyzer finds. Select the operation with 'action':

- 'list' (read-only): analyze the directory and list recommendations. Two kinds are returned. transform: mechanical fixes needed for the traffic to replay or mock cleanly: JWT re-signing, timestamp shifting, message-id rotation, data redaction; each carries transform chains. traffic: informational findings about the recorded traffic itself. Recommendations the user already rejected are filtered out.
- 'accept' (writes blueprint): merge one recommendation's transform chains into the workspace's per-service tuning blueprint on disk by 'id'. No RRPair files are rewritten; replay and mock runs in this workspace apply the blueprint automatically.
- 'reject' (writes state): record the id in the workspace so the recommendation stops appearing in 'list'.

Accept and reject are idempotent and match what the proxymock web UI's Accept/Reject buttons do. Recommendation ids are stable content hashes: the same recommendation keeps its id across analysis runs, so an id from action=list can be passed to accept/reject later.

This is a different id space from the mocks tool, which handles the Mocks-view match-rate fixes.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which recommendations operation to run: 'list' is read-only; 'accept' and 'reject' write workspace state. |
| `in-directory` | array | **yes** | Directory containing RRPair files to analyze. Exactly one directory; the tuning blueprint and rejection state are stored under it. Usually ends with 'proxymock' and is contained in the current repository. |
| `id` | string | no | Recommendation id as returned by action=list. Required for accept and reject. |
| `type` | string | no | action=list only. Optional filter: 'transform' or 'traffic'. Default is both. |

#### `mocks`

Tune a replay's OUTBOUND mock match rate offline from RRPair files in one workspace. No replay or cluster is needed. Select the operation with 'action':

- 'analyze' (read-only): report how well the replay's outbound requests match the recorded mocks, and list impact-sorted fix recommendations grouped by the filter that would collapse them. Reports two rates over the same denominator: the report rate recorded at replay time and the projected rate with the workspace's active tuning blueprints applied.
- 'accept' (writes blueprint): accept one recommendation by 'id' (from analyze), or every open one with 'all'=true. Writes a filter-scoped transform into the workspace's per-service tuning blueprint; no RRPair files are rewritten. The response reports the projected-rate movement immediately.
- 'undo' (writes blueprint): remove a previously accepted recommendation by 'id'. Idempotent, so accepts and undos can be tried and reverted freely.
- 'similar' (read-only): deep-dive one projected miss ('id'), ranking it against the recorded mock corpus with per-field drift, likely cause, and any pending recommendation. Use it to reason about ambiguous misses before accepting fixes.

The workspace usually comes from 'proxymock cloud pull report &lt;id&gt;', which materializes both analysis sides (snapshot-* and report-* run directories). This is the Mocks-view match-rate loop; it is a different id space from the recommendations tool, which handles general replay-tuning recommendations.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which mocks operation to run: 'analyze' and 'similar' are read-only; 'accept' and 'undo' write the tuning blueprint. |
| `in-directory` | array | **yes** | Exactly one workspace directory holding both analysis sides as run directories (usually snapshot-* and report-*). The tuning blueprint is stored under it. |
| `all` | boolean | no | action=accept only: accept every open recommendation with its default transform (the web UI's 'Accept all'). |
| `id` | string | no | A recommendation id (shaped '&lt;service&gt;\|&lt;target&gt;') for action=accept/undo, or a projected-miss id for action=similar. Both are returned by action=analyze. Required for accept (unless all=true), undo, and similar. |
| `max` | number | no | action=similar only: how many nearest candidates to return (default 3). |
| `mock-source` | string | no | Optional run-directory name (or absolute RRPair directory) supplying the recorded mock signatures. Auto-discovered when omitted: the newest snapshot-*/recorded-*/mocked-* run. |
| `request-source` | string | no | Optional run-directory name (or absolute RRPair directory) supplying the outbound requests to check. Auto-discovered when omitted: the newest report-*/replayed-* run. |
| `transform` | string | no | action=accept only: transform type overriding the recommendation's default (e.g. 'constant' to mask). Ignored for URL id-segment fixes, which always wildcard. |

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
| `config` | string | **yes** | Path to a filter/transform config JSON file, or the id of a config pulled with 'proxymock cloud pull filter\|transform'. A filter id resolves against the workspace's proxymock/filters/ directory (from the first in-directory), where the proxymock web filter editor also saves rules. |
| `in-directory` | array | **yes** | Directories or RRPair files to read, relative to the working directory. Directories are read recursively. |
| `out-directory` | array | no | Required for 'transform-apply': directory to write transformed copies to (must be outside the input directories). Only the first entry is used. Ignored by the read-only actions. Unless otherwise instructed use 'proxymock/transform-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |

#### `test_config`

Author, inspect, validate and delete the test configs of a proxymock workspace (files in &lt;workspace&gt;/proxymock/testconfigs/&lt;id&gt;.json, each one complete TestConfig as Speedscale cloud stores it). Works offline with no Speedscale account. The same rules as the proxymock web test config editor apply, and files written here open unchanged in it.

A test config controls how a replay runs: load stages, responder replicas and resources, chaos, goals and assertions. Workflow:
1. action='meta' with a 'section' or 'path_prefix' to find the field paths you need, their types and defaults, and which run paths (local/cluster/cloud) honour them.
2. action='create' with a new 'id': copies the built-in 'regression' config unless 'from' names another config or 'config' supplies a whole document.
3. action='set' with 'fields', a map of field path to value, e.g. &#123;"responder.numReplicas": 3, "cluster.responderResources.limits.cpu": "2"&#125;. Unknown and deprecated paths are refused with the path named; a null value removes a field.
4. Pass the id as 'test_config' to replay_traffic (a replay on this machine), to the cluster tool (action='replay-start') or to the cloud_replay tool (action='start'). Fields the chosen run path does not honour are reported rather than silently dropped.

Other actions: 'list' (workspace configs plus the read-only built-in 'regression'), 'show' (one config with warnings and validation problems), 'validate' (check a saved config by 'id' or an unsaved 'config' document without writing), 'delete' (remove a workspace config; requires confirm=true).

The built-in 'regression' and the other Speedscale default names are reserved (case-sensitive): they can be shown and copied, never created, changed or deleted. 'protected' can never be set. create and set refuse to write a config with validation problems (for example a resource quantity Kubernetes would reject) and name each problem.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | list, show, meta and validate are read-only; create and set write a workspace file; delete removes one. |
| `config` | object | no | create, validate: a complete TestConfig JSON document. Parsed strictly: an unknown field is an error naming the field. |
| `confirm` | boolean | no | delete: must be true; delete refuses without it. |
| `fields` | object | no | set: map of dotted field path to new value, e.g. &#123;"responder.numReplicas": 3, "generator.stages": [...]&#125;. List entries are not addressable; set the whole list. null removes the field. |
| `force` | boolean | no | create: replace an existing workspace config with the same id instead of refusing. |
| `from` | string | no | create: the config to copy, a workspace config id or the built-in 'regression' (the default). Cannot be combined with 'config'. |
| `id` | string | no | show, create, set, delete: the config id (its file name without .json; letters, digits, '.', '_' or '-'). validate: the saved config to check, or the id to check an unsaved 'config' under. |
| `in_directory` | string | no | The proxymock workspace: the repo directory holding proxymock/, the proxymock directory itself, or a recording inside it. Defaults to the working directory. Pass the same directory as 'in_directories' on the replay that uses the config. |
| `path_prefix` | string | no | meta: only fields whose path starts with this, e.g. 'responder.' or 'cluster.responder'. |
| `section` | string | no | meta: only fields in this editor section ('none' is the identity fields). |

#### `dlp`

Author and validate DLP (data loss prevention) redaction rules against local RRPair files, entirely offline (no Speedscale account, API key, or network). The redaction pipeline is identical to what 'proxymock record --dlp-config' applies at capture time, so this reports exactly what a live recording would redact. Select the operation with 'action':

- 'test' (read-only): report what a DLP config would redact without modifying any file - per-location match counts and the file and location of each match. Set 'show-redacted' to a single RRPair file to print its full before/after redaction instead of the summary.
- 'apply' (writes files): write redacted copies of the RRPairs to 'out-directory', mirroring the input layout. Input files are never modified.

The 'config' is the same JSON document 'proxymock cloud pull/push dlp' read and write, so a rule authored locally round-trips to and from Speedscale Cloud.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which DLP operation to run: 'test' is a read-only report; 'apply' writes redacted copies to out-directory. |
| `config` | string | **yes** | Path to a DLP config JSON file, or the id of a rule in the workspace's proxymock/dlprules/ directory (resolved from the first in-directory), where the proxymock web DLP editor and 'proxymock cloud pull dlp' save rules. |
| `in-directory` | array | **yes** | Directories or RRPair files to read, relative to the working directory. Directories are read recursively. |
| `out-directory` | array | no | Required for 'apply': directory to write redacted copies to (must be outside the input directories). Only the first entry is used. Ignored by 'test'. Unless otherwise instructed use 'proxymock/redacted-&lt;date&gt;' where &lt;date&gt; is the output from the command 'date +%Y-%m-%d_%H-%M-%S', or something similar. |
| `show-redacted` | string | no | For 'test' only: path to a single RRPair file to print its full before/after redaction instead of the summary. |

### Edit traffic

#### `edit_rrpair`

Edit an HTTP RRPair markdown file: request or response body and headers, response status code, and duration metadata. Content-Length is recomputed after body edits and the file is rewritten atomically.

Use this to fix stale recorded data before mocking or replaying, e.g. after search_local_traffic or compare_rrpair_files points you at the file. Relative and absolute paths are accepted; both must resolve inside the working directory. Only existing .md RRPair files are editable.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | **yes** | Relative or absolute path to the .md RRPair file. |
| `body` | string | no | The new body content as a UTF-8 string. For binary content prefix with 'base64:' followed by standard base64. An empty string clears the body. |
| `duration-ms` | number | no |  |
| `headers` | object | no | Header names mapped to a string or array of strings. A null value deletes the header. Names are matched case-insensitively and stored lowercased, so the same header cannot be listed twice under different casing. |
| `side` | string | no | Side whose body or headers to edit. Required when body or headers is supplied. |
| `status-code` | number | no | Response status code. The reason phrase is derived from it, so a custom phrase cannot be stored. |

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
- outbound (default): OUTBOUND mock definitions. Serve them with 'mock_server_start' (proxymock mock) to stand up a mock of the spec's API, or use them as dependency mocks during 'replay_traffic'.
- inbound: INBOUND test definitions. Drive them at a running implementation of the spec with 'replay_traffic' (proxymock replay).
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
- locust: a Python locustfile for HTTP load testing. Run with --host to target the test deployment.
- gatling: a Gatling simulation Java file.
- datadog-synthetics: a Datadog Synthetics test bundle written to disk (local files only; this tool never publishes to Datadog).

Reads RRPair files from one input directory and writes a single output artifact. To go the other way (a third-party artifact to RRPairs) use import_traffic.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `format` | string | **yes** | Format to export to: 'postman', 'k6', 'gatling', 'locust', or 'datadog-synthetics'. |
| `in-directory` | string | **yes** | Directory of recorded RRPair files to export, relative to the working directory (read recursively). |
| `out` | string | no | Output file (or bundle directory for datadog-synthetics). Defaults per format: collection.json, k6.js, LoadSimulation.java, locustfile.py, or a datadog-synthetics-&lt;dir&gt; bundle. |

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

Pull a Speedscale cloud replay report AND the snapshot it was generated from into a local workspace, the equivalent of 'proxymock cloud pull report &lt;id&gt;'.

The report's artifacts land in the workspace reports/&lt;id&gt;/ directory, its RRPairs (carrying the HIT/MISS mock-match verdicts) in &lt;out-directory&gt;/report-&lt;id&gt;/ and the source snapshot's recorded traffic in a sibling snapshot-&lt;id&gt;/: exactly the two sides the mocks tool needs, so this tool is step one of the mock match-rate tuning loop: pull_report -&gt; mocks action=analyze -&gt; mocks action=accept -&gt; repeat.

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

#### `snapshot`

Work traffic snapshots stored in Speedscale cloud, or in the customer's own object-store bucket. Select the operation with 'action':

- 'push' (uploads): publish local RRPair (request/response pair) directories as one named snapshot. Every RRPair under the given directories is consolidated and uploaded, making the traffic available to teammates, CI replays, and (in cloud) the dashboard. Curate the directories first; optionally pass 'sample' to keep only a deterministic fraction (whole sessions) so a large recording fits under the snapshot limit. Active tuning blueprints in the workspace are uploaded with the snapshot, so recommendations accepted via recommendations travel with the traffic. Returns the new snapshot id and its location.
- 'list' (read-only): list snapshots, newest first, optionally narrowed by 'search', 'service', and 'tag'. Use it to find a snapshot id for pull_remote_recording, or to confirm a push landed.
- 'pull' (downloads): fetch a stored snapshot back into local RRPair files that proxymock can search, mock, and replay. Requires 'snapshot_id'.
- 'delete' (destructive): remove a stored snapshot. Requires 'snapshot_id' and 'confirm'=true. This is the only operation that deletes stored traffic; push, pull, and list never do.

Destination: by default every action targets Speedscale cloud and needs Speedscale credentials (run 'proxymock init' once to register). Set 'bucket' to target the customer's own object store instead. That path never contacts Speedscale, takes credentials from the standard AWS environment chain, and works without a Speedscale account. Bucket snapshots are not analyzed by the cloud, so replay them locally rather than in-cluster.

Retention in a bucket is the customer's: objects are written only under 'bucket_prefix', nothing is deleted except by an explicit 'delete', and a lifecycle policy they set is the only thing that expires a snapshot. A pull whose objects are no longer complete fails before downloading anything rather than producing a partial snapshot.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which snapshot operation to run: 'push' uploads local RRPairs; 'pull' downloads a stored snapshot; 'list' is read-only; 'delete' removes a stored snapshot. |
| `bucket` | string | no | Store snapshots in this named bucket instead of Speedscale cloud. For bucket_provider=gcs, use Google Application Default Credentials; bucket_from_cluster can discover the bucket. S3 uses the AWS credential chain or bucket_from_cluster. No Speedscale account is needed. |
| `bucket_from_cluster` | boolean | no | Discover a bucket through kubeconfig. Native GCS reads only ConfigMaps and uses local Google Application Default Credentials with separate snapshot permissions. The cluster traffic reader is read-only. Omit this and bucket to use Speedscale cloud. |
| `bucket_namespace` | string | no | Namespace to search for native GCS collectors. |
| `bucket_prefix` | string | no | Base key prefix for snapshots in the bucket. Defaults to "speedscale/". Everything proxymock writes or deletes stays under this prefix. |
| `bucket_provider` | string | no | Storage provider: s3 or native gcs using Google Application Default Credentials |
| `confirm` | boolean | no | action=delete only (required there): must be true. Deleting a snapshot cannot be undone, so it is never inferred. |
| `destination` | string | no | Native GCS destination ID; required when discovery finds multiple exporters. |
| `force` | boolean | no | action=pull only. The snapshot carries test configs; when one already exists in the workspace and differs, it is overwritten only with force=true. Without it nothing is written for that config and the call returns an error naming the file. |
| `in-directory` | array | no | action=push only (required there): directories containing the RRPair files to publish. Read recursively; all RRPairs are consolidated into a single snapshot. |
| `kube_context` | string | no | Which cluster to discover the bucket from. Defaults to your current kubeconfig context. Only used with bucket_from_cluster. |
| `limit` | number | no | action=list only. Maximum snapshots to return (default 20, max 100). |
| `max_rrpairs` | number | no | action=push only. Optional: if the traffic exceeds this many RRPairs, narrow the push to a representative contiguous time window that fits (keeping the operation mix), instead of sampling. Composes with 'sample' (window crops time, sample thins within). Omit for no limit. |
| `name` | string | no | action=push only. Optional display name for the snapshot in the dashboard. |
| `out-directory` | string | no | action=pull only. Workspace directory to expand the snapshot into. Defaults to ./proxymock. |
| `region` | string | no | Region of the bucket. Defaults to the AWS SDK configuration (AWS_REGION). |
| `s3_endpoint_url` | string | no | Custom endpoint URL for an S3-compatible store (MinIO, DigitalOcean Spaces, GCS S3-interop). Leave empty for AWS S3. |
| `s3_force_path_style` | boolean | no | Use path-style addressing (bucket in the path, not the host). Often required for MinIO and other S3-compatible stores. |
| `sample` | string | no | action=push only. Optional: keep only a deterministic fraction of the traffic so a large recording fits under the snapshot limit. Whole sessions are kept or dropped together (sessionless RRPairs fall back to per-pair). Accepts a percentage ("20%"), a fraction ("1/5"), or "1 in 5". Omit to push everything. |
| `search` | string | no | action=list only. Optional search term matched against snapshot names. |
| `service` | string | no | action=list only. Optional filter: only snapshots containing traffic for this service. |
| `snapshot_id` | string | no | action=pull and action=delete only (required there): the id of the stored snapshot, as returned by action=list. |
| `tag` | string | no | action=list only. Optional filter: only snapshots with this build tag. |

### BYOC bucket

#### `pull_byoc_bucket`

Pull historical traffic from the customer's OWN BYOC object-store bucket (S3, S3-compatible, or native Google Cloud Storage) into local RRPair files that proxymock can search, mock, and replay. Runs locally with no Speedscale account. storage-provider=s3 uses the AWS credential chain (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_PROFILE). storage-provider=gcs uses the native GCS API with Google Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS, gcloud auth application-default login, or an attached identity); HMAC keys are not needed. With bucket-from-cluster=true, the dedicated reader uses its own Google identity; credentials remain in the cluster. Use list-buckets=true to discover destinations and select destination when multiple exporters exist.

This is distinct from pull_remote_recording, which pulls from Speedscale-managed cloud. Use this tool when the traffic lives in the customer's own bucket, for example a BYOC deployment where the in-cluster OTel collector's awss3 exporter writes OTLP-JSON objects under the "byoc/" prefix.

Narrow the pull with a time window (from/to) and filters (service, namespace, status, trace-id, or a full filter expression) so you download only what you need. Returns the import summary: RRPair files written, keys scanned, objects downloaded, and malformed records skipped.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `access-mode` | string | no | Native GCS: adc uses local Google credentials; cluster reads through the dedicated reader without exporting credentials. |
| `bucket` | string | no | Name of the object-storage bucket that holds the BYOC traffic. |
| `bucket-from-cluster` | boolean | no | Native GCS: discover the collector destination and use its dedicated cluster reader by default. |
| `bucket-namespace` | string | no | Namespace containing the collector; limits discovery to namespaced RBAC. |
| `destination` | string | no | Exact destination ID returned by list-buckets; required when multiple destinations exist. |
| `filter` | string | no | Speedscale traffic filter string, for example '(service IS "checkout") AND (status IS "500")'. Overlapping criteria override the convenience filters below. |
| `from` | string | no | Start of the time window when the filter has no timerange, for example now-15m or 2026-06-12T18:00:00Z. Defaults to now-1h. |
| `kube-context` | string | no | Kubernetes context for native GCS discovery and reader access. |
| `limit` | number | no | Maximum number of matched RRPairs to write. 0 (default) means unlimited. |
| `list-buckets` | boolean | no | Native GCS: list active collector destinations without importing traffic. |
| `namespace` | string | no | Kubernetes namespace to match when the filter has no namespace predicate. |
| `out-directory` | string | no | Directory to write RRPair files to. Defaults to ./proxymock/imported-&lt;provider&gt;-&lt;timestamp&gt;. |
| `prefix` | string | no | Object key prefix to search. Use 'byoc/' for the current OTel awss3 layout. Defaults to the whole bucket. |
| `region` | string | no | S3 provider only: AWS region of the bucket. Defaults to the AWS SDK configuration (AWS_REGION). |
| `s3-endpoint-url` | string | no | S3 provider only: custom endpoint URL for an S3-compatible store (MinIO, DigitalOcean Spaces, GCS S3-interop). Leave empty for AWS S3. |
| `s3-force-path-style` | boolean | no | S3 provider only: use path-style S3 addressing (bucket in the path, not the host). Often required for MinIO and other S3-compatible stores. |
| `service` | string | no | Service name to match when the filter has no service predicate. |
| `status` | string | no | Exact response status to match when the filter has no status predicate, for example 500. |
| `storage-provider` | string | no | s3 (default) for S3-compatible storage; gcs for native Google Cloud Storage using ADC. |
| `to` | string | no | End of the time window when the filter has no timerange, for example now or 2026-06-12T19:00:00Z. Defaults to now. |
| `trace-id` | string | no | Trace ID to match when the filter has no trace predicate. |

### Kubernetes cluster

#### `cluster`

Work the Kubernetes cluster your kubeconfig points at: inspect what is running, turn Speedscale eBPF traffic capture on and off, and run recorded traffic back against a workload inside the cluster. Select the operation with 'action'.

Capture (record real traffic off a running workload):
- 'inject' (mutates): turn capture on for one workload by patching its capture.speedscale.com/* annotations. eBPF capture attaches to running pods, so the workload is NOT restarted; setting 'java_agent' does restart it, because the agent is injected at pod admission and only loads into new pods. Idempotent.
- 'uninject' (mutates): turn capture off by clearing those annotations. Idempotent; already-recorded traffic is untouched.
- 'capture-status' (read-only): report whether capture is on, whether the java agent is enabled, which ports are excluded, and whether the workload looks like it runs a JVM.

There are two capture mechanisms and these three actions cover both. By default they record intent in annotations, which the in-cluster operator and nettap daemon act on. On a NAMESPACED install (one where the Speedscale data plane lives in a single application namespace instead of the shared "speedscale" one), there is no cluster-wide operator or nettap to act on them, so annotations are inert there and the goproxy SIDECAR is the only mechanism that captures anything: proxymock computes the sidecar mutation itself and applies it with your own credentials, the same mutation an admission webhook would perform. You MUST set 'sidecar' to choose it. It is never inferred, not from $SPEEDSCALE_NAMESPACE and not from anything else, so on a namespaced install, omitting it writes annotations that nothing will ever act on and the workload captures nothing. It also works on a classic install. Sidecar capture restarts the workload (a sidecar only joins a pod at creation), records every field it changed in an inventory ConfigMap so 'uninject' can put the workload back exactly as it was, and refuses to revert rather than guessing if anything has drifted since. Deployments and StatefulSets only. Call action='status' first if you are unsure which install this is: it reports namespacedMode, and namespacedMode=true means pass sidecar=true.

Replay: run recorded traffic against a workload in the cluster, straight from the kubeconfig. This is the second of proxymock's three independent replay paths: replay_traffic replays on this machine; these actions replay in the cluster your kubeconfig reaches; the cloud_replay tool replays in a cluster registered with Speedscale cloud, needing a cloud login instead of a kubeconfig, the way a dashboard replay does. When the user wants the replay to run through Speedscale cloud, use cloud_replay rather than these actions.
- 'replay-prepare' (read-only, local): analyze recordings on this machine and return the inbound slices a replay can be routed at and the outbound dependencies it can mock. Runs the same analyzer the cloud runs, with no push and no login, so the keys it returns are exactly the keys 'replay-start' accepts. Call this before 'replay-start' rather than guessing dependency keys.
- 'replay-start' (mutates): analyze the recordings on this machine, stage the snapshot in the in-cluster forwarder over a port-forward, and create the replay. No Speedscale cloud login is needed for that; the replay is annotated snapshot-source=local, and its report stays in the cluster (so there is no dashboard link). By default ('snapshot_source' auto) the recordings are pushed to Speedscale cloud instead only if staging in the cluster fails, which does need a login. Set 'snapshot_source' to local to forbid that fallback, so the call fails rather than touching the cloud, or to cloud to skip staging and push to the cloud directly. The result says which happened as 'snapshotSource' (local or cloud). Pass 'snapshot_id' to reuse a snapshot already in the cloud and skip both. Give it either 'workload' (replay every inbound slice against a cluster workload; the only shape that can mock dependencies), 'routes' (send individual slices to their own workload, in any namespace, or address; combine with 'workload' for the rest), or 'target' (replay against a plain address, touching nothing in the cluster). 'replay_mode' picks full-replay (default), responder-only or generator-only, and 'build_tag' is recorded on the report, on both install mechanisms. 'mocks' takes the outbound keys from 'replay-prepare'; mocking a dependency makes the responder answer it from the recording instead of letting the workload reach the real thing, which is what makes the replay repeatable. Omitting both 'mocks' and 'mock_enabled' mocks nothing (the same default as 'proxymock cluster replay start', the proxymock web Replay tab and the cloud_replay tool); set 'mock_enabled' to mock every recorded dependency. A parameter that does not apply to the replay shape you picked (for example 'workload_type' with 'target', or 'in_directories' with 'snapshot_id') is refused rather than ignored. Returns immediately with the replay name and report id; it does not block.
- 'replay-status' (read-only): with 'replay_name', the full stage breakdown of one replay including the operator's own explanation of a failure; without it, the replays currently running in the cluster (pass 'all' to include finished ones still present). A replay is garbage-collected after it finishes, so a long-completed replay will not be found; read its report in Speedscale cloud.
- 'replay-logs' (read-only): the generator, responder and system-under-test log lines for a running replay. This is a LIVE tap with no history and is lossy under load, so it returns lines emitted while it is subscribed and nothing from before; it returns nothing for a replay that is not currently running. The complete log is the cloud report.
- 'replay-cancel' (mutates, destructive): stop a running replay by deleting it. This reverts the workload under test and tears down the generator and responder, and produces no report. Refused once the generator has finished, so it cannot discard results that are still being analyzed.

On a NAMESPACED install the replay actions drive a replay REQUEST (a labeled ConfigMap the in-cluster replay coordinator reads) instead of a TrafficReplay, because such an install cannot have the TrafficReplay CRD. A namespaced install is an install mode, not another replay path: the replay still runs from the kubeconfig, through a different in-cluster mechanism. Set 'namespaced' to select that mechanism - it is never inferred (a namespaced install is recognized by what is deployed, not by its namespace name; action='status' reports which mechanisms an install supports). Three things differ with it. There is no push to Speedscale cloud and no login, so the traffic must already be in the cluster: pass 'snapshot_id' for a snapshot already staged there, or 'snapshot_file' to stage a snapshot document alongside the request. It drives exactly one workload, so 'target' is refused. And 'replay-cancel' writes a cancellation the coordinator acts on (it restores the workload as it tears the replay down) instead of deleting anything, and is accepted from every non-terminal state. A replay request also has no TTL, so 'replay-status' still answers for a replay that finished long ago.

Install (read-only):
- 'status': report whether the Speedscale data plane is present, reachable and permitted in the resolved namespace: which components are deployed and ready, whether the forwarder and inspector actually answer over a port-forward (naming the failing hop when they do not), what this kubeconfig is allowed to do there, and which capture and replay mechanism the actions above will therefore drive. It never fails outright: a completely unreachable cluster still produces a full report with each check marked failed, so this is the first action to call when anything else here behaves unexpectedly.

Inspect (read-only, and the fastest way to answer "what is actually in this cluster"):
- 'namespaces': the namespaces the forwarder has observed. Start here when you do not know what is in the cluster. Note that it lists only namespaces nettap has seen traffic in, so it is not the same as 'kubectl get ns'.
- 'nodes': the cluster's nodes with kernel, OS image and container runtime. The kernel version is what to check when eBPF capture records nothing.
- 'services': the Services in a namespace with type, cluster IP and ports. A Service address is usually what 'replay-start' wants as its 'target'.
- 'dependencies': the ConfigMaps, Secrets, Services and volumes one workload references and how it reaches each. This is the DECLARED wiring from the workload's spec, the complement to 'topology' (which shows connections actually observed). Names and reference paths only; no ConfigMap or Secret values are returned.
- 'topology': the service map for one namespace: its workloads, the workloads elsewhere they exchange traffic with, and the observed connections between them. Built from what nettap sees on the wire, so it shows real connections, not declared ones.
- 'workloads': the workloads the forwarder has observed, cluster-wide or in one namespace. These are the names 'inject' and 'replay-start' take.
- 'pods': the pods in a namespace, optionally narrowed to one workload, with node, IP and phase. This is the OBSERVED inventory, not the apiserver's, so a freshly scaled-up workload can show fewer pods than 'kubectl get pods', and fewer than 'logs' returns, since that reads the apiserver through the inspector.
- 'logs': pod logs for a workload. Served by the in-cluster inspector under its own ServiceAccount, so this works even when the kubeconfig cannot read pod logs directly. Set 'previous' to read the last terminated container, the only way to see why a CrashLoopBackOff pod died.
- 'events': Kubernetes events for a workload and its pods. Failed image pulls, scheduling problems, probe failures and OOM kills surface here first.

Everything here needs only a kubeconfig. The inspect and replay actions are served by Speedscale components running in the cluster, which proxymock locates and port-forwards to for you using 'kube_context'; there is nothing to configure and no address to supply. Capture records intent only: the in-cluster operator and nettap daemon watch the annotations and do the actual capture, so annotating a cluster without them installed has no effect.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | string | **yes** | Which cluster operation to run. Read-only: 'capture-status', 'replay-prepare', 'replay-status', 'replay-logs', 'status', 'topology', 'namespaces', 'nodes', 'workloads', 'pods', 'services', 'dependencies', 'logs', 'events'. Mutating: 'inject', 'uninject', 'replay-start', 'replay-cancel'. |
| `all` | boolean | no | action=replay-status listing: include replays that are no longer running but are still in the cluster. |
| `build_tag` | string | no | action=replay-start: build tag recorded on the report (the TrafficReplay spec field the operator copies into the test config's cluster.buildTag, so it wins over a test config's own value). Same as cloud_replay 'build_tag'. |
| `container` | string | no | action=logs: container to read within each pod. Omit for the pod's first container. |
| `force` | boolean | no | Sidecar inject/uninject only: proceed even though a GitOps controller (Argo CD, Flux) manages this workload and will revert the change on its next sync. Only set this when the user has said they accept that. |
| `ignore_inbound_ports` | string | no | Sidecar inject only: comma-separated inbound ports to leave uncaptured. |
| `ignore_outbound_ports` | string | no | Sidecar inject only: comma-separated outbound ports to leave uncaptured. |
| `ignore_ports` | string | no | action=inject only: comma-separated ports to exclude from capture (e.g. '8080,9090'). |
| `in_directories` | array | no | action=replay-prepare and replay-start: directories holding the RRPair files to replay. Defaults to the working directory. Refused with 'snapshot_id' (nothing is staged) and on a namespaced replay (it never reads local recordings). |
| `java_agent` | boolean | no | action=inject only: also inject the Java agent. Restarts the workload, and is only useful when 'capture-status' reports javaDetected. |
| `kube_context` | string | no | Kubeconfig context to target. Omit to use the current-context. |
| `limit` | number | no | action=events: keep only the most recent N events (default 50). action=replay-logs: stop after N lines (default 200). |
| `mock_enabled` | boolean | no | action=replay-start: true mocks every recorded outbound dependency of the workload (narrow it with 'mocks'); false or omitted mocks nothing unless 'mocks' lists keys. The same switch as the proxymock web Replay tab's 'Mock dependencies' checkbox and the cloud_replay tool's 'mock_enabled'. |
| `mocks` | array | no | action=replay-start: outbound dependency keys to mock, taken verbatim from 'replay-prepare'. Only applies to a workload replay, because mocking needs a responder. Omitting both 'mocks' and 'mock_enabled' mocks nothing, so the workload reaches its real dependencies - the default of the proxymock web Replay tab on both paths and of 'proxymock cluster replay start'. Set 'mock_enabled' to mock every recorded outbound dependency, or list keys in 'mocks' to mock only those. Mocking needs a workload to attach a responder to, so neither applies to a 'target' replay. |
| `namespace` | string | no | Kubernetes namespace. Required for every action except 'replay-prepare', 'status', 'namespaces', 'nodes' and the cluster-wide listings ('workloads', 'replay-status'), where omitting it spans the cluster. This always names the WORKLOAD's namespace, never the Speedscale install's; that one comes from $SPEEDSCALE_NAMESPACE. |
| `namespaced` | boolean | no | Replay actions: drive a replay request read by the in-cluster replay coordinator instead of creating a TrafficReplay, for an install without the TrafficReplay CRD. Set this for a namespaced install; it is never inferred from the namespace, exactly like --namespaced on the CLI. That mechanism never touches Speedscale cloud, so it needs 'snapshot_id' or 'snapshot_file' rather than pushing local recordings. |
| `pod` | string | no | action=logs: read only this pod instead of every pod of the workload. |
| `previous` | boolean | no | action=logs: read the last terminated container instead of the running one. This is how you find out why a CrashLoopBackOff pod died. |
| `replay_mode` | string | no | action=replay-start, on both install mechanisms: full-replay (default), responder-only or generator-only. The cloud_replay tool has no equivalent: Speedscale cloud's replay request carries no mode. |
| `replay_name` | string | no | action=replay-status and replay-cancel: the replay's name as returned by 'replay-start' or listed by 'replay-status'. Omit on 'replay-status' to list instead. |
| `report_id` | string | no | action=replay-logs: the report id 'replay-start' returned, which scopes the log tap to that replay. |
| `request_name` | string | no | Namespaced replay-start only (refused without namespaced=true): name for the replay request object. Omit to generate one. |
| `routes` | array | no | action=replay-start: send one inbound slice to its own destination, each entry as SLICE=WORKLOAD, SLICE=NAMESPACE/WORKLOAD, SLICE=NAMESPACE/KIND/WORKLOAD or SLICE=scheme://host:port (an address). Slice keys come from 'replay-prepare'; each slice may be routed once. Combine with 'workload', which takes every slice not routed here; mutually exclusive with 'target'. The same vocabulary as cloud_replay 'routes', 'proxymock cluster replay start --route' and the proxymock web Replay tab. Mocks attach to every workload route. |
| `sidecar` | boolean | no | Capture actions: drive the goproxy sidecar, which proxymock computes and applies itself, instead of the eBPF capture annotations. Set this for a namespaced install - nothing there acts on the annotations, so the sidecar is the only mechanism that captures anything; it also works on a classic install. Never inferred from the namespace: without it, capture actions drive the annotations. Deployments and StatefulSets only, and injecting restarts the workload. |
| `snapshot_file` | string | no | Namespaced replay-start only (refused without namespaced=true): path to a snapshot document to stage in the cluster as a ConfigMap for the coordinator to read. Use this when the snapshot is on this machine; use 'snapshot_id' alone when it is already staged. |
| `snapshot_id` | string | no | action=replay-start: replay a snapshot already in Speedscale cloud instead of staging or pushing the local recordings. |
| `snapshot_name` | string | no | action=replay-start: display name for the snapshot when the recordings are pushed to Speedscale cloud (snapshot_source=cloud, or the auto fallback). A snapshot staged in the cluster has no name, so it is refused with snapshot_source=local and with 'snapshot_id'. Same as cloud_replay 'snapshot_name' and 'proxymock cluster replay start --name'. |
| `snapshot_source` | string | no | action=replay-start: where the replay's snapshot comes from. 'auto' (default) stages the recordings in the in-cluster forwarder and pushes them to Speedscale cloud only if staging fails. 'local' stages them in the forwarder and fails instead of falling back, so the replay never touches Speedscale cloud. 'cloud' skips staging and pushes the recordings to Speedscale cloud, which needs a login. 'local' cannot be combined with 'snapshot_id', which names a snapshot already in the cloud. This only chooses where the snapshot lives; to run the whole replay through Speedscale cloud with no kubeconfig, use the cloud_replay tool. |
| `tail_lines` | number | no | action=logs: read only the last N lines of each pod log. |
| `target` | string | no | action=replay-start: replay against this address instead of a cluster workload. Nothing in the cluster is modified and nothing can be mocked. Mutually exclusive with 'workload'. |
| `test_config` | string | no | action=replay-start: a test config authored in this workspace (proxymock/testconfigs/&lt;name&gt;.json; create and edit one with the test_config tool), or a path to a config JSON file. It is compiled and staged in the in-cluster forwarder alongside the snapshot, so the replay runs it without any Speedscale cloud round-trip. This is how responder replicas and resources get set on a cloud-free replay. Fields the in-cluster path does not honour are reported rather than silently dropped. Omit for the built-in regression config (maintained by Speedscale, read-only), which is staged the same way. A workspace config cannot be combined with 'snapshot_id', which skips the staging this rides on. |
| `tls_out` | boolean | no | Sidecar inject only: unwrap outbound TLS so encrypted upstream calls are captured. Leave unset to keep whatever the workload's own annotations say; passing false turns it off. |
| `wait` | boolean | no | Sidecar inject/uninject only: wait for the rollout to finish, and on inject verify the sidecar came up, before returning. Defaults to true: a sidecar only joins a pod at creation, so returning early would report success for a workload that is not capturing yet. Pass false for a fire-and-forget change. |
| `workload` | string | no | Name of the workload to target. Required for the capture actions, 'logs', 'events' and 'dependencies'; on 'replay-start' it selects the system under test; on 'pods' it narrows the listing. List the options with action='workloads'. |
| `workload_type` | string | no | Workload kind: deployment (default), statefulset, daemonset, replicaset, job or rollout. On replay-start it is also the default kind of every 'routes' workload, and it is refused with 'target', which has no workload. This path takes 'job' and not 'service' because a TrafficReplay references the workload object itself (a Job is one, a Service is not); the cloud_replay tool is the reverse, because the cloud resolves a system under test to a long-running workload or a Service. |

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

Trigger these explicitly. Many clients surface them as slash commands.

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

Pull a replay report and iteratively tune the workspace's mock blueprints (analyze, accept filter-scoped fixes, re-analyze) until the projected mock match rate is as high as it can get.

Try saying: "improve match rate", "mock match rate", "tune mocks", "fix mock matching", "increase match rate", "improve mocks", "tune blueprints"

## Resources

The server exposes recorded artifacts as read-only resources the assistant can read for context:

- **`rrpair://{path}`**: recorded request/response pair files from the workspace.
- **`report://{path}`**: report artifacts (digest, section JSON, fix prompts) produced by the `generate_report` tool.

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
