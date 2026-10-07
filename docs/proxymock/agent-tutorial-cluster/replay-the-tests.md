---
title: "Agent tutorial in your cluster 4: replay the tests"
description: "Your coding agent replays the baseline recording against the tutorial-orders workload in the cluster with its dependencies mocked, reads what the regression verdict checks, and makes a test config that also checks value types."
sidebar_position: 5
sidebar_label: "4. Replay and tune the tests"
---

# Chapter 4: Replay and tune the tests

Your agent replays the recording against the workload in the cluster, with its dependencies mocked, reads what the verdict checks, and makes a test config that also catches a field whose type changes.

Time: about 4 minutes.

## Prompt

```text
Use the run-snapshot-replay skill to replay the baseline recording against the tutorial-orders workload in the cluster, in regression mode with its dependencies mocked. Tell me what the verdict checked. Then use the tune-snapshot-replay skill to make a test config named tutorial from the regression config that also checks each response field's value type, and confirm the baseline passes with it.
```

## What the agent does

The `run-snapshot-replay` skill, in cluster mode with the regression mode, then the `tune-snapshot-replay` skill:

- Runs the read-only pre-flight: `proxymock cluster workloads` and `proxymock cluster replay prepare`, which lists the inbound requests the replay sends and the two dependencies it can mock, the CNCF API and Postgres.
- Replays the recording against the workload with the built-in `regression` test config:

  ```bash
  proxymock cluster replay start --in proxymock/recorded-baseline \
    -n tutorial --workload tutorial-orders --snapshot-source local \
    --test-config regression --wait
  ```

  proxymock analyzes the recording on your machine and stages it in the cluster's forwarder, so the replay never touches Speedscale cloud. The operator puts the workload under test, starts a responder that answers the CNCF API and Postgres from the recording, replays the 134 inbound requests, and restores the workload afterwards. `--wait` prints the verdict and every goal when it ends.
- Explains what the verdict checked. The `regression` config compares each response's status code, `Content-Type` header, content type and JSON schema, the field paths, not the values. The fields that change on every run, `generated_at` and the new order `id`, pass without any tuning.
- Copies it into a workspace config, `proxymock test-config new tutorial --from regression`, and makes one change: `matchType` on the schema assertion, so every field must also keep its value type. A field whose type changes, such as a number that becomes a string, now fails.
- Checks the config both ways with the app on your machine behind the mocks, which needs your language's toolchain: the current build passes, and `APP_VERSION=v2`, which returns `total_cents` as a string, fails. Then confirms the baseline passes with it in the cluster.

## What you should see

The first replay's result, as `--wait` prints it:

```text
started replay tutorial/superfluous-yaml
  source:    local (staged in the in-cluster forwarder; no Speedscale cloud round-trip, report stays in the cluster)
  config:    regression
  mocks:     every recorded outbound dependency

result: Passed (success rate 100.0%)
goals (0 of 1 missed):
  PASS passAssertPct: expected >= 100, actual 100
```

The agent's answer. Trimmed:

```text
The baseline passes with the new tutorial config in the cluster: passAssertPct 100. The regression replay with the built-in regression config also passed (100%).

What the regression verdict checked: the HTTP status code, the Content-Type header, the response content type, and the shape (schema) of the JSON body. It doesn't check body values, and its schema check doesn't compare value types.

What tutorial changes: the schema assertion now sets matchType: true, so each response field must keep the same value type as in the recording.

| Build | Assertions | passAssertPct | Result |
|---|---|---|---|
| v1 | 536 of 536 passed | 100 | pass |
| v2 | 80 failed (POST /orders and GET /orders/{id}, 40 each) | 85.07 | fail |
```

The config ends up as `proxymock/testconfigs/tutorial.json`, with the schema assertion set to:

```json
{"type":"httpResponseSchema","config":{"matchType":"true"}}
```

That is the difference from the [version on your machine](../agent-tutorial/tune-the-tests.md), where the test config compares body values and has to ignore `generated_at` and `id`. A schema with value types needs no ignore list, and it still catches the change chapter 6 plants. Every later replay in this tutorial uses `--test-config tutorial`.

## If it goes wrong

- **The result is `Error` with `FieldMask.paths contains irreversible value "StartTime"`.** The cluster runs operator images older than 2.5.1138. Upgrade the operator with `helm upgrade` to a current chart.
- **The replay waits at `Responder` for minutes.** The responder's image is still downloading on a first replay. `proxymock cluster replay status -n tutorial <replay name>` shows each stage and the operator's explanation of a stall.
- **The baseline fails with the `tutorial` config.** A field changed type between the recording and the replay. The answer names it; if it legitimately changes type, add it to the schema assertion's `ignore` list.
- **You want to read a result again.** `proxymock cluster replay status -n tutorial <replay name>` prints the same result while the replay exists. The operator removes finished replays after a while, and the report never reaches Speedscale cloud, so keep the result from the agent's answer.

<details>
<summary>Manual equivalent</summary>

```bash
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local \
  --test-config regression --wait
proxymock test-config new tutorial --from regression
# set "config": {"matchType": "true"} on the httpResponseSchema assertion in proxymock/testconfigs/tutorial.json
proxymock test-config compile tutorial
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local \
  --test-config tutorial --wait
```

</details>

## Next

[Chapter 5: Tune the mocks](./tune-the-mocks.md)
