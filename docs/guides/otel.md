---
sidebar_position: 19
---

# OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/docs/what-is-opentelemetry/) (OTEL) is an open-source project that provides vendor-neutral tools, APIs, and SDKs designed to create and manage observability data within distributed systems. This data includes metrics, logs, and especially traces. Traces enable developers and operations teams to understand the flow of requests across various components within a complex system, providing a comprehensive picture of how services interact. Each trace consists of individual units of work called spans. Speedscale is OpenTelemetry-aware and treats OTEL Trace and Span IDs as native data types.

In this guide, we'll isolate a specific transaction, replicate the entire environment during the timeframe it was running, and then replay it on the local desktop. Once recording is complete, no further dependency or interaction with production is necessary. The snapshot will contain the information necessary to not only regenerate the incoming requests, but also generate service mocks for the back end services involved.  This is an example of complete environment portability tailored to only what is necessary for a particular use case.

---

## Overview

### What are Trace IDs?

A Trace ID is a unique identifier assigned to an entire trace. It serves as a single identifier that stitches together all the individual spans generated in the lifecycle of a request across different services. It's akin to a thread that binds together all the milestones of an operation from start to finish. Every span that is part of the same operation or transaction will carry the same Trace ID, allowing for easy correlation and monitoring of a request as it traverses through multiple services.

### What are Span IDs?

A Span ID is a unique identifier that marks a single unit of work within a trace. Each trace consists of multiple spans, where each span represents a step in the processing of a request. Spans include information like the start and end time of the operation, attributes, events, and links. Span IDs make it easier to pinpoint where delays or errors are occurring within a specific service or step, offering granular visibility into the performance of an operation.

---

## Finding traces in traffic viewer

Speedscale allows you to search for any substring of data, anywhere in your API requests, across all services. You can find any trace ID or span ID using this capability. Here is a video showing how the feature works for general filtering:

<iframe width="560" height="315" src="https://www.youtube.com/embed/SxZ7DFSM89Y" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Here are the steps for filtering for an OpenTelemetry trace:
1. Create a Notebook from the traffic viewer
1. Add a filter for Request Header *Traceparent* with a CONTAINS of only the middle section of the Traceparent. For example, if the full header is `Traceparent=00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00` then you only need to include 4bf92f3577b34da6a3ce929d0e0e4736 because that is the Trace ID. The Span ID will chagne between services so it isn't a good target.

## Creating a Trace Snapshot (CLI)

For this guide, we'll focus on replicating only a specific Trace. Virtually any criteria can be used by modifying the filter criteria, OpenTelemetry is just a simple example.  

### Step 1: Identify OpenTelemetry ID in Traffic Viewer

First, pick a Trace ID to investigate. Conveniently, Speedscale automatically identifies and parses these values from many kinds of transactions. If Speedscale is monitoring your production environment, this involves simply opening the traffic viewer, selecting an RRPair and looking for the Trace ID in its Interesting Data. Speedscale will automatically populate the Trace ID if it is in a standard location. Here is an example HTTP Header taken from the traffic viewer:

`Traceparent=00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00`

This will break down into a `TraceID=4bf92f3577b34da6a3ce929d0e0e4736` and a `SpanID=00f067aa0ba902b7` in the RRPair's Interesting Data.

### Step 2: Create Trace ID Snapshot

After identifying the trace ID, you can then extract all calls related to that Trace ID from your service(s). This is done by by using the `speedctl create` command with a filter targeted at a specific service and header. Here is an example that will search all traffic on the payment service (inbound and outbound) related to this trace ID.

```bash
speedctl create snapshot --name trace_id_filtered --service payment --filter '(header[Traceparent] CONTAINS \"4bf92f3577b34da6a3ce929d0e0e4736\") AND (service IS \"payment\")'
```

The contents of this snapshot can be downloaded for inspection using the following command:

```bash
speedctl pull snapshot 2dff1e5a-a32f-4d73-8bb7-990924cec054
```

Using `speedctl edit` or by just looking at your local filesystem you can inspect the `raw.jsonl` file which contains the exact details necessary to replicate the trace as well as the back end services. Note that this example only contains requests going into and out of a specific service. You can run this command multiple times and merge snapshots to create a multi-service hop snapshot.

## Replay Trace Locally

Every request and response involved in that transaction will now be stored in a portable container called a [Snapshot](/reference/glossary.md#snapshot). This command will return a JSON description of the snapshot. Take note of its ID as this is the identifier used to replicate the environment. Snapshots are portable across environments and allow you to re-run the same transactions on your own machine or in a staging environment. As an example, we can replay the inbound traffic against a service running on the local desktop using a command like this:

```bash
speedctl replay 2dff1e5a-a32f-4d73-8bb7-990924cec054 --custom-url=localhost:9000
```

This may seem like magic but keep in mind that a snapshot is a recording of the entire data environment during the test timeframe. In this case, the snapshot will include BOTH the inbound requests necessary to initiate the transaction and also the responses received from the downstream services. Practically speaking, this means that the transaction can be replayed with the expectation that the service mocks will automatically be generated to satisfy this transaction.

:::tip
Once a snapshot is recorded, the environment it was recorded from is no longer needed and will not be affected by replay. This snapshot is self contained and includes the calls necessary to replicate the entire data environment.
:::
---

By following these steps, you'll be well-equipped to utilize Speedscale for monitoring and analyzing OpenTelemetry trace and span IDs. This enables you to gain deep insights into your distributed system's behavior and performance, leading to better diagnostics and optimizations.