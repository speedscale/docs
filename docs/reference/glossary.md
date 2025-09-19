---
sidebar_position: 1
---

# Glossary

### Action File

A [snapshot](#snapshot) related file used internally by Speedscale services to store and access the [RRPairs](#rrpair) used by the [generator](#generator) during replay.

```shell
speedctl pull snapshot $SNAPSHOT_ID
cat ~/.speedscale/data/snapshots/$SNAPSHOT_ID/action.jsonl
```

### Assertion

A validation applied to each individual [RRPair](#rrpair) captured in a [report](#report),
used to confirm your application behavior during [replay](#replay). Use a
[filter](#filter) to narrow the scope of assertions. Assertions are defined in
[test configs](#test-config). Assertions have no effect when running in [low
data mode](#low-data-mode).

### Collector

A Speedscale component that collects logs and metric data from pods during a
[replay](#replay). This service runs beside replay components like the
[generator](#generator) and [responder](#responder) during the replay and
communicates with the Kubernetes API.

### Endpoint

A partial representation of a URI, endpoints often group similar requests
together. View the endpoints requests were made to during a [replay](#replay)
at the bottom of the [report](#report).

### Filter

A set of rules which determines whether to include or exclude traffic.

See [creating traffic filters](../guides/creating-filters.md) and the
[filters reference](./filters/README.md) for more information.

### Generator

A Speedscale component that generates traffic from a [snapshot](#snapshot),
targeting the [SUT](#sut). When running a load test the generator is the
service responsible for generating the load.

See [replaying traffic](/concepts/replay.md) for more information.

### Goproxy

A Speedscale component that captures [traffic](#traffic) from a client to your
service (inbound) and from your service to third parties like other APIs or
databases (outbound). Go proxy is, as its name suggests, a [proxy](#proxy) which
captures traffic routed through it.

See [proxy modes](/setup/sidecar/proxy-modes.md) for more information.

### Inspector

A Speedscale component that executes actions on your behalf in your cluster.
Actions like adding a sidecar proxy to your workload, or starting a
[replay](#replay).

### Load Generator

A load generator is a software component used to simulate a client workload.
A load generator is itself a client, like [cURL](https://curl.se/), but with features
designed to

"Test" is a fairly general and often overloaded term in tech, but in the context
of Speedscale it describes a request sent to the [SUT](#sut) from a Speedscale
component. They are called tests because they are meant to exercise some
behavior of your application.

In Speedscale tests are sent by either [proxymock](/proxymock/)
on your local machine or by the [generator](#generator) in a cluster.

### Low Data Mode

A [replay](#replay) mode of operation which does not collect
[RRPairs](#rrpair). This mode is useful for high-throughput replays, like a
load tests, which may make hundreds of thousands of requests. In this case it
may not be feasible to capture and analyze each request individually. Low data
mode can be applied to the [generator](#generator) or [responder](#responder)
in the [test config](#test-config).

Note that replay run with low data mode will not be able to run
[assertions](#assertion) as the full RRPairs are not available, but the report
will show when errors occur.

### Mock

A mock is an artifact that can be used to imitate a real service, API, or
database. [proxymock](/proxymock/) is built to create mock
definitions from application traffic and then use them with a [mock
server](#mock-server) to simulate the services, APIs, and databases your
application depends on.

The difference between a mock and a [test](#test) is that tests are inbound
traffic (from the client to your app), and mocks are outbound traffic
(from your app to external resources).

### Mock Server

A mock server is a software component that imitates another, usually more
complex or difficult to run, software component in limited ways. A mock server
is generally used during local development or testing when it is impractical or
impossible to run the real thing.

In Speedscale mock servers are provided by either
[proxymock](/proxymock/) on your local machine or by the
[responder](#responder) in a cluster.

See [Mocking and Service Virtualization](/mocks/) for more information.

### Operator

A [Kubernetes operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
that runs in your cluster to perform Speedscale actions on your behalf.
Actions like adding a sidecar proxy to your workload, or starting a
[replay](#replay) in your cluster.

See [Kubernetes Operator](../setup/install/kubernetes-operator.md) for more information.

### Proxy

A process that accepts, stores, and forwards traffic. Speedscale uses
[goproxy](#goproxy), a purpose-built proxy written in Go, in various ways to
capture traffic and route requests.

### Raw File

A [snapshot](#snapshot) related file used internally by Speedscale services to store and access all [RRPairs](#rrpair).

```shell
speedctl pull snapshot $SNAPSHOT_ID
cat ~/.speedscale/data/snapshots/$SNAPSHOT_ID/raw.jsonl
```

### Reaction File

A [snapshot](#snapshot) related file used internally by Speedscale services to store and access [RRPairs](#rrpair) used by the [responder](#responder) during replay.

```shell
speedctl pull snapshot $SNAPSHOT_ID
cat ~/.speedscale/data/snapshots/$SNAPSHOT_ID/reaction.jsonl
```

### Recursion

See [recursion](#recursion).

### Replay

The act of replaying a [snapshot](#snapshot) which usually involves the
generator making requests to the SUT. A traditional replay involves a
[Speedscale generator](#generator), which makes requests to the [SUT](#sut)
(inbound), which makes requests to the [Speedscale responder](#responder)
(outbound), which mocks external resources. A replay may not involve a
generator though, as in responder-only replay mode.

See [replaying traffic](../guides/replay/README.md) for more information.

### Report

The artifact of a [replay](#replay), a report contains aggregate information
about latency and throughput, as well as detailed information about the
requests made.

Reports are listed on the [snapshots page](https://app.speedscale.com/snapshots) in the UI.

See [reports](../guides/reports/README.md) for more information.

### Responder

A Speedscale component that mocks other services using traffic from a
[snapshot](#snapshot). The responder looks like the Stripe API, or a Postgres
server, or whatever else so that you can test your app in a controlled
environment.

See [service mocking](../concepts/service_mocking.md) and
[mocking backends](/guides/replay/mocks/) for more information.

### RRPair

The RRPair, short for request / response pair, is the Speedscale internal
representation in which all traffic is stored. The RRPair is segregated into a
request and a response, but also may contain just part of a request or
response like when representing part of a data stream.

See the [markdown file format](/proxymock/how-it-works/rrpair-format) for the
easiest way to view and modify RRPairs on your local machine.

### Schedule

Schedule Speedscale actions to run automatically on a regular basis.

See [schedules](../concepts/schedules.md) for more information.

### Snapshot

A collection of captured [RRPairs](#rrpair) that can be replayed in your
cluster or from your local desktop.

Snapshots are listed on the [snapshots page](https://app.speedscale.com/snapshots) in the UI.

See [creating a snapshot](/guides/creating-a-snapshot/) for more information.

### speedctl

The Speedscale CLI which can be used to interact with Speedscale resources in
all the same ways the [Speedscale UI](https://app.speedscale.com) does.

See [cli setup](../setup/install/cli.md) for more information.

### SUT

System under test. Whenever Speedscale documentation mentions a SUT, we're
talking about your application. Your app/service is the system Speedscale is
testing and this is a generic way to refer to it.

### Test

A test is an artifact that can be used to imitate a real client workload.
[proxymock](/proxymock/) is built to create test definitions from
application traffic and then use them with a [load generator](#load-generator)
to simulate the client workloads that make requests to your application.

The difference between a test and a [mock](#mock) is that tests are inbound
traffic (from the client to your app), and mocks are outbound traffic (from your
app to external resources).

In Speedscale tests are sent by either [proxymock](/proxymock/)
on your local machine or by the [generator](#generator) in a cluster.

### Test Config

Configuration for a traffic [replay](#replay).

Test configs are listed on the [test configs page](https://app.speedscale.com/config) in the UI.

See [test configs](../concepts/test_config.md) for more information.

### Traffic

All of the bytes sent or received by your application.

Inbound traffic is the traffic that is being sent to, and received by, your
application. This may also be called ingress. An example of inbound traffic
is an HTTP request sent to your server's API.

Outbound traffic is the traffic that is sent by your application to external
resources. This may also be called egress. An example of outbound traffic
is a database query, or calling the API of another service.

### Traffic Viewer

Speedscale UI for visualizing traffic where each line contains an [RRPair](#rrpair).

Traffic for each of your applications can be found on the [traffic page](https://app.speedscale.com/analyze) in the UI.

### Request

A single request and response, for HTTP. Like a ping which goes out to the target and
back, a transaction consists of a single round trip, whatever that means for
the protocol in use.

### Requests Per Second

The number of [requests](#request) completed in a single second of
measurement. Requests per second (RPS) are used to describe the throughput
of one endpoint or a service as a whole.

### Transform

A set of functions which can be used to modify traffic at various points during
a [replay](#replay).

Transforms are listed on the [transforms page](https://app.speedscale.com/trafficTransforms) in the UI.

See [transforms](../concepts/transforms.md) for more information.

### User Data

Generic documents stored in the Speedscale cloud which can be referenced during a [replay](#replay). Use [speedctl](#speedctl) to manage these documents.

### Variable Cache

A bucket of values which can be shared between requests during a [replay](#replay).
Servers are often stateful, or expose stateful behavior from networked storage.
In order to simulate this behavior a cache can store a value on one request and
retrieve it from another. Variables may also be populated statically in the
[transform editor](../concepts/transforms.md#where-to-transform-traffic).

### vUser

A "virtual" user, run by the [generator](#generator) during a
[replay](#replay). Also called a VU, these are meant to represent a single
user session in your application. A single VU sends a request for each
[RRPair](#rrpair) in the [snapshot](#snapshot) once, in order. The number of
concurrent VUs to run during a replay can be defined in the [test
config](#test-config).

See [replaying traffic](/concepts/replay.md) for more information.
