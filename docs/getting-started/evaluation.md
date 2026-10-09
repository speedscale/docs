---
title: Evaluation prerequisites and plan
description: Prepare a Speedscale evaluation with a short readiness checklist, agreed success criteria, and a sample three-week plan.
sidebar_label: Evaluation
slug: /getting-started/evaluation/
---

# Evaluation prerequisites and plan

Evaluate Speedscale with one service to assess replay accuracy and performance in your environment. Agree on scope and success criteria with your account team before kickoff.

## Before kickoff

- **Service and traffic:** choose the service, endpoints and dependencies. Prepare representative requests, including authenticated flows and error cases. Test or UAT traffic is sufficient to start.
- **Test environment:** provide a non-production deployment, test credentials, seed data and capacity for the agreed load. Identify which dependencies will be mocked or remain live.
- **Owners:** name an application owner and a platform contact for installation and network access.
- **Data handling:** agree on fields to redact, storage location, access and retention before capture. See [Data Loss Prevention](/guides/dlp/).
- **Access:** arrange Speedscale access, installation permissions and the required binaries or container images.

## Installation requirements

| Environment | Prepare |
| --- | --- |
| Kubernetes, classic operator | Configure an API key and follow the [Quick Start](./quick-start.md). Approve [RBAC and webhook access](../security/kubernetes-permissions.md) and confirm [eBPF compatibility](../reference/ebpf-traffic-collection/README.md), or agree on sidecar capture. |
| Kubernetes, namespace-only | Follow the [namespaced guide](./installation/install/kubernetes-namespaced.md). Pre-provision the namespace and required Secrets, including the API key. This mode uses sidecar capture; eBPF is unavailable. |
| Local service | Install [proxymock](../proxymock/getting-started/installation.md) and activate through browser sign-in. Use an API key for headless runs. Confirm proxy routing and TLS trust; Kubernetes is optional. |
| VM or Docker | Configure an API key and review the [VM](./installation/install/vm.md) or [Docker](./installation/install/docker.md) guide. |

Confirm [network access](../reference/networking.md) for your deployment, including outbound cloud connections and TCP 9443 webhook access for the classic operator. If captured traffic must stay in customer-controlled storage, review [BYOC](../byoc/index.md). It requires Enterprise enablement and still needs Speedscale API connectivity.

## Success criteria

Agree on response-match accuracy, request rate or concurrency, test duration, error limits and p95/p99 latency targets. Confirm capture coverage, data redaction and which dependencies must be isolated. Use the [replay reports](../guides/reports/README.md) to assess results and verify detection of one controlled regression.

Load tests with mocked dependencies measure the service under controlled conditions, rather than the capacity of live downstream systems.

## Sample evaluation plan

| Stage | Outcome |
| --- | --- |
| Week 1: install and capture | Verify installation, representative traffic coverage and agreed data redaction. |
| Week 2: establish a baseline | Create a reusable snapshot, configure dependency mocks and obtain a baseline replay that meets the agreed response comparisons. |
| Week 3: test and review | Run the agreed load, compare latency and errors, demonstrate regression detection and review results together. |

Agree on dates once approvals, traffic and the application are ready. Share this checklist with your account team, or contact [support@speedscale.com](mailto:support@speedscale.com).
