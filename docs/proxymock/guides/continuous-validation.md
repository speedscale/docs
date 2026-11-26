---
title: Validate a Service Continuously
description: Have your coding agent set up recurring replays of a service, graded on the readiness scorecard, first locally and in CI with no cluster, then on a Speedscale schedule in the service's cluster.
sidebar_position: 1.7
---

# Validate a Service Continuously

The `continuous-validation` skill has your coding agent set up a check that keeps running after the agent session ends. Every run replays recorded traffic at the service and grades the result on the [readiness scorecard](/guides/readiness/), so a regression shows up as a letter that drops and a verdict that turns to Not ready.

The work comes in two phases. Phase 1 needs nothing but the service's code, so a team can start without installing anything in a cluster. Phase 2 adds the cluster when it is available, and starts from everything phase 1 left behind.

| | Phase 1: local | Phase 2: cluster |
| --- | --- | --- |
| Needs | The service's code, a way to start it, and proxymock | The Speedscale operator in the service's cluster, and the Maintainer role |
| What replays | A recording, against the app on your machine and on CI runners, with every dependency mocked | Fresh traffic, against the service deployed in its cluster |
| When | Every change and nightly, in your CI pipeline | Daily, on a Speedscale schedule |
| Graded families | Regression, Performance, Mock fidelity, Data layer, Spec adherence, Security, Resilience | All ten, adding Runtime health, Trend and Coverage |
| Where results show | The CI job log and exit code | The service page's Readiness view in the dashboard |

## Start from the dashboard

Open a service in the dashboard. Under the signal strip, **Validate this service automatically** offers a prompt for each phase. Copy one and paste it into your coding agent from the service's repository. The prompt names the service, its newest complete snapshot, where Speedscale captured it and its latest replay verdict, so the agent does not have to ask.

Viewers see phase 1 only, because phase 2 creates a schedule, which needs the Maintainer role. Once an active schedule replays the service, the section names the schedule and links to it instead of offering the prompts.

A service that Speedscale has never seen has no page yet. Choose **Add...** > **Start from code or a load test** instead: its prompt sets up phase 1 from what your repository already has.

You can also ask your agent directly, for example: "Use the continuous-validation skill to set up phase 1 for the orders service in this repo."

## Phase 1: locally and in CI

The agent reads your repository for how the service starts, its port, every dependency it calls, its API contract and how CI runs, and asks only what the code does not say. Then it:

1. Gets a recording. It pulls the service's newest complete snapshot with `proxymock cloud pull snapshot`. When there is none, it builds the first recording with the [bootstrap workflow](./bootstrap-regression-test.md) from an existing load test (k6, Gatling, JMeter, Locust or any script that sends requests to a base URL), a Postman collection or HAR file, an OpenAPI, protobuf or GraphQL spec, or the code. A load test runs once at low volume against proxymock's recording port; its requests become the replay and its thresholds become the test config's latency goals.
2. Creates a test config, `validate-<service>`, whose `readiness` section makes Regression and Mock fidelity block below B. That is what makes a local replay fail on Not ready.
3. Replays the recording at the app under `proxymock mock` and reads the scorecard. A blocking family below its floor is reported with the skill that fixes it, and nothing is tuned without your yes.
4. Saves the gate as `proxymock/validate.sh` and adds a CI job that runs it on every change and nightly, with the replay output kept as an artifact. You add one secret, `SPEEDSCALE_API_KEY`.
5. Writes `proxymock/VALIDATION.md`: how the service starts and what it calls, where the recording came from, the gate and its first grades. Phase 2 reads it, and so can a teammate or a DevOps engineer.

The agent asks before it starts your app, changes the pipeline, or keeps a recording of production traffic in the repository. A recording built from a load test, a collection, a spec or the code has invented requests and real responses; `VALIDATION.md` says so, and phase 2 offers to replace it with captured traffic.

## Phase 2: in the cluster

Phase 2 needs the Speedscale operator in the cluster that runs the service. The agent checks for it first.

- **You can install it.** When `kubectl auth can-i create clusterrole` says yes, the agent installs it with the `install-speedscale` skill, after confirming the kube context.
- **Someone else runs the cluster.** The agent writes `proxymock/OPERATOR-INSTALL.md`: what the operator is for, what the chart installs, the permissions it needs, the Helm steps with the API key kept in a Secret, how to verify, and how to undo. When your repository holds the cluster's GitOps configuration, it also drafts the install there. It gives you a short message to send, then stops. Phase 1 keeps running in CI while you wait. Paste the same prompt again once the operator is in.

With the operator in place, the agent:

1. Checks whether the workload is captured. If it is not, it offers to turn capture on, and until then the schedule replays the phase 1 recording.
2. Pushes the phase 1 test config, and the recording when there is no capture, so the cloud grades with the same floors and the same tuning.
3. Runs one replay through Speedscale cloud and compares its letters with phase 1.
4. Creates a schedule named `validate-<service>` that snapshots the last day of traffic and replays it daily, then checks the first run.

Each of these steps asks first, and the agent asks again before any namespace that looks like production.

## What notifies you

A schedule's notify task with the trigger **On failure** fires when a task errors, for example when the snapshot window held no traffic or the replay ended in Error. It does not fire on Missed Goals or on a Not ready verdict, because the schedule counts those runs as completed.

To act on the verdict, the skill includes `check-readiness.sh`, which reads a report's verdict and exits 0 on Ready and 1 on Not ready. The agent offers a scheduled CI job that runs it after the schedule's hour:

```bash
check-readiness.sh --schedule validate-orders --since "$(date -u +%Y-%m-%dT00:00:00Z)"
```

It also takes `--report <id>` for one report and `--snapshot <id>` for a schedule that replays a pinned snapshot. It needs `speedctl` v2.5.1281 or newer; older versions do not print the readiness grade, so every report looks ungraded.

## Related

- [Readiness scorecard](/guides/readiness/)
- [Bootstrap a regression test with no recording](./bootstrap-regression-test.md)
- [Schedules](/concepts/schedules)
- [Agent skills](../agent-skills.md)
