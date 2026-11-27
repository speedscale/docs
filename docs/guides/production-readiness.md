---
description: "Rehearse production traffic capture in non-production, approve the IaC change, and verify that capture and replay data stay in your object storage."
sidebar_position: 20
---

# Production Readiness

Before recording production traffic, run one business transaction through the capture, storage, and replay setup you plan to promote. Use Speedscale Cloud in non-production to inspect traffic and tune rules quickly. Then rehearse the production BYOC configuration against a test bucket. Your deployment approval should identify the tested Git revision, the settings that differ in production, and how to stop capture.

## Choose the production storage and capture mode {#preparation-checklist}

For Kubernetes deployments where captured requests and responses, replay inputs, and reports must stay in your account, use [BYOC direct storage](/byoc/#direct-storage). The namespaced Forwarder writes to your S3, S3-compatible, GCS, or Azure Blob object store. Capture uses a sidecar on a Deployment or StatefulSet. Stage the snapshot locally and run a namespaced replay with `--snapshot-source local` to keep replay artifacts in your storage. Dashboard-initiated Cloud replays upload snapshots to Speedscale Cloud.

If you need node-level eBPF capture, use the classic Operator with [BYOC collector export](/byoc/#collector-export-on-kubernetes). The Forwarder sends captured traffic to your OpenTelemetry Collector. To reuse it, [import from the bucket](/byoc/use-traffic) and replay locally with proxymock. Direct replay storage requires the namespaced install. Adding a collector exporter to the classic install leaves its Cloud traffic route active. For a storage-only production capture, assign a drop-all rule to the Cloud `filterRule` before enabling capture, and give the bucket exporter its own keep filter and DLP rule.

Confirm the production support agreement and BYOC Enterprise entitlement with Speedscale. For either path, allow the Speedscale API route needed for registration, configuration, and operational telemetry. Approve the storage route, workload identity, bucket access, encryption, and retention separately. See [Configure BYOC on Kubernetes](/byoc/configure-kubernetes).

## Tune one transaction in non-production

1. Choose a representative operation, for example a checkout that calls an inventory service. Give the request a unique, non-sensitive marker. Record the expected application response and dependency calls.
2. Where your data policy permits, enable a hybrid capture for that workload. Send approved non-production traffic to Speedscale Cloud and use a named collector exporter to send a copy to a test bucket. Configure filters and data loss prevention (DLP) for **each** destination before sending the request. Filter probes and out-of-scope workloads before export.
3. Find the marked request in Traffic Viewer and in a newly written bucket object. Inspect the inbound request, application response, and outbound dependency exchange in both places. Check that sensitive fields are masked in the stored object before applying any import-time redaction. Check that the excluded traffic is absent.
4. Save the tested filter and DLP definitions in Git. A rule name can still point to edited contents. If you tuned a rule in the UI, pull its JSON and run the [local rule tests](/proxymock/guides/local-rules) against representative recordings. Keep raw captures and credentials out of the pull request.

## Rehearse the production change {#deployment-checklist}

Build the approval workflow in non-production with the same IaC pipeline that will deploy production. Use a separate rehearsal namespace and test bucket for the production storage mode. In the rehearsal, disable Cloud payload export and exercise the same capture and replay paths you will use in production.

### Example promotion pull request

Suppose you are promoting direct S3 storage for a `checkout` canary. Commit the pinned chart and component versions, shared Helm values, capture target, and rule contents. Put the environment-specific values in separate overlays. Reference credentials through workload identity or an existing Secret. A reviewer should be able to account for every difference, including the following example settings.

| Setting | Non-production rehearsal | Production canary |
| --- | --- | --- |
| Workload and namespace | `checkout-canary` in `checkout-test` | `checkout-canary` in `checkout-prod` |
| Capture and transport | Namespaced sidecar, `namespaced.forwarder.primaryTransport: byoc` | Same mode, with the same chart, image pins, and rule contents |
| Storage destination | `checkout-capture-test` bucket | `checkout-capture-prod` bucket |
| Forwarder identity | Role scoped to the test bucket and prefix | Role scoped to the production bucket and prefix |
| Other payload destinations | None | None |

Start from the [direct-storage Helm values](/byoc/configure-kubernetes#customer-owned-s3-replay-storage), including `namespaced.enabled: true`. In CI, render the rehearsal and production values from the same checkout. For example, if your repository stores the approved chart version in `chart-version.txt` and the values in `capture/`, this Bash step produces a review copy with Kubernetes Secret values removed. It uses yq v4.

```bash
set -o pipefail
helm template checkout-capture speedscale/speedscale-operator \
  --version "$(cat chart-version.txt)" --namespace checkout-prod \
  -f capture/shared.yaml -f capture/production.yaml |
  yq 'with(select(.kind == "Secret"); del(.data, .stringData))' > production-review.yaml
```

Render again with `checkout-test` and `capture/rehearsal.yaml`. Compare the manifests, including the Forwarder transport, enabled exporters, identities, and permissions. A namespaced direct-storage render should contain only namespaced resources. Deploy from the pinned chart and committed values. Reserve the sanitized manifests for review. Include the workload capture step in the review as well. For namespaced capture, the [sidecar injection and removal steps](/guides/capture/sidecar-namespaced) both roll the workload. Argo CD or Flux can undo a live injection. For a bounded trial, use a dedicated canary whose pod template your approved pipeline controls throughout the recording window.

### Evidence to attach before approval {#validation}

- Send the marked request through the rehearsal canary. Retrieve the stored request/response pair with the expected service and namespace. Verify the response body, dependency calls, and redactions. Confirm that the same marker is absent from Cloud traffic for that cluster and time window.
- Import a bounded sample and replay against an isolated test workload. Verify the application status and assertions, expected mock hits, and any unexpected dependency passthrough. Check authentication using the rehearsal workload identity. A finished replay can contain a `401` from the application.
- For direct storage, retrieve the final replay report from the test bucket. For collector export, verify both the stored capture and the local replay result. The [BYOC verification guide](/byoc/verify) gives the checks for each path.
- Attach the sanitized manifest diff, the revision tested, redacted evidence, and the rollback procedure to the pull request. Record the acceptable application latency, error rate, capture volume, and resource limits for the canary window. Route the change through your normal deployment approval. Deploy the reviewed revision and repeat the rehearsal if capture behavior or rules change.

## Run and stop the production canary

Enable capture for one workload for the approved time window. If you need only a fraction of its traffic, route that share to a dedicated canary with stable labels. Send a fresh marked request. Verify production identity and storage access, locate the redacted record in the production bucket, and check Cloud traffic for an unintended copy. Compare application latency and errors to the baseline. Check the Forwarder logs and, if using collector export, the collector logs for queue drops, retries, or rejected writes. Healthy pods alone cannot confirm delivery.

At the end of the window, or sooner if a check fails, apply the rehearsed stop change through the same pipeline. For namespaced sidecar capture, uninject the canary while the Forwarder is available and wait for the workload rollout. For eBPF, revert the target selector or annotation in Git and reconcile. After queued writes drain, send a fresh marker to the workload. Confirm the application still responds and no new capture for that marker appears. Expand to the next workload only after the first canary meets the agreed limits and the stop procedure works.

### Additional checks for classic eBPF capture

- Check [kernel, container runtime, protocol, and TLS support](/reference/ebpf-traffic-collection#system-requirements). Have the platform team verify that admission policy permits the privileged nettap DaemonSet and its host mounts. Check [Istio networking](/getting-started/installation/install/istio#external-networking-requirements) or [GKE Autopilot requirements](/getting-started/installation/install/gke-autopilot) where applicable.
- Use the Operator's `namespaceSelector` to limit webhook scope and permissions. Separately [select the workloads to capture](/reference/ebpf-traffic-collection#enabling-via-helm). For GitOps-only control, set `dashboardAccess: false`. Review `secretAccessList` for transforms that read Secrets. An empty list allows access to all Secrets in the configured namespaces.
- Verify nettap is ready on each target node. Where TLS capture requires it, re-establish long-lived connections after probes attach and confirm the marked exchange decodes. Measure Operator, Forwarder, and per-node nettap CPU, memory, restarts, and throttling during capture. Follow the [workload impact procedure](/reference/ebpf-traffic-collection/workload-impact) to compare against the baseline.
