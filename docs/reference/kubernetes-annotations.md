---
title: Kubernetes Annotations
sidebar_position: 9
---

import SidecarAnnotations from './_sidecar-annotations.mdx'
import CommonV2Annotations from '../reference/_common-annotations.mdx'

Below are all the relevant Kubernetes annotations for the Speedscale sidecar. Replays are controlled using [Custom Resource Definitions](./replay-crd.md)

## Common Annotations

These annotations are common across workloads and Speedscale's Custom Resources.

<CommonV2Annotations />

## Sidecar Annotations

These annotations relate to the proxy sidecar that the Speedscale operator attaches to your workload.

<SidecarAnnotations />
