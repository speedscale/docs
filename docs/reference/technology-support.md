---
sidebar_position: 1
---

# Technology Support

Protocol Support

Speedscale replays involve three distinct steps that are supported separately: **Capture**, **Analyze**, and **Playback**. It is possible to have observability (Capture) into one protocol without necessarily having full replay support. Please reach out if you need support for a technology not in this list.

### Supported Protocols <a href="#protocols" id="protocols"></a>

| Technology | Type | Support | Notes |
| ---------- | ---- | ------- | ----- |
| Auth0 | API | Full | |
| Basic Auth | Auth | Full | |
| Bearer JWT | Auth | Full | Automatic discovery and replacement|
| BigQuery | DBMS | Full | If using the Google SDK with standard pagination |
| Cookies | Auth | Full | |
| DynamoDB | DBMS | Full |  |
| Elasticsearch | DBMS | Full |  |
| Kubernetes (1.19+) | Environment | Full |  |
| Gmail | API | Full |  |
| GraphQL | Protocol | Full |  |
| gRPC | Protocol | Full |  |
| HTTP 1.1 / 2.0 | Protocol | Full |  |
| HTTP/S inbound | Protocol | Full | See [TLS](/setup/sidecar/tls/) |
| JSON | Protocol | Full |  |
| IMAP | Protocol | Capture Only |  |
| Istio (1.12+) | Environment | Full | |
| Kafka | Protocol | Capture Only | Active beta for full replay |
| MongoDB | DBMS | Capture Only |  |
| Mutual TLS (mTLS) | Protocol | Partial | See [TLS](/setup/sidecar/tls/) |
| MySQL | DBMS | Full | |
| Outlook 365 | API | Full |  |
| Postgres | DBMS | Partial | Active beta for full replay |
| Redis | DBMS | Capture Only | |
| Salesforce | API | Full | |
| SOAP | API | Full | |
| S3 / minio | API | Full |  |
| Stripe | API | Full |  |
| Twilio | API | Full |  |
| XML | Protocol | Full |  |
| Zapier | API | Full | |

### Environments <a href="#environments" id ="environments"></a>

Most modern enterpise environments are supported by Speedscale and new ones are added upon request. This includes everything from desktops to Docker to Kubernetes.

| Environment/Distribution | Notes |
| ------------ | ----- |
| Argo Rollouts | See [guide](../guides/argo.md) |
| AWS Elastic Container Service (ECS) or Fargate | See [guide](../guides/ecs.md) |
| AWS Elastic Kubernetes Service (EKS) | |
| AWS Elastic Beanstalk | See [guide](../guides/beanstalk.md) |
| AWS Elastic Compute Cloud (EC2) | See [guide](../guides/vm.md) |
| Canonical Microk8s | Must enable DNS |
| Civo Kubernetes | |
| CNCF Kind | |
| CNCF Minikube | Must add `--cni=true` flag |
| DigitalOcean Kubernetes | |
| Docker Desktop | See [guide](../guides/docker.md) |
| DigitalOcean Managed Kubernetes | |
| GCP GKE Autopilot | Requires [Dual Proxy](/setup/sidecar/proxy-modes/) |
| GCP GKE CloudRun | |
| GCP GKE Standard | |
| Istio | See [guide](../guides/istio.md) |
| MacOS Desktop | See [CLI](../guides/cli.md) |
| Microsoft Azure Kubernetes Service (AKS) | |
| Microsoft Azure App Services | See [guide](../guides/azure.md) |
| Postman Collections (v2+) | See [guide](../guides/import-postman.md) |
| Rancher Desktop | |
| Rancher K3S | |
| Rancher RKE2 | Rancher Marketplace [Helm Chart](https://rancher.com/docs/rancher/v2.6/en/helm-charts/) |
| Redhat OpenShift | See [guide](../guides/openshift.md) |
| Virtual Machines (VMWare and others) | See [guide](../guides/vm.md) |
| Windows Desktop | See [CLI](../guides/cli.md) |

Speedscale control plane, sidecar and replay system are compatible with all currently supported versions of [Kubernetes](https://kubernetes.io/releases/) and [Istio](https://istio.io/latest/docs/releases/supported-releases/).

### Questions?

If there are other protocols that are integral to your organization, please let us know at [support@speedscale.com](mailto:support@speedscale.com) or join our [slack community](https://slack.speedscale.com).
