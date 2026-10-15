---
title: Integrations
description: Connect Quality Factory tasks to CI, coding agents, BYOC storage and observability without assuming automatic orchestration.
---

# Integrations

Choose the component for the task you need. Capturing traffic, exporting telemetry and starting a repair are separate operations.

| Role | Existing instructions | Boundary |
| --- | --- | --- |
| Local runtime checks and CI | [proxymock CI/CD](/proxymock/guides/cicd/) and [verdict gates](/proxymock/guides/replay-verdicts/) | Configure required checks in your SCM; replay does not enforce branch protection |
| Coding agent context and tools | [Model Context Protocol](/proxymock/how-it-works/mcp/) and [agent skills](/proxymock/agent-skills/) | Scope tool access; review repairs and rerun checks before merge |
| Customer-operated storage and exporters | [BYOC](/byoc/) | Operate access, retention and any required collector; storage does not run validation |
| Local tracing and telemetry | [Observability](/proxymock/guides/observability/) | Exported telemetry is diagnostic context, not a repair verdict |
| Sensitive-data handling | [DLP](/guides/dlp/) | Configure and verify masking before capture/export |

## Observability partners

New Relic, Datadog, Dynatrace and Grafana can have roles in a partner design: detecting a production condition, supplying operational context or receiving result notifications. Verify the destination's supported transport and configuration. Do not infer a turnkey integration from an OpenTelemetry export.

The [New Relic example](./examples.md#new-relic) covers a controlled alert-to-reproduction path. Synthetic generation and automatic incident-to-repair orchestration are not established by that example. Define and test each handoff before claiming it works.

Use a dedicated partner account for demonstrations. Datadog partner workloads require explicit partner credentials and site; never fall back to credentials for Speedscale's production infrastructure. Do not publish keys or raw payloads in configuration examples or notifications.

## Cloud implementations

AWS is one infrastructure instance of the design. Use [BYOC on Kubernetes](/byoc/configure-kubernetes/) and [stored traffic with proxymock](/byoc/use-traffic/). There is no GCP Quality Factory deployment recipe in this section.

For alert-driven runs, authenticate the trigger, restrict selection and targets, deduplicate delivery and bound retries. Return a report reference to an authorized recipient. A coding agent needs an explicit repair workflow and validation gate in addition to an alert webhook.
