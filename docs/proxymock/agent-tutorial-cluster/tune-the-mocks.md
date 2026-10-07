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
- Re-runs locally to measure the fix, then confirms with a replay in the cluster (`proxymock cluster replay start ... --test-config regression --wait`). The blueprints travel with that replay: the responder's log reports the four chains it loaded.

## What you should see

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** workspace `proxymock/` (recording `proxymock/recorded-baseline`); 1 offline round; phase 2 as two local re-runs (Go app built from `mock-lab/tutorial/go`, Postgres through `--map 15432`), then one cluster confirmation on `speedscale-tutorial` / `tutorial` / `tutorial-orders` with the `regression` config
- **Outcome:** measured 93.4% → 100%, and the cluster replay passed with the new blueprints. Nothing still misses, and no app regression was found.
- **Numbers:**
  - local match rate: 93.4% before (993/1063, 70 passthrough) → 100% after (1063/1063, 0 passthrough, 0 noMatch)
  - SQL: order-dependent reads 122 → 0, with 0 bind drift and 0 fallback
  - cluster: Passed, 0 of 1 goals missed; the cluster doesn't report a match rate
- **Artifacts:**
  - blueprints: `proxymock/blueprints/` (2 files)
  - checkpoints: `proxymock/tuning/checkpoints/0/` and `1/`
- **Next:** with the mocks complete and order-independent, a load test is now safe.
```

The agent's evidence that the fix reached the cluster: the confirming replay's responder logged `chainCount: 4` when it loaded the snapshot, and the real Postgres in the cluster still holds only the orders from chapter 3, so none of the replay's writes reached it.

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
