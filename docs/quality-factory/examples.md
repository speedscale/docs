---
title: Examples
description: Understand the scope of the local TLS, AWS, New Relic and synthetic Java Kafka examples.
---

# Examples

These cases demonstrate different parts of the workflow. They are not evidence of a single completed automatic incident-to-repair integration. The decks and video show the target workflow.

## Local TLS deposit fixture

[Get started](./get-started.md) exercises `POST /api/transactions/deposit`: baseline `201`, faulty `503`, repaired `201`. This is a synthetic local TLS response fixture, not a production banking service. Body comparison is off. It checks status transitions and gate behavior, not business semantics, real dependency fidelity or an agent autonomously repairing code.

## AWS

AWS provides a Kubernetes runtime and customer-operated storage for the design. Follow [Configure BYOC on Kubernetes](/byoc/configure-kubernetes/), [verify the deployment](/byoc/verify/) and [use stored traffic with proxymock](/byoc/use-traffic/). These are the canonical setup instructions; this example does not duplicate them.

Capture on supported EKS nodes can use eBPF. Check [kernel, architecture and TLS runtime support](/reference/ebpf-traffic-collection/) first. Do not assume the same capture deployment works on Fargate. Configure DLP and storage access before collecting sensitive traffic.

## New Relic {#new-relic}

The controlled October 2, 2026 rehearsal used a New Relic alert to start a **25-request reproduction**. The recorded requests matched during replay. This established alert-to-reproduction behavior for that demo, not that a repaired application passed a fix check.

To use this pattern, supply authenticated alert routing, a bounded recording selection, an isolated affected build and an access-controlled report destination. A notification should link to replay evidence, not just the observability incident. Keep raw payloads out of notifications. Fix verification remains a separate step.

## Synthetic Java and Kafka {#kafka}

The October 13, 2026 guided rehearsal exercised Java/Spring Boot Kafka production and consumption with an unchanged synthetic recording. A custom business assertion distinguished faulty `SETTLED` state from expected `COMPLETED` state. The affected build failed that assertion and the repaired build passed it.

Kafka protocol matching alone matched in both runs, so it was insufficient evidence of business correctness. The application's existing unit tests also detected the defect. This case does not demonstrate a bug escaping those tests or a fully automatic agent repair loop. SASL authentication is separate and is not covered by this case.

Start with the [local walkthrough](./get-started.md) to learn the gate behavior. Define explicit application-state assertions before adapting the pattern to an async service.
