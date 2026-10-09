---
title: POC prerequisites and evaluation plan
description: Prepare a Speedscale proof of concept with one service, an installation checklist, agreed success criteria, and a sample three-week evaluation plan.
sidebar_label: POC prerequisites
slug: /getting-started/poc-prerequisites/
---

# POC prerequisites and evaluation plan

Start a Speedscale proof of concept (POC) with one service and measurable acceptance criteria. Use this checklist to prepare for installation and agree on a three-week evaluation with your Speedscale account team.

## Before kickoff

| Prepare | What to confirm |
| --- | --- |
| Target service | The service, endpoints or journeys, language, protocols and dependencies. |
| Traffic source | The capture environment and representative requests, including authentication and error cases. Test or UAT traffic can be the starting point; production capture is optional. |
| Replay environment | A non-production environment with the service image or start command, configuration, test credentials and required seed data. |
| Owners | An application owner and a platform contact for installation and networking. Include a security reviewer when data handling needs approval. |
| Capacity | Compute for the service and replay components, sized for the agreed request rate, concurrency and duration. See [generator sizing](../reference/generator-sizing-guide.md) and [responder sizing](../reference/responder-sizing-guide.md) for Kubernetes replay. |
| Data handling | Approved traffic and credentials to capture, fields to redact, storage location, access controls and retention. See [Data Loss Prevention](/guides/dlp/) and [data protection](../security/data_protection.md). |
| Success criteria | Measurable targets for response accuracy, throughput, latency and errors, with a named owner to review the results. |

Capture and replay can run in different environments. List which dependencies will be mocked and prepare test access or seed data for those that remain live.

## Choose the installation path

| Environment | Setup and permissions |
| --- | --- |
| Kubernetes | A Speedscale account/API key, `kubectl` access and approval to deploy capture and replay components. Follow the [Quick Start](./quick-start.md), which includes Helm and GitOps options. |
| Workstation or a service you can run locally | Install and initialize [proxymock](../proxymock/getting-started/installation.md), run the service and configure proxy routing and TLS trust. This path does not require Kubernetes. |
| Existing VM or Docker deployment | Review the [VM](./installation/install/vm.md) or [Docker](./installation/install/docker.md) guide with the platform owner. Confirm proxy routing and certificate trust. |

For Kubernetes, confirm:

- **Permissions:** for the classic operator, approve RBAC, admission webhooks and Secret access using [Kubernetes security requirements](../security/kubernetes-permissions.md). If cluster-scoped access is prohibited, review [namespace-only installation](./installation/install/kubernetes-namespaced.md).
- **Capture:** confirm kernel, BTF, runtime and host-access compatibility using [eBPF requirements](../reference/ebpf-traffic-collection/README.md). Use eBPF where supported; otherwise agree on [sidecar capture](./installation/sidecar/install.md).
- **Networking:** allow the deployment's outbound destinations and, for the classic operator, API-server access to its webhook on TCP 9443. See [networking requirements](../reference/networking.md) for current hosts. Cloud connections originate outbound from the cluster.
- **Artifacts:** access the chart and container images, or arrange internal mirrors. Supply the API key through your approved Secret-management process.

Choose the storage boundary before kickoff. Hosted Speedscale uses the cloud endpoints in the networking guide. [Bring Your Own Cloud](../byoc/index.md) offers customer-controlled storage and requires Enterprise enablement. BYOC still needs Speedscale API connectivity; customer-owned storage alone does not make the installation air-gapped.

## Agree on success criteria

Set targets for your service with the evaluation team.

| Measure | Agree before testing | Evidence at completion |
| --- | --- | --- |
| Capture coverage | Required endpoints, journeys and dependency calls. | A reviewed traffic snapshot containing the selected requests and responses. |
| Data handling | Sensitive fields to redact and approved destinations. | Inspection of captured data at the storage destination confirms the agreed redactions. |
| Replay accuracy | Expected response comparisons and exceptions for changing values such as timestamps. | A baseline replay meets the agreed response-match target. |
| Dependency isolation | Dependencies to mock and permitted live calls. | Mock match results and network checks confirm the intended dependency behavior. |
| Load and latency | Request rate or concurrency, duration, error threshold and p95/p99 latency limits. | A [replay report](../guides/reports/README.md) records achieved load, latency and errors. |
| Regression detection | One controlled behavior or latency regression. | The baseline passes and the changed version fails the agreed criteria. |

A load test with mocked dependencies measures the service under controlled conditions. It does not establish the capacity of live downstream systems.

## Sample three-week evaluation

| Stage | Work | Completion check |
| --- | --- | --- |
| Week 1: install and capture | Verify installation, enable capture for the selected service and generate representative traffic. Check data masking before retaining or exporting traffic. | Required inbound and dependency traffic is present, with agreed sensitive fields redacted. |
| Week 2: establish a baseline | Create a reusable snapshot, configure dependency mocks and handle authentication or changing request values. Replay against the non-production service. | The baseline meets the agreed response comparisons and dependency isolation criteria. |
| Week 3: evaluate and review | Increase load to the agreed target, review latency and errors, and introduce the controlled regression. Add [CI/CD integration](../guides/integrations/cicd/cicd.md) if it is in scope. | Share the baseline and load reports, regression result, any unmet targets and the recommended next step. |

Start the evaluation clock once approvals, traffic and the application are ready. Agree on dates at kickoff. For local CI workflows, use the [proxymock CI/CD guide](../proxymock/guides/cicd.md).

## Ready to start

Share this completed checklist with your account team to confirm the installation path and kickoff date. For setup questions, contact [support@speedscale.com](mailto:support@speedscale.com).
