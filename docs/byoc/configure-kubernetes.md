---
title: Configure BYOC on Kubernetes
description: Install a BYOC collector and configure named Speedscale Forwarder exporters on Kubernetes.
---

# Configure BYOC on Kubernetes

This guide installs a reference collector and connects the Speedscale Forwarder to it. Repeat the backend and exporter steps for every independent destination channel.

## Prerequisites

- A Kubernetes cluster such as EKS, GKE, AKS, k3s, or minikube
- `kubectl` configured for the cluster and Helm 3
- A Speedscale API key with BYOC enabled
- Credentials and an existing destination for the backend you select

## 1. Add the Helm repositories

```bash
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo add speedscale-byoc https://speedscale.github.io/speedscale-byoc/
helm repo update
```

## 2. Create the Speedscale API key Secret

```bash
kubectl create namespace speedscale
kubectl -n speedscale create secret generic speedscale-apikey \
  --from-literal=SPEEDSCALE_API_KEY="<YOUR_API_KEY>" \
  --from-literal=SPEEDSCALE_APP_URL="app.speedscale.com"
```

## 3. Install a backend collector

Install each collector in its own namespace. The chart README contains its complete IAM policy, credential, and configuration options.

### Amazon S3 with static credentials

```bash
kubectl create namespace byoc-s3
kubectl -n byoc-s3 create secret generic s3-creds \
  --from-literal=accessKeyId="<AWS_ACCESS_KEY_ID>" \
  --from-literal=secretAccessKey="<AWS_SECRET_ACCESS_KEY>"

helm upgrade --install byoc-s3 speedscale-byoc/fluentbit-s3 \
  -n byoc-s3 \
  --set s3.bucket="<S3_BUCKET>" \
  --set s3.region="<AWS_REGION>" \
  --set s3.credentialsSecret="s3-creds"
```

### Amazon S3 with EKS IAM Roles for Service Accounts

```bash
helm upgrade --install byoc-s3 speedscale-byoc/fluentbit-s3 \
  -n byoc-s3 --create-namespace \
  --set s3.bucket="<S3_BUCKET>" \
  --set s3.region="<AWS_REGION>" \
  --set irsa.enabled=true \
  --set irsa.roleArn="arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>"
```

### Native Google Cloud Storage

Grant a Google service account `roles/storage.objectCreator` on the bucket. Configure GKE Workload Identity in `values-gcs.yaml`:

```yaml
gcs:
  project: <GCP_PROJECT>
  bucket: <GCS_BUCKET>
  region: <GCS_REGION>
serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: byoc-gcs@<GCP_PROJECT>.iam.gserviceaccount.com
```

```bash
helm upgrade --install byoc-gcs speedscale-byoc/gcs \
  -n byoc-gcs --create-namespace \
  -f values-gcs.yaml
```

### Loki and Grafana

```bash
helm upgrade --install byoc-grafana speedscale-byoc/grafana \
  -n byoc-grafana --create-namespace
```

### Elasticsearch and Kibana

```bash
helm upgrade --install byoc-elasticsearch speedscale-byoc/elasticsearch \
  -n byoc-elasticsearch --create-namespace
```

For Azure Blob, Datadog, Dynatrace, New Relic, and advanced values, select the chart from the [backend guide](./backends.md) and follow its README.

## 4. Configure named Forwarder exporters

Add one entry under `forwarder.exporters` for every collector. Keep filters and DLP configuration explicit per destination:

```yaml
forwarder:
  exporters:
    byoc_s3:
      otel_endpoint: "http://otel-collector.byoc-s3.svc.cluster.local:4317"
      filter_rule: standard
      dlp_config_id: standard
    byoc_grafana:
      otel_endpoint: "http://otel-collector.byoc-grafana.svc.cluster.local:4317"
      filter_rule: standard
      dlp_config_id: standard
```

Install or upgrade the operator with that values file:

```bash
helm upgrade --install speedscale-operator speedscale/speedscale-operator \
  -n speedscale --create-namespace \
  --set apiKeySecret=speedscale-apikey \
  --set clusterName=<CLUSTER_NAME> \
  -f values.yaml
```

:::caution

Every `otel_endpoint` must include `http://` and use the receiver's actual protocol port. A reference collector normally uses OTLP/gRPC on `4317`.

:::

## 5. Enable capture

Annotate the workload you want to capture:

```bash
kubectl patch deployment my-app -p \
  '{"spec":{"template":{"metadata":{"annotations":{"capture.speedscale.com/enabled":"true"}}}}}'
```

The operator restarts or injects the required capture component according to the selected installation mode. Send a known request through the workload, then [verify each BYOC hop](./verify.md).
