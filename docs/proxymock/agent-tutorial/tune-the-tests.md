---
title: "Agent tutorial 5: tune the tests"
description: "Your coding agent uses the tune-snapshot-replay skill to create a strict test config named tutorial, find the response fields that change on every run with proxymock drift, and ignore them until the replay passes."
sidebar_position: 6
sidebar_label: "5. Tune the tests"
---

# Chapter 5: Tune the tests

Your agent creates a test config that checks every response body, finds the fields that legitimately change on every run, and ignores only those, so the replay passes on unchanged code and fails on a real change.

Time: about 3 minutes.

## Prompt

```text
Use the tune-snapshot-replay skill to create a test config named tutorial from the standard config, then tune it until the replay of the baseline recording passes with the dependencies mocked.
```

## What the agent does

The `tune-snapshot-replay` skill runs a loop: change one thing, re-run the replay, keep the change if the score went up, revert it if not. It saves a checkpoint before each change and logs every run in `proxymock/tuning/LOOP.md`.

- Creates the config with `proxymock test-config new tutorial --from standard`. It is written to `proxymock/testconfigs/tutorial.json` and asserts on status code, headers, cookies, content type and response body, with the goal that every assertion passes (`passAssertPct >= 100`). The built-in default config already ignores values shaped like UUIDs and timestamps. The `standard` config does not, which is why this chapter has work to do.
- Starts the app behind the mocks from chapter 4 and replays with `--test-config tutorial`. The goal fails at 68.63%: 280 of 408 assertions passed.
- Compares the recorded and replayed response bodies and finds that `generated_at` differs on every endpoint and `id` differs on `POST /orders`.
- Confirms both are volatile with `proxymock drift`, which compares two replays of the same code. A field that changes between two runs of unchanged code is safe to ignore.
- Adds `generated_at` to the body assertion's ignore list and re-runs (90.2%), then adds `id` and re-runs (100%, pass). It validates each edit with `proxymock test-config compile tutorial`.

Ignoring `id` only affects the `POST /orders` response, where the order id is new on every run. The later `GET /orders/{id}` responses are still checked in full.

## What you should see

The drift between two replays of the same code. Trimmed:

```text
http.res.bodyBase64.generated_at  {GET /catalog 1},{GET /orders 1},{GET /orders/* 1},{GET /orders/*/status 1},{POST /orders 1}
http.res.bodyBase64.id  {POST /orders 1}
```

Each run:

| Run | Assertions passed (`tutorial`) | Change |
| --- | --- | --- |
| 1 | 68.63% (280/408) | `tutorial` created from `standard` |
| 2 | 90.2% | Body ignores `generated_at` |
| 3 | 100% (408/408), pass | Body ignores `generated_at,id` |

The last replay's goals:

```text
TEST CONFIG GOALS (tutorial)
 PASS passAssertPct >= 100 - observed 100 (counts assertions, not requests: each replayed request carries one assertion per configured type, so this is not the match rate)
 PASS failedVUsers <= 0 - observed 0 (applied to every report by the analyzer)
```

The body assertion in `proxymock/testconfigs/tutorial.json` ends up as:

```json
{"type":"httpResponseBody","config":{"ignore":"generated_at,id"}}
```

The skill's `### Result` block. Trimmed:

```text
### Result
- **Outcome:** pass — ... test config tutorial passAssertPct ... → 100 (408/408 assertions); Status: done
- **Numbers:** accuracy 100%; measured match rate ... 100% (1063/1063, 0 passthrough, SQL 0 bind drift / 0 fallback); ... 0 real SUT findings
- **Artifacts:** proxymock/testconfigs/tutorial.json (httpResponseBody ignore `generated_at,id`), ... proxymock/tuning/LOOP.md, checkpoints in proxymock/tuning/checkpoints/ ...
- **Next:** proxymock-regression-test — "make a regression gate for the tutorial app from recorded-baseline using --test-config tutorial"
```

"0 real SUT findings" means nothing in the app itself behaves differently from the recording.

## If it goes wrong

- **The first replay shows `502 catalog unavailable` on `/catalog` and `POST /orders`.** The mocks are not tuned yet, so the CNCF API calls pass through and fail. The skill hands this to `improve-mock-match-rate`. Run [chapter 4](./tune-the-mocks.md) first: tune the mocks before the tests, or the test config is tuned against broken responses.
- **The observed `passAssertPct` looks different from the match rate.** It counts assertions, not requests: each replayed request carries one assertion per configured type.

See [Configure a replay with test configs](../guides/test-configs.md) for the test config format.

<details>
<summary>Manual equivalent</summary>

Start the app behind the mocks as in [chapter 4](./tune-the-mocks.md), then:

```bash
cd mock-lab/tutorial/go
proxymock test-config new tutorial --from standard

# Replay with the strict config
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 --test-config tutorial

# Run it twice, then list the fields that changed between the two runs
proxymock drift --source proxymock/results/<replayed-run-1> --source proxymock/results/<replayed-run-2> --sensitivity strict

# Ignore the volatile fields in the body assertion and check the config
jq '(.assertionGroups[].configs[] | select(.type == "httpResponseBody")) |= (.config = {ignore: "generated_at,id"})' \
  proxymock/testconfigs/tutorial.json > tutorial.json.new && mv tutorial.json.new proxymock/testconfigs/tutorial.json
proxymock test-config compile tutorial

# Restart the mock and app, then replay again
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 --test-config tutorial
```

</details>

## Next

[Chapter 6: Run a regression test](./regression-test.md)
