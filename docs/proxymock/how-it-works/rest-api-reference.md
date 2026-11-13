---
title: "REST API Reference"
description: "Every stable operation of the proxymock REST API, its request fields and its result, generated from the OpenAPI document."
sidebar_position: 8
---

# REST API Reference

> **Generated file: do not edit by hand.** Run `proxymock mcp openapi --markdown` to regenerate it.

This is version 1.0.0 of the stable API that `proxymock mcp run --http` serves under `/v1`. How to start the server, authenticate and use jobs is in [REST API for CI and scripts](../guides/rest-api.md). The machine-readable contract is the [OpenAPI document](pathname:///proxymock/openapi-v1.json), also served at `GET /v1/openapi.json`. A running server also serves an interactive version of this page at `/v1/docs`, where you can send requests from the browser.

Every operation is a `POST` with a JSON object body. Unknown fields are rejected with `400`. Operations marked **job** answer `202` with a [job](#jobs) and put their result in the job's `result` field.

## Snapshots

### `POST /v1/snapshots/list`

**List snapshots** (`snapshots.list`).

Lists stored snapshots, newest first, in Speedscale cloud or in a bucket.

| Field | Type | Required | Description |
|---|---|---|---|
| `search` | string |  | Match snapshot names containing this text. |
| `service` | string |  | Only snapshots with traffic for this service. |
| `tag` | string |  | Only snapshots with this build tag. |
| `limit` | number |  | Maximum snapshots to return (default 20, max 100). |
| `bucket` | string |  | Use this bucket instead of Speedscale cloud. Credentials come from the standard AWS chain (S3) or Google Application Default Credentials (GCS). No Speedscale account is needed. |
| `bucketProvider` | string |  | Bucket storage provider: s3 (default) or gcs. |
| `bucketPrefix` | string |  | Key prefix in the bucket. proxymock only writes and deletes under it. |
| `region` | string |  | Bucket region. Defaults to the AWS SDK configuration. |
| `s3EndpointUrl` | string |  | Endpoint of an S3-compatible store such as MinIO. Empty for AWS S3. |
| `s3ForcePathStyle` | boolean |  | Use path-style S3 addressing, often needed for MinIO. |

Answers `200` with a [SnapshotListResult](#snapshotlistresult).

### `POST /v1/snapshots/push`

**Push a snapshot** (`snapshots.push`). **Job.**

Uploads local RRPair directories as one new snapshot. Runs as a job.

| Field | Type | Required | Description |
|---|---|---|---|
| `inDirectories` | array of string | yes | Directories of RRPair files to upload, read recursively. |
| `name` | string |  | Display name for the snapshot. |
| `sample` | string |  | Keep a deterministic fraction of the traffic, whole sessions at a time: "20%", "1/5" or "1 in 5". |
| `maxRRPairs` | number |  | Above this many RRPairs, narrow the push to a representative time window that fits. |
| `bucket` | string |  | Use this bucket instead of Speedscale cloud. Credentials come from the standard AWS chain (S3) or Google Application Default Credentials (GCS). No Speedscale account is needed. |
| `bucketProvider` | string |  | Bucket storage provider: s3 (default) or gcs. |
| `bucketPrefix` | string |  | Key prefix in the bucket. proxymock only writes and deletes under it. |
| `region` | string |  | Bucket region. Defaults to the AWS SDK configuration. |
| `s3EndpointUrl` | string |  | Endpoint of an S3-compatible store such as MinIO. Empty for AWS S3. |
| `s3ForcePathStyle` | boolean |  | Use path-style S3 addressing, often needed for MinIO. |

The job's `result` is a [SnapshotPushResult](#snapshotpushresult).

### `POST /v1/snapshots/pull`

**Pull a snapshot** (`snapshots.pull`). **Job.**

Downloads a stored snapshot into local RRPair files that can be replayed and mocked. Runs as a job.

| Field | Type | Required | Description |
|---|---|---|---|
| `snapshotId` | string | yes | ID of the snapshot to pull. |
| `outDirectory` | string |  | Workspace directory to expand the snapshot into. Defaults to ./proxymock. |
| `force` | boolean |  | Overwrite test configs in the workspace that differ from the snapshot's. |
| `bucket` | string |  | Use this bucket instead of Speedscale cloud. Credentials come from the standard AWS chain (S3) or Google Application Default Credentials (GCS). No Speedscale account is needed. |
| `bucketProvider` | string |  | Bucket storage provider: s3 (default) or gcs. |
| `bucketPrefix` | string |  | Key prefix in the bucket. proxymock only writes and deletes under it. |
| `region` | string |  | Bucket region. Defaults to the AWS SDK configuration. |
| `s3EndpointUrl` | string |  | Endpoint of an S3-compatible store such as MinIO. Empty for AWS S3. |
| `s3ForcePathStyle` | boolean |  | Use path-style S3 addressing, often needed for MinIO. |

The job's `result` is a [SnapshotPullResult](#snapshotpullresult).

### `POST /v1/snapshots/delete`

**Delete a snapshot** (`snapshots.delete`).

Deletes a stored snapshot. This cannot be undone, so confirm must be true.

| Field | Type | Required | Description |
|---|---|---|---|
| `snapshotId` | string | yes | ID of the snapshot to delete. |
| `confirm` | boolean | yes | Must be true. |
| `bucket` | string |  | Use this bucket instead of Speedscale cloud. Credentials come from the standard AWS chain (S3) or Google Application Default Credentials (GCS). No Speedscale account is needed. |
| `bucketProvider` | string |  | Bucket storage provider: s3 (default) or gcs. |
| `bucketPrefix` | string |  | Key prefix in the bucket. proxymock only writes and deletes under it. |
| `region` | string |  | Bucket region. Defaults to the AWS SDK configuration. |
| `s3EndpointUrl` | string |  | Endpoint of an S3-compatible store such as MinIO. Empty for AWS S3. |
| `s3ForcePathStyle` | boolean |  | Use path-style S3 addressing, often needed for MinIO. |

Answers `200` with a [SnapshotDeleteResult](#snapshotdeleteresult).

## Mocks

### `POST /v1/mocks/start`

**Start the mock server** (`mocks.start`).

Starts the mock server on the outbound proxy port and answers once it is ready. Point the application under test at it with the returned environment variables. Passthrough is off: a call with no recorded response gets a 404 instead of reaching the live dependency. One mock server runs at a time.

| Field | Type | Required | Description |
|---|---|---|---|
| `inDirectories` | array of string | yes | Directories of recorded RRPairs to answer from. |
| `outDirectory` | string |  | Directory to write the traffic the mock server served to. Score the replay's outbound calls from it. |
| `mockTiming` | string |  | Response timing: none, recorded, or a fixed duration. |
| `faults` | array of string |  | Fault specs, '&lt;regexp&gt;:action=value[,...]'. |
| `chaos` | array of string |  | Chaos specs, '&lt;filter query&gt;:&lt;effect&gt;=&lt;value&gt;[,...]'. |
| `responseSelection` | string |  | How to pick among several recorded responses for one request. |

Answers `200` with a [MockServerResult](#mockserverresult).

### `POST /v1/mocks/stop`

**Stop the mock server** (`mocks.stop`).

Stops the running mock server.

No request fields; send an empty body.

Answers `200` with a [MockServerResult](#mockserverresult).

## Replays

### `POST /v1/replays/run`

**Run a replay** (`replays.run`). **Job.**

Replays recorded traffic against the application under test and scores the result. Runs as a job; the job's result has passed=false when a test config goal is missed or a fail-if condition triggers. One replay runs at a time.

| Field | Type | Required | Description |
|---|---|---|---|
| `inDirectories` | array of string | yes | Directories of recorded RRPairs to replay. |
| `testAgainst` | array of string |  | Where to send the requests: a URL, or host=URL pairs to route each recorded host. |
| `outDirectory` | string |  | Directory to write the observed traffic and replay-verdict.json to. Required unless noOut is true. |
| `noOut` | boolean |  | Write nothing to disk. The result then has no score. |
| `testConfig` | string |  | Test config ID from the workspace: load shape, goals and assertions. |
| `failIf` | array of string |  | Fail conditions such as "requests.failed &gt; 0". |
| `rewriteHost` | boolean |  | Rewrite the Host header to the testAgainst host. |
| `testsFilter` | string |  | Filter query selecting which recorded requests to replay. |
| `vus` | number |  | Virtual users replaying in parallel. |
| `sessions` | number |  | Sessions to replay in parallel. |
| `for` | string |  | Keep replaying for this long, e.g. "5m". |
| `times` | number |  | Replay the traffic this many times. |
| `stages` | array of string |  | Load stages such as "30s:10" (duration:virtual users). |
| `loadTest` | boolean |  | Load-test mode: skip response comparison to drive more load. |
| `baseline` | string |  | Output directory of an earlier replay to compare with. |
| `failOnNewMismatch` | boolean |  | Fail when a response differs that matched in the baseline. |
| `verifyFix` | boolean |  | Fail unless the responses that differed now match. |
| `expect` | string |  | With verifyFix: a pattern the fixed requests must match. |
| `ignoreBodyChanges` | boolean |  | Compare status codes only, not bodies. |
| `semantic` | boolean |  | Score response bodies by semantic similarity. |
| `semanticPass` | number |  | With semantic: the similarity, 0 to 1, at or above which a body passes. |
| `semanticFail` | number |  | With semantic: the similarity, 0 to 1, below which a body fails. |
| `requireBlueprints` | array of string |  | Tuning blueprints that must apply during the replay. |

The job's `result` is a [ReplayRunResult](#replayrunresult).

### `POST /v1/replays/score`

**Score a replay** (`replays.score`).

Scores a finished replay: accuracy, mock match rate, goals and the outbound HTTP assertion. Takes a local replay output directory or a pulled cloud report.

| Field | Type | Required | Description |
|---|---|---|---|
| `input` | string | yes | A replay output directory holding replay-verdict.json, a pulled report ID, or a pulled workspace. |
| `baseline` | string |  | An earlier replay or report to compare with. |
| `workspace` | string |  | Directory a bare report ID is looked up in. |
| `mockRun` | string |  | The mocked-* run that served the replay, when the time-overlap pairing picks the wrong one. |
| `mocksOut` | string |  | The mock server's outDirectory, to score the outbound HTTP assertion. |

Answers `200` with a [ReplayScore](#replayscore).

## Jobs

A job is a long-running operation. It lives in the server process and ends with it.

| Call | What it does |
|---|---|
| `GET /v1/jobs/{id}` | The job. Add `?wait=<seconds>` (at most 600) to block until it finishes. Answers `202` while it runs and `200` once it is done. |
| `POST /v1/jobs/{id}/cancel` | Stops a running job. A replay's process is killed. |
| `GET /v1/jobs` | Every job this server has run, newest first. The latest 100 finished jobs are kept. |

### Job

| Field | Type | Description |
|---|---|---|
| `created` | string (date-time) |  |
| `error` (optional) | string |  |
| `errorCode` (optional) | string |  |
| `finished` (optional) | string (date-time) |  |
| `id` | string |  |
| `operation` | string | operationId of the call that started the job, e.g. replays.run. |
| `result` (optional) | any |  |
| `status` | string |  |

## Errors

Every error answers with a JSON body that has an `error` message and, except for the access guard's `401` and `403`, a `code`.

| Status | Code | Meaning |
|---|---|---|
| 400 | `invalid_request` | The body or a query parameter is not valid for the operation. |
| 401 | | The access token is missing or wrong. |
| 403 | | The Host or Origin header names another site. |
| 404 | `not_found` | No such operation or job. |
| 409 | `conflict` | A mock server or a replay is already running. |
| 422 | `tool_error` | The request was valid, but the operation failed. The message says why. |
| 500 | `internal` | An unexpected server error. |

## Result types

The results of the operations above and the types they use. New fields can appear in a minor version, so ignore fields you do not know.

### MockServerResult

| Field | Type | Description |
|---|---|---|
| `env` (optional) | map of string | Environment variables that point an application at the mock server. |
| `inDirectories` (optional) | array of string | Directories the mock responses come from. |
| `outDirectory` (optional) | string | Directory the mock server writes the traffic it served to. |
| `proxyUrl` (optional) | string | Outbound proxy the application under test must send its dependency calls through. |
| `running` | boolean | Whether the mock server is running after the call. |

### MocksSQLCorrectness

| Field | Type | Description |
|---|---|---|
| `bindDrift` | integer |  |
| `checked` | integer |  |
| `exact` | integer |  |
| `fallback` | integer |  |
| `fallbackByTier` (optional) | map of integer |  |
| `orderDependent` (optional) | integer |  |
| `statements` (optional) | array of [MocksSQLStatement](#mockssqlstatement) |  |
| `unverified` (optional) | integer |  |
| `writesWithNewValues` (optional) | integer |  |

### MocksSQLStatement

| Field | Type | Description |
|---|---|---|
| `applied` (optional) | boolean |  |
| `bindDrift` | integer |  |
| `exact` | integer |  |
| `fallback` | integer |  |
| `keyParams` (optional) | array of integer |  |
| `orderDependent` (optional) | integer |  |
| `reason` (optional) | string |  |
| `recommendationId` (optional) | string |  |
| `service` | string |  |
| `statement` | string |  |

### ProcessLogs

| Field | Type | Description |
|---|---|---|
| `stderr` (optional) | string |  |
| `stdout` (optional) | string |  |

### ReplayRunResult

| Field | Type | Description |
|---|---|---|
| `exitCode` | integer | Exit code of proxymock replay. 0 passed; 1 means a test config goal was missed, a fail-if condition triggered, or the replay failed. |
| `logs` | [ProcessLogs](#processlogs) |  |
| `outDirectory` (optional) | string | Directory the observed traffic and replay-verdict.json were written to. |
| `passed` | boolean | True when exitCode is 0. Fail the CI job when this is false. |
| `score` (optional) | [ReplayScore](#replayscore) | The replay scored as replays.score scores it. |
| `scoreError` (optional) | string |  |

### ReplayScore

| Field | Type | Description |
|---|---|---|
| `accuracy` | [ScoreAccuracy](#scoreaccuracy) |  |
| `baseline` (optional) | [ReplayScore](#replayscore) |  |
| `deltas` (optional) | [ScoreDeltas](#scoredeltas) |  |
| `goals` | [ScoreGoals](#scoregoals) |  |
| `httpOutput` (optional) | [ScoreHttpOutput](#scorehttpoutput) |  |
| `input` | [ScoreInput](#scoreinput) |  |
| `matchRate` | [ScoreMatchRate](#scorematchrate) |  |
| `notes` (optional) | array of string |  |
| `sources` | map of string |  |

### ScoreAccuracy

| Field | Type | Description |
|---|---|---|
| `bodyMismatches` | integer |  |
| `matched` | integer |  |
| `mismatches` | integer |  |
| `pairs` | integer |  |
| `rate` | number |  |
| `reportSuccessRate` (optional) | number |  |
| `statusMismatches` | integer |  |
| `topFailingEndpoints` | array of [ScoreEndpointFailures](#scoreendpointfailures) |  |
| `unpaired` (optional) | integer |  |

### ScoreAccuracyDeltas

| Field | Type | Description |
|---|---|---|
| `bodyMismatches` | integer |  |
| `matched` | integer |  |
| `mismatches` | integer |  |
| `pairs` | integer |  |
| `rate` | number |  |
| `statusMismatches` | integer |  |

### ScoreDeltas

| Field | Type | Description |
|---|---|---|
| `accuracy` (optional) | [ScoreAccuracyDeltas](#scoreaccuracydeltas) |  |
| `goals` (optional) | [ScoreGoalDeltas](#scoregoaldeltas) |  |
| `matchRate` (optional) | [ScoreMatchRateDeltas](#scorematchratedeltas) |  |

### ScoreEndpointFailures

| Field | Type | Description |
|---|---|---|
| `bodyMismatches` | integer |  |
| `endpoint` | string |  |
| `failures` | integer |  |
| `method` (optional) | string |  |
| `statusMismatches` | integer |  |

### ScoreGoal

| Field | Type | Description |
|---|---|---|
| `condition` | string |  |
| `metric` | string |  |
| `name` | string |  |
| `observed` (optional) | string |  |
| `reason` (optional) | string |  |
| `status` | string |  |

### ScoreGoalDeltas

| Field | Type | Description |
|---|---|---|
| `failed` | integer |  |
| `passed` | integer |  |
| `verdictChanged` (optional) | string |  |

### ScoreGoals

| Field | Type | Description |
|---|---|---|
| `failed` | integer |  |
| `goals` | array of [ScoreGoal](#scoregoal) |  |
| `notEvaluated` (optional) | integer |  |
| `passed` | integer |  |
| `verdict` | string |  |

### ScoreHostCount

| Field | Type | Description |
|---|---|---|
| `count` | integer |  |
| `host` | string |  |

### ScoreHttpOutput

| Field | Type | Description |
|---|---|---|
| `differences` (optional) | map of integer |  |
| `reason` (optional) | string |  |
| `status` | string |  |

### ScoreInput

| Field | Type | Description |
|---|---|---|
| `kind` | string |  |
| `path` | string |  |
| `reportId` (optional) | string |  |
| `status` (optional) | string |  |
| `workspace` (optional) | string |  |

### ScoreMatchRate

| Field | Type | Description |
|---|---|---|
| `analysis` (optional) | [ScoreMatchRateAnalysis](#scorematchrateanalysis) |  |
| `matched` | integer |  |
| `mockRun` (optional) | string |  |
| `mockRunSelection` (optional) | string |  |
| `noMatch` | integer |  |
| `noMatchRate` | number |  |
| `passthrough` | integer |  |
| `passthroughRate` | number |  |
| `rate` | number |  |
| `topMissingHosts` | array of [ScoreHostCount](#scorehostcount) |  |
| `topMissingSignatures` | array of [ScoreMissingSignature](#scoremissingsignature) |  |
| `total` | integer |  |

### ScoreMatchRateAnalysis

| Field | Type | Description |
|---|---|---|
| `blueprintsApplied` | integer |  |
| `projectedMatched` | integer |  |
| `projectedMisses` (optional) | array of [ScoreMissingSignature](#scoremissingsignature) |  |
| `projectedNoMatch` | integer |  |
| `projectedRate` | integer |  |
| `reportMatched` | integer |  |
| `reportNoMatch` | integer |  |
| `reportRate` | integer |  |
| `sqlCorrectness` (optional) | [MocksSQLCorrectness](#mockssqlcorrectness) |  |
| `total` | integer |  |

### ScoreMatchRateDeltas

| Field | Type | Description |
|---|---|---|
| `matched` | integer |  |
| `noMatch` | integer |  |
| `noMatchRate` | number |  |
| `passthrough` | integer |  |
| `passthroughRate` | number |  |
| `rate` | number |  |
| `total` | integer |  |

### ScoreMissingSignature

| Field | Type | Description |
|---|---|---|
| `command` (optional) | string |  |
| `count` | integer |  |
| `host` (optional) | string |  |
| `path` | string |  |

### SnapshotDeleteResult

| Field | Type | Description |
|---|---|---|
| `deleted` | boolean |  |
| `destination` | string |  |
| `id` | string |  |

### SnapshotListResult

| Field | Type | Description |
|---|---|---|
| `destination` | string | Where the snapshots are stored: cloud or a bucket location. |
| `snapshots` | array of [SnapshotSummary](#snapshotsummary) | Snapshots, newest first. |

### SnapshotPullResult

| Field | Type | Description |
|---|---|---|
| `directory` | string | Directory holding the snapshot's RRPair files. |
| `id` | string |  |
| `name` (optional) | string |  |
| `services` (optional) | array of string |  |
| `source` | string | Where it was pulled from: cloud or a bucket location. |
| `testConfigs` (optional) | array of string | Test configs restored into the workspace. |
| `warnings` (optional) | array of string |  |
| `workspace` | string | Workspace root to replay or mock against. |

### SnapshotPushResult

| Field | Type | Description |
|---|---|---|
| `cloudAnalysisPending` | boolean | True for a cloud snapshot: it becomes replayable in the cloud when analysis completes. |
| `destination` | string | Where it was stored: cloud or a bucket location. |
| `id` | string | ID of the new snapshot. |
| `name` (optional) | string |  |
| `rrpairs` | integer | Number of RRPairs uploaded. |
| `services` (optional) | array of string |  |
| `testConfigs` (optional) | array of string | Test configs uploaded with the snapshot. |
| `url` (optional) | string | Dashboard URL for a cloud snapshot, or the object location for a bucket. |
| `warnings` (optional) | array of string |  |
| `window` (optional) | [SnapshotWindow](#snapshotwindow) | Set when maxRRPairs narrowed the push to a time window. |

### SnapshotSummary

| Field | Type | Description |
|---|---|---|
| `buildTag` (optional) | string | Build tag the snapshot was recorded with. |
| `created` (optional) | string (date-time) | When the snapshot was created. |
| `id` | string | Snapshot ID. |
| `name` (optional) | string | Display name, when one was given. |
| `services` (optional) | array of string | Services with traffic in the snapshot. |
| `status` (optional) | string | Cloud analysis status, e.g. COMPLETE. |

### SnapshotWindow

| Field | Type | Description |
|---|---|---|
| `coverage` | number | Fraction of the operations in the full recording that the window covers, 0 to 1. |
| `end` | string (date-time) |  |
| `start` | string (date-time) |  |

