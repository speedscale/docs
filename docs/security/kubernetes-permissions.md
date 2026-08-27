---
title: Kubernetes Security Requirements
description: "Review the Kubernetes RBAC, admission webhooks, runtime certificates, and eBPF permissions required by Speedscale capture and replay."
sidebar_position: 3
---

# Kubernetes Security Requirements

Speedscale uses Kubernetes admission webhooks, an operator service account, and namespaced resources to capture traffic and run replays. eBPF capture adds host-level runtime permissions. This page summarizes those requirements for a security review.

The [Speedscale Operator Helm chart](https://github.com/speedscale/operator-helm) is the source of truth for a specific release. Render the chart version you plan to install to review its exact permissions:

```bash
helm template speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale \
  -f values.yaml > speedscale-manifests.yaml
```

## Operator RBAC

The operator separates cluster-scoped discovery from the namespaced access used to manage capture and replay resources.

### Cluster-scoped access

The operator requires the following cluster-scoped access at runtime:

| Resources | Access | Purpose |
| --- | --- | --- |
| Namespaces and nodes | `get`, `list`, `watch` | Discover available namespaces and nodes and place cluster components correctly. |
| Mutating and validating webhook configurations | `get`, `list` | Inspect the capture and replay admission webhooks installed by the chart. |
| CustomResourceDefinitions | `get`, `list` | Discover Speedscale custom resources, including the `TrafficReplay` API. |
| Speedscale ClusterRoles and ClusterRoleBindings | Manage the named Speedscale resources | Reconcile RBAC for the operator, forwarder, and eBPF collector during component updates. |

The chart also grants `get` and `list` for Cilium nodes when that API is present. Installation and provisioning require broader create/update/delete access for the Speedscale secrets and admission webhook configurations that the chart installs.

### Namespace-scoped access

Within each namespace managed by Speedscale, the operator needs read/write access to the resources that make up a replay environment:

| Resource group | Resources | Why access is required |
| --- | --- | --- |
| Workloads | Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs, Pods, and Argo Rollouts | Inject or remove capture configuration, prepare the system under test, and create or clean up replay workloads. |
| Replay support | Services, ServiceAccounts, ConfigMaps, Roles, RoleBindings, and Leases | Connect replay components, provide configuration, and coordinate their lifecycle. |
| Secrets | Kubernetes Secrets | Mount the Speedscale certificate secrets and customer-approved credentials used by replay transforms or mocked dependencies. |
| Speedscale APIs | `TrafficReplay`, `TrafficReplay/status`, `AgentTask`, and `AgentTask/status` | Create, reconcile, report status for, and clean up replay operations. |
| Diagnostics | Pod logs, events, and pod metrics | Collect replay diagnostics and report data. |

By default, an empty `namespaceSelector` gives the operator namespaced permissions across the cluster. Set `namespaceSelector` to create Roles and RoleBindings only in the selected application namespaces and the Speedscale installation namespace. The cluster-scoped discovery permissions above remain necessary.

Secret access is also configurable. An empty `secretAccessList` permits access to all Secrets in a managed namespace. Set it to an allowlist to restrict named Secret access; the chart always includes Speedscale's required internal secrets.

## Admission webhooks and the TrafficReplay API

The chart installs three admission webhook configurations:

- The **capture mutating webhook** observes supported workload changes and injects capture configuration when Speedscale annotations request it.
- The **replay mutating webhook** defaults and prepares `TrafficReplay` resources.
- The **replay validating webhook** validates `TrafficReplay` create, update, and delete operations.

The namespaced `TrafficReplay` custom resource is the control API for a Kubernetes replay. The operator watches this resource and creates the generator, responder, collector, and supporting objects required by the selected replay mode. See the [TrafficReplay CRD reference](/reference/replay-crd) for its schema and examples.

## Replay runtime certificates

Speedscale uses two in-cluster Secrets for TLS mocking and Java trust:

| Secret | Contents and use |
| --- | --- |
| `speedscale-certs` | A CA certificate and private key used to generate certificates when mocking TLS APIs. The key pair remains in Kubernetes Secrets inside the cluster. Replay responder pods and TLS-enabled workloads receive it through read-only volume mounts. |
| `speedscale-jks` | An optional convenience Java truststore containing the public CA certificate from `speedscale-certs` plus the standard OpenJDK CA set. TLS-enabled Java workloads can mount it and point the JVM at `cacerts.jks`. |

The chart creates `speedscale-certs` by default. Set `createTLSCerts: false` to use certificates provisioned by your own PKI or secret-management process. See [Bringing Your Own TLS Certs](/getting-started/installation/install/bring-your-own-cert).

The `speedscale-jks` Secret is built by an optional pre-install Job. This Job runs as UID 0 because it modifies the JDK truststore, while privilege escalation remains disabled. Set `createJKS: false` if Java truststore support is unnecessary or cluster policy requires every container to run as non-root. You can also [merge the Speedscale CA into your own JKS](/getting-started/installation/sidecar/tls#trusting-tls-certificates).

## eBPF capture permissions

The optional `nettap` eBPF collector runs as a DaemonSet with `hostNetwork: true` and `hostPID: true`. The current chart runs its capture and ingest containers as UID/GID 0, but does **not** enable Kubernetes privileged-container mode. Instead, it drops all capabilities and adds only the capabilities required by each container.

The complete capability list and the reason for each permission are documented in [eBPF Traffic Collection: Runtime Requirements](/reference/ebpf-traffic-collection#runtime-requirements).

