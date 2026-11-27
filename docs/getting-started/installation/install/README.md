---
title: Install Speedscale
description: "Choose where captured traffic is stored (Speedscale Cloud, BYOC or local proxymock) and the environment to install Speedscale in."
sidebar_position: 0
---
# Install Speedscale

Two choices come before installing: where captured traffic and replay results are stored, and which environment your service runs in.

## Choose where traffic is stored

| Setup | Use it when | Start here |
| --- | --- | --- |
| Speedscale Cloud | You want Speedscale-managed storage and dashboard workflows, with a classic or namespaced Kubernetes installation. | [Choose a Kubernetes installation](./kubernetes.md) |
| BYOC direct storage | Captures, replay inputs, and reports must stay in your S3, S3-compatible, GCS, or Azure Blob storage. Requires a namespaced Kubernetes installation. | [Choose direct storage](/byoc/#direct-storage) |
| BYOC collector export on Kubernetes | You want an OpenTelemetry Collector to send captured traffic to your storage or observability tools. | [Configure Kubernetes export](/byoc/#collector-export-on-kubernetes) |
| BYOC collector export on ECS/Fargate | Your application runs on ECS/Fargate and captured traffic should go through a collector to your storage. | [Configure ECS/Fargate export](/byoc/#collector-export-on-ecs-fargate) |
| Local proxymock | You want to record, mock dependencies, and replay on your machine. | [Follow the local quickstart](/proxymock/getting-started/quickstart/quickstart-cli.md) |

Already have traffic in a BYOC bucket? [Import it into proxymock](/byoc/use-traffic.md) to inspect, mock, and replay it.

Speedscale Cloud and all BYOC deployments require Speedscale API connectivity for registration, configuration, and operational telemetry. BYOC controls the destination of captured traffic; it is not a self-hosted or air-gapped Speedscale platform. BYOC also uses your Speedscale tenant, through the dashboard or speedctl, for tenant values and rule configuration. Direct storage can use local Forwarder rule files; named collector exporters use tenant-managed filter and DLP configurations. Review [BYOC setup and data boundaries](/byoc/) before enabling capture.

Local proxymock keeps recordings on your machine by default. See [data and privacy](/proxymock/how-it-works/data_and_privacy/) for activation and telemetry details.

## Choose your environment

| Environment | Start here |
|---|---|
| Local development with proxymock | [Install proxymock CLI](../../../proxymock/getting-started/installation.md) |
| Kubernetes | [Choose a Kubernetes installation](./kubernetes.md) |
| Docker | [Docker](./docker.md) |
| AWS ECS or Fargate | [AWS ECS/Fargate](./ecs.md) |
| Virtual machines | [Virtual Machines](./vm.md) |
| AWS Elastic Beanstalk | [AWS Elastic Beanstalk](./beanstalk.md) |
| Google Cloud Run | [Google Cloud Run](./cloudrun.md) |

After installing on Kubernetes, follow [Kubernetes capture with eBPF and Java Agent](/guides/capture/kubernetes) to select workloads and verify captured traffic.

For platform setup and cloud resource automation, [install speedctl](./cli.md). See [Command-line tools](../../command-line-tools.md) for help choosing between speedctl and proxymock.
