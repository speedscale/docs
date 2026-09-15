---
description: "Set independent endpoint and session workloads, rotate recorded users, and measure how one workload affects another."
sidebar_position: 6
---

# Endpoint and session load plans

Load groups give selected traffic its own schedule and goals. For example, raise
statement traffic while keeping transaction posts at a steady rate, then check
whether posting latency increases. Both workloads run against the same app.

:::info Release candidate
This guide accompanies the endpoint and session load-plan release candidate.
Use compatible proxymock, generator, operator and cloud components. The proxymock
visual editor runs these plans locally; its **Run in cluster** integration and
dashboard editor are still being completed. The Kubernetes example below uses
a saved test config and a TrafficReplay.
:::

## Choose requests or complete sessions

| Selection | What a filter selects | What an execution does |
| --- | --- | --- |
| Requests | Individual recorded requests | Replays selected requests with the group's schedule. An arrival starts one request. |
| Sessions | Recorded actors with a matching request in their journey | Replays the complete journey, including login and other steps. An arrival starts one journey. |

A session filter defines the eligible population. It does not restrict replay to
one session unless the filter only matches one actor. **Rotate** cycles through
eligible actors as workers become available. **Sticky** reuses an available
actor preferentially; **Once** starts each selected actor once. An actor slot is
never shared by two active journeys.

Population size, concurrent sessions and session starts per second are different
settings. A population of 100 actors can support 10 concurrent journeys, rotating
through the population as journeys finish. Increasing concurrency does not create
new credentials. Cloning requires explicit identity fields and transformations
that produce accounts accepted by the target application.

When groups overlap, earlier groups own matching traffic within each selection
type. Review the compiled preview for ownership, exclusions and selected
endpoints. Set `loadUnmatchedPolicy` explicitly: exclude unmatched traffic or
fail preparation with `LOAD_UNMATCHED_ERROR`.

## Stress statements while measuring transaction posting

Save this as `bank-endpoints.json`. It ramps statement starts from 5 to 20 per
second and holds transaction posting at 2 starts per second. The posting goal
checks response-header p95 latency during the final 20 seconds.

```json
{
  "loadSeed": "7",
  "loadUnmatchedPolicy": "LOAD_UNMATCHED_EXCLUDE",
  "loadDrainTimeout": "10s",
  "maxVusers": 24,
  "loadGroups": [
    {
      "id": "statements",
      "name": "Statement requests",
      "selection": "LOAD_SELECTION_REQUESTS",
      "scope": {"conditions": [{"filters": [{"include": true, "operator": "CONTAINS", "optUrl": "/statements"}]}]},
      "arrivalPolicy": {"maxConcurrency": 20, "maxStartLag": "0.2s"},
      "stages": [
        {"duration": "10s", "arrivals": {"rate": 5}},
        {"duration": "20s", "rampFor": "5s", "arrivals": {"rate": 20}}
      ]
    },
    {
      "id": "posting",
      "name": "Transaction posts",
      "selection": "LOAD_SELECTION_REQUESTS",
      "scope": {"conditions": [{"filters": [{"include": true, "operator": "CONTAINS", "optUrl": "/transactions"}]}]},
      "arrivalPolicy": {"maxConcurrency": 4, "maxStartLag": "0.2s"},
      "stages": [{"duration": "30s", "arrivals": {"rate": 2}}],
      "goals": [{
        "id": "posting-latency",
        "startAfter": "10s",
        "endAfter": "30s",
        "minSamples": "20",
        "rule": {"metricName": "p95Latency", "type": "TOO_HIGH", "value": 500, "action": "ALERT"}
      }]
    }
  ]
}
```

Run against a recording containing both endpoints:

```sh
proxymock replay --in ./proxymock --out ./results/bank-endpoints \
  --load-plan ./bank-endpoints.json --test-against http://localhost:3000
```

Use an app and accounts prepared for repeated transactions. Independent requests
do not replay login automatically. Replace recorded credentials using the
existing Automations workflow when needed.

## Rotate complete banking journeys

Save this as `bank-sessions.json`. The endpoint filter finds journeys that post
transactions. Each start runs that actor's entire journey, and the goal measures
only the transaction endpoint within it.

```json
{
  "loadSeed": "7",
  "loadUnmatchedPolicy": "LOAD_UNMATCHED_EXCLUDE",
  "loadDrainTimeout": "10s",
  "maxVusers": 4,
  "loadGroups": [{
    "id": "bank-customers",
    "name": "Customers posting transactions",
    "selection": "LOAD_SELECTION_SESSIONS",
    "scope": {"conditions": [{"filters": [{"include": true, "operator": "CONTAINS", "optUrl": "/transactions"}]}]},
    "population": {"reuse": "LOAD_SESSION_REUSE_ROTATE"},
    "arrivalPolicy": {"maxConcurrency": 4, "maxStartLag": "0.2s"},
    "startBudget": "10",
    "stages": [{"duration": "10s", "arrivals": {"rate": 2}}],
    "goals": [{
      "id": "posting-latency",
      "scope": {"conditions": [{"filters": [{"include": true, "operator": "CONTAINS", "optUrl": "/transactions"}]}]},
      "minSamples": "10",
      "rule": {"metricName": "p95Latency", "type": "TOO_HIGH", "value": 500, "action": "ALERT"}
    }]
  }]
}
```

```sh
proxymock replay --in ./proxymock --out ./results/bank-sessions \
  --load-plan ./bank-sessions.json --test-against http://localhost:3000
```

The start budget limits the whole group to ten starts. It is not a per-worker
budget. A complete session can contain several HTTP requests, so ten session
starts do not imply ten requests.

Use **Sessions > Replay readiness** to review the population and
**Automations > Replace credentials** to prepare transformations. Existing
response-variable transformations carry live login tokens into later requests
within the same execution. Recorded-login ordering and uncertain credentials
produce advisory warnings; they do not prevent you from trying the replay.
Actual authentication failures remain failed requests. An optional
`identityVerification` policy can check the live JWT claim and expected identity;
configure it for the application's authentication scheme.

## Build and preview a plan visually

1. Open `proxymock web --in ./proxymock` and select **Replay > Load plan**.
2. Add request or session groups, or import either JSON example.
3. Use **Edit filter** to select traffic. You can also create a group from the
   Requests filter or selected actors in Sessions.
4. Choose schedules, durations, ramps, offsets, population reuse and goals.
5. Select recording directories and destinations in **Source & Target**.
6. Validate and preview the compiled plan. Check endpoint lists, group ownership,
   population, worker capacity, schedule units and advisory readiness warnings.
7. Run replay and inspect each group's delivery and goals.

**Advanced JSON** retains options the visual controls do not yet edit, including
identity mappings. Download the plan to use the same configuration in the CLI.
Quote 64-bit integers such as seeds and budgets so browser edits preserve them.

## Pick the right schedule

| Schedule | Controlled quantity | Use it for |
| --- | --- | --- |
| Traffic copies | Concurrent copies of selected recorded traffic | Replay a larger version of an existing workload. |
| Adaptive TPS (pending grouped runtime support) | Feedback-controlled request rate | The existing global TPS strategy adjusts traffic copies; grouped execution is not yet available in this candidate. |
| Concurrent sessions | Active complete journeys | Keep a fixed number of users working. |
| Arrivals | Independent request or session starts per time unit | Keep offered load independent of response time. |
| Recorded multiple | Multiple of measured source starts in an explicit UTC window | Scale the recorded arrival rate with a reproducible baseline. |

Ramp time is part of stage duration. A zero target pauses new work; active
journeys drain. `startAfter` offsets a group's timeline relative to run start.
Fractional arrival rates use `rate` with `timeUnit`, for example a rate of `0.5`
with `timeUnit: "1s"`. Recorded multiples require an explicit baseline window;
the window measures starts without truncating the selected journeys.

Use shared arrival pools when groups should divide a total rate. Define a pool
in `loadArrivalPools`, then give each group an `arrivalShare` with a `poolId` and
`basisPoints`. An 80/20 split uses 8000 and 2000 basis points. Active shares must
sum to 10000. Members inherit the pool's stages, offset and spacing; request and
session starts use separate pools.

Existing ramp and chaos rules remain separate controls. Load groups decide which
traffic starts and when; chaos affects request behavior. Goal windows let you
measure impact and recovery without changing session ownership.

## Understand failures and evidence

Arrival schedules do not build an unlimited backlog when the app slows down.
`maxConcurrency` bounds active work and `maxStartLag` limits lateness. Reports
retain missed starts and their causes, including unavailable workers or actors.
Missed starts fail by default. An explicit `arrivalPolicy.maxMissedStarts` permits
a chosen count across the group run while retaining the actual missed count.

That allowance does not suppress failed HTTP requests, failed identity checks,
failed goals, cancellation or a positive workload that delivers no executions.
Goals also fail when their required samples are missing. A structural validation
success is not a successful test result.

Inspect `<output>/load-groups.json` after both successful and failed runs. Compare
scheduled, started and completed work; request failures; peak concurrency;
population and identity results; and goal samples and verdicts. Source execution
counts help confirm that session rotation used the intended population.

In the local report, expand **Traffic over time and stages** to compare scheduled
starts, actual execution starts and HTTP request rates. Session starts count
journeys; HTTP rates count the requests inside them. Stage rows show samples,
failures and p95 latency, with latency attributed to the stage where the request
began. Requests begun after the schedule ends appear in a separate drain row.
Long runs use at most 300 regular chart windows plus drain; configured stage
boundaries remain exact in the stage table.

## Run the same plan in Kubernetes

Save the generator plan inside a version 3 test config. For example:

```sh
jq '{id:"bank-endpoint-load",version:3,generator:.,cluster:{replayMode:"generator-only"}}' \
  bank-endpoints.json > bank-test-config.json
speedctl put test-config bank-test-config.json
speedctl get test-config bank-endpoint-load
```

Read the config back before running. The `generator.loadGroups` must be preserved
without adding legacy `generator.stages`. Push your prepared workspace snapshot,
including its active credential blueprints, and wait for analysis to finish.
Create a TrafficReplay with that snapshot ID, the saved test config and your
in-cluster target:

```yaml
apiVersion: speedscale.com/v1
kind: TrafficReplay
metadata:
  name: bank-endpoint-load
  namespace: banking
spec:
  snapshotID: REPLACE_WITH_ANALYZED_SNAPSHOT_ID
  testConfigID: bank-endpoint-load
  mode: generator-only
  customURL: http://bank.banking.svc.cluster.local:3000
  timeout: 5m
```

Check the TrafficReplay verdict and cloud report, including per-group delivery,
identity and scoped goal assertions. A completed generator Pod alone does not
prove the test passed.

## Try the banking demo

The [sessions demo](https://github.com/speedscale/demo/tree/main/sessions-demo)
includes a real banking app, statement dependency, authentication and an
independent request journal. Its grouped tests exercise request and session
workloads, budgets, composition, identity, cloning and intentional failures:

```sh
cd sessions-demo
PROXYMOCK_BIN=/absolute/path/to/proxymock make bank-load-workers
```

The Kraken endpoint-load validator runs the proxymock matrix and actual
Kubernetes operator/generator/report path. For quick local iterations, select
`ENDPOINT_LOAD_PATHS=proxymock`; the release gate uses both paths. Mocking the
statement dependency can make dependency behavior predictable while preserving
the real bank's authentication, ledger and shared-resource contention. Keep the
real dependency path in validation for behavior that the mock cannot establish.
