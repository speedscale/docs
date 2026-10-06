---
title: Quality Factory reference design
description: Connect code, traffic capture, observability, CI, and isolated test environments into a repeatable quality stage.
sidebar_position: 2
---

This reference design implements the [Quality Factory](/concepts/quality-factory) as a dedicated quality stage in the SDLC. It supports both code-change checks and incident reproduction. Products can change without changing the verification boundary: run the candidate, evaluate explicit expectations, and retain evidence that an engineer can reproduce.

## System responsibilities

| Role | Responsibility | Example implementations |
| --- | --- | --- |
| SCM | Identify the candidate revision and version scenarios and rules | GitHub or GitLab |
| AI coding and review | Propose changes and review code; consume failure evidence | Kiro or another coding and review tool |
| Traffic capture | Record inbound requests and outbound dependency behavior; apply approved data protection | Speedscale eBPF capture and forwarder |
| Observability | Supply the affected service, incident time window, and symptoms | New Relic or another observability platform |
| Orchestration and CI | Select scenarios, run checks, enforce the gate, and retain artifacts | CI jobs and an authenticated incident-trigger runner |
| Test execution | Exercise the candidate and mock dependencies where required | Speedscale replay or proxymock |
| Storage | Retain approved traffic, scenario versions, and reports with access controls and retention | BYOC object storage or an approved artifact store |
| Cloud runtime | Host isolated candidate services and test infrastructure | AWS or GCP |
| Human owner | Define acceptable behavior, review exceptions, and approve releases | Service owner and release process |

These are responsibility mappings, not a list of turnkey integrations. Alert delivery, SCM checks, artifact linking, and cloud provisioning depend on the chosen implementation.

## Capture and data boundary

For Kubernetes, use [eBPF traffic collection](/reference/ebpf-traffic-collection/) where supported. The node-level capture path avoids injecting a capture sidecar into each application. Review its runtime requirements and [Kubernetes permissions](/security/kubernetes-permissions) before installation.

Apply [data protection](/security/data_protection) in the forwarder before traffic leaves the cluster. Select the [BYOC boundary](/byoc/) when traffic storage must remain in your cloud account. Verify redaction and the storage destination with a controlled recording before using production traffic.

Keep credentials out of datasets and source control. Grant the test runner access only to the approved recordings and artifacts it needs. Set retention for both traffic and reports; reports may contain request or response data too.

## Code-change path

1. Build the candidate and record its revision and runtime configuration.
2. Select a versioned, non-empty dataset and the scenarios relevant to the change.
3. Start the candidate in an isolated environment. Mock dependencies where needed and reset mutable state between runs.
4. Apply versioned normalization rules, then execute functional and selected non-functional suites.
5. Evaluate configured assertions and run completeness. Fail on missing expected requests or other conditions that invalidate the suite.
6. Attach the report and rerun instructions to the build. The release process evaluates the gate and any authorized exceptions.

Keep AI review and existing CI checks before this stage. An agent may propose a fix after a failure, but the rerun must evaluate the same agreed expectations. Changes to expected results require review; an agent must not make a failing test pass by weakening its assertions.

## Incident path

An observability alert identifies symptoms. It does not itself provide a complete reproduction. An orchestration job needs enough incident context to select a relevant recording and a known service revision.

1. Receive an authenticated alert containing an incident identifier, affected service, and time window.
2. Map that context to an approved dataset and scenario. Reject unsupported mappings instead of running a default unrelated test.
3. Start the affected revision in isolation and confirm the reported behavior with explicit checks.
4. Link the reproduction report to the incident and break/fix work. Include dataset and scenario identities, expected and observed behavior, and rerun instructions.
5. Run the same scenario against the fix, retain both results, and add the case to the regression suite.

For a New Relic implementation, the notification workflow calls your authenticated runner. The runner performs dataset selection and starts reproduction. Keep the New Relic incident link separate from the Speedscale or proxymock report link: one explains the production symptom, the other demonstrates the reproduced behavior.

Deduplicate repeated notifications by incident and scenario. Limit concurrency and execution time, allowlist target services, and give the runner no production write permissions. Treat alert text and recorded payloads as untrusted data, including when supplying them to coding agents.

## Reusable scenarios

Use [proxymock blueprints](/proxymock/guides/blueprints/) to save traffic transforms such as timestamp normalization or environment-specific field replacement. Apply narrow endpoint and method filters so unrelated requests are unchanged. Blueprints can be reused across compatible recordings; they are not a reason to hardcode a particular demo dataset into the runner.

Blueprint execution and replay success are different checks. `--require-blueprint` verifies that a blueprint loaded and at least one transform chain ran. It does not prove every chain ran or every response matched. Use [replay verdicts](/proxymock/guides/replay-verdicts/) and explicit assertions for the gate.

Version the scenario's dataset selection criteria, transforms, expected behavior, state setup, and exclusions. Preserve the failure condition when redacting or normalizing traffic. Report any fields ignored during comparison.

## Verification and reporting

Start with a functional case that is known to fail on one revision and pass on another. Then add suites with explicit scope:

- **Functional:** expected statuses and relevant response fields or business assertions.
- **Scalability:** a defined load profile, representative environment, and latency or error thresholds.
- **Resilience:** specified dependency errors, timeouts, or latency changes and the expected application response.
- **Security behavior:** selected authorization or input-handling cases, alongside dedicated security controls.

A successful process exit alone is insufficient. Distinguish an assertion failure, incomplete execution, and infrastructure failure. Preserve reports even when the gate fails. Speedscale [replay reports](/guides/reports/) and proxymock verdicts supply execution evidence; CI and the service owner decide how that evidence gates release.

## Cloud and partner implementations

On AWS, EKS can host capture and isolated candidate workloads, BYOC can retain traffic in your account, and your CI runner can execute the scenarios. Kiro can use a reproduction report when proposing a fix. Bedrock may be a dependency of the application under test; define the behavior you check rather than assuming identical generated text across live model calls.

The same responsibilities apply on GCP or with different SCM, CI, and observability products. Validate cloud-specific capture requirements, identities, storage, and execution controls independently. This design does not claim a validated deployment for every provider combination.

For component-level Kubernetes details, see [Deployment Architecture](/reference/architecture). For the smallest implementation, choose one service, one approved recording, one failing assertion, and a runner that publishes a report the developer can rerun.
