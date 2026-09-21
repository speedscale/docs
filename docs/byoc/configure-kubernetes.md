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

The chart reuses an existing bucket. Its Google service account (GSA) therefore needs `storage.objects.create` to write objects and `storage.buckets.get` to check that the bucket exists. `roles/storage.objectCreator` contains only the first permission, so add a narrowly scoped custom role for the second.

Create the GSA and custom role, then grant both roles on the bucket:

```bash
gcloud iam service-accounts create byoc-gcs \
  --project=<GCP_PROJECT>

gcloud iam roles create speedscaleByocBucketReader \
  --project=<GCP_PROJECT> \
  --title="Speedscale BYOC bucket reader" \
  --permissions=storage.buckets.get \
  --stage=GA

gcloud storage buckets add-iam-policy-binding gs://<GCS_BUCKET> \
  --member="serviceAccount:byoc-gcs@<GCP_PROJECT>.iam.gserviceaccount.com" \
  --role="roles/storage.objectCreator"

gcloud storage buckets add-iam-policy-binding gs://<GCS_BUCKET> \
  --member="serviceAccount:byoc-gcs@<GCP_PROJECT>.iam.gserviceaccount.com" \
  --role="projects/<GCP_PROJECT>/roles/speedscaleByocBucketReader"
```

The [GCS exporter documents](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/googlecloudstorageexporter#using-with-bucket-level-permissions-only) the extra bucket-read permission required by `reuse_if_exists`. The predefined [Storage Object Creator role](https://docs.cloud.google.com/storage/docs/access-control/iam-roles#storage.objectCreator) does not include it.

With Workload Identity Federation enabled on the cluster and node pool, link the deterministic Kubernetes service account (KSA) `byoc-gcs` in namespace `byoc-gcs` to the GSA. Both this IAM binding and the annotation in the Helm values are required by the [GKE service-account linking procedure](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/workload-identity#kubernetes-sa-to-iam):

```bash
gcloud iam service-accounts add-iam-policy-binding \
  byoc-gcs@<GCP_PROJECT>.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:<GCP_PROJECT>.svc.id.goog[byoc-gcs/byoc-gcs]"
```

Configure the KSA name and GSA annotation in `values-gcs.yaml`:

```yaml
gcs:
  project: <GCP_PROJECT>
  bucket: <GCS_BUCKET>
  region: <GCS_REGION>
serviceAccount:
  name: byoc-gcs
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

Use the receiver's actual protocol port. A reference collector normally uses OTLP/gRPC on `4317`. Including `http://` is recommended for compatibility with Forwarder versions older than v2.5.617; newer Forwarders also accept scheme-less gRPC endpoints.

:::

## 5. Enable capture

Annotate the workload you want to capture:

```bash
kubectl patch deployment my-app -p \
  '{"spec":{"template":{"metadata":{"annotations":{"capture.speedscale.com/enabled":"true"}}}}}'
```

The operator restarts or injects the required capture component according to the selected installation mode. Send a known request through the workload, then [verify each BYOC hop](./verify.md).
