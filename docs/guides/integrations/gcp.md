---
title: "GCP"
description: "Integrate Speedscale with Google Cloud Platform's GKE to optimize API testing and traffic replay while adhering to Autopilot's strict security policies"
sidebar_position: 4
---

# GCP

Speedscale is compatible with Google Cloud Platform editions of Kubernetes.

### Operator Support

The Speedscale operator is compatible with GCP GKE (Google Kubernetes Engine) Autopilot and Standard, versions v1.16 and newer.

### GKE Autopilot

Autopilot is an operational mode for GKE in which the entire cluster configuration, nodes, scaling, etc. are all managed by Google. Its strict security policies do not normally allow pods with privileged containers, which changes how Speedscale captures traffic.

Speedscale uses **eBPF** capture on Autopilot through a customer-owned WorkloadAllowlist. Existing deployments that cannot use eBPF can fall back to a **sidecar in dual proxy mode**; transparent proxy mode is not supported. Both paths and the required Autopilot Helm values are documented on the dedicated page:

➡️ **[GKE Autopilot install guide](/getting-started/installation/install/gke-autopilot)**
