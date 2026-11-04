---
title: Install Speedscale on Kubernetes
sidebar_label: Kubernetes
description: "Choose the standard operator or namespace-scoped installation, then review the requirements for your Kubernetes platform."
---

# Install Speedscale on Kubernetes

Choose an installation based on the permissions your platform team can grant. Both paths use the public `speedscale-operator` Helm chart. The installation mode determines which components run and how traffic is captured.

## Choose an installation

| | [Standard operator](./kubernetes-operator.md) | [Namespace-scoped installation](./kubernetes-namespaced.md) |
|---|---|---|
| Use when | Your platform team permits cluster-scoped resources | Your installer can write only in one existing application namespace |
| Permissions | Cluster RBAC, a Speedscale CRD, and admission webhooks | Namespace-scoped Roles and RoleBindings; no Speedscale CRD or admission webhook |
| Capture | eBPF when the cluster and workload meet its requirements; sidecar fallback when needed | Sidecar capture applied by proxymock with your kubeconfig; no eBPF DaemonSet |
| Replay | Operator-managed replay environments | Replay components share the application namespace and its resource quotas |

**Use the [standard operator](./kubernetes-operator.md) when cluster policy permits it.** It provides eBPF capture and needs less manual coordination. If cluster-scoped grants are unavailable, follow the [namespace-scoped guide](./kubernetes-namespaced.md) and review its [limitations and compatibility](./kubernetes-namespaced-limitations.md) before installing.

## Check your platform requirements

Review these guides before running the installation commands for your chosen mode:

- [OpenShift](./openshift.md): security context settings and SecurityContextConstraints.
- [GKE Autopilot](./gke-autopilot.md): privileged-workload allowlisting for eBPF and the sidecar fallback.
- [EKS Auto Mode](./eks-auto-mode.md): Bottlerocket SELinux settings for eBPF capture.
- [Istio](./istio.md): networking and sidecar interaction requirements.

Standard EKS and GKE clusters and local minikube clusters can start with the [standard operator guide](./kubernetes-operator.md). Review the [eBPF system requirements](/reference/ebpf-traffic-collection#system-requirements) for your nodes and application runtime.

Platform requirements and permission scope are separate choices. For example, a namespace-scoped OpenShift installation still needs a platform administrator to grant the workload's SCC permissions out of band. Follow the prerequisites for your selected installation mode as well as your platform.

## Storage and configuration

Choose the storage destination independently of Kubernetes permission scope. See [BYOC Kubernetes configuration](/byoc/configure-kubernetes) for customer-owned storage, the [Helm values reference](/reference/helm) for chart settings, and [bring your own TLS certificates](./bring-your-own-cert.md) for certificate configuration.

For installation failures, use [Troubleshooting](./troubleshooting.md). For namespace-scoped cleanup, use [Uninstall and recovery](./kubernetes-namespaced-runbooks.md).
