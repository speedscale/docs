---
title: "Agent tutorial in your cluster 5: tune the mocks"
description: "Your coding agent uses the improve-mock-match-rate skill on the recording pulled from the cluster: it measures the mocks with the app on your machine, fixes a ts query parameter and order-dependent SQL reads, and confirms the fix with a replay in the cluster."
sidebar_position: 6
sidebar_label: "5. Tune the mocks"
---

# Chapter 5: Tune the mocks

Your agent gets every outbound call the app makes answered by a mock, then confirms the fix with a replay in the cluster.

Time: about 4 minutes.

## Prompt

```text
Use the improve-mock-match-rate skill to get every call the tutorial app makes in the baseline recording answered by a mock, then confirm the fix with a replay in the cluster.
```

## What the agent does

A replay in the cluster reports a verdict, not how each outbound call was answered, so the `improve-mock-match-rate` skill measures the mocks on your machine with the recording it pulled, then confirms in the cluster:

- Builds the app from `mock-lab/tutorial/go` and starts it behind `proxymock mock --in proxymock/recorded-baseline --map 15432=postgres://localhost:5432`, with `DATABASE_URL` pointed at port 15432. The mock answers the CNCF API and Postgres from the recording, so no database runs on your machine.
- Replays the recorded inbound traffic at it with `proxymock replay`, then measures with `proxymock replay score` and `proxymock match-rate analyze`.
- Finds the two problems the version on your machine finds. The app adds `ts=<epoch ms>` to every CNCF API call, so none of the 70 calls matched a recording and all of them went to the real API. And 122 Postgres reads got their own row only because the replay sent them in recorded order.
- Accepts the four recommendations: `ts` replaced with a constant on the CNCF API calls, and the three order-id reads keyed on their `$1` value. They are written to blueprints in `proxymock/blueprints/`, with a checkpoint before and after.
- Re-runs locally to measure the fix, then confirms with a replay in the cluster (`proxymock cluster replay start ... --test-config tutorial --wait`). The blueprints travel with that replay.

## What you should see

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** workspace `proxymock/` (`recorded-baseline`). Phase 1: one round of offline analysis, 4 fixes accepted. Phase 2: two local replays with the app behind `proxymock mock` (before and after), then one cluster confirmation replay against `tutorial-orders` in `speedscale-tutorial` / `tutorial` with `--test-config tutorial`.
- **Outcome:** measured 93.4% → 100%, with no passthrough; the cluster confirmation passed (100% of checks passed). No regressions in the app.
- **Numbers:**
  - Match rate: 93% when recorded at replay time, 100% projected after the fixes, and 93.4% → 100% measured (1063/1063).
  - Passthrough: 70 → 0.
  - SQL correctness: order-dependent reads 122 → 0; 0 bind drift, 0 fallback.
  - Accuracy held at 100%.
- **Artifacts:**
  - `proxymock/blueprints/` (2 files) and the checkpoints `proxymock/tuning/checkpoints/0/` (before any fix) and `proxymock/tuning/checkpoints/1/` (after the `ts` fix).
  - `proxymock/results/cluster-replay-mocks-confirm.log`
- **Next:** now that the SQL reads are keyed, the recording can be used for load: `run a light load test of the baseline against tutorial-orders in the cluster` (proxymock-load-test, which hands off to run-snapshot-replay in load mode).
```

The agent's evidence that the fix reached the cluster: the endpoints that call the CNCF API got much faster once it was mocked. `POST /orders` went from a p95 of 256.5 ms in chapter 4's replay to 5.0 ms in the confirming replay.

The numbers match the version on your machine, because it is the same app and the same recording. From here on, every replay in the cluster carries these blueprints.

## If it goes wrong

- **The local re-run cannot start the app.** This chapter builds and runs the app on your machine, so it needs your language's toolchain: Go 1.25 or newer, JDK 21 or newer, Python 3.11 or newer, or Node.js 22.21 or newer. No database is needed, because the mock answers Postgres.
- **The cluster replay passes but the match rate was never measured.** The agent skipped the local re-run. Ask it to measure the mocks on your machine first: the cluster result has no match rate, so a pass alone does not show that the CNCF API was mocked.
- **The confirming replay did not use the fixes.** The blueprints travel with `proxymock cluster replay start --snapshot-source local`. A snapshot pushed to Speedscale cloud by another route does not carry them.

<details>
<summary>Manual equivalent</summary>

```bash
cd mock-lab/tutorial/go && go build -o ../../../bin/tutorial-orders . && cd -
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-baseline --out proxymock/results/mocked-1 \
  --map 15432=postgres://localhost:5432 --app-health-endpoint http://localhost:8080/healthz \
  -- ./bin/tutorial-orders
# second terminal
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --out proxymock/results/replayed-1
proxymock match-rate analyze --mock-source recorded-baseline --request-source results/mocked-1
proxymock match-rate accept --all
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local --wait
```

</details>

## Next

[Chapter 6: Run a regression test](./regression-test.md)
