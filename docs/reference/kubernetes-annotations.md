---
title: Kubernetes Annotations
---

import SidecarAnnotations from './_sidecar-annotations.mdx'
import ReplayAnnotations from './_replay-annotations.mdx'
import CommonV2Annotations from '../reference/_common-annotations.mdx'

Below are all the relevant Kubernetes annotations for Speedscale.


## Sidecar Annotations

These annotations relate to the proxy sidecar that the Speedscale operator attaches to your workload.

<SidecarAnnotations />

## Replay Annotations

These annotations control traffic replay for your workload.

<ReplayAnnotations />

## Common Annotations

These annotations are common across workloads and Speedscale's Custom Resources.

<CommonV2Annotations />
