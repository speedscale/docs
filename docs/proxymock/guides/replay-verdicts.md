---
title: Gate CI on Replay Results
description: Use proxymock replay verdicts, baseline regression gates, and fix verification to decide whether a CI run passes.
sidebar_position: 10
---

# Gate CI on Replay Results

A replay can finish sending requests while the application returns the wrong result. Standard replay writes `replay-verdict.json` in its output directory so you can inspect the overall verdict and each request's result. Choose a gate explicitly when a mismatch should fail CI.

[Watch replay verdicts on YouTube](https://www.youtube.com/watch?v=0yborMZ4kr4).

<iframe title="Replay verdicts" src="https://www.youtube.com/embed/0yborMZ4kr4?rel=0&modestbranding=1" width="640" height="360" style={{minHeight: 0}} frameBorder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>

Run the examples from your application directory, with the application listening at `http://localhost:8080`. Replace `recorded-example` with a recording that contains inbound requests for it.

## Save a baseline

```shell
proxymock replay \
  --in ./proxymock/recorded-example \
  --test-against http://localhost:8080 \
  --out ./proxymock/results/baseline
```

Keep the output directory, including its observed RRPairs and `replay-verdict.json`. The verdict includes an aggregate result, per-pair findings, and a `gate` object recording whether a gate was enabled and the selected exit code. An ungated mismatch does not by itself make the command fail.

By default, the verdict checks response status and stable response-body changes. Fields learned as volatile from repeated observations are excluded from body differences. `--ignore-body-changes` restricts verdict scoring to status codes; use it only when body correctness is covered separately.

## Fail on a new regression

After changing your app, replay the same recording:

```shell
proxymock replay \
  --in ./proxymock/recorded-example \
  --test-against http://localhost:8080 \
  --out ./proxymock/results/candidate \
  --baseline ./proxymock/results/baseline \
  --fail-on-new-mismatch
```

The gate exits `3` when it finds a new mismatch. A request that failed in the baseline is exempt only from that same failure. A different status or a new stable-body change can still be a regression. Preserve request identities by using the same source recording for the comparison.

## Verify a bug fix

For a recording containing an error you intend to fix:

```shell
proxymock replay \
  --in ./proxymock/recorded-incident \
  --test-against http://localhost:8080 \
  --out ./proxymock/results/fix-check \
  --verify-fix \
  --expect '/checkout'
```

`--expect` is a regular expression selecting recorded-error endpoints. It requires `--verify-fix`. Fix verification interprets a recorded error becoming a successful response as a fix and checks for collateral regressions elsewhere.

| Exit | Fix-verification meaning |
| --- | --- |
| `0` | Fix confirmed without detected collateral regressions |
| `2` | Fix not confirmed, including a bug that still reproduces |
| `3` | Collateral regression detected |

Invalid configuration and operational failures can produce other nonzero results. A recording with no selected recorded-error requests is not evidence of a fix. Do not combine `--verify-fix` with `--fail-on-new-mismatch`.

## Add metric and blueprint requirements

Use `--fail-if` for aggregate metrics and `--require-blueprint` for required transform activity:

```shell
proxymock replay \
  --in ./proxymock/recorded-example \
  --test-against http://localhost:8080 \
  --require-blueprint 'Field Transforms' \
  --fail-if 'requests.failed > 0' \
  --fail-if 'requests.response-match-pct < 100' \
  --fail-if 'latency.p99 > 500'
```

`requests.response-match-pct` is the share of the verdict's pairs that matched, so it fails the run when a response body changes. `requests.result-match-pct` compares status codes only, so a body change does not move it.

To check the calls your service makes to its dependencies, add an [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion to the test config and pass the directory `proxymock mock` wrote while it served the replay:

```shell
proxymock replay \
  --in ./proxymock/recorded-example \
  --test-against http://localhost:8080 \
  --test-config outbound \
  --mocks-out ./proxymock/results/mocked-1
```

A difference from the recorded calls fails the goal verdict and exits `1`, and the differences are written to `http-output-diff.json` in the replay output. `proxymock replay score <replay-dir> --mocks-out <dir>` scores a finished replay the same way.

Use the actual blueprint name. A violated `--fail-if` condition exits `1`. These metrics and blueprint checks answer different questions from the per-pair verdict; requiring a blueprint proves that at least one of its chains ran, not that the response was correct.

## Failure bundles

When a request, a browser journey or a gate fails, the replay writes a `replay-failures` directory beside `replay-verdict.json`. It holds one bundle per distinct failure, written for a coding agent to act on without reading the whole run.

| File | Holds |
| --- | --- |
| `replay-failures/index.json` | The list to read first: every failure with its id, kind, title and likely cause, and the count per cause |
| `replay-failures/<id>.json` | One failure's evidence |
| `replay-failures/<id>.md` | A fix prompt: the same evidence as Markdown, with what to do and how to confirm the fix |

Requests that fail the same way are one failure. The same endpoint, statuses and set of changed fields make one bundle, and `occurrences` counts the requests behind it. A known mismatch, one that fails the same way in `--baseline`, gets no bundle.

### What a bundle holds

A request's bundle names the recorded pair and the replayed pair, the recorded and observed status, and each response field that changed.

It also lists `outboundCalls`: the calls the application made to its dependencies while the request was in flight, each marked `HIT`, `MISS` or `PASSTHROUGH`. They are read from the output of the `proxymock mock` run that overlaps the replay in time. Name that output with `--mocks-out` when it is outside the workspace. With more than one virtual user, a request's calls can include a neighbouring request's.

A journey's bundle names the spec and line, the failed step, every step in order with the calls it made, the calls the recording could not answer, and the paths of the screenshot and trace.

A gate's bundle names the goal or `--fail-if` condition, what it requires and what was observed.

When the replay started the application and wrote its log with `--app-log-to`, the index also holds the last error lines of that log.

### Likely cause

Each bundle sorts its failure into one cause, with the evidence for it in `bucketReason` and what to do in `nextStep`:

| `bucket` | Evidence | What to do |
| --- | --- | --- |
| `sut-regression` | The status changed, or a response field that was stable in the recording changed | Fix the application, or record again if the change is intended |
| `mock-gap` | A dependency call made during the request was a `MISS` or a `PASSTHROUGH`, or a journey made a call the recording could not answer | Record the missing calls, or [tune the mocks](./mock-match-rate.md) |
| `volatile-data` | The application refused the recorded credential with `401` or `403`, or every changed field holds a value that differs on each run | Apply a [recommendation](./recommendations.md) that keeps the value current |
| `environment` | No response came back, or the browser could not reach the frontend | Check that the target is running and reachable |
| `test-config` | A goal or `--fail-if` condition failed while every request replayed as recorded | Check the limit itself |

A cloud replay report names causes with the same rules, on its Accuracy tab. See [Likely cause of a failed request](/guides/reports/README.md#likely-cause-of-a-failed-request).

The cause is read from the evidence, not proven. A gate that fails beside failing requests is marked `sut-regression`, because it most likely reads their result. Fix the requests first.

### Fix prompts

A fix prompt is self-contained. It previews the recorded and replayed request and response with header names only, never header values, and with bodies cut to 1,024 bytes, so it can be handed to a model without carrying a credential or a whole payload. It names both pairs by path for an agent that needs the rest.

It ends with the command that confirms the fix: the same replay again with the failing run as `--baseline` and `--fail-on-new-mismatch`.

A run writes at most 50 bundles. Past that, `index.json` counts the rest in `omitted`. A run with no failures writes no `replay-failures` directory, and removes one an earlier run left in the same output directory.

The same output directory also holds `replay-summary.md`, the result for a person. See [Report the result on the pull request](./cicd.md#report-the-result-on-the-pull-request).

## Output and load-mode limits

Baseline, fix-verification, and [semantic comparison](./semantic-comparison.md) need response output. They cannot run with `--no-out` or `--load-test`. High-throughput load mode also omits `requests.result-match-pct` and `requests.response-match-pct` and cannot verify blueprint activity. `--no-out` omits `requests.response-match-pct` too.

Keep CI artifacts from failed runs so you can inspect the request, observed response, and verdict together. Do not use the global `--exit-zero` option in a job that relies on exit codes. See the [CI/CD guide](./cicd.md) for pipeline setup and the [CLI reference](/reference/proxymock-cli-reference.md#replay) for options.
