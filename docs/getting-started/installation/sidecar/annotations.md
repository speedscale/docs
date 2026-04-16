---
title: Configuration Reference
description: "Configure the Speedscale sidecar using Kubernetes annotations for optimal API testing and traffic replay in your workloads."
sidebar_position: 5
---

import SidecarAnnotations from '@site/src/partials/reference/sidecar-annotations.mdx';

The Speedscale sidecar can be configured with the use of annotations added to your Kubernetes workload. The
following are the currently supported annotations:

:::info Prefer eBPF in Kubernetes
For Kubernetes traffic capture, enable the [eBPF collector](/reference/ebpf-traffic-collection) when possible. The annotations below apply when using the sidecar as a fallback.
:::

<SidecarAnnotations />
