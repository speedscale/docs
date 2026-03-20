---
description: "Explore the deployment architecture of Speedscale, detailing components, network requirements, and installation methods for Kubernetes environments."
sidebar_position: 1
---

# Deployment Architecture

Speedscale runs a set of components and processes in your Kubernetes environment. This document outlines the specific components and the network requirements for each component.

The Speedscale deployment breaks into three modes:

1. Operator (shared)
2. Ingest
3. Replay

The Operator is usually installed via the helm [chart](https://github.com/speedscale/operator-helm). Once that is installed, most additional deployment activities are automated using either the Speedscale Infrastructure UI, the `speedctl` API or via direct Custom Resource [editing](../guides/replay/kube.md). It is possible to automate the entire Speedscale installation via Argo, git or your deployment system of choice. This page outlines the components used in a typical deployment. Speedscale supports highly secure environments and there are different recipes for different constraints. Please reach out to [support](https://slack.speedscale.com) for assistance.

## Shared Components

By default, Speedscale's helm chart installs an operator and a complement of webhooks. This operator is necessary to both ingest data and perform replays. The managed components (Forwarder, Inspector, nettap) are deployed by the operator and typically should not be modified directly. These optional components are not present in the helm [chart](https://github.com/speedscale/operator-helm). Keep in mind that your exact deployment may omit some of these components due to security constraints and other factors.

```mermaid
graph TD
    subgraph cluster["Kubernetes Cluster"]
        subgraph ns["speedscale namespace"]
            direction TB
            subgraph webhooks[" "]
                mwh["Mutating Webhook"]
                vwh["Validating Webhook"]
                rmwh["Replay Mutating Webhook"]
            end

            operator["Operator"]

            subgraph managed["Managed Components"]
                forwarder["Forwarder"]
                inspector["Inspector<br/><i>optional</i>"]
                nettap["nettap DaemonSet<br/><i>optional – eBPF</i>"]
            end
        end

        subgraph app_ns["application namespace"]
            pods["Pods"] ~~~ deploy["Deployments"]
            sts["StatefulSets"] ~~~ ds["DaemonSets"]
            jobs["Jobs"] ~~~ rs["ReplicaSets"]
            rollout["Argo Rollouts"]
        end
    end

    subgraph cloud["Speedscale Cloud"]
        api["API / Dashboard"]
    end

    mwh -->|workload events| operator
    vwh -->|CR validation| operator
    rmwh -->|trafficreplay CRs| operator

    operator --> forwarder
    operator --> inspector
    operator --> nettap
    operator -->|"manages capture"| app_ns

    forwarder -->|"data"| api
    operator -->|"telemetry"| api
    inspector -->|"control"| api
```

A full complement of Speedscale services deployed to the default `speedscale` namespace will produce output similar to this pod listing:
```bash
kubectl -n speedscale get pods
NAME                                    READY   STATUS    RESTARTS   AGE
java-client-67bf4b4cb4-7lmkd            1/1     Running   0          7d6h
java-server-5786d56974-pv765            2/2     Running   0          7d6h
speedscale-forwarder-7785df55c-688sn    1/1     Running   0          7d6h
speedscale-inspector-7f797bb75f-dvmr8   1/1     Running   0          7d6h
speedscale-operator-d9cc9c794-mtcdp     1/1     Running   0          7d6h
```

**speedscale-operator (mutating webhook)** - A Kubernetes API extension that listens for workloads. If a workload has the necessary annotations, the operator modifies it. If this is not in working order then the operator will not "notice" workloads that are applied to the cluster.

**speedscale-operator-replay (validating webhook)** - A Kubernetes API extension that listens for changes made to trafficreplay [CRs](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)

**speedscale-operator-replay (mutating webhook)** - A Kubernetes API extension that listens for trafficreplay [CRs](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/). trafficreplay CRs control which workloads have sidecars and running replays.

**operator** - The central controller for Speedscale ingest and replays. The operator listens to the webhooks and responds to commands. For instance, if a trafficreplay CR is created the operator will do the work of actually initiating the replay. The operator communicates directly with the Kubernetes API.

**inspector (optional)** - Provides remote control services initiated from Speedscale cloud. This component is intentionally separate from the rest of Speedscale's system so it can be removed in secure environments. Once this component is disabled, Speedscale will work normally but remote environment control will be no longer be possible.

**java-server/client (optional)** - A simple demo app deployed in the `speedscale` namespace that can be easily turned off.

The sidecar and eBPF DaemonSet capture methods are detailed in the [Ingest](#ingest-only) section below. The operator installation does not automatically deploy either capture method.

:::note
All connections to Speedscale Cloud are initiated outbound from your cluster. Speedscale does not require listener ports to be opened.
:::

:::note
`telemetry` and `control` are very low bandwidth connections. `data` typically utilizes more bandwidth depending on your traffic ingest. Please see the helm [chart](https://github.com/speedscale/operator-helm) and networking [requirements](./networking.md) for more information.
:::

## Ingest Only

During traffic ingest, Speedscale utilizes a data pipeline that is optimized for data masking, filtering and high volume. Speedscale offers two capture methods: a **sidecar proxy** injected into each pod, or an **eBPF DaemonSet** (`nettap`) that observes traffic at the node level without modifying workloads. Both methods forward captured traffic to the in-cluster forwarder where DLP filtering and PII redaction occur before data leaves the cluster.

### Sidecar Capture

```mermaid
graph LR
    subgraph pod["Application Pod"]
        app["App Container"]
        sidecar["Sidecar<br/>speedscale-goproxy"]
    end

    forwarder["Forwarder<br/>DLP & Filtering"]
    cloud["Speedscale Cloud"]

    app <-->|traffic| sidecar
    sidecar -->|traffic data| forwarder
    forwarder -->|"filtered data<br/>PII redacted"| cloud
```

**sidecar** - A listener proxy injected into each application pod, similar to an Envoy sidecar. The sidecar intercepts inbound and outbound traffic and forwards it to the in-cluster forwarder.

Pods with the speedscale sidecar injected will have a new container named `speedscale-goproxy`:

```bash
kubectl -n speedscale get pods java-server-5786d56974-pv765 -o jsonpath='{.spec.containers[*].name}'
speedscale-goproxy java-server
```

### eBPF Capture

```mermaid
graph LR
    subgraph node["Kubernetes Node"]
        nettap["nettap DaemonSet"]
        subgraph pod["Application Pod"]
            app["App Container"]
        end
    end

    forwarder["Forwarder<br/>DLP & Filtering"]
    cloud["Speedscale Cloud"]

    nettap -.->|"kprobe / uprobe<br/>(passive observe)"| app
    nettap -->|traffic data| forwarder
    forwarder -->|"filtered data<br/>PII redacted"| cloud
```

**nettap (eBPF DaemonSet)** - A per-node DaemonSet that uses eBPF kprobes and uprobes to passively observe network traffic without proxies or application changes. No sidecar is injected into the pod. See [eBPF Traffic Collection](/reference/ebpf-traffic-collection) for details.

Verify the nettap DaemonSet is running:

```bash
kubectl -n speedscale get daemonset nettap
```

:::tip
Speedscale can dynamically prevent PII data from leaving your environment during ingest. Learn more in our [Data Loss Prevention Guide](/guides/dlp/)
:::

## Replay Only

```mermaid
graph TB
    subgraph cloud["Speedscale Cloud"]
        api["API / Dashboard"]
    end

    subgraph cluster["Kubernetes Cluster"]
        subgraph test_ns["test namespace"]
            generator["speedscale-generator<br/><i>optional</i>"]
            responder["speedscale-responder<br/><i>optional</i>"]
            redis["Redis"]
            collector["speedscale-collector<br/><i>optional</i>"]

            subgraph pod["Application Pod"]
                app["App Container"]
            end
        end
    end

    generator -->|"inbound test traffic"| app
    app -->|"outbound calls"| responder
    responder -->|mock data| redis
    collector -->|report data| api
    generator -->|results| api
    responder -->|results| api
```

During replay, the operator starts a collector to retrieve logs and other events from the Kubernetes API. The load generator only starts if tests are being executed. The responder only starts if service mocking is enabled.

**speedscale-collector (optional)** - A logging and event data collector. Events are forwarded to the cloud and included in the report.

**speedscale-generator (optional)** - The Speedscale load generator. Note this can be run from anywhere but is often included in the namespace.

**speedscale-responder (optional)** - The Speedscale mock server. 

During replay, you may see some or all of these components in the testing namespace depending on the type of replay you are running (tests only, mocks only, etc).

```bash
kubectl get pods
NAME                                                   READY   STATUS              RESTARTS   AGE
java-client-67bf4b4cb4-7lmkd                           1/1     Running             0          7d7h
java-server-5786d56974-pv765                           2/2     Running             0          7d7h
speedscale-collector-abstract-yucca-7fb7d8f89b-z8btv   1/1     Running             0          8s
speedscale-generator-abstract-yucca-nlkm9              0/1     ContainerCreating   0          2s
speedscale-responder-abstract-yucca-ffc7a8ffec-f11av   1/1     Running             0          8s
```

## Data Security

Speedscale's Data Loss Prevention (DLP) engine protects sensitive information by redacting personally identifiable information (PII) and other sensitive data before it leaves your network. The DLP engine runs within the forwarder component, inspecting all traffic data received from sidecars or the eBPF DaemonSet and automatically detecting and redacting sensitive patterns such as email addresses, credit card numbers, Social Security Numbers, and other PII.

```mermaid
graph LR
    Sidecar[Sidecar<br/>speedscale-goproxy]
    Nettap[nettap<br/>eBPF DaemonSet]
    Forwarder[Forwarder<br/>Cache<br/>DLP Engine]
    Kinesis[AWS Kinesis<br/>Firehose]
    
    Sidecar -->|traffic data| Forwarder
    Nettap -->|traffic data| Forwarder
    Forwarder -->|filtered data<br/>PII redacted| Kinesis
```

The DLP engine processes traffic data in the forwarder before forwarding it to AWS Kinesis Firehose. This ensures that sensitive information is never transmitted outside your environment, while preserving the overall structure and shape of the data for testing purposes. The forwarder's cache optimizes performance by reducing redundant processing of similar traffic patterns.

To learn more about configuring DLP and Speedscale's overall approach to data security, please visit our [Data Loss Prevention Guide](/guides/dlp/) and security [hub](/security/security_/).
