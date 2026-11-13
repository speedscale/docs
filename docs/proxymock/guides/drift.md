---
title: Find What Changes Between Runs
description: "Use proxymock drift to find the fields whose values change from run to run, and response-diff to compare two runs' responses with that noise filtered out, so real regressions stand out from timestamps and ids."
sidebar_position: 11.5
---

# Find What Changes Between Runs

Record the same flow twice and the responses will not be identical. Timestamps move, ids are new, trace headers change. Diff the two runs naively and every real change is buried under that noise; ignore whole responses and you miss the real change.

proxymock has two tools for this:

- **`proxymock drift`** finds the fields whose values change between runs, so you know what to ignore when matching mocks or writing assertions.
- **`proxymock automation response-diff`** compares two runs' responses on the fields that should be stable, and reports what actually changed.

Both work on HTTP and gRPC traffic in RRPair directories: recordings, replay results, or a mix.

## Find the fields that drift

Pass two or more sources. A source is an RRPair directory or a single JSONL file, such as a snapshot's `raw.jsonl` or a report's `raw_rr.jsonl`. A recording and a replay of it is the most common pair:

```shell
proxymock drift \
  --source ./proxymock/recorded-<timestamp> \
  --source ./proxymock/results/replayed-<timestamp> \
  --out drift.json
```

proxymock pairs the requests across the sources: a replayed request with the recorded request it came from, and otherwise requests to the same endpoint in the order they happened. It then walks every field of each pair, the method, URL path segments, query parameters, headers, the response status code, and every JSON leaf of the request and response bodies, and reports each field whose value differs within a pair.

Each entry in the report names the field location, the endpoints it appeared on, whether it was inbound or outbound, how many distinct values it took, up to five sample values, and example RRPairs. Drift does not guess what a value is; it reports that the value moved and lets you decide whether it is noise.

`--sensitivity` sets how much movement counts:

| Sensitivity | Reports a field when |
|---|---|
| `permissive` | It changed in at least one pair |
| `normal` (default) | It changed in more than one pair |
| `strict` | It took three or more values across more than one pair |

Start with `normal`. Use `permissive` with only two runs to see everything, and `strict` across many runs to keep only fields that move every time.

The command writes JSON to stdout, or to the `--out` file. It exits 0 whether or not anything drifted, so it reports rather than gates. Responses the mock server changed with [chaos rules](/concepts/chaos.md) are left out by default, because an injected 503 is not drift; `--include-chaos-affected` keeps them.

### Use what drift finds

- **Mocks that miss.** A request field that drifts, such as a nonce in the body, makes recorded mocks miss. For body fields and headers, each entry includes a ready-made transform that wildcards the field in the mock signature. The [Mocks view and the match-rate tools](./mock-match-rate.md) find and fix the same misses for you.
- **Assertions that fail on noise.** A response field that drifts between two replays of the same recording, on unchanged code, is noise. Leave it out of your replay assertions.
- **Two replays that should agree.** Run drift over the results of several replays of one recording. Anything that drifts there is nondeterminism in your service or its data, not a code change.

### In proxymock web

On the Requests view, open **Actions** and choose **Compare traffic for drift**. Pick two or more runs and proxymock web lists each drifting field with its sample values. Accepting a field writes an active blueprint that wildcards it in the mock signature, named after the field, so the next mocked run stops missing on it.

## Compare two runs' responses

`response-diff` answers "what changed in the responses?" between a baseline run and a newer one:

```shell
proxymock automation response-diff \
  --baseline ./proxymock/recorded-<timestamp> \
  --candidate ./proxymock/results/replayed-<timestamp>
```

It pairs each baseline response with its twin in the candidate run, the same way drift does. Before comparing, it learns which response fields are volatile in each run, from two signals:

- **Values that look volatile**: UUIDs, timestamps and dates, trace and span ids, JWTs, hashes, long opaque tokens and prefixed ids such as `cus_...`.
- **Fields that vary on their own**: a field that takes different values across three or more calls to the same endpoint within one run.

Those fields are filtered out, and every other field is compared. Stable personal data such as an email address is still compared, since it should not change. The report lists:

| Kind | Meaning |
|---|---|
| `value_changed` | A stable field has a different value |
| `magnitude` | A number changed by 10x or more, or moved off zero |
| `sign_flip` | A number changed sign |
| `null_flip`, `type_change` | A value became null, or changed type |
| `field_removed`, `field_added` | A field disappeared or appeared |
| `endpoint_gone`, `endpoint_new` | A request appears in only one run |

Findings are ranked regressions first, then removals, then additions. The output is JSON by default. Add `-o pretty` for a readable digest; when nothing changed, it says how many responses were compared and how many volatile fields were filtered.

The command exits 0 whether or not it finds differences, and 2 when either run has no HTTP or gRPC responses to compare, or when every response on one side was changed by chaos rules. `response-diff` from the CLI needs a Speedscale enterprise account; see [Initialize proxymock](./initialize.md#enterprise-account).

## For AI agents

The `detect_drift` and `response_diff` MCP tools run the same analyses. `response_diff` can also score how similar each pair of responses is in meaning, which helps with prose or LLM-generated responses; see [Compare Response Meaning](./semantic-comparison.md). Parameters are in the [MCP tools reference](../how-it-works/mcp-tools.md).

## Which comparison to use

| Question | Use |
|---|---|
| Which fields change between runs? | `proxymock drift` |
| What changed in the responses, ignoring noise? | `proxymock automation response-diff` |
| Did a replay pass, and is this failure new? | `replay-verdict.json` and `--baseline --fail-on-new-mismatch`; see [Gate CI on Replay Results](./replay-verdicts.md) |
| How did latency, errors and security findings move? | `proxymock report --baseline`, or **Compare** on the Report view in proxymock web |
| What exactly differs between two RRPairs? | `proxymock files compare`, a raw diff with no filtering |

The replay verdict uses the same volatile-field learning as `response-diff` for response bodies, so a replay does not fail on a timestamp.
