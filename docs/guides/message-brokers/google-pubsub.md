---
title: Google Pub/Sub
description: "Capture, mock and replay Google Pub/Sub traffic with Speedscale and proxymock, and drive a subscriber under test by republishing the messages it received."
sidebar_position: 11
---

## Background

The Google Cloud client libraries talk to Pub/Sub over gRPC, on `pubsub.googleapis.com:443` or a regional endpoint, so Speedscale records Pub/Sub calls as gRPC calls. The PHP library falls back to the REST API when its gRPC extension is missing, and those calls are recorded as HTTP.

A publisher sends unary `Publish` calls. A subscriber built on a high-level client opens a bidirectional `StreamingPull` stream, receives messages on it, and acknowledges them with separate unary `Acknowledge` and `ModifyAckDeadline` calls. Some subscribers use unary `Pull` instead.

For more information about Google Pub/Sub, see the [Google Cloud Pub/Sub documentation](https://cloud.google.com/pubsub).

## What is supported

| Call | Capture | Mock | Replay |
|---|---|---|---|
| `Publish`, `Acknowledge`, `ModifyAckDeadline` and other unary calls | Yes, as gRPC | Yes, as gRPC | Yes, as gRPC |
| `Pull` | Yes, as gRPC | Yes, from the recorded messages ([mock a subscriber](#mock-a-pubsub-subscriber)) | Its messages can be republished to drive a subscriber |
| `StreamingPull` | Yes, as a streamed gRPC call, kept in parts when it runs long | Yes, from the recorded messages ([mock a subscriber](#mock-a-pubsub-subscriber)) | Its messages can be republished to drive a subscriber |

Capture needs TLS interception, as for any gRPC service. A subscriber keeps its `StreamingPull` stream open and ends it by cancelling it; capture keeps such a stream as one or more parts of a [long-lived stream](/proxymock/grpc/long-lived-streams/), which the mock serves as one stream. proxymock always records streamed calls. Cloud capture records them when stream capture is turned on, as described in [record a subscriber in your cluster](#record-a-subscriber-in-your-cluster).

## Record a subscriber in your cluster

Cloud capture does not record a stream that the client cancels unless stream capture is turned on, and a Pub/Sub subscriber always ends its `StreamingPull` that way. Without stream capture, a recording of a subscriber holds its `Acknowledge` and `ModifyAckDeadline` calls but none of the messages it received, so neither the mock nor republish has anything to send.

With eBPF capture, set the `ebpf.configuration.grpcStreaming` Helm value to `true`. It applies to every workload the node-level capture records:

```bash
helm upgrade speedscale-operator speedscale/speedscale-operator -n speedscale --reuse-values --set ebpf.configuration.grpcStreaming=true
```

With the [legacy sidecar](/getting-started/installation/sidecar/install), set the annotation on the subscriber's workload instead:

```yaml
metadata:
  annotations:
    sidecar.speedscale.com/grpc-streaming: "true"
```

Then check that the recording holds `/google.pubsub.v1.Subscriber/StreamingPull` calls with messages before you create a snapshot from it.

## Mock a Pub/Sub subscriber

When the service under test is a Pub/Sub subscriber, `proxymock mock` and the Speedscale responder answer its subscriber calls from the messages recorded for its subscription, so it runs with no Google Cloud project and no emulator. The Google client libraries call Pub/Sub over gRPC, and a high-level subscriber opens a bidirectional `StreamingPull` stream and acknowledges messages with separate unary `Acknowledge` and `ModifyAckDeadline` calls. Its keepalives, lease extensions and acknowledgement batches differ on every run, so the mock does not match these calls by signature.

Record the subscriber with proxymock, which records `StreamingPull` streams, including the long-lived streams a subscriber keeps open and ends by cancelling (see [long-lived gRPC streams](/proxymock/grpc/long-lived-streams/)). To record it in your cluster, turn on stream capture first, as described in [record a subscriber in your cluster](#record-a-subscriber-in-your-cluster). Then run the mock with the same mapping you recorded with, as for any [gRPC dependency](/proxymock/grpc/mock-a-grpc-dependency/). With the emulator, set `PUBSUB_EMULATOR_HOST` to the mapped port.

| Call | What the mock does |
|---|---|
| `StreamingPull` | Matches the stream by the subscription in its first request only. Pushes the messages recorded for that subscription, with their data, attributes, ordering key and message ID, at the pace they arrived in the recording. Then keeps the stream open until the client cancels it. |
| `Pull` | Answers from the same recorded messages, up to `max_messages`, and returns an empty response once none are left. |
| `Acknowledge` and `ModifyAckDeadline` | Answers success whatever the ack IDs. |
| Publisher calls such as `Publish`, and other subscriber calls such as `GetSubscription` | Matched by signature, like any other gRPC call. |

The mock answers these four calls this way for a Pub/Sub host once the recording holds at least one of them for that host.

The mock uses the messages of every recorded `StreamingPull` and `Pull` call for the subscription, in the order they were recorded, including streams recorded as several parts and streams the client cancelled. A message recorded twice with the same ack ID is sent once, and a redelivery recorded with a new ack ID is sent again as recorded. Use `proxymock mock --grpc-streaming-immediate` to send the messages without the recorded gaps.

The mock honors the `max_outstanding_messages` and `max_outstanding_bytes` that the client sends in its first `StreamingPull` request. It stops sending while the messages it sent and the client has not acknowledged reach either limit, and splits a recorded response when only part of it fits. An acknowledgement frees room whether it arrives on the stream or as an `Acknowledge` call, and so does a nack, which is a `ModifyAckDeadline` of 0 seconds. A lease extension frees nothing, and keepalives are ignored.

Each recorded message is sent once per mock instance and subscription. Two subscribers on the same subscription share the recorded messages, as they share a real subscription, instead of both receiving all of them. A `Pull` takes from the same messages, so it gets only what the streams have not taken. Restart or reload the mock to send the messages again.

A `StreamingPull` for a subscription with no recorded `StreamingPull` or `Pull` call returns `NOT_FOUND`. A `Pull` for such a subscription goes to the normal gRPC match instead, which can answer it from a `Pull` recorded by an older release. A subscription whose recordings hold no messages keeps its stream open and answers `Pull` with an empty response.

Every call is saved to the mock's observed output as a match or a miss. A `StreamingPull` is saved when the stream ends, with the requests the client sent and the messages the mock sent.

The mock does not redeliver a message that is nacked, never acknowledged, or left outstanding on a stream the client cancelled, as Pub/Sub would after the ack deadline. It does not simulate exactly-once delivery or ordering-key delivery rules.

## Drive a subscriber by republishing

When the service under test is a subscriber, replaying its recorded calls to Pub/Sub would pull from the live subscription instead of feeding your service. Republish mode turns each message a recorded `StreamingPull` or `Pull` call received into a `Publish` of the same data, attributes and ordering key to the subscription's topic. Your subscriber then receives the messages again and acknowledges them itself.

The recorded `Acknowledge`, `ModifyAckDeadline` and other subscriber calls are not replayed, because your subscriber makes them. `Publish` calls your service made still replay as gRPC.

Each message is one request on the report, shown as `/google.pubsub.v1.Publisher/Publish` with the topic it went to. The latency is the time Pub/Sub took to accept the message, not the time your subscriber took to process it. A message Pub/Sub refuses fails the request.

### Turn on republish

Add `generator.pubsub` to the test config:

```json
{
  "generator": {
    "pubsub": {
      "republish": true
    }
  }
}
```

The topic is looked up from the subscription with `GetSubscription`, so the replay's credentials need `pubsub.subscriptions.get` on the subscription and `pubsub.topics.publish` on the topic. To publish to another topic, or when the replay cannot read the subscription, map the subscription to a topic with full names:

```json
{
  "generator": {
    "pubsub": {
      "republish": true,
      "subscriptionTopics": {
        "projects/shop/subscriptions/orders-worker": "projects/shop-staging/topics/orders"
      }
    }
  }
}
```

### Credentials and endpoint

Without credentials in the test config, the replay uses Application Default Credentials, such as Workload Identity on GKE or `gcloud auth application-default login` on your machine.

To use a service account key, store the key file in a secret and reference it in `credentialsJson`. Speedscale mounts the secret into the generator, so it only has to exist in the namespace of the workload you replay. Do not paste the key itself, because a literal value is stored with the test config:

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

With proxymock you can set `credentialsFile` to the path of a key file on your machine instead. Service account, authorized user, impersonated service account and external account files are accepted.

Set `endpoint` to a `host:port` such as `us-east1-pubsub.googleapis.com:443` to publish through a regional endpoint.

### Replay into the Pub/Sub emulator

Set `emulatorHost` to the emulator's `host:port`, or set the `PUBSUB_EMULATOR_HOST` environment variable as the Google client libraries do. The emulator is reached in plaintext without credentials, and `emulatorHost` wins over `endpoint`. Create the topic and the subscription in the emulator before the replay starts, as your subscriber's own setup would.

### Replay in your cluster

**1. Choose the subscriber's calls as the replay's tests** when you create the snapshot. A subscriber's calls to Pub/Sub are outbound, so a replay mocks them by default:

```bash
speedctl create snapshot --name orders-worker --service orders-worker --tests-filter '(location CONTAINS "google.pubsub.v1.Subscriber")'
```

In the dashboard, open the snapshot's **Traffic** tab and use **Choose replay tests** instead. [Choose What a Replay Tests](../../proxymock/guides/choose-replay-tests.md) covers the filter syntax.

**2. Replay the snapshot** with a test config that turns on republish. Leave Pub/Sub unmocked with `--mock-except`, so your subscriber reads the republished messages from Pub/Sub, while its other dependencies, such as its database and the HTTP services it calls, stay mocked:

```bash
speedctl infra replay orders-worker --snapshot-id <snapshot-id> --test-config-id <test-config-id> --mock-except 'host:pubsub.googleapis.com'
```

Use the host your subscriber recorded, such as `us-east1-pubsub.googleapis.com` for a regional endpoint. Add `--dry-run-mocks` to print which services the replay will mock before you run it. [Controlling Outbound Mocks](../replay/via-speedctl.md#controlling-outbound-mocks) covers the selector syntax.

Keep the other dependencies mocked to catch regressions. A republished message passes when Pub/Sub accepts it, whatever your subscriber then does with it, so what your subscriber does is visible only in the calls it makes downstream. The [`httpOutput` assertion](../../reference/configuration/assertions/httpoutput.md) compares those calls with the recording, and it needs the responder that `--no-mocks` turns off.

### Replay locally with proxymock

Run your subscriber against the emulator or a test project, then replay the recorded deliveries with a test config that turns on republish:

```bash
PUBSUB_EMULATOR_HOST=localhost:8085 proxymock replay --in proxymock/recorded-<timestamp> --tests-filter '(location CONTAINS "google.pubsub.v1.Subscriber")' --test-config pubsub-republish
```

See [test configs](../../proxymock/guides/test-configs.md) for where `pubsub-republish` lives.

### Load test a subscriber

Each message is published at the time it arrived in the recording, so the gaps between deliveries match production. To publish faster or slower, set the stage's request delay to a multiple of the recorded time: `0.5` halves every gap. To multiply the volume, raise the number of vUsers: each vUser publishes the whole recording again. With proxymock, `--vus` and `--times` do the same. See [load patterns](../load-patterns.md).

Messages that share an ordering key are published in recorded order within one vUser. Pub/Sub delivers them in order only when the subscription has message ordering turned on.

Republished messages get new message IDs and publish times. Exactly-once delivery is not simulated.
