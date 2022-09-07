---
sidebar_position: 1
---

# Technology Support

Protocol Support

Speedscale replays involve three distinct steps that are supported separately: **Observe**, **Analyze**, and **Playback**. It is possible to have observability into one protocol without necessarily having full replay support.

### Supported <a href="#supported" id="supported"></a>

| Technology | Type | Support | Notes |
| ---------- | ---- | ------- | ----- |
| Auth0 | API | Full | |
| Basic Auth | Auth | Full | |
| Bearer JWT | Auth | Full | See [JWT Tokenizer](../tokenizers-1/httpauthorization) |
| BigQuery | DBMS | Full | If using the Google SDK with standard pagination |
| Cookies | Auth | Full | See [Cookie Tokenizer](../tokenizers-1/http-cookie-tokenizer) |
| Desktop | Environment | Full | See [CLI](https://cli.speedscale.com) |
| Docker (non-K8S) | Environment | Full | See [CLI](https://cli.speedscale.com) |
| DynamoDB | DBMS | Full |  |
| Elasticsearch | DBMS | Full |  |
| Kubernetes (1.19+) | Environment | Full |  |
| Gmail | API | Full |  |
| GraphQL | Protocol | Full |  |
| gRPC | Protocol | Full |  |
| HTTP 1.1 / 2.0 | Protocol | Full |  |
| HTTP/S inbound | Protocol | Full | See [TLS](../../setup/sidecar/sidecar-trust/) |
| JSON | Protocol | Full |  |
| IMAP | Protocol | Observe Only |  |
| Istio (1.12+) | Environment | Full | |
| MongoDB | DBMS | Partial |  |
| Mutual TLS (mTLS) | Protocol | Partial | See [TLS](../../setup/sidecar/sidecar-trust/) |
| Outlook 365 | API | Full |  |
| Postgres | DBMS | Partial | Full Observe, most playback |
| Redis | DBMS | Observe Only | |
| S3 / minio | API | Full |  |
| Stripe | API | Full |  |
| Twilio | API | Full |  |
| XML | Protocol | Full |  |
| Zapier | API | Full | |

### Kubernetes Distributions

Speedscale control plane, sidecar and replay system are compatible with all currently supported versions of [Kubernetes](https://kubernetes.io/releases/) and [Istio](https://istio.io/latest/docs/releases/supported-releases/).

| Distribution | Notes |
| ------------ | ----- |
| AWS EKS | |
| Azure AKS | |
| Canonical Microk8s | Must enable DNS |
| Civo Kubernetes | |
| CNCF Kind | |
| CNCF Minikube | Must add `--cni=true` flag |
| DigitalOcean Kubernetes | |
| Docker Desktop | |
| GCP GKE Autopilot | Requires [Dual Proxy](../../setup/sidecar/sidecar-http-proxy/) |
| GCP GKE Standard | |
| Rancher Desktop | |
| Rancher K3S | |
| Rancher RKE2 | Rancher Marketplace [Helm Chart](https://rancher.com/docs/rancher/v2.6/en/helm-charts/) |

### Questions?

If there are other protocols that are integral to your organization, please let us know at [support@speedscale.com](mailto:support@speedscale.com) or join our [slack community](http://slack.speedscale.com).
