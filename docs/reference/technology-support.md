---
sidebar_position: 1
---

# Technology Support

Protocol Support

Speedscale is a 3 part process: **Observe**, **Analyze**, and **Playback**. That means that protocol and technology support can be viewed through these steps separately.

### Supported <a href="#supported" id="supported"></a>

| Technology | Type | Support | Notes |
| ---------- | ---- | ------- | ----- |
| Auth0 | API | Full | |
| Basic Auth | Auth | Full | |
| Bearer JWT | Auth | Full | See [JWT Tokenizer](../../configuration/tokenizers-1/httpauthorization) |
| Cookies | Auth | Full | See [Cookie Tokenizer](../../configuration/tokenizers-1/http-cookie-tokenizer) |
| Desktop | Environment | Full | See [CLI](https://cli.speedscale.com) |
| Docker (non-K8S) | Environment | Full | See [CLI](https://cli.speedscale.com) |
| DynamoDB | DBMS | Full |  |
| Elasticsearch | DBMS | Full |  |
| Kubernetes (1.16+) | Environment | Full |  |
| Gmail | API | Full |  |
| GraphQL | Protocol | Full |  |
| gRPC | Protocol | Full |  |
| HTTP 1.1 / 2.0 | Protocol | Full |  |
| HTTP/S inbound | Protocol | Full | See [TLS](../../install/kubernetes-sidecar/sidecar-trust/) |
| JSON | Protocol | Full |  |
| IMAP | Protocol | Observe Only |  |
| MongoDB | DBMS | Partial |  |
| Mutual TLS (mTLS) | Protocol | Partial | See [TLS](../../install/kubernetes-sidecar/sidecar-trust/) |
| Outlook 365 | API | Full |  |
| Postgres | DBMS | Partial | Full Observe, most playback |
| S3 / minio | API | Full |  |
| Stripe | API | Full |  |
| Twilio | API | Full |  |
| XML | Protocol | Full |  |
| Zapier | API | Full | |

### Kubernetes Distributions

Speedscale control plane, sidecar and replay system are compatible with Kubernetes versions v1.16 and newer.

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
| GCP GKE Autopilot | Requires [Dual Proxy](../../install/kubernetes-sidecar/sidecar-dual-proxy/) |
| GCP GKE Standard | |
| Rancher Desktop | |
| Rancher K3S | |
| Rancher RKE2 | Rancher Marketplace [Helm Chart](https://rancher.com/docs/rancher/v2.6/en/helm-charts/) |

### Questions?

If there are other protocols that are integral to your organization, please let us know at [support@speedscale.com](mailto:support@speedscale.com) or join our [slack community](http://slack.speedscale.com).
