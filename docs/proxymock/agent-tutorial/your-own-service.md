---
title: "Agent tutorial 8: do it to your own service"
description: "Your coding agent uses the quality-loop skill to record a service it has not seen before, tune the replay and the mocks, and leave a regression test script you run before every change."
sidebar_position: 9
unlisted: true
---

# Chapter 8: Do it to your own service

Your agent runs the whole loop from chapters 3 to 6 on a service it has not seen: record it, tune the replay and the mocks, and leave a regression test you can run before every change.

Time: about 5 minutes.

## Prompt

This prompt uses the mock-lab Go demo app as a stand-in for your service. To run it on your own service, replace `mock-lab/languages/go` with your service's directory.

```text
Now treat mock-lab/languages/go as my own service. Use the quality-loop skill to record it, tune the replay and the mocks, and leave me a regression test I can run before every change.
```

## What the agent does

The `quality-loop` skill is the starting point for a service with no recording yet. It picks the other skills in order:

- Runs the skill's environment check (`quality-loop.sh doctor`): proxymock version, existing recordings and blueprints, and free ports.
- Reads the service to learn how it starts, what it calls and what it generates. This service has no database, calls the CNCF projects API (`DOWNSTREAM_URL`), and mints an `access_token` and an `order_id` on every run.
- Writes a traffic script when the service has none. Here it wrote `scripts/traffic.sh`, which sends 14 requests covering every route, the token and order flow, and the 400, 401 and 404 error paths.
- Records with `proxymock record` while the script runs, then replays behind `proxymock mock` and measures accuracy and the mock match rate.
- Checks that the service's committed blueprint is needed by moving it aside for one run, then tunes a strict test config (`go-service`, from `standard`) with `proxymock drift`, one change per run.
- Writes `scripts/regression-test.sh` and proves it: it passes on the current code, then fails with exit code 3 when the agent plants a one-word change, and the agent restores the code.

## What you should see

The tuning runs:

| Run | Accuracy | Mock match | Assertions passed (`go-service`) | Change |
| --- | --- | --- | --- | --- |
| Baseline | 100% | 100% (10/10) | - | Default scoring, committed blueprint loaded |
| Blueprint moved aside | 61.1% | 100% | - | Every auth and order call returned 401 on the stale recorded token. Blueprint restored |
| Strict config | 100% | 100% | 87.04% | `go-service` created from `standard` |
| | 100% | 100% | 90.74% | Body ignores `ts`, `created` |
| | 100% | 100% | 100% (54/54) | Body also ignores `order_id`, `access_token` |

The gate on a planted change (`status` changed from `"created"` to `"placed"`). Trimmed:

```text
NEW MISMATCH: POST /api/orders status 201, body status created -> placed
NEW MISMATCH: GET /api/orders/order-dacf472b4b1ae3a8 status 200, body status created -> placed
...
 FAIL passAssertPct >= 100 - observed 92.59 (counts assertions, not requests: ...)
== regression gate exit 3 (verdict: proxymock/results/regress-2026-10-01_14-26-09/replay-verdict.json)
```

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** quality-loop "own service" flow on mock-lab/languages/go, all 4 steps: doctor (healthy), record (scripts/traffic.sh via :4143), replay tuning (5 runs + 1 ablation, test config go-service) and mock check, regression gate created and proven against a planted change
- **Outcome:** gate created — baseline PASS (exit 0); planted status change caught (exit 3, 4 NEW MISMATCH)
- **Numbers:** 18 inbound + 10 outbound pairs recorded; accuracy 100%, measured match 100% (10/10, 0 passthrough); go-service passAssertPct 87.04 → 100 (54/54)
- **Artifacts:** languages/go/proxymock/recorded-baseline/, proxymock/testconfigs/go-service.json, proxymock/results/regress-base/, proxymock/tuning/LOOP.md, scripts/traffic.sh, scripts/regression-test.sh (gate command: `scripts/regression-test.sh`)
- **Next:** proxymock-chaos-mock — "chaos-test /v1/inventory in mock-lab/languages/go with a 503 rule and check the retry loop survives"
```

Run `scripts/regression-test.sh` before each change. The first run creates the baseline, every later run is gated against it, and `--rebase` re-creates the baseline after an intended change. Exit code 0 is a pass, 1 is a failed check or a broken run, and 3 is a new mismatch against the baseline.

## If it goes wrong

- **Replayed calls fail with 401.** The replay sends the stale token from the recording. The service needs a blueprint that carries the newly issued token into later requests, as the demo app's committed blueprint does. See [Create and verify blueprints](../guides/blueprints.md).
- **A replay with mismatches still exits 0.** Without a test config and a baseline, a replay does not fail on mismatches. The generated script uses both.
- **Your teammates do not get the recording.** Check `.gitignore` before you commit. mock-lab ignores `proxymock/recorded-baseline/`, so the agent listed the new files to commit and left the choice of a `.gitignore` exception to you.
- **The recording holds sensitive values.** Check it before you commit it. In the demo the only sensitive-looking values were the app's own random demo tokens in 7 `Authorization` headers.

See [Gate CI on replay results](../guides/replay-verdicts.md) and [CI/CD](../guides/cicd.md) to run the gate in a pipeline.

<details>
<summary>Manual equivalent</summary>

```bash
cd mock-lab/languages/go

# Record while your traffic script runs against proxymock's inbound port 4143
proxymock record --out proxymock/recorded-baseline --app-port 8080 --app-health-endpoint / -- go run .
scripts/traffic.sh http://localhost:4143    # second terminal

# Replay with the dependencies mocked
proxymock mock --in proxymock/recorded-baseline --app-health-endpoint / -- go run .
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080
proxymock replay score proxymock/results/<replayed-run>

# Strict test config, tuned with drift between two replays of the same code
proxymock test-config new go-service --from standard
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 --test-config go-service
proxymock drift --source proxymock/results/<replayed-run-1> --source proxymock/results/<replayed-run-2> --sensitivity strict

# The gate the script runs: a baseline once on known-good code, then every change against it
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --test-config go-service --out proxymock/results/regress-base
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --test-config go-service --baseline proxymock/results/regress-base --fail-on-new-mismatch
```

</details>

## Where to go next

- The [agent skills](../how-it-works/agent-skills.md) page lists every skill, including chaos, contract and verify-fix testing.
- [Model Context Protocol (MCP)](../how-it-works/mcp.md) explains the proxymock MCP server your agent uses.
- [Choose replay tests](../guides/choose-replay-tests.md) compares the ways to test with recorded traffic.
