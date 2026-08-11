---
description: "Prepare a Speedscale eBPF traffic capture deployment for a safe production rollout."
sidebar_position: 20
---

# Production Readiness

Use the Speedscale eBPF collector for new Kubernetes production deployments. It observes traffic from each node without injecting a proxy into application pods or adding a network hop. Review the [eBPF system requirements](/reference/ebpf-traffic-collection#system-requirements) and [workload impact](/reference/ebpf-traffic-collection/workload-impact) before rollout.

Use [sidecar capture](/getting-started/installation/sidecar/install) only for an existing deployment or a workload that does not meet the eBPF requirements.

## Preparation Checklist

- [ ] Sign the Speedscale SaaS agreement.
- [ ] Confirm the target clusters, namespaces, and workloads.
- [ ] Confirm that cluster nodes meet the eBPF requirements.
- [ ] Check for a service mesh or other cluster security controls.
- [ ] Size the Operator, forwarder, and nettap for the expected traffic volume.
- [ ] Decide whether to disable remote control.
- [ ] Configure data loss prevention and traffic filters.
- [ ] Restrict access to Kubernetes secrets if required.
- [ ] Define rollout and rollback criteria.

### Sign the SaaS agreement

Speedscale requires a signed SaaS agreement for a commercial license before it will support a production deployment.

### Scope the initial target

Speedscale records only the workloads selected by the eBPF capture configuration. Start with one representative service and a limited traffic window. Expand to additional workloads after validating capture quality, resource use, data controls, and ingest volume.

Target workloads with namespace and pod selectors in the Operator Helm values, or use the `capture.speedscale.com/enabled` annotation. See [eBPF traffic collection](/reference/ebpf-traffic-collection#enabling-via-helm) for both options.

### Review cluster and workload requirements

Confirm the supported Kubernetes version, Linux kernel, container runtime, protocols, and TLS libraries before installation. If the workload uses TLS, check [TLS traffic visibility](/reference/ebpf-traffic-collection#tls-traffic-visibility) for language-specific requirements.

The collector is a privileged DaemonSet. Review its security context, host mounts, and required capabilities with the platform and security teams. Managed Kubernetes platforms can require additional admission configuration. For example, see the [GKE Autopilot guide](/getting-started/installation/install/gke-autopilot).

Istio and its derivatives are supported natively. If you run Istio, follow the [Istio installation notes](../getting-started/installation/install/istio.md) while configuring the Operator. For any other service mesh, contact [support](https://slack.speedscale.com) before you start.

Ask your security team whether cluster-level security tooling is in place. Admission controllers and runtime security agents can block the collector's privileged DaemonSet, and the failures present as obscure timeouts rather than clear denials. Namespaces such as `twistlock` or `calico-` are a hint that such tools are installed. Speedscale has recipes for coexisting with many of them; ask support.

### Disable remote control when required

Speedscale can optionally accept control-plane commands from the web application. For production recording clusters that require all changes to pass through Kubernetes RBAC and GitOps, set `dashboardAccess: false` in the Operator Helm values. This prevents the remote-control container from being deployed.

With remote control disabled, manage capture targets and replays through cluster configuration.

### Configure data loss prevention

[Data loss prevention (DLP)](/guides/dlp) filters and redacts traffic before it leaves the cluster. Test DLP rules in a non-production cluster with representative traffic before applying them to production.

A safe validation sequence is:

1. Copy the `standard` DLP rule and add the fields that must be redacted.
2. Install or upgrade the Operator with `dlp.enabled: true` and set `dlp.config` to the custom rule.
3. Enable capture for one workload.
4. Confirm that sensitive fields are redacted in the Traffic Viewer.
5. Add remaining rules and repeat the check.

### Restrict secret access

The Operator can read Kubernetes secrets for transforms such as JWT resigning. Use the `secretAccessList` Helm value to restrict access to the specific secrets required by your replay workflows. An empty list allows access to all secrets in the configured namespaces.

### Filter traffic before ingest

Use [traffic filters](/guides/creating-filters) to exclude health checks, monitoring traffic, large payloads, and out-of-scope services before data is sent to Speedscale Cloud. Start from the `standard` filter and add environment-specific rules. Filtering is also the primary control for limiting ingest volume and network egress.

## Deployment Checklist

- [ ] Scope the Operator to the namespaces it needs.
- [ ] Install the Operator and enable eBPF.
- [ ] Apply a narrow capture target.
- [ ] Confirm the collector and forwarder are healthy.
- [ ] Generate representative traffic.
- [ ] Validate redaction, filtering, and TLS decoding.
- [ ] Measure resource use and application latency.
- [ ] Expand the target set gradually.

### Scope the Operator with a namespace selector

The Operator installs a mutating webhook that runs on every deployment in the cluster. Restrict it to a subset of namespaces with the `namespaceSelector` Helm value. This also changes the RBAC the chart creates:

- A `ClusterRole` and `ClusterRoleBinding` named `speedscale-operator` is always created. It always carries the minimal permissions the Operator needs to function, such as listing namespaces, webhooks, and its own role.
- Without a namespace selector, that `ClusterRole` also gets permission to read and modify `deployments`, `statefulsets`, `daemonsets`, `secrets`, and similar resources across the whole cluster.
- With a namespace selector, those broader permissions move into a `Role` and `RoleBinding` created in each selected namespace instead, so the Operator has no access outside them.

:::tip
A `ClusterRole` is a non-namespaced resource granting permissions across the entire cluster. A `Role` is namespaced and grants permissions only within its own namespace.
:::

Security reviewers usually want the namespace-scoped form for production. The exact resources and verbs are in `rbac.yaml` in the [chart templates](https://github.com/speedscale/operator-helm).

### Install and target eBPF capture

Enable the collector in the Operator Helm values and define an initial target:

```yaml title="production-values.yaml"
ebpf:
  enabled: true
  configuration:
    capture:
      targets:
        - name: checkout
          namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: production
          podSelector:
            matchLabels:
              app: checkout
```

Add these values to the normal [Operator installation](/getting-started/installation/install/kubernetes-operator). For an existing installation, apply them with an upgrade:

```bash
helm upgrade speedscale-operator speedscale/speedscale-operator \
  --namespace speedscale \
  --reuse-values \
  -f production-values.yaml
```

For an existing Operator installation, you can instead enable a deployment with an annotation:

```bash
kubectl annotate deployment checkout -n production \
  capture.speedscale.com/enabled="true" --overwrite
```

### Size the in-cluster components

Monitor CPU, memory, restarts, and throttling for the Operator, forwarder, and nettap during the initial recording window. Increase the relevant Helm resource requests and limits if components approach their limits. The forwarder needs enough capacity for filtering, DLP, and compression at the expected traffic rate.

Because nettap runs once per selected node, compare node resource use before and after enabling the target. The [workload impact guide](/reference/ebpf-traffic-collection/workload-impact) provides a repeatable measurement procedure.

### Expand in stages

Add workloads in small groups after the initial target passes validation. Prefer selectors that identify stable application labels. Avoid revision-specific labels that change with each deployment.

If only a percentage of traffic should be captured, route that percentage to a canary deployment and target the canary's stable labels. Use the platform's normal canary or service-mesh traffic management rather than injecting a separate capture proxy.

## Validation

Confirm each of these before expanding production capture:

- The nettap DaemonSet is ready on every node that hosts a target workload.
- Captured traffic is attributed to the expected service and namespace.
- Supported TLS traffic is decoded and long-lived connections were restarted after probes attached.
- DLP rules redact sensitive fields before upload.
- Filters exclude health checks, monitoring traffic, and other known noise.
- Operator, nettap, and forwarder resource use remains within limits.
- Application latency and error rates remain within the agreed rollout threshold.
- Ingest volume matches the expected traffic sample.

To stop capture for an annotation-based target:

```bash
kubectl annotate deployment checkout -n production \
  capture.speedscale.com/enabled="false" --overwrite
```

For selector-based targets, remove the target from the Operator Helm values and apply the updated configuration. Contact [Speedscale support](https://slack.speedscale.com) if the rollout does not meet the validation criteria.
