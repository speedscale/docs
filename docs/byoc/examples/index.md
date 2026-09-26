---
title: BYOC Examples
description: End-to-end BYOC deployment and traffic-reuse examples.
---

# BYOC Examples

Use these examples after reviewing [How BYOC works](../how-it-works.md) and the backend-specific prerequisites.

## Reference architectures

- [AWS EKS quality factory](./aws-eks-quality-factory.md) shows how eBPF-captured, redacted S3 traffic can check a Kiro code change with an independent local replay gate. The Bedrock path is a separate capture proof.

## Deployment examples

- [BYOC on ECS/Fargate](./ecs.md) captures ECS application traffic and writes it to S3 with an OpenTelemetry collector and ECS task role.
- [Kubernetes configuration](../configure-kubernetes.md) installs a reference collector and connects one or more named Forwarder exporters.

## Traffic reuse examples

- [Use BYOC traffic with proxymock](../use-traffic.md) imports S3 or GCS traffic through the CLI, MCP, or web interface.
- [Export BYOC traffic to Locust](/guides/integrations/export/locust) turns imported inbound requests into a load test and links to a runnable Kubernetes scenario.
- [Datadog export and trace correlation](/guides/integrations/export/datadog.md) connects captured traffic with APM data and includes a trace-to-proxymock workflow.

Each example names the boundary it validates. Treat synthetic validation results as functional checks, not capacity benchmarks.
