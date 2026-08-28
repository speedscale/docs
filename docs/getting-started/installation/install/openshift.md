---
title: Redhat OpenShift
description: This documentation provides a comprehensive guide on installing Speedscale in an OpenShift environment, detailing the necessary prerequisites and step-by-step instructions. Enhance your development workflow by seamlessly integrating Speedscale's capabilities into your OpenShift setup.
sidebar_position: 10
---

# Working with OpenShift

:::caution
This workflow is currently in preview status. Please provide feedback in our [slack community](https://slack.speedscale.com).
:::

## Prerequisites

1. An available OpenShift cluster with administrative access
1. [OpenShift CLI](https://docs.openshift.com/container-platform/4.11/cli_reference/openshift_cli/getting-started-cli.html)

[OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) is a container orchestration
offering from Red Hat that aims to provide a cloud-like platform that can be deployed either in existing cloud
infrastructure such as AWS or GCP, or in local or on-premise infrastructure. Compared to other container
orchestration platforms, OpenShift is built on top of Kubernetes so all of the standard Kubernetes concepts
and terminologies (e.g. Deployments, Pods) still apply. However, OpenShift adds features and tools to
Kubernetes that aim to provide the "enterprise-ready" characterics to which many users of CentOS or Red Hat
Enterprise Linux are already accustomed.

## Installing the Speedscale Operator

:::info Installation is always through the Helm chart
Speedscale is installed on OpenShift the same way as on any Kubernetes cluster: with the Speedscale Helm chart, following the standard [operator installation](./kubernetes-operator.md). Speedscale is not available through OperatorHub or the OpenShift web console's operator catalog. Use `helm` (or `helm template` plus `oc apply` in [Helm-restricted environments](/reference/ebpf-traffic-collection#installation)) for installation, and `oc` for the OpenShift-specific steps below. The web console is useful for watching the resulting workloads, but no part of the installation happens there.
:::

The following settings are required to be set in the `values.yaml` when [installing the Speedscale operator](./kubernetes-operator.md) for OpenShift. OpenShift injects it's own user and group IDs, so we need to set these fields as null to allow it to override them at deploy time. You can read more about how [here](https://www.redhat.com/en/blog/a-guide-to-openshift-and-uids).

```yaml
createJKS: false
privilegedSidecars: true
globalPodSecurityContext:
  runAsUser: null
  runAsGroup: null
globalSecurityContext:
  fsGroup: null
  supplementalGroups: null
```

## Capturing Traffic

:::warning Sidecar capture is deprecated
For new OpenShift installations, use the [eBPF collector](/reference/ebpf-traffic-collection) when your nodes meet its system requirements. Use the sidecar instructions below only for an existing deployment or an incompatible cluster.
:::

Speedscale is able to capture traffic from your workload by either running as a sidecar injected onto your workload or as an eBPF agent. The sidecar mode requires additional configuration and setup in order to function
correctly.

### Sidecar mode

#### Security Context Constraints

Running the sidecar as a transparent proxy is the default installation behavior and prevents needing to
configure manual proxies by initializing pods via `iptables` modifications. In standard Kubernetes
environments, this only requires the sidecar init container to run as root. This presents a challenge for
OpenShift environments since even with the container running as root, SELinux policies will still prevent the
necessary `iptables` modifications from taking place.

OpenShift uses [security context constraints](https://docs.openshift.com/container-platform/4.11/authentication/managing-security-context-constraints.html)
(SCCs) to place more restrictive rules on how pods can be run and what permissions they have as opposed to
plain Kubernetes.

In addition to needing an SCC that allows running as any specified user ID, the sidecar's init container also
requires additional capabilities to function correctly, namely `NET_ADMIN` and `NET_RAW`. [A custom SCC](#securitycontextconstraint-example) can be
added that allows both running with a specific user ID and the additional capabilities r the specific workload could be added to the built in `privileged` SCC provided by OpenShift.

```bash
oc create -f scc.yaml
```

Add this SCC to your service account group policy:

```bash
oc adm policy add-scc-to-group speedscale-sidecar system:serviceaccounts:<WORKLOAD_NAMESPACE>
```

Or

```bash
oc adm policy add-scc-to-group privileged system:serviceaccounts:<WORKLOAD_NAMESPACE>

```

When this is done, allow the Speedscale operator to add the sidecar to your workload using the `inject`
annotation. For example:

```bash
cat <<EOF | oc patch -n my-namespace deploy my-app -p -
annotations:
  sidecar.speedscale.com/inject: "true"
EOF
```

To stop capturing traffic, edit your workload to remove the sidecar

```bash
cat <<EOF | oc patch -n my-namespace deploy my-app -p -
annotations:
  sidecar.speedscale.com/inject: "false"
EOF
```

You may also remove the SCC from the service account group at this time if you no longer require it:

```bash
oc adm policy remove-scc-from-group speedscale-sidecar system:serviceaccounts:<WORKLOAD_NAMESPACE>
```

### eBPF

In eBPF mode, a daemonset is deployed to all nodes. In addition to the overrides specified earlier for the `values.yaml`, you'll need to specify a few more flags to enable capture through this mode:

```yaml
# Required regardless of sidecar mode
createJKS: false
privilegedSidecars: true
globalPodSecurityContext:
  runAsUser: null
  runAsGroup: null
globalSecurityContext:
  fsGroup: null
  supplementalGroups: null

# eBPF related settings
ebpf:
  enabled: true
```

No manual SCC setup is needed for eBPF capture. When the chart detects OpenShift (the `security.openshift.io/v1` API group), it creates a dedicated `speedscale-nettap` SecurityContextConstraints and grants it to the daemonset's service account automatically. The daemonset runs as a non-root user (UID 2102) rather than as root or privileged, with only the [documented capture capabilities](/reference/ebpf-traffic-collection#capabilities).

The Java agent init container that Speedscale injects for JVM TLS capture sets no user ID of its own, so it is compatible with the default `restricted-v2` SCC: OpenShift assigns it a user ID from the namespace's range like any other workload container.

#### Validating the deployment

Confirm the daemonset is running under the expected SCC and identity:

```bash
oc get pods -n speedscale -l app=speedscale-nettap
POD=$(oc get pods -n speedscale -l app=speedscale-nettap -o name | head -1)
oc get -n speedscale $POD -o jsonpath='{.metadata.annotations.openshift\.io/scc}'
```

The SCC annotation should read `speedscale-nettap`. Then check the capture process itself:

```bash
oc exec -n speedscale $POD -c speedscale-nettap-capture -- sh -c 'id; grep -E "CapPrm|CapEff" /proc/$(pidof nettap)/status'
```

Expected output: `uid=2102(nettap) gid=2102(nettap)` and `CapPrm`/`CapEff` both `000000c001281000`, which decodes to exactly `NET_ADMIN`, `SYS_PTRACE`, `SYS_ADMIN`, `SYS_RESOURCE`, `PERFMON`, and `BPF`. Confirm the probes loaded:

```bash
oc logs -n speedscale daemonset/speedscale-nettap -c speedscale-nettap-capture | grep -E "loading bpf objects|program attached"
```

Finally, verify capture end to end: send traffic to a capture target and confirm it appears in the [traffic viewer](https://app.speedscale.com). Exercise a plaintext endpoint, a Go TLS service, and an OpenSSL-based service (see the [TLS support table](/reference/ebpf-traffic-collection#tls-traffic-visibility)) to cover all three capture mechanisms.

#### Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Capture container logs `bpf objects failed to load: ... opening mem: open /proc/self/mem: permission denied` | nettap image older than `v0.1.62` running non-root on a RHEL 9 kernel | Upgrade to a chart that pins nettap `v0.1.62` or newer |
| Daemonset pods rejected with `unable to validate against any security context constraint` | The `speedscale-nettap` SCC is missing, usually because manifests were rendered outside the cluster without OpenShift API detection | Confirm with `oc get scc speedscale-nettap`; re-render against the cluster or apply the SCC from the chart manually |
| Capture container logs `failed to build kubernetes informer factories: RBAC` | The daemonset's ClusterRole or binding was not applied | Re-apply the chart's RBAC objects, or set `namespaceSelector` to restrict nettap to namespaces where it holds a Role |
| Plaintext capture works but TLS is missing for one service | The target binary or SSL library is not world-readable, so the non-root capture process cannot open it | Make the binary readable, or run capture as root for that cluster (see below) |

#### Upgrading an existing installation

Run the normal `helm upgrade` with your existing values. If you previously overrode `ebpf.nettap.capture.podSecurityContext` or `ebpf.nettap.ingest.podSecurityContext` to force root, remove those overrides so the non-root defaults apply; Helm merges user values over chart defaults, so a stale `runAsUser: 0` override keeps the daemonset on root indefinitely.

#### Running capture as root where required

Non-root capture is the default and works on standard OpenShift nodes. Run as root only when a specific platform blocks file capabilities (for example, container storage mounted `nosuid` by policy) or when target binaries are unreadable to a non-root user:

```yaml
ebpf:
  nettap:
    capture:
      podSecurityContext:
        runAsUser: 0
        runAsGroup: 0
    securityContext:
      runAsNonRoot: false
```

Treat this as a bounded exception for the affected cluster, not a recommended configuration.

## Replaying Traffic

As with capturing traffic in sidecar mode, replaying a traffic snapshot will also require an SCC that allows Speedscale
components to run with privileged access, regardless of the capture mode. For replays, you must [setup the SCC](#security-context-constraints) in order for all Speedscale components to be able to run.

## SecurityContextConstraint Example

```yaml
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: speedscale-sidecar
allowHostDirVolumePlugin: false
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegeEscalation: true
allowPrivilegedContainer: true
allowedCapabilities:
  - NET_ADMIN
  - NET_RAW
readOnlyRootFilesystem: false
fsGroup:
  type: RunAsAny
runAsUser:
  type: RunAsAny
seLinuxContext:
  type: RunAsAny
supplementalGroups:
  type: RunAsAny
volumes:
  - "*"
```

## Getting Help

If you are experiencing issues with this guide and have further questions, please reach out to us on the
[community Slack](https://slack.speedscale.com).
