---
title: Kubernetes Annotations
description: "Configure Kubernetes eBPF capture and Java Agent injection, with common operator annotations and legacy sidecar settings."
sidebar_position: 9
---

import SidecarAnnotations from '@site/src/partials/reference/sidecar-annotations.mdx'
import CommonV2Annotations from '@site/src/partials/reference/common-annotations.mdx'

Start with [Kubernetes capture with eBPF and Java Agent](/guides/capture/kubernetes) for prerequisites, manifest placement, rollout requirements, persistence, and capture verification. The capture annotations below configure the standard operator's capture path. Replays are controlled using [Custom Resource Definitions](./replay-crd.md).

## Capture annotations

Set these on the workload's top-level `metadata.annotations`, outside the pod template. The eBPF controller supports Deployments, StatefulSets, DaemonSets, Jobs, and installed Argo Rollouts. The standard operator and collector must be installed and permitted to watch the namespace. A strict [namespace-scoped installation](/getting-started/installation/install/kubernetes-namespaced) has no collector or injection webhook and uses a separate [sidecar capture workflow](/guides/capture/sidecar-namespaced).

| Annotation | Values | Effect |
| --- | --- | --- |
| `capture.speedscale.com/enabled` | `"true"` or `"false"`; default `"false"` | Selects the workload's pods for eBPF capture. Requires `ebpf.enabled: true` in the Speedscale Helm release. |
| `capture.speedscale.com/java-agent` | `"true"` or `"false"`; default `"false"` | Adds the Java Agent init container, volume, and JVM startup option. Can be combined with eBPF capture. Requires new pods and a JVM restart. See [compatibility](/reference/java/agent#compatibility). |
| `capture.speedscale.com/java-agent-tag` | Agent image tag; omitted uses the installation's default nettap component tag | Overrides the Java Agent init-container image tag. Check the image on a new pod when comparing agent versions. |
| `capture.speedscale.com/ignore-ports` | Comma-separated port numbers, `1` to `65535`; omitted excludes no ports through this annotation | Excludes the listed ports from eBPF capture for this workload. Invalid entries are skipped and logged by the operator. |

Keep annotations in the workload's [Helm/GitOps source](/guides/capture/kubernetes#preserve-capture-across-redeploys) so they survive workload recreation or reconciliation. Do not enable `sidecar.speedscale.com/inject` together with either eBPF capture or Java Agent injection; the standard operator rejects those combinations.

## Common annotations {#common-annotations}

These annotations are common across workloads and Speedscale's Custom Resources.

<CommonV2Annotations />

## Legacy sidecar annotations {#sidecar-annotations}

These settings apply to the [legacy sidecar fallback](/getting-started/installation/sidecar/install). Use the capture annotations above for standard Kubernetes capture.

<SidecarAnnotations />
