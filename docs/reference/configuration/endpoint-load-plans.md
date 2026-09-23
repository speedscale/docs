---
title: Endpoint and session load-plan reference
description: "JSON fields, scheduling units, selection ownership and failure semantics for grouped replay load."
sidebar_position: 3
---

# Endpoint and session load-plan reference

A proxymock `--load-plan` file is a JSON `GeneratorConfig`. In a cloud version 3 test config, the same fields live under `generator`. Follow the [how-to](../../guides/replay/endpoint-load-how-to.md) for a runnable example and the [feature guide](../../guides/replay/endpoint-session-load-plans.md) for scheduling choices.

## Plan and group fields

| Field | Meaning |
| --- | --- |
| `loadGroups` | Ordered groups with unique `id` values, optional display `name`, `scope` filters and a `selection`. |
| `loadSeed` | Seed for reproducible allocation and jitter. Encode uint64 values as strings. |
| `loadUnmatchedPolicy` | Explicitly exclude unmatched requests (`LOAD_UNMATCHED_EXCLUDE`) or fail preparation (`LOAD_UNMATCHED_ERROR`). |
| `loadDrainTimeout` | Time allowed for already-started work to finish after scheduling ends. |
| `maxVusers` | Generator worker capacity shared through group reservations. |
| `loadArrivalPools` | Named schedules shared by compatible request or session arrival groups. |
| `selection` | `LOAD_SELECTION_REQUESTS` selects records; `LOAD_SELECTION_SESSIONS` selects actors and preserves complete journeys. |
| `disabled` | Excludes the group from execution. Active pool shares must still total 100%. |
| `startAfter` | Group offset relative to the common run start; pool members inherit the pool offset. |
| `stages` | Ordered duration/target pairs using one schedule strategy per group. Ramp time is included in duration. |
| `maxWorkers` | Adaptive TPS worker ceiling. Omitted/zero allocates from remaining capacity; TPS groups only. |
| `startBudget` | Maximum primary starts across the entire arrival group, encoded as a uint64 string. Counts attempts, not successful responses. |
| `recordedBaseline` | Explicit UTC `start` and `end` used to measure source rates for recorded multiples. Does not truncate selected journeys. |

Session groups claim complete journeys first, in configured order. Request groups claim remaining records in configured order. A broad earlier filter can leave a later group empty. Positive load with no eligible data fails preparation. Grouped schedules cannot be combined with legacy top-level stages or conflicting CLI scheduling overrides such as `--vus`.

## Arrivals, pools and population

| Field | Meaning |
| --- | --- |
| `stages[].arrivals.rate` | Request or journey starts per `timeUnit` (default `1s`), independent of response completion. Fractional values are supported. |
| `stages[].arrivals.recordedMultiple` | Multiple of the measured baseline start rate; mutually exclusive with explicit rate/time unit. |
| `arrivalPolicy.maxConcurrency` | Bound on active executions; required for arrival schedules. |
| `arrivalPolicy.maxStartLag` | Maximum scheduling lateness before an offered start is missed. |
| `arrivalPolicy.spacing` | `LOAD_ARRIVAL_SPACING_EVEN` or seeded `LOAD_ARRIVAL_SPACING_JITTERED`. Jitter preserves planned counts; it is not a Poisson process. |
| `arrivalPolicy.maxMissedStarts` | Run-wide missed-start allowance. Omitted/zero fails on any miss. |
| `arrivalShare.poolId` / `basisPoints` | Pool reference and share. Active shares total 10000; 8000/2000 means 80/20. |
| `population.size` | Eligible actor population size, independent of concurrency; omitted uses all eligible sources. |
| `population.reuse` | `LOAD_SESSION_REUSE_ROTATE`, `LOAD_SESSION_REUSE_STICKY` or `LOAD_SESSION_REUSE_ONCE`. |
| `population.identityFields` | Named values synthesized with existing `{n}`, `{ordinal}`, `{session}` placeholders for request transforms. |
| `population.allowClones` | Explicit opt-in to more slots than sources, requiring a size and expected-identity verification. Does not provision accounts. |
| `identityVerification` | JWT claim check (`jwtClaim`, default `sub`) and optional synthesized `expectedField`; cloning requires the expected field. |

A pool defines `id`, `selection`, `stages`, optional `startAfter` and `spacing`. Members inherit its timing instead of carrying independent stages or offsets. Request starts and session starts cannot share a pool. Once-only populations do not use shared arrivals. Each group retains its own admission bounds and budget. An active actor slot cannot run two journeys at once.

## Goals and results

`goals[]` contains `id`, optional source-request `scope`, `startAfter`, `endAfter`, `minSamples`, and a `rule`. Rules use supported latency metrics in milliseconds or `totalTransactionCount`; `TOO_HIGH`/`TOO_LOW` define threshold direction. Put selection filters on the goal's `scope`, not nested rule location fields.

Windows are relative to run start and include attempts started at the beginning but exclude those started at the end. Omitted end includes drain. Minimum samples defaults to one; insufficient samples fail. A session group's goal can select just one endpoint inside the complete journey.

Adaptive TPS stages allow 5% request-count deviation, with a minimum allowance of one request per stage. Both excess and insufficient traffic fail. An HTTP success does not satisfy an unmet delivery or TPS target. Missed-start allowances do not suppress HTTP, identity, cancellation or scoped-goal failures.

Inspect `load-groups.json` for group, stage, timeline and source evidence. Session starts and HTTP attempts have different units. Keep the drain row separate from scheduled stages. Missing report evidence must not be interpreted as PASS.

## Compatibility and limits

- Use compatible engine, operator, coordinator and cloud API/analyzer versions;
  the completed engine is in v2.5.1012.
- Cloud recording previews accept at most 32 MiB of analyzed traffic and execute
  no target requests or credential transformations.
- Namespaced inline plans are limited to 64 KiB and use replay-request payload
  version 2. Older coordinators reject them. Requests without a plan retain version 1.
- Inline plans replace schedule-owned fields while preserving base request and DLP settings.
- Credential coverage is advisory and reuses Automations/Sessions metadata.
- Ramps determine offered load over time; chaos rules independently alter request
  behavior. See [Chaos Engineering](../../concepts/chaos.md).
