---
sidebar_position: 3
---

# Technology Support

Protocol Support

Speedscale replays involve three distinct steps that are supported separately: **Capture**, **Analyze**, and **Playback**. It is possible to have observability (Capture) into one protocol without necessarily having full replay support. Please reach out if you need support for a technology not in this list.

### Supported Languages

| Technology | Type     | Support | Notes                          |
| ---------- | -------- | ------- | ------------------------------ |
| .NET       | Language | Full    | See [TLS](/setup/sidecar/tls/) |
| C++        | Language | Full    | See [TLS](/setup/sidecar/tls/) |
| Go         | Language | Full    | See [TLS](/setup/sidecar/tls/) |
| Java       | Language | Full    | See [TLS](/setup/sidecar/tls/) |
| Node.js    | Language | Full    | See [TLS](/setup/sidecar/tls/) |
| Python     | Language | Full    | See [TLS](/setup/sidecar/tls/) |
| Ruby       | Language | Full    | See [TLS](/setup/sidecar/tls/) |

### Supported Protocols

| Technology        | Type     | Support      | Notes                                                                              |
| ----------------- | -------- | ------------ | ---------------------------------------------------------------------------------- |
| AMQP              | Protocol | Capture Only | 0.9.1 or newer                                                                     |
| Form URL Encoded  | Protocol | Full         |                                                                                    |
| Google PubSub     | Protocol | Capture Only |                                                                                    |
| GraphQL           | Protocol | Full         | See [GraphQL guide](/guides/graphql.md). See [details](/observe/bodies.md#graphql) |
| gRPC              | Protocol | Full         | See [details](/observe/bodies.md#grpc)                                             |
| HTTP 1.1          | Protocol | Full         |                                                                                    |
| HTTP 2.0          | Protocol | Full         |                                                                                    |
| HTTP/S TLS        | Protocol | Full         | See [TLS](/setup/sidecar/tls/)                                                     |
| IMAP              | Protocol | Capture Only |                                                                                    |
| JSON              | Protocol | Full         |                                                                                    |
| Kafka             | Protocol | Full         | See [details](../guides/kafka.md)                     |
| Mutual TLS (mTLS) | Protocol | Partial      | See [TLS](/setup/sidecar/tls/)                                                     |
| Protobuf          | Protocol | Full         |                                                                                    |
| RabbitMQ          | Protocol | Capture Only |                                                                                    |
| SOAP              | Protocol | Full         |                                                                                    |
| XML               | Protocol | Full         |                                                                                    |
| YAML              | Protocol | Full         |                                                                                    |

### Supported Auth

| Technology            | Type | Support | Notes                                                                                            |
| --------------------- | ---- | ------- | ------------------------------------------------------------------------------------------------ |
| AWS Signature (SigV4) | Auth | Full    | Automatic discovery and replacement. See [aws_auth transform](/transform/transforms/aws_auth.md) |
| Basic Auth            | Auth | Full    |                                                                                                  |
| Bearer JWT            | Auth | Full    | Automatic discovery and replacement. See [JWT guide](../guides/replay/resign-jwt.md)             |
| Cookies               | Auth | Full    |                                                                                                  |

### Supported DBMS

| Technology            | Type | Support      | Notes                                            |
| --------------------- | ---- | ------------ | ------------------------------------------------ |
| AWS Athena            | DBMS | Full         |                                                  |
| AWS DynamoDB          | DBMS | Full         |                                                  |
| AWS RDS               | DBMS | Full         | Supported for Postgres and MySQL engines.        |
| AWS Redshift          | DBMS | Full         |                                                  |
| Elasticsearch         | DBMS | Full         | For the REST API                                 |
| Google BigQuery       | DBMS | Full         | If using the Google SDK with standard pagination |
| Google BigTable       | DBMS | Full         | If using the Google SDK with standard pagination |
| Google Spanner        | DBMS | Full         | If using the Google SDK with standard pagination |
| Microsoft Outlook 365 | API  | Full         |                                                  |
| MongoDB               | DBMS | Capture Only |                                                  |
| MySQL                 | DBMS | Full         |                                                  |
| Postgres              | DBMS | Full         | See [details](/observe/bodies.md#postgres)       |
| Redis                 | DBMS | Capture Only | See [details](/observe/bodies.md#redis)          |

### Supported APIs

| Technology                  | Type | Support | Notes                                  |
| --------------------------- | ---- | ------- | -------------------------------------- |
| Agent 2 Agent               | API  | Full    |                                        |
| Auth0                       | API  | Full    |                                        |
| AWS Data Firehose           | API  | Full    |                                        |
| AWS Kinesis                 | API  | Full    | See [details](../guides/kafka.md)      |
| AWS S3 / minio              | API  | Full    |                                        |
| AWS SNS                     | API  | Full    |                                        |
| AWS SQS                     | API  | Full    |                                        |
| Gmail                       | API  | Full    |                                        |
| MCP                         | API  | Full    |                                        |
| Microsoft Outlook 365       | API  | Full    |                                        |
| Microsoft Azure Service Bus | API  | Full    | See [details](../guides/kafka.md)      |
| Salesforce                  | API  | Full    | Both the legacy SOAP and new REST APIs |
| Stripe                      | API  | Full    |                                        |
| Twilio                      | API  | Full    |                                        |
| Zapier                      | API  | Full    |                                        |

### Environments <a href="#environments" id ="environments"></a>

Most modern enterpise environments are supported by Speedscale and new ones are added upon request. This includes everything from desktops to Docker to Kubernetes.

| Environment/Distribution                       | Notes                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Argo Rollouts                                  | See [guide](../guides/argo.md)                                                          |
| AWS Elastic Container Service (ECS) or Fargate | See [guide](../setup/install/ecs.md)                                                    |
| AWS Elastic Kubernetes Service (EKS)           |                                                                                         |
| AWS Elastic Beanstalk                          | See [guide](../setup/install/beanstalk.md)                                              |
| AWS Elastic Compute Cloud (EC2)                | See [guide](../setup/install/vm.md)                                                     |
| Canonical Microk8s                             | Must enable DNS                                                                         |
| Civo Kubernetes                                |                                                                                         |
| CNCF Kind                                      |                                                                                         |
| CNCF Minikube                                  | Must add `--cni=true` flag                                                              |
| DigitalOcean Kubernetes                        |                                                                                         |
| Docker Desktop                                 | See [guide](../setup/install/docker.md)                                                 |
| DigitalOcean Managed Kubernetes                |                                                                                         |
| GCP GKE Autopilot                              | Requires [Dual Proxy](/setup/sidecar/proxy-modes.md)                                    |
| GCP GKE CloudRun                               |                                                                                         |
| GCP GKE Standard                               |                                                                                         |
| Istio                                          | See [guide](../setup/install/istio.md)                                                  |
| MacOS Desktop                                  | See [CLI](../guides/cli.md)                                                             |
| Microsoft Azure Kubernetes Service (AKS)       |                                                                                         |
| Microsoft Azure App Services                   | See [guide](../setup/install/azure.md)                                                  |
| Postman Collections (v2+)                      | See [guide](../integration/import/import-postman.md)                                    |
| Rancher Desktop                                |                                                                                         |
| Rancher K3S                                    |                                                                                         |
| Rancher RKE2                                   | Rancher Marketplace [Helm Chart](https://rancher.com/docs/rancher/v2.6/en/helm-charts/) |
| Redhat OpenShift                               | See [guide](../setup/install/openshift.md)                                              |
| Virtual Machines (VMWare and others)           | See [guide](../setup/install/vm.md)                                                     |
| Windows Desktop                                | See [CLI](../guides/cli.md)                                                             |

Speedscale control plane, sidecar and replay system are compatible with all currently supported versions of [Kubernetes](https://kubernetes.io/releases/) and [Istio](https://istio.io/latest/docs/releases/supported-releases/).

### Questions?

If there are other protocols that are integral to your organization, please let us know at [support@speedscale.com](mailto:support@speedscale.com) or join our [slack community](https://slack.speedscale.com).

### Supported Observability & Tracing

| Technology                 | Type          | Notes                          |
| -------------------------- | ------------- | ------------------------------ |
| APM Agent                  | Observability | Should be filtered by default. |
| AWS Cloudwatch Monitoring  | Observability | Should be filtered by default. |
| Azure Application Insights | Observability | Should be filtered by default. |
| Azure Live Diagnostics     | Observability | Should be filtered by default. |
| calico-node-metrics        | Observability | Should be filtered by default. |
| Cisco Appdynamics          | Observability | Should be filtered by default. |
| Datadog                    | Observability | Should be filtered by default. |
| DDTracing                  | Observability | Should be filtered by default. |
| Dynatrace                  | Observability | Should be filtered by default. |
| Elastic APM                | Observability | Should be filtered by default. |
| ELB HealthChecker          | Observability | Should be filtered by default. |
| Google Cloudtrace          | Observability | Should be filtered by default. |
| GoogleHC                   | Observability | Should be filtered by default. |
| Java Hystrix               | Observability | Should be filtered by default. |
| kube-probe                 | Observability | Should be filtered by default. |
| LightStep                  | Observability | Should be filtered by default. |
| New Relic                  | Observability | Should be filtered by default. |
| newrelic.com               | Observability | Should be filtered by default. |
| OpenTelemetry              | Observability | Should be filtered by default. |
| OpenTracing                | Observability | Should be filtered by default. |
| Prometheus                 | Observability | Should be filtered by default. |
| Sentry                     | Observability | Should be filtered by default. |
| Signoz                     | Observability | Should be filtered by default. |
| Tealeaf                    | Observability | Should be filtered by default. |
| Zipkin                     | Observability | Should be filtered by default. |
