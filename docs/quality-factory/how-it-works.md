---
title: How it works
description: Separate capture, dependency mocks, runtime checks and repair evidence in a Quality Factory workflow.
---

# How it works

A recording contains observed requests and responses. Inbound requests exercise the candidate; recorded outbound responses can supply its dependency mocks. The candidate is a real running application, separate from the live services you recorded.

## The feedback loop

1. **Record a baseline.** Exercise a working build and retain representative web services, async messages, database calls and cloud service interactions supported by your capture setup.
2. **Change the code.** A developer or coding agent proposes a change. Passing unit tests and code review do not establish that captured behavior is preserved.
3. **Check the candidate.** Replay inbound traffic against the candidate with dependency mocks. Compare responses and run the business assertions you selected.
4. **Repair with context.** Return the failing request, expected and observed results, dependency context and rerun command to the developer or agent.
5. **Validate the repair.** Run the unchanged recording and checks against the repaired build. Review intentional behavior changes separately before accepting a new baseline.

Require evidence for the exact candidate before merge. A passing run covers its selected checks, not every production condition.

## Capture and storage

On supported Kubernetes nodes, the [eBPF collector](/reference/ebpf-traffic-collection/) observes traffic beneath the application runtime. JVM TLS paths use the Java agent described in that guide. Local proxymock uses proxies instead; the local walkthrough is not an eBPF demonstration.

[BYOC](/byoc/) stores traffic in a destination you operate. Storage alone does not run a replay or fix code. You still configure the isolated runtime, selection rules, mocks and checks.

Configure DLP before capture/export, verify its output and restrict recording and report access. Notifications must carry report references and bounded summaries, not raw payloads.

## Responsibilities

| Component | Responsibility |
| --- | --- |
| SCM and CI | Identify the candidate and require a passing check before merge |
| Recording and transforms | Supply bounded traffic, masking and reviewed dynamic-data handling |
| Candidate runtime and mocks | Execute code without unintended calls to live dependencies |
| Replay and business checks | Report behavior differences and assertion results |
| Developer or coding agent | Diagnose, propose a repair and rerun the same checks |

Start with [the local example](./get-started.md), then [connect integrations](./integrations.md). Automatic alert routing and agent repair require orchestration beyond the CLI commands.
