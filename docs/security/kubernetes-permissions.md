---
title: Kubernetes Security Requirements
description: "Review the Kubernetes RBAC, admission webhooks, runtime certificates, and eBPF permissions required by Speedscale capture and replay."
sidebar_position: 3
---

# Kubernetes Security Requirements

This page covers the classic `speedscale-operator` chart, which uses Kubernetes admission webhooks, an operator service account, and namespaced resources to capture traffic and run replays. eBPF capture adds host-level runtime permissions. Setting `namespaceSelector` limits this operator's scope; it does not turn it into the separate `speedscale-namespaced` deployment mode.

The examples and defaults below were checked against [Speedscale Operator chart 2.5.978](https://github.com/speedscale/operator-helm/tree/main/charts/2.5.978). Render the exact chart version and values you plan to install; older versions have different runtime security contexts:

```bash
helm template speedscale-operator speedscale/speedscale-operator \
  --version 2.5.978 \
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
| ClusterRoles and ClusterRoleBindings | `get`, `create`, `list` without a name restriction; all verbs for `speedscale-operator`, `speedscale-forwarder`, and `speedscale-nettap` | Reconcile component RBAC during updates. |

The chart also grants `get` and `list` for Cilium nodes when that API is present. Installation and provisioning require broader create/update/delete access for the Speedscale secrets and admission webhook configurations that the chart installs.

### Namespace-scoped access

Within each namespace managed by Speedscale, the operator needs read/write access to the resources that make up a replay environment:

| Resource group | Resources | Why access is required |
| --- | --- | --- |
| Workloads | Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs, Pods, and Argo Rollouts | Inject or remove capture configuration, prepare the system under test, and create or clean up replay workloads. |
| Replay support | Services, ServiceAccounts, ConfigMaps, Roles, RoleBindings, and Leases | Connect replay components, provide configuration, and coordinate their lifecycle. |
| Service mesh | Istio EnvoyFilters, Sidecars, and PeerAuthentications | Configure traffic routing and TLS policy for replay. |
| Secrets | Kubernetes Secrets | Mount the Speedscale certificate secrets and customer-approved credentials used by replay transforms or mocked dependencies. |
| Speedscale APIs | `TrafficReplay`, `TrafficReplay/status`, `AgentTask`, and `AgentTask/status` | Create, reconcile, report status for, and clean up replay operations. |
| Diagnostics | Pod logs, events, and pod metrics | Collect replay diagnostics and report data. |

By default, an empty `namespaceSelector` gives the operator namespaced permissions across the cluster. Set `namespaceSelector` to create Roles and RoleBindings only in the selected application namespaces and the Speedscale installation namespace. The cluster-scoped discovery permissions above remain necessary.

Secret access is also configurable. An empty `secretAccessList` permits access to all Secrets in a managed namespace. A nonempty list adds Kubernetes `resourceNames` restrictions, including `speedscale-certs`, `speedscale-apikey`, `speedscale-jks`, and `speedscale-webhook-certs`. Validate capture and replay with this setting: [Kubernetes name restrictions](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#referring-to-resources) do not grant top-level `create` or `deletecollection`, and list/watch requests must select an allowed `metadata.name`. It is not a transparent filter over a namespace-wide Secret watch.

## Admission webhooks and the TrafficReplay API

The chart installs three admission webhook configurations:

- The **capture mutating webhook** observes supported workload changes and injects capture configuration when Speedscale annotations request it. It uses `failurePolicy: Ignore`.
- The **replay mutating webhook** defaults and prepares `TrafficReplay` resources.
- The **replay validating webhook** validates `TrafficReplay` create, update, and delete operations.

Both replay webhooks use `failurePolicy: Fail`, so an unavailable webhook can block matching replay API operations.

The namespaced `TrafficReplay` custom resource is the control API for a Kubernetes replay. The operator watches this resource and creates the generator, responder, collector, and supporting objects required by the selected replay mode. See the [TrafficReplay CRD reference](/reference/replay-crd) for its schema and examples.

## Replay runtime certificates

Speedscale uses two in-cluster Secrets for TLS mocking and Java trust:

| Secret | Contents and use |
| --- | --- |
| `speedscale-certs` | A CA certificate and private key used to generate certificates when mocking TLS APIs. Replay responders and workloads configured for TLS interception can receive the Secret through read-only volume mounts. Read-only mounts prevent file changes; they do not prevent those processes from reading the private key. |
| `speedscale-jks` | An optional convenience Java truststore containing the public CA certificate from `speedscale-certs` plus the standard OpenJDK CA set. TLS-enabled Java workloads can mount it and point the JVM at `cacerts.jks`. |

The chart creates `speedscale-certs` and the admission server's `speedscale-webhook-certs` by default. Set `createTLSCerts: false` when your PKI or secret manager provisions both Secrets. You must also populate the admission webhook CA bundles, for example through cert-manager annotations. See [Bringing Your Own TLS Certs](/getting-started/installation/install/bring-your-own-cert).

The `speedscale-jks` Secret is built by an optional pre-install Job. In chart 2.5.978 it uses the global security contexts, defaults to UID/GID 2100 with privilege escalation disabled, and supports a read-only root filesystem. It copies the selected runtime's truststore instead of modifying it in place. Older charts ran this Job as UID 0. Set `createJKS: false` when the Secret is pre-provisioned or Java truststore support is unnecessary. See [Java runtime image requirements](/reference/helm#bring-your-own-redis-and-java-runtime-images) and [Java TLS trust](/reference/java/tls).

## eBPF capture permissions

In chart 2.5.978, the optional `nettap` DaemonSet uses `hostNetwork: true` and `hostPID: true`. Its capture and ingest containers run as UID/GID 2102 with `runAsNonRoot: true` and `privileged: false`. Both set `allowPrivilegeEscalation: true` so their executables can acquire file capabilities. Each drops all capabilities before adding its required set. Non-root execution still requires policy approval for host access and these capabilities.

The complete capability list and the reason for each permission are documented in [eBPF Traffic Collection: Runtime Requirements](/reference/ebpf-traffic-collection#runtime-requirements).
