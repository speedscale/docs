---
title: "Agent tutorial in your cluster 4: replay the tests"
description: "Your coding agent replays the baseline recording against the tutorial-orders workload in the cluster with its dependencies mocked, reads what the regression verdict checks, and makes a test config that also checks value types."
sidebar_position: 5
sidebar_label: "4. Replay and tune the tests"
---

# Chapter 4: Replay and tune the tests

Your agent replays the recording against the workload in the cluster, with its dependencies mocked, reads what the verdict checks, and makes a test config that also catches a field whose type changes.

Time: about 5 minutes.

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
- Replays the baseline again with `--test-config tutorial` to confirm it still passes. Chapter 6 shows the same config failing a real change.

## What you should see

The first replay's result, as `--wait` prints it. Trimmed:

```text
started replay tutorial/caring-glee
  source:    local (staged in the in-cluster forwarder; no Speedscale cloud round-trip, report stays in the cluster)
  config:    regression
  mocks:     every recorded outbound dependency
  Applied
  Responder    Waiting for replay inventory to become ready
  SUT          Successfully initialized
  Generating   SUT has reached ready state

result: Passed (success rate 100.0%)
goals (0 of 1 missed):
  PASS passAssertPct: expected >= 100, actual 100
endpoints (busiest first):
  POST /orders: 44 requests, ...
replay finished: generator finished
```

The `endpoints` list gives each endpoint's request count and latency. Chapter 7 reads it.

The agent's answer. Trimmed:

```text
The baseline passes in the cluster both with the built-in `regression` config and with the new `tutorial` config. Each run replayed all 134 recorded requests against `tutorial-orders` (namespace `tutorial`, context `speedscale-tutorial`), with Postgres and the CNCF API both mocked.

The built-in `regression` config compares each replayed response with the recorded one on four things:
- Status code.
- The `Content-Type` header.
- Response body structure: the same field paths must be present. Field values are not compared, so IDs and timestamps that change each run don't fail it. New extra fields are allowed.
- Response content type.

It does not check what type each field's value is. A `total_cents` that came back as `"1234"` instead of `1234` would still pass.

The `tutorial` test config: I copied `regression` with `proxymock test-config new tutorial --from regression`. The only change is `"matchType": "true"` on the body-structure check, so each field must now also have the same value type (string, number or boolean) as in the recording.

| Replay | Config | Verdict | Checks passed | Goals missed |
| --- | --- | --- | --- | --- |
| `tutorial/caring-glee` | `regression` (built-in) | Passed | 100% (134 requests) | 0 of 1 |
| `tutorial/cerulean-ibis` | `tutorial` | Passed | 100% (134 requests) | 0 of 1 |
```

The agent also says it cannot confirm from a cluster replay how many dependency calls the mocks answered. A cluster result reports the verdict, not a mock match rate. Chapter 5 measures the match rate.

The config ends up as `proxymock/testconfigs/tutorial.json`, with the schema assertion set to:

```json
{"type":"httpResponseSchema","config":{"matchType":"true"}}
```

That is the difference from the [version on your machine](../agent-tutorial/tune-the-tests.md), where the test config compares body values and has to ignore `generated_at` and `id`. A schema with value types needs no ignore list, and it still catches the change chapter 6 plants. Every later replay in this tutorial uses `--test-config tutorial`.

## If it goes wrong

- **The result is `Error` with `FieldMask.paths contains irreversible value "StartTime"`.** The cluster runs operator images older than 2.5.1138. Upgrade the operator with `helm upgrade` to a current chart.
- **The replay waits at `Responder` for minutes.** The responder's image is still downloading on a first replay. `proxymock cluster replay status -n tutorial <replay name>` shows each stage and the operator's explanation of a stall.
- **The baseline fails with the `tutorial` config.** A field changed type between the recording and the replay. The answer names it; if it legitimately changes type, add it to the schema assertion's `ignore` list.
- **Every replay with the `tutorial` config prints lines starting `‼ cluster.cleanup may be rewritten at run time`.** They list settings the operator may set for the replay. They are informational.
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
