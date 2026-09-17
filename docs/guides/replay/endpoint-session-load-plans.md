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
The completed engine is included in v2.5.1012. Use compatible proxymock,
generator, operator and cloud components. The proxymock
visual editor supports local replay and **Run in cluster**, including inline plans
carried by namespaced replay requests. Dashboard controls cover groups, shared
arrival pools, budgets, scoped goals and recording previews.
Final acceptance of the cluster launch integration is still pending.
:::

For an executable walkthrough, start with [Test one endpoint while stressing
another](./endpoint-load-how-to.md). See the [load-plan field reference](../../reference/configuration/endpoint-load-plans.md)
for JSON fields, units, ownership and compatibility rules.

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

When groups overlap, session groups claim complete journeys first, in configured
order. Request groups then claim remaining records in configured order. Review the compiled preview for ownership, exclusions and selected
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

Expand **Recorded credentials** in the compiled preview to see configured
replacement coverage. Counts use the selected requests and source actors,
including complete journeys. They recognize matching constant, variable-load,
HTTP-auth and JWT re-signing chains for every recorded Authorization or Cookie
header value. Cloned slots do not multiply these counts. The preview does not
execute the chains, resolve variables or verify target accounts. Custom credential
locations and other transforms remain unassessed; coverage remains advisory.

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

### Preview in the dashboard

In the test configuration's load-pattern editor, choose **Preview against a
recording**, select a snapshot and run the preview. The preview uses the same
traffic preparation and load-plan compiler as proxymock; it does not send traffic.
It shows selected endpoints, request ownership, source sessions, population and
clone slots, scheduled arrivals, unmatched requests and reserved worker capacity.

Credential rewrite coverage and recorded login/JWT warnings are advisory. Review
existing **Automations** and **Sessions** settings when fresh credentials are
needed. Editing the plan or choosing another recording clears the previous
result. Use **Refresh recording preview** after editing the snapshot itself.
The cloud preview accepts up to 32 MiB of analyzed replay traffic; use a smaller
snapshot if it exceeds that limit. Preview does not change or save replay settings.

### Inline plans in namespaced installations

With namespaced mode configured, **Run in cluster** carries the plan in the
immutable replay request. The coordinator transfers it to the generator, which
replaces the base configuration's schedule fields and then applies the target
URI override. Existing request and DLP settings remain in effect. The client does not create a cloud test configuration or add a
cloud-login step. The snapshot and base test configuration still need to be
available to the installation through its existing replay setup.

Inline plans are limited to 64 KiB in this path. They use replay-request payload
version 2; an older coordinator rejects the request instead of ignoring the plan.
Use matching updated coordinator and generator images. Requests without an inline
plan retain their existing payload and test-configuration-ID behavior. Live
acceptance of this path remains a release gate.

## Pick the right schedule

| Schedule | Controlled quantity | Use it for |
| --- | --- | --- |
| Traffic copies | Concurrent copies of selected recorded traffic | Replay a larger version of an existing workload. |
| Adaptive TPS | Feedback-controlled HTTP request rate | Adjust workers and pacing within each request group's budget to approach its target. |
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

### Adaptive TPS by endpoint

Choose **Adaptive TPS** for a request group and set each stage's target. TPS
counts individual HTTP requests, even when the group's filter selects several
endpoints. The scheduler rotates through the selected recorded requests and
adjusts that group's workers and pacing from observed throughput. Use arrivals
when you need independent offered starts, or session schedules for complete
authenticated journeys.

Set `maxWorkers` to cap the group's concurrency. If omitted, TPS groups divide
the remaining `maxVusers` capacity equally after other groups reserve their
workers. A slow group cannot borrow another group's reservation. Preview rejects
a plan that cannot allocate at least one worker to each active TPS group.

Each stage must deliver within 5% of its target request count, with a minimum
allowance of one request for discrete rounding. Ramps contribute the area under
the target curve; a pause contributes zero. Both undershoot and overshoot fail
the test, even when every HTTP response succeeds. Requests retain their start
stage when responses drain, so a later stage cannot hide an earlier miss.
The report shows target and actual requests for each stage and a separate TPS
result. Short stages can fail while the controller is still adjusting; allow
enough time and worker capacity for the throughput you want to measure.

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

With cloud login and a connected cluster, choose a destination and select **Run
in cluster** in proxymock. It saves a new test configuration, checks that the cloud
preserved the plan, pushes the selected recordings and active blueprints, then
launches the TrafficReplay with the saved configuration. Routes and selected
dependency mocks follow the existing cluster workflow. A cloud service that
changes or drops the plan causes launch to fail before creating a TrafficReplay.

Namespaced installations carry inline plans in version 2 replay requests; see
[Inline plans in namespaced installations](#inline-plans-in-namespaced-installations)
for compatibility and size limits.

To launch directly with a saved configuration and Kubernetes manifest, follow
the steps below.

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

The [sessions demo](https://github.com/speedscale/demo/tree/master/sessions-demo)
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

## Edit groups in the dashboard

Open **Test Config > Load Pattern**. Add request or session groups, then set their
filters and independent schedules. Changing schedule modes resets stage targets
to one and clears incompatible capacity and budget settings; the editor displays
this before the change. Ordinary edits preserve identity and transform settings.

For an 80/20 workload, add an arrival pool with request or session units. Assign
compatible groups to it and set their shares to 80% and 20%. Active shares must
sum to 100%; disabling a group does not redistribute its allocation. Pool members
inherit the schedule, start offset and spacing. A member retains its own admission
bounds and optional primary-start budget. Once-only sessions cannot use shares.

A primary-start budget caps request or journey attempts, not successful responses.
The default allowed missed starts is zero. Increasing that allowance does not
suppress HTTP, identity, cancellation or scoped-goal failures.

Under **Group goals**, choose a supported latency metric or HTTP attempt count,
set an upper or lower threshold, and optionally narrow the endpoint filter and
time window. A blank minimum sample count means one; insufficient samples fail.
A blank end includes requests started during drain.

## Inspect stage and source evidence

Report **Overview** includes a group summary. Missing metrics display a dash, and
incomplete assertions do not make a group pass. Select **Load stage and source
evidence** to retrieve the original generator artifact on demand.

Choose a group to compare scheduled starts with actual starts, or expected HTTP
requests with measured HTTP requests for adaptive TPS. Stage and timeline tables
separate HTTP attempts from journey starts. The drain row is separate from scheduled
stages. Session source counts show how recorded actors were reused.

The download requires a compatible cloud API. An older API, missing artifact, or
failed download leaves an explicit warning rather than substituting summary counts.
The summary remains available. This view does not contact the target application.
