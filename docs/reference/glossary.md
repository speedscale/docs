---
sidebar_position: 1
---

# Glossary

### Filter

A set of rules which determines whether to include or exclude traffic.

See [creating traffic filters](../guides/creating-filters/index.md)

### Generator

A Speedscale component that generates traffic from a [snapshot](#snapshot),
targeting the [SUT](#sut).  When running a load test the generator is the
service responsible for generating the load.

See [replaying traffic](../concepts/replay.md).

### Operator

A [Kubernetes operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
that runs in your cluster to perform Speedscale actions on your behalf.
Actions like adding a sidecar proxy to your workload, or starting a
[replay](#replay) in your cluster.

See [Kubernetes Operator](../setup/install/kubernetes-operator.md).

### Proxy

A process that accepts, stores, and forwards traffic.  Speedscale uses goproxy,
a purpose-built proxy written in Go, in various ways to capture traffic and route requests.

### Replay

The act of replaying a [snapshot](#snapshot) which usually involves the
generator making requests to the SUT.  A traditional replay involves a
[Speedscale generator](#generator), which makes requests to the [SUT](#sut)
(inbound), which makes requests to the [Speedscale responder](#responder)
(outbound), which mocks external resources.

```
 ┌─────────┐   ┌────────┐   ┌─────────┐
 │generator├───►your app├───►responder│
 └─────────┘   └────────┘   └─────────┘
```

A replay may not involve a generator though, as in responder-only replay mode.

### Report

The artifact of a [replay](#replay), a report contains aggregate information
about latency and throughput, as well as detailed information about the
requests made.  See your reports on the
[reports page](https://app.speedscale.com/reports).

### Responder

A Speedscale component that mocks other services using traffic from a
[snapshot](#snapshot).  The responder looks like the Stripe API, or a Postgres
server, or whatever else so that you can test your app in a controlled
environment.

See [service mocking](../concepts/service_mocking.md).

### RRPair

The RRPair, short for request / response pair, is the Speedscale internal
representation in which all traffic is stored.  The RRPair is segregated into a
request and a response, but also may contain just part of a request or
response like when representing part of a data stream.

### Snapshot

A collection of captured [RRPairs](#rrpair) that can be replayed in your
cluster or from your local desktop.

### speedctl

The Speedscale CLI which can be used to interact with Speedscale resources in
all the same ways the [Speedscale UI](https://app.speedscale.com) does.

See [cli setup](../setup/install/cli.md).

### SUT

System under test.  Whenever Speedscale documentation mentions a SUT, we're
talking about your application.  Your app/service is the system Speedscale is
testing and this is a generic way to refer to it.

### Transform

A set of functions which can be used to modify traffic at various points during
a [replay](#replay).

See [transforms](../concepts/transforms.md).

