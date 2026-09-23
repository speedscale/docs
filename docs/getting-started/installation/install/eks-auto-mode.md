---
title: EKS Auto Mode
description: Install Speedscale on Amazon EKS Auto Mode with eBPF or transparent sidecar capture on Bottlerocket nodes.
sidebar_position: 13
---

# Working with EKS Auto Mode

[Amazon EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode.html) extends AWS management to cluster compute, networking, load balancing, and storage. Auto Mode nodes use AWS-managed Bottlerocket images with immutable root filesystems and SELinux enforcement.

Speedscale supports two capture paths on EKS Auto Mode:

- **eBPF capture** runs `nettap` on each node and can cover multiple namespaces and workloads. Outbound TLS inspection on Bottlerocket requires the `control_t` SELinux type shown below.
- **Sidecar capture** injects `goproxy` into selected workloads. The validated configuration needs no EKS Auto Mode or Bottlerocket exception, and transparent proxy mode works without the `dual` proxy configuration required by GKE Autopilot.

Unlike [GKE Autopilot](./gke-autopilot.md), EKS Auto Mode does not require a cluster-level privileged-workload allowlist for Speedscale. The eBPF configuration on this page changes only the SELinux type of the `nettap` capture container. The container remains `privileged: false`.

:::info Validated configuration
This configuration was validated with Kubernetes 1.35 on EKS Auto Mode, Bottlerocket EKS Auto Standard 2026.9.14, Speedscale chart 2.5.1008, and `nettap` 0.1.78.
:::

## Prerequisites

- An EKS cluster with Auto Mode enabled.
- `kubectl` connected to the cluster.
- Helm 3.
- A Speedscale API key.
- Platform and security approval for the `control_t` SELinux setting if you use eBPF capture.

Set the cluster name and API key used by the commands below:

```bash
export CLUSTER_NAME="YOUR_CLUSTER_NAME"
export SPEEDSCALE_API_KEY="YOUR_SPEEDSCALE_API_KEY"
```

Confirm that workloads are running on Auto Mode nodes:

```bash
kubectl get nodes -L eks.amazonaws.com/compute-type,kubernetes.io/os
```

Auto Mode nodes report `auto` under `eks.amazonaws.com/compute-type` and `linux` under `kubernetes.io/os`.

## Install Speedscale with eBPF

Create `eks-auto-values.yaml` with the Bottlerocket SELinux override:

```yaml
ebpf:
  enabled: true
  nettap:
    capture:
      podSecurityContext:
        seLinuxOptions:
          type: control_t
```

The complete Helm path is `ebpf.nettap.capture.podSecurityContext.seLinuxOptions.type`. Putting `seLinuxOptions` under `ebpf.nettap.securityContext` does not configure the capture container.

Install the Speedscale operator:

```bash
helm repo add speedscale https://speedscale.github.io/operator-helm/
helm repo update

helm upgrade --install speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale --create-namespace \
  --set apiKey="${SPEEDSCALE_API_KEY}" \
  --set clusterName="${CLUSTER_NAME}" \
  --values eks-auto-values.yaml
```

For general operator configuration, see the [Kubernetes installation guide](./kubernetes-operator.md) and [Helm values reference](/reference/helm.md).

## Verify nettap on Auto Mode nodes

Check the `nettap` pods and DaemonSet:

```bash
kubectl get pods -n speedscale -l app=speedscale-nettap -o wide
kubectl get daemonset -n speedscale speedscale-nettap
```

Each Auto Mode node should have a `nettap` pod in the `Running` state. The DaemonSet's desired, current, and ready counts should match for the nodes where it is scheduled.

Confirm that the capture container received the SELinux type:

```bash
kubectl get daemonset -n speedscale speedscale-nettap \
  -o jsonpath='{.spec.template.spec.containers[?(@.name=="speedscale-nettap-capture")].securityContext.seLinuxOptions.type}{"\n"}'
```

The command should print `control_t`.

## Configure an eBPF capture target

Set the namespace and application label for the workload you want to capture:

```bash
export APP_NAMESPACE="YOUR_APP_NAMESPACE"
export APP_NAME="YOUR_APP_LABEL"
```

Add the capture target while preserving the installation values:

```bash
helm upgrade speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale --reuse-values \
  --set "ebpf.configuration.capture.targets[0].name=${APP_NAME}" \
  --set "ebpf.configuration.capture.targets[0].namespaceSelector.matchLabels.kubernetes\\.io/metadata\\.name=${APP_NAMESPACE}" \
  --set "ebpf.configuration.capture.targets[0].podSelector.matchLabels.app=${APP_NAME}"
```

Generate traffic from the selected workload, then confirm that the traffic appears in Speedscale. The [eBPF traffic collection reference](/reference/ebpf-traffic-collection) covers additional target and protocol configuration.

## Use sidecar capture

:::warning Sidecar capture is deprecated
Use eBPF for new Kubernetes installations. Sidecar capture remains available for existing deployments or when your security policy does not permit the Bottlerocket SELinux override.
:::

Sidecar capture is available when you want to capture individual workloads without the Bottlerocket SELinux override. Add these annotations to the workload's pod template:

```yaml
metadata:
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls-out: "true"
```

The validated EKS Auto Mode configuration uses the default transparent proxy. Do not add `sidecar.speedscale.com/proxy-type: "dual"` unless your application has a separate reason to use explicit proxy routing.

The `tls-out` annotation enables outbound TLS interception. The application must also trust the Speedscale certificate authority as described in [TLS Support](/getting-started/installation/sidecar/tls.md).

After the workload rolls out, verify that the injected container is ready:

```bash
kubectl get pods -n "${APP_NAMESPACE}"
kubectl get pod -n "${APP_NAMESPACE}" -l "app=${APP_NAME}" \
  -o jsonpath='{.items[0].spec.containers[*].name}{"\n"}'
```

The container list should include `speedscale-goproxy`.

## Security considerations

The `control_t` setting is a deliberate privilege relaxation. Bottlerocket normally assigns ordinary containers the `container_t` SELinux type and isolates pods with Multi-Category Security labels. Outbound TLS inspection requires `nettap` to read the target process's loader and TLS libraries through `/host/proc/<pid>/root`, which the default isolation blocks.

Bottlerocket documents `control_t` as a privileged SELinux label. It grants more host access than `container_t`, including access to the Bottlerocket API socket. It is narrower than `super_t`, which can modify any file or directory on the host, and the validated Speedscale configuration does not set the container to privileged mode. Review this setting with your platform and security teams before deployment. See [Bottlerocket security guidance](https://github.com/bottlerocket-os/bottlerocket/blob/develop/SECURITY_GUIDANCE.md#limit-use-of-privileged-selinux-labels).

## Troubleshooting

Inspect the capture container logs:

```bash
kubectl logs -n speedscale -l app=speedscale-nettap -c speedscale-nettap-capture --tail=200
```

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `permission denied` while reading `/host/proc/<pid>/root/...` | The capture container is still using the default `container_t` SELinux type | Confirm that the Helm value uses the exact `ebpf.nettap.capture.podSecurityContext.seLinuxOptions.type` path, then upgrade the release |
| Failure to read `libssl` or `openssl attach failure` | SELinux blocked `nettap` from inspecting the target process's OpenSSL library | Apply `type: control_t`, restart the `nettap` pods through a Helm upgrade, and verify the rendered DaemonSet |
| Kernel eBPF events appear but outbound HTTPS traffic is missing | Kernel attachment succeeded, but TLS library inspection is blocked | Check for the SELinux and OpenSSL errors above; do not replace `control_t` with the broader `super_t` or `privileged: true` configuration |
| No `nettap` pod on an Auto Mode node | The DaemonSet is not scheduled or the node is not Ready | Compare the labeled node list with `kubectl get pods -n speedscale -l app=speedscale-nettap -o wide`, then inspect DaemonSet events |
| Sidecar HTTPS calls fail certificate validation | The application does not trust the Speedscale certificate authority | Follow the runtime-specific trust instructions in [TLS Support](/getting-started/installation/sidecar/tls.md) |

AWS does not allow direct SSH or SSM access to Auto Mode managed instances. For node-level problems, use the Kubernetes and AWS API methods in the [EKS Auto Mode troubleshooting guide](https://docs.aws.amazon.com/eks/latest/userguide/auto-troubleshoot.html).

## Getting help

If you have questions about this configuration, contact [Speedscale support](mailto:support@speedscale.com) or ask in the [Speedscale Community](https://slack.speedscale.com).
