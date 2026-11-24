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
| `Publish` | Yes, as gRPC | Yes, by topic with new message IDs ([mock a publisher](#mock-a-pubsub-publisher)) | Yes, as gRPC |
| `Acknowledge` and `ModifyAckDeadline` | Yes, as gRPC | Yes, without matching ([mock a subscriber](#mock-a-pubsub-subscriber)) | Yes, as gRPC |
| Other unary calls, such as `GetSubscription` | Yes, as gRPC | Yes, as gRPC | Yes, as gRPC |
| `Pull` | Yes, as gRPC | Yes, from the recorded messages ([mock a subscriber](#mock-a-pubsub-subscriber)) | Its messages can be republished to drive a subscriber |
| `StreamingPull` | Yes, as a streamed gRPC call, kept in parts when it runs long | Yes, from the recorded messages ([mock a subscriber](#mock-a-pubsub-subscriber)) | Its messages can be republished to drive a subscriber |

Capture needs TLS interception, as for any gRPC service. A subscriber keeps its `StreamingPull` stream open and ends it by cancelling it; capture keeps such a stream as one or more parts of a [long-lived stream](/proxymock/grpc/long-lived-streams/), which the mock serves as one stream. proxymock and cloud capture both record streamed calls.

## Record a subscriber in your cluster

eBPF capture and the legacy sidecar record a subscriber's `StreamingPull` with no extra setting, including the messages it received. Check that the recording holds `/google.pubsub.v1.Subscriber/StreamingPull` calls with messages before you create a snapshot from it.

A recording that holds the subscriber's `Acknowledge` and `ModifyAckDeadline` calls but no `StreamingPull` was made with `GRPC_STREAMING_ENABLED=false` set on goproxy. That setting selects the older writer, which drops a stream the client cancels, and a subscriber always ends its `StreamingPull` that way. Remove it and record again.

## Mock a Pub/Sub subscriber

When the service under test is a Pub/Sub subscriber, `proxymock mock` and the Speedscale responder answer its subscriber calls from the messages recorded for its subscription, so it runs with no Google Cloud project and no emulator. The Google client libraries call Pub/Sub over gRPC, and a high-level subscriber opens a bidirectional `StreamingPull` stream and acknowledges messages with separate unary `Acknowledge` and `ModifyAckDeadline` calls. Its keepalives, lease extensions and acknowledgement batches differ on every run, so the mock does not match these calls by signature.

Record the subscriber with proxymock, which records `StreamingPull` streams, including the long-lived streams a subscriber keeps open and ends by cancelling (see [long-lived gRPC streams](/proxymock/grpc/long-lived-streams/)). Cloud capture records it the same way, as described in [record a subscriber in your cluster](#record-a-subscriber-in-your-cluster). Then run the mock with the same mapping you recorded with, as for any [gRPC dependency](/proxymock/grpc/mock-a-grpc-dependency/). With the emulator, set `PUBSUB_EMULATOR_HOST` to the mapped port.

| Call | What the mock does |
|---|---|
| `StreamingPull` | Matches the stream by the subscription in its first request only. Pushes the messages recorded for that subscription, with their data, attributes, ordering key and message ID, at the pace they arrived in the recording. Then keeps the stream open until the client cancels it. |
| `Pull` | Answers from the same recorded messages, up to `max_messages`, and returns an empty response once none are left. |
| `Acknowledge` | Ends the delivery of each ack ID the mock handed out, and answers success whatever the ack IDs. |
| `ModifyAckDeadline` | Extends the ack deadline of each delivery, or redelivers it when the deadline is 0 seconds (a nack), and answers success whatever the ack IDs. |
| `Publish` | Answered by topic, see [mock a publisher](#mock-a-pubsub-publisher). |
| Other subscriber calls such as `GetSubscription` | Matched by signature, like any other gRPC call. |

The mock answers the four subscriber calls this way for a Pub/Sub host once the recording holds at least one of them for that host.

The mock uses the messages of every recorded `StreamingPull` and `Pull` call for the subscription, in the order they were recorded, including streams recorded as several parts and streams the client cancelled. Each message is sent once at its first recorded delivery, however many times it was delivered in the recording, because the mock redelivers what your subscriber nacks or lets expire. Use `proxymock mock --grpc-streaming-immediate` to send the messages without the recorded gaps.

The mock honors the `max_outstanding_messages` and `max_outstanding_bytes` that the client sends in its first `StreamingPull` request. It stops sending while the messages it sent and the client has not acknowledged reach either limit, and splits a recorded response when only part of it fits. An acknowledgement frees room whether it arrives on the stream or as an `Acknowledge` call, and so does a nack, which is a `ModifyAckDeadline` of 0 seconds. A lease extension frees nothing, and keepalives are ignored.

Each recorded message is sent once per mock instance and subscription, unless you [serve more than the recorded volume](#serve-more-than-the-recorded-volume). Two subscribers on the same subscription share the recorded messages, as they share a real subscription, instead of both receiving all of them. A `Pull` takes from the same messages, so it gets only what the streams have not taken. Restart or reload the mock to send the messages again.

A `StreamingPull` for a subscription with no recorded `StreamingPull` or `Pull` call returns `NOT_FOUND`. A `Pull` for such a subscription goes to the normal gRPC match instead, which can answer it from a `Pull` recorded by an older release. A subscription whose recordings hold no messages keeps its stream open and answers `Pull` with an empty response.

Every call is saved to the mock's observed output as a match or a miss. A `StreamingPull` is saved when the stream ends, with the requests the client sent and the messages the mock sent.

The mock does not simulate exactly-once delivery or ordering-key delivery rules.

### Redelivery

The mock redelivers a message the way Pub/Sub does when no retry policy is set:

- A nack, which is a `ModifyAckDeadline` of 0 seconds on the stream or as a unary call, redelivers the message at once.
- A message left unacknowledged past its ack deadline is redelivered. That includes a message outstanding on a stream the client cancelled or the mock dropped.
- A redelivery has a new ack ID and the next `delivery_attempt`, counting the first delivery as 1. The message itself, its message ID included, is unchanged.
- An ack with the old ack ID no longer ends the redelivered message.

The ack deadline of a `StreamingPull` delivery is the `stream_ack_deadline_seconds` of the stream. A `ModifyAckDeadline` with more than 0 seconds extends it from the time it arrives. A `Pull` delivery has the Pub/Sub default deadline of 10 seconds, because the subscription's own deadline is not in the recording.

Redelivery lets a recording test your subscriber's retry path, a poison message it keeps nacking, and the dead-letter handling it does itself. The mock has no dead-letter topic of its own.

### Faults and chaos

The test config's [chaos rules](../../concepts/chaos.md) and the [`proxymock mock --fault`](../../reference/proxymock-cli-reference.md#mock) rules apply to `StreamingPull`, `Pull`, `Acknowledge`, `ModifyAckDeadline` and `Publish`. A rule sees each unary call once, and each `StreamingPull` once when the stream opens:

| Effect | Unary call | `StreamingPull` |
|---|---|---|
| Latency | Delays the response. | Delays every message the stream sends. |
| Status code | Fails the call with the gRPC code a client reads from that HTTP status: 429, 502, 503 and 504 are `UNAVAILABLE`, 401 is `UNAUTHENTICATED`, 403 is `PERMISSION_DENIED`, 404 is `UNIMPLEMENTED`, 400 is `INTERNAL`, and others are `UNKNOWN`. | Ends the stream with that code before it sends anything. |
| No response | Leaves the call unanswered until the client gives up. | Keeps the stream open without sending anything. |
| Connection refuse, reset or stall | Faults the connection before anything is answered. | Faults the connection before anything is sent. |
| Connection drop | Sends part of the response, then cuts the connection. | Sends the first message, then cuts the connection. |

A call a fault stops changes nothing: a failed `Acknowledge` leaves its messages outstanding, and a failed `Pull` or `StreamingPull` hands nothing out. A message the mock sent before it dropped the connection stays outstanding until its ack deadline passes, and is then redelivered. Body, header and payload effects do not apply to Pub/Sub calls. Each perturbed call is marked in the observed output, as any other chaos is.

For example, this fails one `Acknowledge` in four with `UNAVAILABLE`, so your subscriber has to retry its acks:

```bash
proxymock mock --in proxymock/recorded-<timestamp> --fault 'Acknowledge:rate=1/4'
```

### Serve more than the recorded volume

By default the mock sends each recorded message once. To load test a subscriber offline, with no Google Cloud project and no emulator, serve the recorded messages several times or without end:

```bash
proxymock mock --in proxymock/recorded-<timestamp> --pubsub-passes 10
```

`--pubsub-passes` takes a whole number, or `loop` to start again each time the messages run out. In a test config, set `responder.pubsub`:

```json
{
  "responder": {
    "pubsub": {
      "passes": 10
    }
  }
}
```

Set `"loop": true` instead of `passes` to serve without end. A `--pubsub-passes` flag wins over the test config.

The first pass sends the messages as recorded. Every later pass sends them with new ack IDs and new message IDs, so a subscriber that deduplicates on the message ID processes them again. Each pass keeps the recorded gaps between messages unless you also use `--grpc-streaming-immediate`. A subscriber that deduplicates on a field inside the message data still sees the recorded data on every pass.

## Mock a Pub/Sub publisher

When the service under test publishes to Pub/Sub, the mock answers its `Publish` calls by topic instead of by signature. A client library batches messages by count, size and delay, and messages often carry timestamps or IDs, so a signature match of the whole request would miss.

The mock answers a `Publish` to any topic that the recording holds a `Publish` to on the same host. It returns a new message ID for each message, whatever the messages hold and however they are batched. A `Publish` to a topic the recording never published to is matched by signature, like any other gRPC call.

Each published message is saved to the observed output as its own `Publish` call, with that one message and its message ID, so a comparison with the recording sees messages instead of batches. The call is tagged with `pubsubTopic`, `pubsubMessageId`, and `pubsubPublishCall`, which the messages of one batch share.

## Catch a publisher regression

When the service under test publishes, its `Publish` calls are outbound calls, so a replay mocks them. With the [`httpOutput` assertion](../../reference/configuration/assertions/httpoutput.md#google-pubsub-publishes) in the test config, the replay also compares what the service published with the recording.

It compares each published message on its own, grouped by topic, so a client library that batches the messages differently is not a difference. JSON data is compared field by field, along with each attribute and the ordering key. A changed amount or event type is reported on its field, such as `data.amount` or `attributes.eventType`, while IDs and timestamps that differ in every message are not compared. A message sent to another topic, or one fewer message than recorded, is reported too.

To compare only one topic, set `includeOnly` to its endpoint:

```json
{
  "type": "httpOutput",
  "config": {
    "includeOnly": "/google.pubsub.v1.Publisher/Publish/projects/shop/topics/orders"
  }
}
```

## Drive a subscriber by republishing

When the service under test is a subscriber, replaying its recorded calls to Pub/Sub would pull from the live subscription instead of feeding your service. Republish mode turns each message a recorded `StreamingPull` or `Pull` call received into a `Publish` of the same data, attributes and ordering key to the subscription's topic. Your subscriber then receives the messages again and acknowledges them itself.

The recorded `Acknowledge`, `ModifyAckDeadline` and other subscriber calls are not replayed, because your subscriber makes them. `Publish` calls your service made still replay as gRPC.

Each message is one request on the report, shown as `/google.pubsub.v1.Publisher/Publish` with the topic it went to. The latency is the time Pub/Sub took to accept the message, not the time your subscriber took to process it. A message Pub/Sub refuses fails the request.

Whether your subscriber kept up is measured separately, from the subscription's Cloud Monitoring metrics and from your subscriber's own acks. See [Check that the subscriber kept up](#check-that-the-subscriber-kept-up).

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

Keep the other dependencies mocked to catch regressions. A republished message passes when Pub/Sub accepts it, whatever your subscriber then does with it. The report's Pub/Sub metrics show whether your subscriber acked the messages, but what it did with them is visible only in the calls it makes downstream. The [`httpOutput` assertion](../../reference/configuration/assertions/httpoutput.md) compares those calls with the recording, and it needs the responder that `--no-mocks` turns off.

### Replay locally with proxymock

Run your subscriber against the emulator or a test project, then replay the recorded deliveries with a test config that turns on republish:

```bash
PUBSUB_EMULATOR_HOST=localhost:8085 proxymock replay --in proxymock/recorded-<timestamp> --tests-filter '(location CONTAINS "google.pubsub.v1.Subscriber")' --test-config pubsub-republish
```

See [test configs](../../proxymock/guides/test-configs.md) for where `pubsub-republish` lives.

### Check that the subscriber kept up

After the last message is published, the replay waits for the subscription's backlog to drain before the report closes, so acks that arrive late still count. The wait ends as soon as Cloud Monitoring shows no undelivered messages in a sample taken after the last publish, or after `drainTimeout`. Cloud Monitoring publishes Pub/Sub samples a minute or more late, so expect the wait to take at least that long.

The report then gets the subscription's Cloud Monitoring metrics for the replay. They are read with the replay's own credentials, which need `monitoring.timeSeries.list` (in `roles/monitoring.viewer`) on the subscription's project:

| Metric | What it measures |
|---|---|
| `pubsubBacklogMax` | The most undelivered messages on the subscription during the replay |
| `pubsubBacklogEnd` | Undelivered messages when the replay ended |
| `pubsubOldestUnackedAgeMax` | The longest any message waited unacked, in seconds |
| `pubsubAckRate` | Acks per second, over the minutes the subscription acked messages |
| `pubsubExpiredAckDeadlineCount` | Ack deadlines that expired during the replay |
| `pubsubSubscriptionAckLatencyP95` | The subscription's ack latency p95 in its worst minute, in milliseconds |

These metrics count every message on the subscription, including any backlog from before the replay and messages from other publishers on the same topic.

The emulator has no Cloud Monitoring metrics. When the replay publishes to the emulator, or its credentials cannot read Cloud Monitoring, the report says so in a replay event and the replay carries on without these metrics. Without them there is no backlog to watch, so the replay waits for the ack window after the last publish instead.

Where your subscriber's own Pub/Sub calls are captured with the replay, each republished message is also checked. The message ID Pub/Sub gave it is followed through your subscriber's `StreamingPull` or `Pull` delivery to its ack, whether the ack went on the stream or as an `Acknowledge` call:

| Metric | What it measures |
|---|---|
| `pubsubRepublishedCount` | Messages Pub/Sub accepted |
| `pubsubAckedPct` | Republished messages acked within the ack window |
| `pubsubUnackedCount` | Republished messages not acked within the ack window, late acks included |
| `pubsubAckLatencyP50`, `pubsubAckLatencyP95`, `pubsubAckLatencyMax` | Time from delivery to ack, in milliseconds |
| `pubsubRedeliveryCount` | Deliveries of a republished message after its first |

With proxymock, pass `--mocks-out` with the directory `proxymock mock` wrote while your subscriber ran through it, and the replay reads your subscriber's calls from there. In your cluster, the report sees only the calls that went through the responder, so with Pub/Sub left out of mocking the messages are not checked one by one. The report says so in a notice, and the Cloud Monitoring metrics are the measure there.

Set how long your subscriber has to ack each message, and how long the replay waits for the backlog to drain:

```json
{
  "generator": {
    "pubsub": {
      "republish": true,
      "ackWindow": "30s",
      "drainTimeout": "2m"
    }
  }
}
```

`ackWindow` defaults to one minute. `drainTimeout` defaults to five minutes, and `0s` turns the wait off.

A message not acked within the ack window adds a warning to the report. When your subscriber's calls were not captured, the warning comes from the subscription's oldest unacked message instead: it fires when a message waited longer than the ack window. To fail the replay instead of warning, add a goal on the metric:

```json
{
  "rules": [
    { "metricName": "pubsubUnackedCount", "type": "TOO_HIGH", "value": 0, "action": "ALERT" },
    { "metricName": "pubsubBacklogEnd", "type": "TOO_HIGH", "value": 0, "action": "ALERT" },
    { "metricName": "pubsubAckLatencyP95", "type": "TOO_HIGH", "value": 500, "action": "ALERT" }
  ]
}
```

A goal on a metric the replay could not measure has nothing to evaluate, so it does not fail the replay. With proxymock, it is listed as not evaluated with the reason.

### Load test a subscriber

Each message is published at the time it arrived in the recording, so the gaps between deliveries match production. To publish faster or slower, set the stage's request delay to a multiple of the recorded time: `0.5` halves every gap. To multiply the volume, raise the number of vUsers: each vUser publishes the whole recording again. With proxymock, `--vus` and `--times` do the same. See [load patterns](../load-patterns.md).

To find the rate your subscriber can sustain, raise the load until the backlog stops draining. Goals on `pubsubBacklogEnd`, `pubsubOldestUnackedAgeMax` or `pubsubAckLatencyP95` fail the replay at the point your subscriber falls behind.

Messages that share an ordering key are published in recorded order within one vUser. Pub/Sub delivers them in order only when the subscription has message ordering turned on.

### Give every vUser its own keys

Every vUser republishes the same data. A subscriber that deduplicates on a business key, such as an order ID, then skips the copies and does less work than it would in production, so the load test looks better than it should. Add a transform that rewrites the key in each message with the [`pubsub_message`](../transformation/extractors/pubsub_message.md) extractor:

```json
{
  "filters": {
    "filters": [{ "include": true, "detectedLocation": "/google.pubsub.v1.Publisher/Publish", "operator": "CONTAINS" }]
  },
  "extractor": {
    "type": "pubsub_message",
    "config": { "field": "data" }
  },
  "transforms": [
    { "type": "json_path", "config": { "path": "orderId" } },
    { "type": "rand_string", "config": { "pattern": "ord-[a-z0-9]{12}" } }
  ]
}
```

`pubsub_message` hands the message's data to `json_path`, which reaches the `orderId` field, and `rand_string` gives every published message a new value. To rewrite an attribute instead, set `name` to its key. The same extractor works on the `Publish` calls a publisher recorded.

Republished messages get new message IDs and publish times. Exactly-once delivery is not simulated.
