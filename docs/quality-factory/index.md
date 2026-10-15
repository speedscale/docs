---
title: Quality Factory
sidebar_label: Overview
description: Validate code changes with recorded traffic, reproduce failures and verify repairs before release.
---

# Quality Factory

Quality Factory adds a runtime validation stage before code reaches trunk. Record how a working application behaves, run a candidate against the same traffic and inspect the differences. Give the developer or coding agent the failing requests and dependency context, then check the repaired build.

For production incidents, start with a recording of the failure. Reproducing that failure confirms the test case; a separate fix check must confirm the repaired behavior.

Quality Factory replaces the QABot name. Existing commands and configuration keep their names.

## Choose a task

| Goal | Start here |
| --- | --- |
| Understand the runtime and evidence | [How it works](./how-it-works.md) |
| Run a local fail/fix/pass example | [Get started](./get-started.md) |
| Handle sensitive or changing data | [Prepare traffic](./prepare-traffic.md) |
| Check a pull request before merge | [Validate code changes](./validate-code-changes.md) |
| Turn captured failures into repair checks | [Reproduce production incidents](./reproduce-production-incidents.md) |
| Decide what a passing result proves | [Verify results](./verify-results.md) |
| Connect storage, agents or observability | [Integrations](./integrations.md) |
| Inspect demonstrated cases | [Examples](./examples.md) |
| Diagnose an unreliable run | [Troubleshooting](./troubleshooting.md) |

## Scope

Replay checks the interactions present in the selected recording. It does not prove complete correctness. Scalability, security and resilience checks need their own workloads and assertions; a response match alone does not establish those requirements.

The walkthrough is local. Cloud capture, BYOC and CI are separate configurations. The presentations and video illustrate the target feedback loop, not a completed automatic production-incident-to-repair integration.

Configure [DLP](/guides/dlp/) before using sensitive traffic. Keep raw payloads out of notifications and public artifacts; share access-controlled report references instead.
