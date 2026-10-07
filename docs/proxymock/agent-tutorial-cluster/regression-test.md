---
title: "Agent tutorial in your cluster 6: run a regression test"
description: "Your coding agent sets APP_VERSION=v2 on the tutorial-orders workload, replays the recording in the cluster with the tutorial test config, finds that total_cents became a string, and confirms the gate passes again on v1."
sidebar_position: 7
sidebar_label: "6. Run a regression test"
---

# Chapter 6: Run a regression test

Your agent changes the app, replays the recording in the cluster, and finds what broke.

Time: about 6 minutes.

## Prompt

```text
Set APP_VERSION=v2 on the tutorial-orders deployment and use the proxymock-regression-test skill with the tutorial test config to run a regression test in the cluster against the baseline recording. Tell me what broke. Then remove APP_VERSION and confirm it passes.
```

## What the agent does

The `proxymock-regression-test` skill hands a cluster workload to `run-snapshot-replay` in its regression mode:

- Sets `APP_VERSION=v2` on the Deployment with `kubectl -n tutorial set env deployment/tutorial-orders APP_VERSION=v2` and waits for the rollout.
- Replays the recording against it with the `tutorial` test config from chapter 4, every dependency mocked:

  ```bash
  proxymock cluster replay start --in proxymock/recorded-baseline \
    -n tutorial --workload tutorial-orders --snapshot-source local \
    --test-config tutorial --wait
  ```

  There is no baseline run in a cluster: the test config's goal, every assertion passes, is the gate, and the command exits nonzero when it misses.
- Works out what broke. The cluster result gives the verdict and the failing goal but not the failing responses, so the agent cross-checks: a local replay of the v2 build with the same config names the field, and a single call to the v2 list endpoint shows the list items changed too.
- Removes `APP_VERSION` (`kubectl set env ... APP_VERSION-`), waits for the rollout, and runs the same gate again.

## What you should see

The v2 replay's result:

```text
result: Missed Goals (success rate 84.1%)
goals (1 of 1 missed):
  FAIL passAssertPct: expected >= 100, actual 84.14
notifications (1):
  passAssertPct: Notification: Assertions - Success Percent is too low (84.14 < 100)
Error: replay missed its goals: Missed Goals (success rate 84.1%)
```

The agent's answer. Trimmed:

```text
The regression test caught the break: with APP_VERSION=v2 the cluster gate failed (Missed Goals, passAssertPct 84.14, exit 1). With APP_VERSION removed it passes at 100.

What broke: total_cents comes back as a JSON string instead of a number (for example 2400 → "2400"). Status codes didn't change. The cluster gate failed 85 of 536 assertions, one for each changed response:

| Endpoint | Responses | Field |
|---|---|---|
| POST /orders | 40 | total_cents |
| GET /orders/{id} | 40 | total_cents |
| GET /orders | 5 | orders[*].total_cents |
```

| Run | App | Exit code | Assertions passed (`tutorial`) |
| --- | --- | --- | --- |
| v2 | `APP_VERSION=v2` | 1 | 84.14% (451/536) |
| v1 | `APP_VERSION` removed | 0 | 100% (536/536) |

No status code changed and no request failed, so a check on status codes alone, or the built-in `regression` config, would have passed v2. The type check from chapter 4 is what catches it.

## If it goes wrong

- **v2 passes.** The gate ran with the built-in `regression` config, which compares field paths but not value types. Run it with `--test-config tutorial` from chapter 4.
- **Only 80 of the 85 responses fail.** The `GET /orders` list items were not type-checked: older operator releases do not compare value types inside arrays. Upgrade the operator to a current chart.
- **The replay tested the old build.** Wait for the rollout after `kubectl set env` before starting the replay, and do not change the Deployment while an earlier replay is still cleaning up: its cleanup restores the template it saved and can undo your change.

<details>
<summary>Manual equivalent</summary>

```bash
kubectl -n tutorial set env deployment/tutorial-orders APP_VERSION=v2
kubectl -n tutorial rollout status deploy/tutorial-orders
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local \
  --test-config tutorial --wait; echo "exit $?"
kubectl -n tutorial set env deployment/tutorial-orders APP_VERSION-
kubectl -n tutorial rollout status deploy/tutorial-orders
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local \
  --test-config tutorial --wait; echo "exit $?"
```

</details>

## Next

[Chapter 7: Run a performance test](./performance-test.md)
