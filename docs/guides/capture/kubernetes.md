---
title: Kubernetes capture with eBPF and Java Agent
sidebar_label: Kubernetes capture setup
description: "Enable Kubernetes traffic capture with eBPF and the Java Agent, preserve annotations across redeploys, and verify captured requests and responses."
sidebar_position: 0
---

# Kubernetes capture with eBPF and Java Agent

Use eBPF for Kubernetes traffic capture with the standard Speedscale operator. For JVM workloads, including Java and Kotlin, enable the Java Agent as well to capture supported socket and TLS traffic inside the JVM. This guide covers setup, persistence across deployments, and verification.

## Check prerequisites

- Install the [standard Kubernetes operator](/getting-started/installation/install/kubernetes-operator) and enable its eBPF collector, `nettap`, on the nodes running your workload.
- Review the [eBPF system requirements](/reference/ebpf-traffic-collection#system-requirements), [runtime permissions](/reference/ebpf-traffic-collection#runtime-requirements), and [TLS runtime support](/reference/ebpf-traffic-collection#tls-traffic-visibility). Follow your [platform requirements](/getting-started/installation/install/kubernetes#check-your-platform-requirements), including OpenShift SCCs or GKE Autopilot allowlisting where applicable.
- For JVM applications, check the [Java Agent compatibility matrix and known gaps](/reference/java/agent#compatibility), allow the agent init-container image, and allow application pods to reach the `speedscale-nettap` Service in the Speedscale namespace on TCP port `8000`.
- Make sure the operator watches your application namespace and has permission to manage the workload. If the standard installation uses `namespaceSelector`, include the application namespace there; the chart also scopes the collector's namespace watches and RBAC to that list. Review [Kubernetes security requirements](/security/kubernetes-permissions).

Keep this setting in the Speedscale release's values file, preserving the release's other values and platform overrides:

```yaml
ebpf:
  enabled: true
```

Follow the [operator installation](/getting-started/installation/install/kubernetes-operator#install-method) or [upgrade flow](/reference/helm#upgrade-flow) to apply it. Set it explicitly rather than relying on a chart version's default. Workload annotations select capture targets; they do not install or start the collector.

:::info Restricted and namespace-scoped installations
A standard operator restricted to selected namespaces still needs the collector's node access and cluster-scoped resources. The separate [namespace-scoped installation](/getting-started/installation/install/kubernetes-namespaced) has no eBPF DaemonSet or admission webhook, so these annotations cannot enable eBPF or Java Agent injection there. Use its [sidecar capture workflow](./sidecar-namespaced.md) and review its [limitations](/getting-started/installation/install/kubernetes-namespaced-limitations). For other environments that cannot meet eBPF requirements, see the [legacy sidecar fallback](/getting-started/installation/sidecar/install).
:::

## Enable capture on the workload

Put capture annotations on the workload's top-level `metadata.annotations`. For a Deployment, this means the Deployment metadata, **outside** `spec.template.metadata.annotations`. The eBPF controller reads the workload annotations and selects pods using that workload's selector; annotations placed only on individual pods or their template do not configure this capture target.

Merge this excerpt into your application manifest, keeping its existing `spec`, labels, and other annotations:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-namespace
  annotations:
    capture.speedscale.com/enabled: "true"
```

For an existing Deployment, you can enable eBPF capture with:

```bash
kubectl annotate deployment my-app -n my-namespace \
  capture.speedscale.com/enabled=true --overwrite
```

The eBPF controller supports Deployments, StatefulSets, DaemonSets, Jobs, and Argo Rollouts when that API is installed. Annotate the controller workload rather than a Deployment's ReplicaSet or a standalone Pod. eBPF-only targeting can attach to running pods without an application restart. For connections established before capture starts, review the [mid-stream connection limitation](/reference/ebpf-traffic-collection#limitations).

Do not combine capture annotations enabled here with `sidecar.speedscale.com/inject: "true"`; the standard operator rejects that combination. Coordinate removal of existing sidecar injection through your deployment process before switching capture modes.

### Add the Java Agent for JVM workloads

Add both annotations to the same workload metadata in your application manifest:

```yaml
metadata:
  annotations:
    capture.speedscale.com/enabled: "true"
    capture.speedscale.com/java-agent: "true"
```

For an existing Deployment:

```bash
kubectl annotate deployment my-app -n my-namespace \
  capture.speedscale.com/enabled=true \
  capture.speedscale.com/java-agent=true --overwrite
kubectl rollout status deployment/my-app -n my-namespace
```

The admission webhook adds an init container, a shared agent volume, and `-javaagent` in the application's `JAVA_TOOL_OPTIONS` to the pod template. The agent loads at JVM startup: enabling, disabling, or changing it requires new pods and a JVM restart. A running JVM does not gain the agent through live attachment.

Confirm that new pods were created after enabling the agent. If the workload's update strategy holds back pod replacement, complete that rollout through your normal deployment process. For a Deployment that has not replaced its pods, request a restart and wait:

```bash
kubectl rollout restart deployment/my-app -n my-namespace
kubectl rollout status deployment/my-app -n my-namespace
```

For StatefulSets and DaemonSets, account for their update strategy; for Jobs, create a new Job with the annotations so injection happens before its pods start. Review [Java Agent support](/reference/java/agent) for transport coverage and startup troubleshooting.

### Exclude ports

Set `capture.speedscale.com/ignore-ports` on the same top-level workload metadata to exclude ports from eBPF capture. For example, if `9090` and `9091` are metrics or management ports you do not need to record:

```yaml
metadata:
  annotations:
    capture.speedscale.com/enabled: "true"
    capture.speedscale.com/ignore-ports: "9090,9091"
```

Use comma-separated port numbers from `1` to `65535`. Keep application and dependency ports that you need to record out of this list. Check exclusions when expected traffic is missing; exclusions are separate from whether the collector and Java Agent are ready. See the [capture annotation reference](/reference/kubernetes-annotations#capture-annotations) for supported settings.

### Disable capture

To stop eBPF capture for a workload, set `capture.speedscale.com/enabled: "false"` in its source. For an existing Deployment:

```bash
kubectl annotate deployment my-app -n my-namespace \
  capture.speedscale.com/enabled=false --overwrite
```

To remove the Java Agent, set `capture.speedscale.com/java-agent: "false"` the same way, then roll out new pods and confirm they no longer include the agent init container or the `-javaagent` option. Running JVMs keep the agent until their pods are replaced. Update the Helm/GitOps source as well so reconciliation does not re-enable capture.

## Preserve capture across redeploys

Save capture annotations in the application source that actually renders the workload: its Helm chart and values, Kustomize patch, or GitOps manifest. Helm values often named `podAnnotations` usually affect only the pod template; inspect the rendered YAML to confirm the annotations appear on the workload's top-level metadata. A one-time `kubectl annotate` changes the live object and does not update that source.

Ordinary pod replacement or scaling keeps the workload object and its capture annotations. The eBPF target's selector continues to match replacement pods, and JVM replacement pods inherit the injected agent when the annotated workload is processed by the operator. The collector must still be ready on their nodes.

Deleting and recreating the workload creates a new object. A replacement manifest without capture annotations loses that capture intent. Helm upgrades, GitOps reconciliation, or another controller can also overwrite or remove annotations if their desired state omits them; whether they do so depends on field ownership and deployment behavior.

Keep `ebpf.enabled: true` and required namespace and platform settings in the Speedscale release's source too. After an application or Speedscale redeploy, compare the rendered source with the live workload and repeat the checks below. Manage operator-injected pod-template fields according to your GitOps controller's drift policy so reconciliation does not strip the Java Agent.

## Verify capture

Replace the namespace, workload, pod, and container names below with your own. The examples assume Speedscale runs in `speedscale`.

1. Check the live workload annotations and pod placement:

   ```bash
   kubectl get deployment my-app -n my-namespace -o yaml
   kubectl get pods -n my-namespace -l app=my-app -o wide
   ```

   Use your workload's actual selector in place of `app=my-app`. Confirm `enabled: "true"`, plus `java-agent: "true"` for JVM capture, on the Deployment metadata. Check the rendered Helm/GitOps source too if they disappear after a deployment.

2. Check the operator, collector rollout, and collector placement:

   ```bash
   kubectl get pods -n speedscale
   kubectl rollout status daemonset/speedscale-nettap -n speedscale
   kubectl get pods -n speedscale -l app=speedscale-nettap -o wide
   ```

   Confirm a ready collector on each node hosting the target pods. If it is missing or unready, inspect its events and logs with your platform administrator; use the [eBPF requirements](/reference/ebpf-traffic-collection#runtime-requirements) and [installation troubleshooting](/getting-started/installation/install/troubleshooting). A user without access to the Speedscale namespace needs an administrator to perform these checks.

3. For JVM capture, inspect a new pod:

   ```bash
   kubectl get pod my-app-pod -n my-namespace -o yaml
   kubectl logs my-app-pod -n my-namespace -c speedscale-initproxy-java-agent
   kubectl logs my-app-pod -n my-namespace -c my-app
   ```

   Confirm the agent init container completed successfully, the `speedscale-java-agent` volume is mounted, and the application has `-javaagent:/speedscale/nettap-agent.jar` in `JAVA_TOOL_OPTIONS`. Check startup logs for agent errors and verify connectivity to the collector Service. See [Java Agent troubleshooting](/reference/java/agent#troubleshooting) for conflicts with existing JVM options or other agents.

4. Send a known application request that calls a dependency, then open the [Traffic Viewer](./traffic.md). Filter to the cluster, namespace, workload, and recent time range. Inspect complete inbound and outbound request/response pairs, including expected bodies, direction, and TLS classification. Repeat for each transport you need, such as HTTP, gRPC, or a database. Ready pods alone do not establish capture coverage.

Passive eBPF and Java Agent capture keeps the application's TLS trust and client certificates. It does not require installing the replay responder CA. If capture works but replay reports certificate errors, follow [Java replay TLS trust](/reference/java/tls#replay) or the relevant [replay TLS guide](/guides/tls).
