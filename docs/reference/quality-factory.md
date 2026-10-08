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
| Observability | Supply incident context; receive selected telemetry and result notifications | Datadog, New Relic, Dynatrace, or Grafana |
| Orchestration and CI | Select scenarios, run checks, enforce the gate, and retain artifacts | CI jobs and an authenticated incident-trigger runner |
| Test execution | Exercise the candidate and mock dependencies where required | Speedscale replay or proxymock |
| Storage | Retain approved traffic, scenario versions, and reports with access controls and retention | BYOC object storage or an approved artifact store |
| Cloud runtime | Host isolated workloads; route triggers and result events | AWS or GCP |
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
6. Attach the report and rerun instructions to the PR. Publish a required SCM check for the exact candidate revision before merge into trunk. Block merge on failed, missing, or incomplete checks.

Keep AI review and existing CI checks before this stage. Revalidate any changed candidate, including rebases or merge-queue changes. A stale passing report must never satisfy a newer revision's gate. An agent may propose a fix after a failure, but the rerun must evaluate the same agreed expectations. Changes to expected results require review; an agent must not make a failing test pass by weakening its assertions.

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

## Partner mappings

Use one operating design across partners. An observability platform detects a symptom and supplies context; the factory reproduces the relevant behavior and validates the repair. A cloud platform provides the runtime and event infrastructure. The tables below distinguish existing components from proposed workflow integrations. They do not describe turnkey deployments.

### Observability partners

| Partner | Customer workflow | Existing component | Factory integration to implement |
| --- | --- | --- | --- |
| Datadog | Turn monitor and trace context into a repeatable test, then return fix evidence | [BYOC export and trace-to-proxymock recipe](/guides/integrations/export/datadog); completed Speedscale report export to the event stream | Monitor-to-run orchestration, incident-specific result linking, and synthetic-test lifecycle |
| New Relic | Turn an alert into reproduction evidence for break/fix, then check the repair | [BYOC export](/guides/integrations/export/new-relic); a controlled alert-to-proxymock-report demo has been demonstrated | Customer-specific alert routing, result notification, unchanged-test fix verification, and synthetic-test lifecycle |
| Dynatrace | Use affected-service and problem context to scope reproduction and return validation evidence | [BYOC export](/guides/integrations/export/dynatrace) | Problem-to-run mapping, result linking, and synthetic-test lifecycle |
| Grafana | Use alert context to select a recording and expose the resulting evidence alongside telemetry | [Loki BYOC channel](/byoc/configure-kubernetes#loki-and-grafana) and [k6 request export](/guides/integrations/export/grafana) | Alert-to-run orchestration, result dashboards/notifications, and managed synthetic-test lifecycle |

Speedscale's forwarder emits captured RRPairs as OTLP logs. Application traces and metrics must arrive from application instrumentation or another source; captured traffic alone does not create an APM topology. Use a separate S3 or GCS channel when developers need portable replay data. New Relic and Dynatrace do not have direct proxymock importers. See [BYOC backends](/byoc/backends) for retrieval limits and collector configurations.

Exporting telemetry, generating a test, and notifying an incident are separate integrations:

- **Telemetry export:** send approved captured logs through a BYOC collector. If you also publish replay-result telemetry, define a separate event schema and pipeline; do not label a replay result as a production request.
- **Synthetic generation:** select an HTTP scenario appropriate for external monitoring, remove sensitive data, and add explicit assertions. k6 export preserves requests, not Speedscale transforms or dependency mocks. Provisioning a vendor-managed monitor, scheduling it, and managing credentials require additional integration. Multi-protocol or stateful reproductions can remain CI tests instead.
- **Result notification:** return a report link, revision, scenario identity, and run outcome to the incident or PR. A reproduced HTTP 503 is evidence of the original failure, not evidence of a successful fix. Verify the repair against an unchanged test.

### Cloud partners

| Responsibility | AWS design | GCP design |
| --- | --- | --- |
| AI-assisted code and triage | Kiro proposes changes; Bedrock can assist triage | Gemini Code Assist proposes/reviews changes; Gemini models can assist triage |
| Operational trigger | CloudWatch alarm events through EventBridge | Cloud Monitoring alert notifications through Pub/Sub |
| Release trigger | Selected CodePipeline execution or deployment-stage events through EventBridge | Selected Cloud Deploy rollout notifications through Pub/Sub |
| Isolated runtime | EKS or ECS validation workers | GKE validation workers |
| Traffic and evidence storage | S3 BYOC channel and controlled report storage | Native GCS BYOC channel and controlled report storage |
| Result transport | Separate SQS PR-check and break/fix queues | Separate Pub/Sub subscriptions for PR-check and break/fix consumers |
| Merge enforcement | Consumer publishes a required check in the chosen SCM | Consumer publishes a required check in the chosen SCM |

These are proposed cloud workflow mappings built around documented components. EKS capture, S3 archival, and a local Kiro-authored status-contract fix have been demonstrated in a limited AWS example. That proof does not validate the event/queue integration, Bedrock-assisted triage, or a deployed pre-merge gate. Native GCS storage is documented, but the full GCP factory above has not been demonstrated.

For capture, follow supported [eBPF runtime requirements](/reference/ebpf-traffic-collection/) on Kubernetes. EKS or GKE capture support does not imply eBPF capture on ECS/Fargate. ECS in this design is an optional worker runtime. Validate GKE permissions and node/runtime requirements before selecting a managed configuration.

Bedrock or Gemini can also be dependencies of the application under test. Define assertions for acceptable behavior rather than requiring identical generated text across live model calls. AI assistance must not determine the pass/fail verdict.

Cloud event references: [CloudWatch alarm events](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-and-eventbridge.html), [CodePipeline events](https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html), [Cloud Monitoring Pub/Sub notifications](https://docs.cloud.google.com/monitoring/support/notification-options), and [Cloud Deploy notifications](https://docs.cloud.google.com/deploy/docs/subscribe-deploy-notifications).

## Result delivery and ownership

Store full reports in approved object storage or an artifact store. Queue messages carry references and a small result envelope: run ID, trigger/incident ID, service, candidate revision, dataset and scenario versions, outcome, and report location. Distinguish assertion failure, reproduced incident, incomplete execution, and setup failure. Restrict report access; reports may contain captured data.

Route PR results to a consumer that updates the required check for the matching candidate revision. Route incident results to a break/fix consumer that links the reproduction evidence and rerun instructions to the incident. Result notifications do not close an incident or approve a release on their own.

Authenticate triggers and authorize report access separately. Deduplicate work by trigger and scenario, make result consumers idempotent, and configure bounded retries and dead-letter handling. Standard queues may redeliver or reorder events. Correlate by run and revision, not arrival order. A delivery failure must leave the required check pending or failed, never turn it green.

## First customer pilot

Choose one service, one known production failure, and one candidate PR. Agree on the scenario and expected behavior before an agent proposes a repair. Confirm that the affected revision fails and the repaired revision passes with unchanged assertions. Then implement the required pre-merge check and the incident-result handoff.

Compare elapsed time to a validated fix, repair retries and token usage, and validation infrastructure cost against the existing process. Separate the cost of running validation from any downstream efficiency benefit. Expand only after the service owner can rerun the evidence and the integration owner can explain failure handling.

For component-level Kubernetes details, see [Deployment Architecture](/reference/architecture). For the smallest implementation, choose one service, one approved recording, one failing assertion, and a runner that publishes a report the developer can rerun.
