---
title: GKE Autopilot
description: Install Speedscale with eBPF traffic capture on a GKE Autopilot cluster using a customer-owned WorkloadAllowlist. Covers the Google Cloud support request, org policy, AllowlistSynchronizer, and the Autopilot-specific Helm values required to pass Warden admission.
sidebar_position: 12
---

# Working with GKE Autopilot

:::caution
This workflow is currently in preview status. Please provide feedback in our [Slack community](https://slack.speedscale.com).
:::

[GKE Autopilot](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview) is Google's fully managed mode for GKE. Autopilot blocks privileged workloads by default through its Warden admission controller. The Speedscale eBPF capture agent (`nettap`) needs Linux capabilities, host namespace access, and a few `hostPath` mounts that Warden rejects unless the workload is explicitly allowed.

This guide uses a **customer-owned [WorkloadAllowlist](https://cloud.google.com/kubernetes-engine/docs/how-to/autopilot-privileged-allowlists)** to approve the Speedscale agent on your project. This path is needed until the Speedscale Autopilot partner allowlist is published globally.

Expected timeline is about one week. Most of that is waiting for Google Cloud support to enable customer-owned WorkloadAllowlists on your project.

## Prerequisites

- A GCP project with billing enabled.
- A GCP **Organization** with a paid Customer Care tier (Standard or higher). Google requires an Organization resource to purchase any paid support tier, and you need a support case to request WorkloadAllowlist eligibility. A standalone billing account with no Organization (for example a personal account) cannot buy support and cannot complete Step 1.
- Permission to set project org policies.
- `gcloud`, `kubectl`, and `helm`.
- A Speedscale API key.
- Two files from Speedscale support, matched to a specific operator chart version:
  - `workload-allowlist.yaml`
  - `allowlist-synchronizer.yaml`

Contact [Speedscale support](https://slack.speedscale.com) to get the allowlist files. The `workload-allowlist.yaml` pins exact container image SHA-256 digests, so it is tied to one operator chart version. Install that exact chart version (see [Step 6](#6-install-speedscale-with-ebpf)).

Set these variables for the commands below:

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"
export CLUSTER_NAME="YOUR_CLUSTER_NAME"
export BUCKET_NAME="${PROJECT_ID}-speedscale-autopilot-allowlists"
export SPEEDSCALE_API_KEY="YOUR_SPEEDSCALE_API_KEY"
export CHART_VERSION="VERSION_MATCHED_TO_YOUR_ALLOWLIST"
```

Enable the required APIs:

```bash
gcloud services enable \
  container.googleapis.com \
  storage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  orgpolicy.googleapis.com \
  serviceusage.googleapis.com \
  --project "${PROJECT_ID}"
```

## 1. Request WorkloadAllowlist Eligibility

Create a Google Cloud support case.

- **Category:** GKE / Autopilot
- **Priority:** P3
- **Subject:** `Grant WorkloadAllowlist eligibility for project PROJECT_ID`

Description:

```text
We need to run Speedscale's eBPF-based traffic capture agent, nettap, as a
privileged DaemonSet on GKE Autopilot. The agent requires capabilities BPF,
PERFMON, NET_ADMIN, SYS_ADMIN, SYS_PTRACE, and SYS_RESOURCE, plus hostNetwork,
hostPID, and hostPath mounts for /proc, /sys, and /var/run/netns.

We are requesting eligibility to use customer-owned WorkloadAllowlists.

Speedscale is a GCP partner currently in the Autopilot Partner Allowlist review
process. This customer-owned path is needed until the partner allowlist is
published globally.

Project ID: PROJECT_ID
Cluster: CLUSTER_NAME
Region: REGION
```

Stop here until Google confirms the project is eligible for customer-owned WorkloadAllowlists. This usually takes 3 to 7 business days.

## 2. Upload the Speedscale Allowlist

After Google approves the project, create a bucket and upload the allowlist:

```bash
gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --project "${PROJECT_ID}" \
  --location "${REGION}"

gcloud storage cp workload-allowlist.yaml \
  "gs://${BUCKET_NAME}/nettap/workload-allowlist.yaml"
```

Grant the GKE service agent read access:

```bash
export PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
export GKE_SERVICE_AGENT="service-${PROJECT_NUMBER}@container-engine-robot.iam.gserviceaccount.com"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${GKE_SERVICE_AGENT}" \
  --role="roles/storage.objectViewer"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${GKE_SERVICE_AGENT}" \
  --role="roles/storage.bucketViewer"
```

The service account must use `container-engine-robot.iam.gserviceaccount.com`.

## 3. Allow the Bucket Path

Set the `container.managed.autopilotPrivilegedAdmission` org policy at the project level. Keep `allowAnyGKEPath: true` to preserve the default GKE-approved allowlists while adding the Speedscale bucket path.

```bash
cat > /tmp/speedscale-autopilot-policy.yaml <<EOF
name: projects/${PROJECT_ID}/policies/container.managed.autopilotPrivilegedAdmission
spec:
  rules:
  - enforce: true
    parameters:
      allowAnyGKEPath: true
      allowPaths:
      - gs://${BUCKET_NAME}/*
EOF

gcloud org-policies set-policy /tmp/speedscale-autopilot-policy.yaml \
  --update-mask=spec
```

Wait about 15 minutes before creating or updating the cluster.

## 4. Create or Update the Autopilot Cluster

For a new cluster:

```bash
gcloud container clusters create-auto "${CLUSTER_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --release-channel rapid \
  --autopilot-privileged-admission="gke://*,gs://${BUCKET_NAME}/*"
```

For an existing cluster:

```bash
gcloud container clusters update "${CLUSTER_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --autopilot-privileged-admission="gke://*,gs://${BUCKET_NAME}/*"
```

The `gke://*` entry keeps the default GKE-approved allowlist source enabled. The `gs://${BUCKET_NAME}/*` entry adds your Speedscale allowlist source.

Connect `kubectl`:

```bash
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}"
```

## 5. Install the AllowlistSynchronizer

Create a cluster-specific copy of the synchronizer file and apply it:

```bash
sed \
  -e "s/YOUR_PROJECT_NUMBER/${PROJECT_NUMBER}/g" \
  -e "s/YOUR_BUCKET_NAME/${BUCKET_NAME}/g" \
  allowlist-synchronizer.yaml > /tmp/speedscale-allowlist-synchronizer.yaml

kubectl apply -f /tmp/speedscale-allowlist-synchronizer.yaml
kubectl wait --for=condition=Ready allowlistsynchronizer/speedscale-nettap-sync --timeout=60s
```

Verify the synchronizer and allowlist were created:

```bash
kubectl get allowlistsynchronizer speedscale-nettap-sync -o yaml
kubectl get workloadallowlist speedscale-nettap -o yaml
```

If the synchronizer is not Ready, inspect `status.conditions[*].message` and `status.managedAllowlistStatus[*].lastError`.

## 6. Install Speedscale With eBPF

Add the Speedscale Helm repo and [install the operator](./kubernetes-operator.md) with eBPF enabled.

:::caution Pin the chart version
Install the chart version that matches your `workload-allowlist.yaml`. The allowlist pins exact image SHA-256 digests; a different chart version pulls different `nettap`/`goproxy` images whose digests will not match, and Warden will reject the nettap pods. To move to a newer version, get a re-pinned `workload-allowlist.yaml` from Speedscale first.
:::

```bash
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo update

helm upgrade --install speedscale-operator speedscale/speedscale-operator \
  --version "${CHART_VERSION}" \
  --namespace speedscale --create-namespace \
  --set apiKey="${SPEEDSCALE_API_KEY}" \
  --set clusterName="${CLUSTER_NAME}" \
  --set image.registry=gcr.io/speedscale \
  --set ebpf.enabled=true \
  --set 'sidecar.resources.limits.cpu=500m' \
  --set 'sidecar.resources.limits.memory=512Mi' \
  --set 'sidecar.resources.limits.ephemeral-storage=100Mi' \
  --set 'sidecar.resources.requests.cpu=500m' \
  --set 'sidecar.resources.requests.memory=512Mi' \
  --set 'sidecar.resources.requests.ephemeral-storage=100Mi'
```

Autopilot requires that resource requests and limits match, and that every container declares `ephemeral-storage`. The `ephemeral-storage` values are required for Speedscale replay init containers to pass Warden admission.

Verify the install:

```bash
kubectl get pods -n speedscale
kubectl get pods -n speedscale -l app=speedscale-nettap
```

The nettap pod should show `2/2 Running` on each node.

## 7. Configure a Capture Target

Set the namespace and app label for the workload you want to capture, then add it as an eBPF capture target:

```bash
export APP_NAMESPACE="YOUR_APP_NAMESPACE"
export APP_NAME="YOUR_APP_LABEL"

helm upgrade speedscale-operator speedscale/speedscale-operator \
  --version "${CHART_VERSION}" \
  --namespace speedscale --reuse-values \
  --set "ebpf.configuration.capture.targets[0].name=${APP_NAME}" \
  --set "ebpf.configuration.capture.targets[0].namespaceSelector.matchLabels.kubernetes\\.io/metadata\\.name=${APP_NAMESPACE}" \
  --set "ebpf.configuration.capture.targets[0].podSelector.matchLabels.app=${APP_NAME}"
```

`--reuse-values` preserves your install values but not the chart version, so pin `--version` again here. Generate traffic against the workload, then confirm it appears in Speedscale.

## Updating Speedscale Versions

The WorkloadAllowlist pins container image digests, so it must be updated in lockstep with the chart. When Speedscale provides an updated `workload-allowlist.yaml` (and its matching chart version), upload it to the same bucket path:

```bash
gcloud storage cp workload-allowlist.yaml \
  "gs://${BUCKET_NAME}/nettap/workload-allowlist.yaml"
```

Force a sync:

```bash
kubectl annotate allowlistsynchronizer speedscale-nettap-sync \
  force-sync="$(date +%s)" --overwrite
```

Then upgrade the chart to the matching `--version`.

## Java Agent Notes

For workloads that make outbound HTTPS calls, the Speedscale [Java Agent](../../../reference/languages/java.md) instruments `SSLSocketImpl` and `SSLEngineImpl` to decrypt TLS traffic.

On Autopilot, the operator's Java Agent init container can be rejected if the injected container does not declare explicit `ephemeral-storage` resources. Speedscale support can provide a workload-specific patch when outbound HTTPS capture is required. If you manually patch a deployment for the Java Agent, re-apply the patch after each replay, since replay cleanup restores the target deployment to its pre-replay state.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Pods rejected by `autopilot-allowlist-synchronizer-limitation` | Google has not enabled customer-owned WorkloadAllowlists on the project | Wait for support approval (Step 1), then retry |
| Cluster create/update fails with `Cluster is not authorized to use custom allowlist paths` | Project eligibility missing, or the org policy has not propagated | Confirm support approval, verify the org policy, wait 15 minutes, retry |
| AllowlistSynchronizer not Ready | Bucket IAM, path mismatch, invalid YAML, or incompatible GKE version | Confirm `container-engine-robot` has `objectViewer` and `bucketViewer`, then inspect synchronizer status |
| Nettap pods rejected by Warden | Resource requests and limits do not match | Reinstall with matching requests and limits |
| Replay init containers rejected by Warden | Missing `ephemeral-storage` values | Reinstall with the `sidecar.resources.*.ephemeral-storage=100Mi` values |
| Nettap image digest mismatch after a chart upgrade | Installed chart version does not match the allowlist | Install the chart `--version` that matches your `workload-allowlist.yaml`, or upload the updated allowlist from Speedscale |
| Forwarder crashes with `FATAL: failed to get filter rule` | `filterRule=none` in the configmap | Patch it: `kubectl patch cm speedscale-forwarder -n speedscale --type merge -p '{"data":{"SPEEDSCALE_FILTER_RULE":"standard"}}'` |

## Getting Help

If you are experiencing issues with this guide and have further questions, please reach out to us on the [community Slack](https://slack.speedscale.com).
