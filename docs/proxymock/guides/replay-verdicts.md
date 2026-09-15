---
title: Gate CI on Replay Results
description: Use proxymock replay verdicts, baseline regression gates, and fix verification to decide whether a CI run passes.
sidebar_position: 10
---

# Gate CI on Replay Results

A replay can finish sending requests while the application returns the wrong result. Standard replay writes `replay-verdict.json` in its output directory so you can inspect the overall verdict and each request's result. Choose a gate explicitly when a mismatch should fail CI.

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
  --fail-if 'latency.p99 > 500'
```

Use the actual blueprint name. A violated `--fail-if` condition exits `1`. These metrics and blueprint checks answer different questions from the per-pair verdict; requiring a blueprint proves that at least one of its chains ran, not that the response was correct.

## Output and load-mode limits

Baseline, fix-verification, and [semantic comparison](./semantic-comparison.md) need response output. They cannot run with `--no-out` or `--load-test`. High-throughput load mode also omits `requests.result-match-pct` and cannot verify blueprint activity.

Keep CI artifacts from failed runs so you can inspect the request, observed response, and verdict together. Do not use the global `--exit-zero` option in a job that relies on exit codes. See the [CI/CD guide](./cicd.md) for pipeline setup and the [CLI reference](/reference/proxymock-cli-reference.md#replay) for options.
