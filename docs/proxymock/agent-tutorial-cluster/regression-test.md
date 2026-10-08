---
title: "Agent tutorial in your cluster 6: run a regression test"
description: "Your coding agent sets APP_VERSION=v2 on the tutorial-orders workload, replays the recording in the cluster with the tutorial test config, finds that total_cents became a string, and confirms the gate passes again on v1."
sidebar_position: 7
sidebar_label: "6. Run a regression test"
---

# Chapter 6: Run a regression test

Your agent changes the app, replays the recording in the cluster, and finds what broke.

Time: about 5 minutes.

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
- Works out what broke. The cluster result gives the verdict and the failing goal but not the failing responses, so the agent replays the same recording and config on your machine: once as v1 to set a baseline, then as v2 with `--fail-on-new-mismatch`, which lists every changed response.
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
With APP_VERSION=v2, tutorial-orders sends total_cents as a string instead of a number, and the regression test caught it. After I removed APP_VERSION, the same test passes again.

What broke: total_cents changed from a number to a string, for example 2400 → "2400". It affects every response that carries an order total:
- POST /orders: 40 created orders (status 201).
- GET /orders/{id}: 40 lookups.
- GET /orders: all 5 list calls (orders[*].total_cents).

That makes 85 of the 134 replayed requests. Status codes, content types and field names were unchanged, and no request failed outright.

| Run | App | Verdict | Checks passing | Goal passAssertPct >= 100 |
| --- | --- | --- | --- | --- |
| Cluster tutorial/sensational-delicatessen | v2 | Missed Goals, exit 1 | 84.14% (451/536) | FAIL |
| Cluster tutorial/intelligent-platypus | APP_VERSION removed | Passed, exit 0 | 100% | PASS |

The v2 run listed 85 new mismatches, all `total_cents changed type: number -> string`, and scored the same 84.14% as the cluster run.
```

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
