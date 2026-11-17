---
title: Google Pub/Sub
description: "Capture Google Pub/Sub traffic with Speedscale and drive a subscriber in your Kubernetes cluster by republishing the messages it received, from a snapshot."
sidebar_position: 11
---

## Background

The Google Cloud client libraries talk to Pub/Sub over gRPC, on `pubsub.googleapis.com:443` or a regional endpoint, so Speedscale records Pub/Sub calls as gRPC calls. The PHP library falls back to the REST API when its gRPC extension is missing, and those calls are recorded as HTTP.

A publisher sends unary `Publish` calls. A subscriber built on a high-level client opens a bidirectional `StreamingPull` stream, receives messages on it, and acknowledges them with separate unary `Acknowledge` and `ModifyAckDeadline` calls. Some subscribers use unary `Pull` instead.

This guide covers replaying a subscriber from a Speedscale snapshot in your cluster. To record Pub/Sub locally, mock it, test a subscriber or a publisher with proxymock, or set up credentials, see [Message brokers](../../proxymock/message-brokers/index.md) in the proxymock docs.

For more information about Google Pub/Sub, see the [Google Cloud Pub/Sub documentation](https://cloud.google.com/pubsub).

## What is supported

| Call | Capture | Mock | Replay |
|---|---|---|---|
| `Publish`, `Acknowledge`, `ModifyAckDeadline` and other unary calls | Yes, as gRPC | Yes, as gRPC | Yes, as gRPC |
| `Pull` | Yes, as gRPC | Yes, from the recorded messages ([mock a subscriber](../../proxymock/message-brokers/mock-a-broker.md#google-pubsub)) | Its messages can be republished to drive a subscriber |
| `StreamingPull` | Yes, as a streamed gRPC call, kept in parts when it runs long | Yes, from the recorded messages ([mock a subscriber](../../proxymock/message-brokers/mock-a-broker.md#google-pubsub)) | Its messages can be republished to drive a subscriber |

Capture needs TLS interception, as for any gRPC service, or the eBPF collector. A subscriber keeps its `StreamingPull` stream open and ends it by cancelling it; capture keeps such a stream as one or more parts of a [long-lived stream](/proxymock/grpc/long-lived-streams/), which the mock serves as one stream. proxymock always records streamed calls; cloud capture records them only when `GRPC_STREAMING_ENABLED` is on (see [native server streaming](/proxymock/grpc/server-streaming/)). [Record Google Pub/Sub traffic](../../proxymock/message-brokers/record/google-pubsub.md) has the details.

## Replay a subscriber in your cluster

When the service under test is a subscriber, replaying its recorded calls to Pub/Sub would pull from the live subscription instead of feeding your service. Republish mode turns each message a recorded `StreamingPull` or `Pull` call received into a `Publish` of the same data, attributes and ordering key to the subscription's topic, and your subscriber receives the messages again. [Test a consumer](../../proxymock/message-brokers/test-a-consumer.md#google-pubsub) explains what republish does and does not replay.

**1. Choose the subscriber's calls as the replay's tests** when you create the snapshot. A subscriber's calls to Pub/Sub are outbound, so a replay mocks them by default:

```bash
speedctl create snapshot --name orders-worker --service orders-worker --tests-filter '(location CONTAINS "google.pubsub.v1.Subscriber")'
```

In the dashboard, open the snapshot's **Traffic** tab and use **Choose replay tests** instead. [Choose What a Replay Tests](../../proxymock/guides/choose-replay-tests.md) covers the filter syntax.

**2. Turn on republish** in the test config, with a secret reference for the service account key if the replay does not use Workload Identity:

```json
{
  "generator": {
    "pubsub": {
      "republish": true,
      "credentialsJson": "${{secret:pubsub-replay/key.json}}"
    }
  }
}
```

Speedscale mounts the secret into the generator, so it only has to exist in the namespace of the workload you replay. Without credentials in the test config, the replay uses Application Default Credentials, such as Workload Identity on GKE. The credentials need `pubsub.subscriptions.get` on the subscription and `pubsub.topics.publish` on the topic. [Connect to the broker](../../proxymock/message-brokers/connect-to-the-broker.md#google-pubsub) covers topic mapping, regional endpoints and the emulator.

**3. Replay the snapshot** with that test config. Leave Pub/Sub unmocked, so your subscriber reads the republished messages from Pub/Sub:

```bash
speedctl infra replay orders-worker --snapshot-id <snapshot-id> --test-config-id <test-config-id> --no-mocks
```

Each message is one request on the report, shown as `/google.pubsub.v1.Publisher/Publish` with the topic it went to. The latency is the time Pub/Sub took to accept the message, not the time your subscriber took to process it.

## Load test a subscriber

To keep the recorded gaps between deliveries, set the stage's request delay to the recorded time, or to a multiple of it: `0.5` halves every gap. A stage of virtual users with no request delay publishes as fast as Pub/Sub accepts. To multiply the volume, raise the number of virtual users: each one publishes the whole recording again. See [Pace and load](../../proxymock/message-brokers/test-a-consumer.md#pace-and-load) and [load patterns](../load-patterns.md).

Messages that share an ordering key are published in recorded order within one virtual user. Pub/Sub delivers them in order only when the subscription has message ordering turned on. Republished messages get new message IDs and publish times. Exactly-once delivery is not simulated.
