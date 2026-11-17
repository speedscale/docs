---
description: "Explore Speedscale's technology support for API testing, covering protocol and language support for seamless capture, analysis, and replay."
sidebar_position: 3
---

# Technology Support

Protocol Support

Speedscale replays involve three distinct steps that are supported separately: **Capture**, **Analyze**, and **Replay**. It is possible to have observability (Capture) into one protocol without necessarily having full replay support. Please reach out if you need support for a technology not in this list.

### Supported Languages

| Technology | Type     | Support | Notes                          |
| ---------- | -------- | ------- | ------------------------------ |
| .NET       | Language | Full    | See [.NET](/reference/languages/dotnet#proxymock) and [TLS](/reference/languages/dotnet#tls-trust) |
| C++        | Language | Full    | See [sidecar TLS](/getting-started/installation/sidecar/tls/) |
| Go         | Language | Full    | See [Go](/reference/languages/golang#proxymock) and [TLS](/reference/languages/golang#tls-trust) |
| Java       | Language | Full    | See [Java setup](/reference/languages/java), [agent compatibility](/reference/java/agent#compatibility), and [TLS trust](/reference/java/tls). |
| Kotlin     | Language | Full    | See [Kotlin](/reference/languages/kotlin). Kotlin uses the JVM agent and Java TLS/proxy configuration. |
| Node.js    | Language | Full    | See [Node.js](/reference/languages/nodejs#proxymock) and [TLS](/reference/languages/nodejs#tls-trust) |
| PHP        | Language | Full    | See [PHP](/reference/languages/php), including proxymock and OpenSSL 3.x eBPF requirements. |
| Python     | Language | Full    | See [Python](/reference/languages/python#proxymock) and [TLS](/reference/languages/python#tls-trust) |
| Ruby       | Language | Full    | See [sidecar TLS](/getting-started/installation/sidecar/tls/) |
| Rust       | Language | Full    | See [Rust](/reference/languages/rust), including proxymock and rustls eBPF requirements. |

### Supported Protocols

| Technology        | Type     | Support      | Notes                                                                              |
| ----------------- | -------- | ------------ | ---------------------------------------------------------------------------------- |
| AMQP              | Protocol | Full         | 0.9.1: captured by the sidecar, eBPF and proxymock, mocked, and replayed by publishing recorded deliveries. See [RabbitMQ](../guides/message-brokers/rabbitmq.md) and [Apache ActiveMQ](../guides/message-brokers/apache-activemq.md) |
| Form URL Encoded  | Protocol | Full         |                                                                                    |
| Google PubSub     | Protocol | Partial      | gRPC calls such as `Publish` and `Acknowledge` are captured, mocked and replayed as gRPC. A subscriber can be driven by republishing the messages its `StreamingPull` and `Pull` calls received. `StreamingPull` mocking is not yet supported. See [details](../guides/message-brokers/google-pubsub.md) |
| GraphQL           | Protocol | Full         | See [GraphQL guide](/guides/graphql/) and [GraphQL in proxymock](/proxymock/graphql/). See [details](/guides/capture/bodies#graphql) |
| gRPC              | Protocol | Partial      | Unary and bounded native server, client and bidirectional streaming. Streams that outlive the per-call limits are recorded as ordered parts and mocked as one live stream; replay follows the first part only. grpc-web streaming remains a separate phase. See [gRPC known limits](/proxymock/grpc/#known-limits), [native server streaming](/proxymock/grpc/server-streaming/), [native client streaming](/proxymock/grpc/client-streaming/), [native bidirectional streaming](/proxymock/grpc/bidi-streaming/) and [long-lived streams](/proxymock/grpc/long-lived-streams/). |
| HTTP 1.1          | Protocol | Full         |                                                                                    |
| HTTP 2.0          | Protocol | Full         |                                                                                    |
| HTTP/S TLS        | Protocol | Full         | See [TLS capture](/guides/tls/)                                                                          |
| IMAP              | Protocol | Capture Only |                                                                                    |
| JSON              | Protocol | Full         |                                                                                    |
| Kafka             | Protocol | Full         | See [details](../guides/message-brokers/kafka.md)                     |
| Mutual TLS (mTLS) | Protocol | Partial      | See [sidecar mutual authentication](/getting-started/installation/sidecar/tls/#mutual-authentication-for-outbound-calls)                         |
| Protobuf          | Protocol | Full         |                                                                                    |
| RabbitMQ          | Protocol | Full         | See [details](../guides/message-brokers/rabbitmq.md)                              |
| SOAP              | Protocol | Full         |                                                                                    |
| WebSocket         | Protocol | Full         | Capture, replay and mock, over `ws://` and `wss://`. See [WebSocket Testing](../guides/websocket.md) |
| XML               | Protocol | Full         |                                                                                    |
| YAML              | Protocol | Full         |                                                                                    |

### Supported Auth

| Technology            | Type | Support | Notes                                                                                            |
| --------------------- | ---- | ------- | ------------------------------------------------------------------------------------------------ |
| AWS Signature (SigV4) | Auth | Full    | Automatic discovery and replacement. See [aws_auth transform](/guides/transformation/transforms/aws_auth) |
| Basic Auth            | Auth | Full    | Swap the recorded user for a replay user. See [Replace credentials](/guides/replay/replace-credentials.md)                         |
| Bearer JWT            | Auth | Full    | Automatic discovery and replacement. See [Replace credentials](/guides/replay/replace-credentials.md) and the [JWT guide](../guides/replay/resign-jwt.md) |
| Cookies               | Auth | Full    |                                                                                                  |
| OAuth 2.0 client credentials | Auth | Full | Fresh tokens from your identity provider during replay. See [Replace credentials](/guides/replay/replace-credentials.md) and the [token_fetch transform](/guides/transformation/transforms/token_fetch) |

### Supported DBMS

| Technology            | Type | Support      | Notes                                            |
| --------------------- | ---- | ------------ | ------------------------------------------------ |
| AWS Athena            | DBMS | Full         |                                                  |
| AWS DynamoDB          | DBMS | Full         |                                                  |
| AWS RDS               | DBMS | Full         | Full for the Postgres and MySQL engines. The SQL Server engine is Partial, the same as SQL Server below. |
| AWS Redshift          | DBMS | Full         |                                                  |
| Elasticsearch         | DBMS | Full         | For the REST API                                 |
| Google BigQuery       | DBMS | Full         | If using the Google SDK with standard pagination |
| Google BigTable       | DBMS | Full         | If using the Google SDK with standard pagination |
| Google Spanner        | DBMS | Full         | If using the Google SDK with standard pagination |
| Microsoft Outlook 365 | API  | Full         |                                                  |
| MongoDB               | DBMS | Full         | See [Database features](#database-features) and the [proxymock guide](/proxymock/databases/record/mongodb) |
| MySQL                 | DBMS | Full         | See [Database features](#database-features) |
| Oracle Database       | DBMS | Partial      | Recorded over plain TCP and TCPS from the JDBC thin, python-oracledb, node-oracledb, go-ora and ODP.NET managed drivers, and shown in every database view. Mocked for the JDBC thin, python-oracledb, node-oracledb and go-ora drivers over plain TCP and TCPS; the mock needs the database user's password in the test config. Replayed against a database for load and regression tests from all five drivers, over TCP and TCPS. See [Database features](#database-features), [Record Oracle](/proxymock/databases/record/oracle#mock) and [Replay against a database](/proxymock/databases/record/oracle#replay). |
| Postgres              | DBMS | Full         | See [Database features](#database-features) and [captured bodies](/guides/capture/bodies#postgres) |
| Redis                 | DBMS | Full         | See [Redis mocking and replay](/proxymock/databases/record/redis) and [captured bodies](/guides/capture/bodies#redis). RESP2 and RESP3 are supported for capture, mocking and replay against a single-node server, including [Pub/Sub](/proxymock/databases/record/redis#pubsub) with channels, patterns and shard channels. `MONITOR` is not supported. |
| SQL Server            | DBMS | Partial      | Includes Azure SQL Database, Amazon RDS for SQL Server and Azure SQL Managed Instance, encrypted or not. Recorded, shown in every database view, mocked, and replayed against a database for load and regression tests. See [Database features](#database-features) and [Record SQL Server](/proxymock/databases/record/sqlserver). |
| Valkey                | DBMS | Full         | Uses Redis protocol capture, mocking and replay. See [Redis mocking and replay](/proxymock/databases/record/redis). |

### Database features

Every supported database can be recorded and mocked. PostgreSQL, MySQL, SQL Server and Oracle are decoded statement by statement, which adds the features below. PostgreSQL, MySQL, SQL Server, Oracle and MongoDB traffic can also be replayed against a live database. See [Databases](/guides/databases/) for the dashboard and [Databases](/proxymock/databases/) for proxymock.

| Feature | PostgreSQL | MySQL | SQL Server | Oracle | MongoDB | Redis, Valkey |
| --- | --- | --- | --- | --- | --- | --- |
| [Record](/proxymock/databases/) | Yes | Yes | Yes | Yes | Yes | Yes |
| [Mock](/proxymock/databases/mock-a-database) | Yes | Yes | Yes | Yes | Yes | Yes |
| Statements with bound values, outcome and errors ([inspect a statement](/guides/databases/inspect-a-statement)) | Yes | Yes | Yes | Yes | No | No |
| Connection view with transactions | Yes | Yes | Yes | Yes | No | No |
| [Database filters](/guides/databases/find-statements) and columns | Yes | Yes | Yes | Yes | No | No |
| [Inferred schema](/guides/databases/inferred-schema) | Yes | Yes | Yes | Yes | No | No |
| Live SQL ([dashboard](/guides/databases/watch-live-sql), [proxymock](/proxymock/databases/watch-live-sql)) and [SQL inventory](/proxymock/databases/sql-inventory) | Yes | Yes | Yes | Yes | No | No |
| SQL script export ([dashboard](/guides/databases/export-sql-script), [proxymock](/proxymock/databases/export-sql-script)) | Yes | Yes | Yes | Yes | No | No |
| Link queries to requests by trace id ([dashboard](/guides/databases/link-queries-to-requests), [proxymock](/proxymock/databases/link-queries-to-requests)) | Yes | Yes | Yes | Yes | No | No |
| Load and regression replay against a database ([PostgreSQL, MySQL, SQL Server, Oracle and MongoDB](/proxymock/databases/load-and-regression-testing), [Redis and Valkey](/proxymock/databases/record/redis#replay)) | Yes | Yes | Yes | Yes | Yes | Yes |

SQL Server is decoded on encrypted connections too, including TDS 8.0 strict encryption, when the driver trusts the proxymock or Speedscale certificate authority; the sidecar needs outbound TLS interception for it. [Record SQL Server](/proxymock/databases/record/sqlserver) shows the connection settings and the limits.

Oracle is decoded on TCPS connections when the [eBPF collector](/reference/ebpf-traffic-collection) records them from a thin driver. Native Network Encryption cannot be decoded. [Record Oracle](/proxymock/databases/record/oracle) lists the tested drivers and the limits.

### Supported APIs

| Technology                  | Type | Support | Notes                                  |
| --------------------------- | ---- | ------- | -------------------------------------- |
| Agent 2 Agent (A2A)         | API  | Full    | Labeled A2A from JSON-RPC methods (0.2, 0.3 and 1.0 names), the `A2A-Version` header, the agent card and HTTP+JSON routes such as `/message:send` |
| Amazon MQ                  | API  | Partial | RabbitMQ brokers are supported as AMQP 0.9.1 over TLS on 5671: recorded, mocked and replayed. See [RabbitMQ](../guides/message-brokers/rabbitmq.md). ActiveMQ brokers are not supported yet. See [details](../guides/message-brokers/amazon-mq.md) |
| Apache ActiveMQ             | API  | Full    | See [details](../guides/message-brokers/apache-activemq.md)      |
| Apache Pulsar               | API  | Full    | See [details](../guides/message-brokers/apache-pulsar.md)      |
| Auth0                       | API  | Full    |                                        |
| AWS Data Firehose           | API  | Full    | See [details](../guides/message-brokers/aws-kinesis-data-firehose.md)      |
| AWS Kinesis                 | API  | Full    | See [details](../guides/message-brokers/aws-kinesis.md)      |
| AWS S3 / minio              | API  | Full    |                                        |
| AWS SNS                     | API  | Full    | See [details](../guides/message-brokers/aws-sns.md)      |
| AWS SQS                     | API  | Full    | See [details](../guides/message-brokers/aws-sqs.md)      |
| Azure Event Hubs            | API  | Full    | See [details](../guides/message-brokers/azure-event-hubs.md)      |
| Gmail                       | API  | Full    |                                        |
| Google Pub/Sub               | API  | Partial | gRPC calls such as `Publish` and `Acknowledge` are captured, mocked and replayed as gRPC. A subscriber can be driven by republishing the messages its `StreamingPull` and `Pull` calls received. `StreamingPull` mocking is not yet supported. See [details](../guides/message-brokers/google-pubsub.md) |
| MCP                         | API  | Full    | Labeled MCP from the `Mcp-Session-Id` and `MCP-Protocol-Version` headers, MCP JSON-RPC methods, and the HTTP+SSE `endpoint` event |
| Microsoft Outlook 365       | API  | Full    |                                        |
| Microsoft Azure Service Bus | API  | Full    | See [details](../guides/message-brokers/azure-service-bus.md)      |
| Salesforce                  | API  | Full    | Both the legacy SOAP and new REST APIs |
| Stripe                      | API  | Full    |                                        |
| Twilio                      | API  | Full    |                                        |
| Zapier                      | API  | Full    |                                        |

### Supported LLM Providers

Speedscale automatically detects and supports popular LLM (Large Language Model) provider APIs. This enables visibility into AI/LLM traffic and mocking of LLM responses for testing without live API calls.

| Technology            | Type | Support | Notes                                                   |
| --------------------- | ---- | ------- | ------------------------------------------------------- |
| Amazon Bedrock        | LLM  | Full    | Auto-detected via `bedrock-runtime`, `bedrock-agent-runtime` and `bedrock-mantle` endpoints, including FIPS and VPC endpoint names |
| Anthropic Claude      | LLM  | Full    | Auto-detected via `api.anthropic.com`                   |
| Azure AI Foundry      | LLM  | Full    | Auto-detected via `*.services.ai.azure.com` and `*.models.ai.azure.com` |
| Azure OpenAI          | LLM  | Full    | Auto-detected via `*.openai.azure.com`, and `*.cognitiveservices.azure.com` under `/openai/` |
| Cohere                | LLM  | Full    | Auto-detected via `api.cohere.com` and `api.cohere.ai`  |
| DeepSeek              | LLM  | Full    | Auto-detected via `api.deepseek.com`                    |
| Fireworks AI          | LLM  | Full    | Auto-detected via `api.fireworks.ai`                    |
| Google Gemini         | LLM  | Full    | Auto-detected via `generativelanguage.googleapis.com`   |
| Google Vertex AI      | LLM  | Full    | Auto-detected via `aiplatform.googleapis.com` and regional `<region>-aiplatform.googleapis.com` |
| Grok (xAI)            | LLM  | Full    | Auto-detected via `api.x.ai`                            |
| Groq                  | LLM  | Full    | Auto-detected via `api.groq.com`                        |
| Mistral AI            | LLM  | Full    | Auto-detected via `api.mistral.ai` and `codestral.mistral.ai` |
| OpenAI                | LLM  | Full    | Auto-detected via `api.openai.com`                      |
| OpenRouter            | LLM  | Full    | Auto-detected via `openrouter.ai`                       |
| Perplexity            | LLM  | Full    | Auto-detected via `api.perplexity.ai`                   |
| Together AI           | LLM  | Full    | Auto-detected via `api.together.xyz` and `api.together.ai` |

### Self-hosted models and gateways

Model servers you run yourself, such as vLLM, LM Studio, TGI or Ollama, and gateways such as LiteLLM can run on any host. Speedscale labels them from the request instead of the hostname.

| Label                 | Type | Support | Detected from                                           |
| --------------------- | ---- | ------- | ------------------------------------------------------- |
| Ollama                | LLM  | Full    | Port 11434, or a request to Ollama's native `/api/chat`, `/api/generate`, `/api/embed` or `/api/embeddings` route that names a `model` and gets Ollama's response shape |
| OpenAI-compatible     | LLM  | Full    | A `/chat/completions`, `/v1/completions`, `/embeddings` or `/responses` request whose JSON body names a `model` and carries that API's input |
| Anthropic-compatible  | LLM  | Full    | A `/v1/messages` request whose JSON body names a `model` and has `messages`, sent with `anthropic-version` or `max_tokens` |

A call to a hosted provider keeps that provider's label, so the OpenAI-compatible endpoints of Gemini, Groq or Bedrock are not also labeled OpenAI-compatible. Request bodies sent with a `Content-Encoding` are not read for these labels.

:::tip
LLM provider traffic is standard HTTP/HTTPS. No special configuration is required. Speedscale automatically detects and labels LLM API calls when the traffic is captured. See the [LLM Simulation guide](../guides/mocking/llm-simulation.md) for how to use recorded LLM traffic as mocks in development, CI, and load testing.
:::

### Environments <a href="#environments" id ="environments"></a>

Most modern enterpise environments are supported by Speedscale and new ones are added upon request. This includes everything from desktops to Docker to Kubernetes.

| Environment/Distribution                       | Notes                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Argo Rollouts                                  | See [guide](../guides/argo.md)                                                          |
| AWS Elastic Container Service (ECS) or Fargate | See [guide](../getting-started/installation/install/ecs.md)                                                    |
| AWS Elastic Kubernetes Service (EKS)           |                                                                                         |
| AWS EKS Auto Mode                              | See [EKS Auto Mode guide](/getting-started/installation/install/eks-auto-mode) (eBPF or transparent sidecar) |
| AWS Elastic Beanstalk                          | See [guide](../getting-started/installation/install/beanstalk.md)                                              |
| AWS Elastic Compute Cloud (EC2)                | See [guide](../getting-started/installation/install/vm.md)                                                     |
| Canonical Microk8s                             | Must enable DNS                                                                         |
| Civo Kubernetes                                |                                                                                         |
| CNCF Kind                                      |                                                                                         |
| CNCF Minikube                                  | Must add `--cni=true` flag                                                              |
| DigitalOcean Kubernetes                        |                                                                                         |
| Docker Desktop                                 | See [guide](../getting-started/installation/install/docker.md)                                                 |
| DigitalOcean Managed Kubernetes                |                                                                                         |
| GCP GKE Autopilot                              | See [GKE Autopilot guide](/getting-started/installation/install/gke-autopilot) (eBPF or dual proxy)         |
| GCP GKE CloudRun                               |                                                                                         |
| GCP GKE Standard                               |                                                                                         |
| Istio                                          | See [guide](../getting-started/installation/install/istio.md)                                                  |
| MacOS Desktop                                  | See [proxymock CLI installation](../proxymock/getting-started/installation.md)                                                             |
| Microsoft Azure Kubernetes Service (AKS)       |                                                                                         |
| Postman Collections (v2+)                      | See [guide](/guides/integrations/import/import-postman)                                    |
| Rancher Desktop                                |                                                                                         |
| Rancher K3S                                    |                                                                                         |
| Rancher RKE2                                   | Rancher Marketplace [Helm Chart](https://rancher.com/docs/rancher/v2.6/en/helm-charts/) |
| Redhat OpenShift                               | See [guide](../getting-started/installation/install/openshift.md)                                              |
| Virtual Machines (VMWare and others)           | See [guide](../getting-started/installation/install/vm.md)                                                     |
| Windows Desktop                                | See [proxymock CLI installation](../proxymock/getting-started/installation.md)                                                             |

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
