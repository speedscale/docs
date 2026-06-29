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

Autopilot is an operational mode for GKE in which the entire cluster configuration, nodes, scaling, etc. are all managed by Google. It applies strict security policies — most notably, it does not allow pods with privileged containers — which changes how Speedscale captures traffic.

Speedscale supports two capture paths on Autopilot: **eBPF** (via a customer-owned WorkloadAllowlist) and a **sidecar in dual proxy mode** (transparent proxy is not supported). Both, along with the required Autopilot Helm values and per-workload annotations, are documented on the single dedicated page:

➡️ **[GKE Autopilot install guide](/getting-started/installation/install/gke-autopilot)**
