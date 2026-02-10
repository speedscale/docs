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

### eBPF (Beta)

In eBPF mode, a privileged daemonset is deployed to all nodes and uses the built in `privileged` SCC provided by OpenShift. In addition to the overrides specified earlier for the `values.yaml`, you'll need to specify a few more flags to enable capture through this mode:

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
  configuration:
    capture:
      # targets to be monitored and captured by the ebpf capture process
      targets:
        - name: example-service
          namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: mynamespace
          podSelector:
            matchLabels:
              app: myapp
```

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
