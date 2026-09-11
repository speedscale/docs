---
title: BYOC on ECS/Fargate
description: Capture application traffic on ECS and export RRPairs through a forwarder and OpenTelemetry collector to your S3 bucket.
---

Run goproxy alongside your application, then send captured traffic to a separate ECS task containing the forwarder and an OpenTelemetry collector. The collector writes OTLP JSON records to your S3 bucket using an ECS task role. This configuration was validated with synthetic HTTP traffic on Linux Fargate 1.4.0, Speedscale v2.5.967, and OpenTelemetry Collector Contrib 0.139.0.

```mermaid
flowchart LR
    client[Client] --> proxy[goproxy :4143]
    subgraph application[Application task]
        proxy --> app[Application]
    end
    subgraph capture[Forwarder task]
        forwarder[Forwarder :8888] -->|localhost:4317| collector[OTel Collector]
    end
    proxy -->|private service discovery| forwarder
    collector --> bucket[(S3 bucket)]
```

## Prerequisites

Use the networking and application setup in [AWS ECS/Fargate](../getting-started/installation/install/ecs.md). You need a Speedscale account with BYOC enabled, a bucket, an ECS cluster, and a private service discovery name for the forwarder. The examples below extend that installation; they do not create the VPC or bucket.

Allow application tasks to reach the forwarder on TCP 8888. The collector listens only on localhost inside the forwarder task. Provide outbound connectivity for image pulls, Secrets Manager, CloudWatch Logs, S3, and the Speedscale API. Adding `EXPORTERS` does not disable the cloud exporter or make this an offline installation.

## Configure credentials and cloud filtering

Populate a Secrets Manager JSON secret with your tenant's values for these keys:

```text
SPEEDSCALE_API_KEY
SPEEDSCALE_APP_URL
TENANT_NAME
TENANT_ID
TENANT_BUCKET
TENANT_REGION
SUB_TENANT_NAME
SUB_TENANT_STREAM
SPEEDSCALE_FILTER_RULE
```

Use the tenant configuration from `speedctl` setup. `TENANT_BUCKET` and `SUB_TENANT_STREAM` are Speedscale tenant values; the collector's destination bucket is configured separately. Keep secret values out of Terraform variables and state.

To filter all captured RRPairs from the cloud exporter, create a dedicated filter in the same tenant:

```bash
cat > ecs-byoc-drop-all.json <<'JSON'
{"id":"ecs-byoc-drop-all","filterQuery":"(location CONTAINS \"\")"}
JSON
speedctl put filter ecs-byoc-drop-all.json
```

Set the secret's `SPEEDSCALE_FILTER_RULE` to `ecs-byoc-drop-all`. The BYOC exporter below uses its own `standard` filter and DLP configuration. Confirm those configurations exist in your tenant before starting the service. Cloud filtering applies to captured RRPairs; registration, configuration downloads, and operational telemetry still use the Speedscale API. Review the DLP rules for your data before capturing sensitive traffic.

Grant the execution role `secretsmanager:GetSecretValue` on this secret and permissions to write the configured CloudWatch log stream. Add `kms:Decrypt` if the secret uses a customer-managed KMS key. JSON-key injection requires Linux Fargate 1.4.0 or later. Launch new tasks after changing the secret. See [AWS secret injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html).

The collector task role needs `s3:PutObject` on `arn:aws:s3:::YOUR_BUCKET/byoc/*` for the SSE-S3 configuration tested here. Both containers in this task share that role; it is separate from the execution role. See [ECS task roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html). Enable S3 public access blocking, encryption, and a retention policy appropriate for your captured data.

## Configure the collector

Save this as `collector.yaml.tftpl` alongside your Terraform module. Terraform supplies the bucket name through `templatefile` in the task definition below.

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 127.0.0.1:4317
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 192
    spike_limit_mib: 48
  batch:
    timeout: 5s
    send_batch_size: 100
exporters:
  awss3:
    s3uploader:
      region: us-east-1
      s3_bucket: ${bucket}
      s3_prefix: byoc
      compression: none
    marshaler: otlp_json
service:
  telemetry:
    metrics:
      readers:
        - pull:
            exporter:
              prometheus:
                host: 127.0.0.1
                port: 8890
  pipelines:
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [awss3]
```

The collector owns port 4317. Set the forwarder's `OTLP_PORT` to 4319 so its receiver does not bind the same port. The collector's metrics endpoint uses 8890 to avoid another shared-task port conflict. These settings are needed because both containers share the task network namespace.

## Define the forwarder task

Supply `execution_role_arn`, `collector_role_arn`, `forwarder_secret_arn`, and `bucket_name` as module variables containing the ARNs and bucket name created by your infrastructure. Define the log group before deploying the task.

```hcl
locals {
  forwarder_secret_keys = [
    "SPEEDSCALE_API_KEY", "SPEEDSCALE_APP_URL", "TENANT_NAME", "TENANT_ID",
    "TENANT_BUCKET", "TENANT_REGION", "SUB_TENANT_NAME", "SUB_TENANT_STREAM",
    "SPEEDSCALE_FILTER_RULE"
  ]
  log_configuration = {
    logDriver = "awslogs"
    options = {
      awslogs-group         = "/ecs/ecs-byoc"
      awslogs-region        = "us-east-1"
      awslogs-stream-prefix = "ecs"
    }
  }
}

resource "aws_ecs_task_definition" "forwarder" {
  family                   = "ecs-byoc-forwarder"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.collector_role_arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
  container_definitions = jsonencode([
    {
      name             = "collector"
      image            = "otel/opentelemetry-collector-contrib:0.139.0"
      essential        = true
      memory           = 256
      command          = ["--config=env:OTEL_CONFIG"]
      environment      = [{ name = "OTEL_CONFIG", value = templatefile("${path.module}/collector.yaml.tftpl", { bucket = var.bucket_name }) }]
      logConfiguration = local.log_configuration
    },
    {
      name             = "forwarder"
      image            = "gcr.io/speedscale/forwarder:v2.5.967"
      essential        = true
      memory           = 768
      dependsOn        = [{ containerName = "collector", condition = "START" }]
      portMappings     = [{ containerPort = 8888, protocol = "tcp" }]
      logConfiguration = local.log_configuration
      secrets = [for key in local.forwarder_secret_keys : {
        name      = key
        valueFrom = "${var.forwarder_secret_arn}:${key}::"
      }]
      environment = [
        { name = "CLUSTER_NAME", value = "ecs-byoc" },
        { name = "LOG_LEVEL", value = "info" },
        # The collector owns port 4317 in this task network namespace.
        { name = "OTLP_PORT", value = "4319" },
        { name = "EXPORTERS", value = jsonencode({
          byoc_otel = {
            otel_endpoint = "http://127.0.0.1:4317"
            filter_rule   = "standard"
            dlp_config_id = "standard"
          }
        }) }
      ]
    }
  ])
}
```

Deploy this task definition through the forwarder ECS service from the [ECS installation guide](../getting-started/installation/install/ecs.md#setup-the-forwarder), with `platform_version = "1.4.0"`. Keep its service discovery registration on the forwarder and set the application's `FORWARDER_ADDR` to that DNS name on port 8888. Set `desired_count = 1` after the secret has a value and the filter exists.

The tested application task used nginx on port 80 and goproxy with `REVERSE_PROXY_HOST=127.0.0.1`, `REVERSE_PROXY_PORT=80`, `CAPTURE_MODE=proxy`, `PROXY_TYPE=dual`, and `PROXY_PROTOCOL=tcp:http`. Requests entered goproxy on port 4143. For this plain HTTP check, `TLS_IN_UNWRAP` and `TLS_OUT_UNWRAP` were both `false`. Configure TLS separately using the ECS guide when your application needs it.

## Verify capture and delivery

Send a request through goproxy, using your load balancer URL or a client in the application task:

```bash
curl --fail 'http://127.0.0.1:4143/?ecs_byoc_validation=synthetic'
```

The localhost command must run inside the application task. Then check both ECS services and their logs:

```bash
aws ecs describe-services --cluster YOUR_CLUSTER --services app forwarder \
  --query 'services[].{name:serviceName,desired:desiredCount,running:runningCount,pending:pendingCount}'
aws logs tail /ecs/ecs-byoc --since 10m
aws s3 ls s3://YOUR_BUCKET/byoc/ --recursive
```

Expect one running task per service, a goproxy connection to the forwarder, and a forwarder startup log containing `starting OTLP log exporter` with `transport=grpc` and endpoint `http://127.0.0.1:4317`. Inspect collector errors if no objects arrive.

Download one newly written object and check the captured content:

```bash
aws s3 cp s3://YOUR_BUCKET/byoc/OBJECT_KEY capture.json
jq '.resourceLogs[].scopeLogs[].logRecords[].body.kvlistValue.values[] |
  select(.key == "service" or .key == "status" or .key == "http")' capture.json
```

The synthetic validation produced the service label, the `ecs_byoc_validation=synthetic` request URI, HTTP status 200, and the nginx response body. Running tasks alone do not verify capture. This check validates HTTP capture and S3 delivery; it does not validate TLS capture, replay, or an installation without cloud connectivity.

For importing stored traffic, see [BYOC bucket imports](../proxymock/guides/byoc-bucket.md). Scale both services to zero through your IaC when capture is no longer needed. Keep the bucket and its retention policy under the same infrastructure lifecycle.
