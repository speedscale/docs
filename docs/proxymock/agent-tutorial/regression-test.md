---
title: "Agent tutorial 6: run a regression test"
description: "Your coding agent uses the proxymock-regression-test skill to replay the baseline recording at a changed build of the tutorial app, explain what broke, and confirm the original build passes."
sidebar_position: 7
sidebar_label: "6. Regression test"
---

# Chapter 6: Run a regression test

Your agent replays the recording at a changed version of the app, reports what broke, then confirms the original version passes.

Time: about 1 to 2 minutes.

## Prompt

```text
Restart the tutorial app with APP_VERSION=v2 and use the proxymock-regression-test skill with the tutorial test config against the baseline. Tell me what broke. Then restart it without APP_VERSION and confirm it passes.
```

## What the agent does

The `proxymock-regression-test` skill:

- Starts the unchanged app (v1) behind the mocks and replays with `--test-config tutorial --out proxymock/results/regress-base`. This known-good run is the baseline.
- Restarts the app with `APP_VERSION=v2` and replays again with `--baseline proxymock/results/regress-base --fail-on-new-mismatch`, so any difference the baseline did not already have fails the run.
- Groups the `NEW MISMATCH` lines by endpoint and field, and reads the app code to confirm the cause.
- Restarts the app without `APP_VERSION` and runs the same gate to confirm it passes.
- Checks that both blueprints from chapter 4 loaded in every run, so the mocks answered every outbound call.

## What you should see

The v2 replay, trimmed:

```text
tutorial-orders (go) listening on :8080 version=v2 slow=false
replay exit=3
NEW MISMATCH: POST /orders status 201, body total_cents changed type: number 3600 -> string "3600"
NEW MISMATCH: GET /orders/e56a157a-0665-4bfa-b4cb-68b6f4a35c4e status 200, body total_cents changed type: number 1600 -> string "1600"
...
 FAIL passAssertPct >= 100 - observed 79.17 (counts assertions, not requests: ...)
 408 assertions over 136 replayed requests: 323 passed, 85 failed
Goal verdict: FAIL
```

The agent's answer: v2 changed `total_cents` from a JSON number to a string in every response that includes it.

| Run | App | Exit code | New mismatches | Assertions passed (`tutorial`) | Mock match |
| --- | --- | --- | --- | --- | --- |
| `regress-base` | v1 | 0 | - | 100% (408/408) | 100% |
| `regress-v2` | v2 | 3 | 85 | 79.17% (323/408) | 100% |
| `regress-v1` | v1 | 0 | 0 | 100% (408/408) | 100% |

The 85 mismatches are 40 `POST /orders` responses, 40 `GET /orders/{id}` responses and 5 `GET /orders` responses, where every order in the list changed. Status codes did not change and no request failed, so a check on status codes alone would have passed. The body comparison catches it.

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** proxymock/recorded-baseline replayed at http://localhost:8080 (app `go run .` behind `proxymock mock --map 15432=postgres://localhost:54329`), --test-config tutorial, --baseline proxymock/results/regress-base --fail-on-new-mismatch; baseline on v1, then APP_VERSION=v2, then v1 again
- **Outcome:** v2 new-mismatch (exit 3; tutorial goal passAssertPct also FAIL) — total_cents number → string on POST /orders, GET /orders/{id}, GET /orders; v1 pass (exit 0, goal PASS)
- **Numbers:** 136 pairs replayed per run; new mismatches v2 85 / v1 0; body mismatches v2 85 / v1 0; passAssertPct v2 79.17 / v1 100; requests.failed 0 in all runs
- **Artifacts:** proxymock/results/regress-base/, regress-v2/, regress-v1/ (each with replay-verdict.json), ...
- **Next:** gate CI on `proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 --test-config tutorial --baseline proxymock/results/regress-base --fail-on-new-mismatch`
```

Exit code 3 means a new mismatch against the baseline. Exit code 0 means the gate passed. Each run writes `replay-verdict.json` in its results directory, with every failing pair and its recorded and replayed files.

## If it goes wrong

- **The v2 run has many more failures than type changes, or 502 responses.** The mocks or the test config are not tuned. Run [chapter 4](./tune-the-mocks.md) and [chapter 5](./tune-the-tests.md) first.
- **A replay with mismatches still exits 0.** Without a test config goal or `--baseline` with `--fail-on-new-mismatch`, a replay reports mismatches but does not fail. Gate with both, as above.

See [Gate CI on replay results](../guides/replay-verdicts.md) for baselines, exit codes and `replay-verdict.json`.

<details>
<summary>Manual equivalent</summary>

Commands from the Go app. For another language, use its start command from [chapter 2](./run-the-demo-app.md) after `--`. Stop the mock with ctrl-c between runs.

```bash
cd mock-lab/tutorial/go
export DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable'

# 1. Baseline on v1
proxymock mock --in proxymock/recorded-baseline --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --test-config tutorial --out proxymock/results/regress-base

# 2. Gate v2 against the baseline (expect exit code 3)
APP_VERSION=v2 proxymock mock --in proxymock/recorded-baseline --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --test-config tutorial --out proxymock/results/regress-v2 \
  --baseline proxymock/results/regress-base --fail-on-new-mismatch

# 3. Gate v1 again (expect exit code 0)
proxymock mock --in proxymock/recorded-baseline --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --test-config tutorial --out proxymock/results/regress-v1 \
  --baseline proxymock/results/regress-base --fail-on-new-mismatch
```

</details>

## Next

[Chapter 7: Run a performance test](./performance-test.md)
