---
title: Record Google Pub/Sub traffic
sidebar_label: Google Pub/Sub
description: "Record a Google Pub/Sub publisher or subscriber with proxymock, against the emulator or the Pub/Sub service, or in Kubernetes, and read the messages each StreamingPull and Pull call received."
---

# Record Google Pub/Sub traffic

The Google Cloud client libraries call Pub/Sub over gRPC, on `pubsub.googleapis.com:443` or a regional endpoint, so proxymock records Pub/Sub calls as gRPC calls. Everything in [Record gRPC traffic](../../grpc/record.md) applies. The PHP library falls back to the REST API when its gRPC extension is missing, and those calls are recorded as HTTP.

## What the client does

- **A publisher** sends unary `Publish` calls, each with one or more messages.
- **A subscriber** built on a high-level client opens a bidirectional `StreamingPull` stream, sends its subscription in the first request, and receives messages on the stream. It acknowledges them with separate unary `Acknowledge` and `ModifyAckDeadline` calls, or on the stream itself. Some subscribers use unary `Pull` calls instead.

A subscriber keeps its stream open for as long as it runs and ends it by cancelling it. proxymock records such a stream as an ordered sequence of parts, a [long-lived stream](../../grpc/long-lived-streams.md), which the mock serves as one stream.

## Record against the emulator

The Pub/Sub emulator speaks plaintext gRPC, so the simplest recording maps a local port to it. Start the emulator, create your topic and subscription, then map a port:

```bash
gcloud beta emulators pubsub start --host-port=localhost:8085
proxymock record --map 18085=localhost:8085
```

Point the client libraries at the mapped port with the variable they read for the emulator:

```bash
PUBSUB_EMULATOR_HOST=localhost:18085 ./your-app
```

Use the app, then stop the recorder with Ctrl-C.

## Record against the Pub/Sub service

The service is reached over TLS, so the client must send its calls through proxymock and trust the proxymock CA. Set the proxy variables your runtime honors, such as `grpc_proxy` or `HTTPS_PROXY`, to the recorder's outbound port, and trust `~/.speedscale/certs/tls.crt`. The [language reference](../../getting-started/language-reference.md) shows both for each runtime. Record with a test project where you can, because the recording holds the messages your app published and received.

## What gets recorded

Each call is one file under a directory named for the host, such as `pubsub.googleapis.com`. The location is the gRPC method, such as `/google.pubsub.v1.Publisher/Publish` or `/google.pubsub.v1.Subscriber/StreamingPull`.

- **`Publish`** keeps the topic and each message's data, attributes and ordering key, and the message IDs Pub/Sub returned.
- **`StreamingPull`** keeps the requests the client sent, starting with the one that names the subscription, and every response the service pushed, each with its messages and ack IDs and the time it arrived.
- **`Pull`** keeps the messages it returned.

proxymock names the fields with the Pub/Sub `.proto` files it ships with, so the messages read as JSON with their field names. See [Name fields with your .proto](../../grpc/name-fields-with-your-proto.md).

This filter lists every subscriber call, which is also the filter that picks the deliveries to republish when you [test a subscriber](../test-a-consumer.md#google-pubsub):

```text
(location CONTAINS "google.pubsub.v1.Subscriber")
```

## In a cluster

In Kubernetes, the sidecar records Pub/Sub calls once it decrypts outbound TLS, as for any gRPC service, and the [eBPF collector](/reference/ebpf-traffic-collection/) reads the plaintext without TLS interception. Cloud capture records streamed calls such as `StreamingPull` only when `GRPC_STREAMING_ENABLED` is on; see [native server streaming](../../grpc/server-streaming.md). Java subscribers built on `google-cloud-pubsub` need a current Java agent image; see [gRPC Java and Google Cloud clients](/reference/java/agent#grpc-java).

## Next

- [Mock a broker](../mock-a-broker.md#google-pubsub)
- [Test a consumer](../test-a-consumer.md#google-pubsub)
- [Connect to the broker](../connect-to-the-broker.md#google-pubsub)
