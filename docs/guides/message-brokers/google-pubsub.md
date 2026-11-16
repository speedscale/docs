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
| `Pull` | Yes, as gRPC | Yes, as gRPC | Its messages can be republished to drive a subscriber |
| `StreamingPull` | Yes, as a streamed gRPC call, usually partial | Not yet (tracked in S-14278) | Its messages can be republished to drive a subscriber |

Capture needs TLS interception, as for any gRPC service. A `StreamingPull` stream normally stays open longer than the capture keeps one streamed call, so it is recorded as a partial call. A partial call cannot be mocked or replayed as a stream, but the messages it recorded in full can be republished.

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

**2. Replay the snapshot** with a test config that turns on republish. Leave Pub/Sub unmocked, so your subscriber reads the republished messages from Pub/Sub:

```bash
speedctl infra replay orders-worker --snapshot-id <snapshot-id> --test-config-id <test-config-id> --no-mocks
```

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
