---
title: Kubernetes Annotations
---

import SidecarAnnotations from './_sidecar-annotations.mdx'
import ReplayAnnotations from './_replay-annotations.mdx'
import CommonV2Annotations from './_common-annotations.mdx'
import SidecarV2Annotations from './_v2-sidecar-annotations.mdx'
import ReplayV2Annotations from './_v2-replay-annotations.mdx'

Below are all the relevant Kubernetes annotations for Speedscale.

## Operator v1 Annotations

### Sidecar Annotations

These annotations relate to the proxy sidecar that Speedscale attaches to your workload with operator v1.

<SidecarAnnotations />

### Replay Annotations

These annotations control traffic replay for your workload with operator v1.

<ReplayAnnotations />


## Operator v2 Annotations

In preparation for a new release of the Speedscale operator, the following annotations and changes will be made. Some annotations are removed, renamed, or have new value types.

### Common Annotations

These annotations are common across workloads and Speedscale's Custom Resources.

<CommonV2Annotations />

### Sidecar Annotations

Operator v2 makes changes to the set of annotations applied. Some annotations are removed or renamed.

<SidecarV2Annotations />

### Replay Annotations

The `test.speedscale.com` subdomain was changed to `replay.speedscale.com`. See below for more detailed changes.

<ReplayV2Annotations />
