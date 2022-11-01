# Working with OpenShift

:::caution
This workflow is currently in preview status. Speedscale currently works best inside plain Kubernetes clusters
such as EKS and GKE.
:::

## Prerequisites
2. An available OpenShift cluster with administrative access
3. [OpenShift CLI](https://docs.openshift.com/container-platform/4.11/cli_reference/openshift_cli/getting-started-cli.html)

[OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) is a container orchestration
offering from Red Hat that aims to provide a cloud-like platform that can be deployed either in existing cloud
infrastructure such as AWS or GCP, or in local or on-premise infrastructure. Compared to other container
orchestration platforms, OpenShift is built on top of Kubernetes so all of the standard Kubernetes concepts
and terminologies (e.g. Deployments, Pods) still apply. However, OpenShift adds features and tools to
Kubernetes that aim to provide the "enterprise-ready" characterics to which many users of CentOS or Red Hat
Enterprise Linux are already accustomed.

## Installing the Speedscale Operator

OpenShift uses [security context constraints](https://docs.openshift.com/container-platform/4.11/authentication/managing-security-context-constraints.html)
(SCCs) to place more restrictive rules on how pods can be run and what permissions they have as opposed to
plain Kubernetes. Speedscale components specify the user ID in container security contexts, which by default
is disallowed by OpenShift and will cause operator installations to fail. To prevent this, you must add a
policy rule that allows the Speedscale service account to run as any user ID.

```bash
oc adm policy add-scc-to-group anyuid system:serviceaccounts:speedscale
```

:::note
The value `anyuid` is a default SCC provided by OpenShift. Any SCC can be used so long as the RunAsUser
strategy is set to `RunAsAny`. See `oc explain scc` for more detail.
:::

Once this step is complete, you can continue [installing the Speedscale operator](../setup/install/kubernetes-operator.md).

## Capturing Traffic

The Speedscale Sidecar is able to capture traffic from your workload by either running as a transparent proxy
or as an explicit inline proxy. Both modes require additional configuration and setup in order to function
correctly. See [Sidecar HTTP Proxy Mode](../setup/sidecar/sidecar-http-proxy) for more detail. In either case,
it will be required to use an additional SCC for your workload to allow the sidecar to run as the user ID
specified in the resulting pod spec.

### Transparent Proxy

Running the sidecar as a transparent proxy is the default installation behavior and prevents needing to
configure manual proxies by initializing pods via `iptables` modifications. In standard Kubernetes
environments, this only requires the sidecar init container to run as root. This presents a challenge for
OpenShift environments since even with the container running as root, SELinux policies will still prevent the
necessary `iptables` modifications from taking place.

In addition to needing an SCC that allows running as any specified user ID, the sidecar's init container also
requires additional capabilities to function correctly, namely `NET_ADMIN` and `NET_RAW`. A custom SCC can be
added that allows both running with a specific user ID and the additional capabilities.

```bash
cat <<EOF | oc create -f -
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  name: speedscale-sidecar
allowHostDirVolumePlugin: false
allowHostIPC: false
allowHostNetwork: true
allowHostPID: false
allowHostPorts: true
allowPrivilegeEscalation: false
allowPrivilegedContainer: false
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
EOF
```

Add this SCC to your service account group policy:

```bash
oc adm policy add-scc-to-group speedscale-sidecar system:serviceaccounts:<WORKLOAD_NAMESPACE>
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

### Inline Proxy

Running the sidecar as an inline proxy is simpler to deploy at the cost of potentially requiring additional
configuration for your application to leverage it. Before configuring your workload, ensure that you have
added an appropriate SCC allowing the sidecar to run as its specified user ID. Note that if your workload
already supports this, this step is not required.

```bash
oc adm policy add-scc-to-group anyuid system:serviceaccounts:<WORKLOAD_NAMESPACE>
```

Once this is complete, you can annotate your workload to inject the sidecar with the correct proxy operational
mode. For example (additional detail can be found [here](../setup/sidecar/sidecar-http-proxy)):

```bash
cat <<EOF | oc patch -n my-namespace deploy my-app -p -
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/proxy-type: "dual"
  sidecar.speedscale.com/proxy-protocol: "tcp:http"
  sidecar.speedscale.com/proxy-port: "8080"
EOF
```

Do note that inbound traffic to your workload **must** be directed to the sidecar. If your workload exposes a
`Service`, ensure that the `targetPort` for the traffic you wish to capture is modified to use the reverse
proxy's port, which by default is `4143`. Use `kubectl edit svc <YOUR_SVC>` or `oc edit svc <YOUR_SVC>` to
make this modification.

To stop capturing traffic with the inline proxy, edit your workload to remove it:

```bash
cat <<EOF | oc patch -n my-namespace deploy my-app -p -
annotations:
  sidecar.speedscale.com/inject: "false"
EOF
```

If your workload service account needed an additional SCC added to allow the sidecar to operate with the user
ID it specifies, you can also remove that as well:

```bash
oc adm policy remove-scc-from-group anyuid system:serviceaccounts:<WORKLOAD_NAMESPACE>
```

## Getting Help

If you are experiencing issues with this guide and have further questions, please reach out to us on the
[community Slack](https://slack.speedscale.com).
