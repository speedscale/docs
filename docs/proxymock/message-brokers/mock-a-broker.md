---
title: Mock a broker
description: "Run a Kafka, RabbitMQ, Amazon MQ, Google Pub/Sub or Redis Pub/Sub producer or consumer against a mock broker built from a proxymock recording: consumers receive the recorded messages, publishes are accepted, and no broker has to run."
---

# Mock a broker

`proxymock mock` answers your app's broker calls from a recording, so the app runs with no broker: no container to start, no topics or queues to create, and the same messages every time. A consumer receives the messages it received when you recorded it, which makes its behavior repeatable on a laptop, in CI and for an AI coding assistant.

## Run the mock

Record once against a real broker, then start the mock with the same mapping and point the app at it:

```bash
proxymock record --map 15672=amqp://localhost:5672 -- your-app                                # once, against the real broker
proxymock mock --in proxymock/recorded-<timestamp> --map 15672=amqp://localhost:5672 -- your-app # from now on, no broker needed
```

The scheme tells the mock which protocol the port speaks: `kafka://`, `amqp://` or `amqps://`, or `redis://`. A Pub/Sub mapping needs no scheme, because gRPC is found from the connection. The broker does not have to run. The mock writes what it served to `proxymock/results/mocked-<timestamp>`, one file per call, tagged `HIT` when it came from the recording and `MISS` when it did not.

The Kafka, AMQP and Redis mocks accept TLS and plaintext on the same port, presenting a certificate from the proxymock CA, so an app that connects over TLS keeps its URL and trusts the proxymock CA as it does when you record.

## What every broker mock does

The mocks follow one model, with the differences listed per broker below:

- **Housekeeping is answered like a broker.** The handshake, heartbeats, acknowledgements and closing do not depend on stored state, so the mock answers them itself, whether or not the recording has them.
- **Stateful calls are answered from the recording.** A queue declare, a group join or a subscription lookup gets the answer the broker gave when you recorded.
- **Recorded deliveries go to live consumers in order.** When your app subscribes, it receives the messages a recorded consumer of the same queue, topic, subscription or channel received.
- **Publishes are accepted and go nowhere.** The mock acknowledges what your app publishes but has no queues behind it, so a message your app publishes is never delivered to a consumer, even one in the same app. Consumers get the recorded messages, which already include any message your app published to itself when you recorded.

| Broker | How a consumer gets messages | Pace | When the recording has no answer |
|---|---|---|---|
| Kafka | Each `Fetch` returns the next recorded batch for its topic, partition and offset | On each fetch | The call is a miss and the mock closes the connection; the client reconnects and retries |
| RabbitMQ and Amazon MQ | `Basic.Consume` starts pushing a recorded consumer's deliveries | All at once, in order | The mock answers as a broker that accepted the request would, and the call is a miss |
| Google Pub/Sub | `StreamingPull` pushes, and `Pull` returns, the subscription's recorded messages | The recorded gaps, within the client's flow control | `StreamingPull` for an unrecorded subscription returns `NOT_FOUND` |
| Redis Pub/Sub | Each subscription receives a recorded subscriber's messages | The recorded gaps | A command with no recording gets an error reply |

## Kafka {#kafka}

```bash
proxymock mock --in proxymock/recorded-<timestamp> --map 19094=kafka://localhost:9094
KAFKA_BOOTSTRAP_SERVERS=localhost:19094 ./your-app
```

Without the `kafka://` scheme, the mock guesses the protocol from the port the recording was made on. The broker's listener settings do not matter, because the mock tells the client that it is the only broker in the cluster and the coordinator of every group. See [Record Kafka traffic](./record/kafka.md) for the recording.

- **Bootstrap and metadata.** `ApiVersions`, `Metadata` and `FindCoordinator` are answered so the client keeps talking to the mock. The mock advertises the API versions it supports, and the client picks from them.
- **Produce.** A `Produce` is acknowledged, or not answered when the producer uses `acks=0`.
- **Fetch.** A consumer's `Fetch` is answered with the records recorded for that topic, partition and offset. Each recorded batch is served once, and later fetches return no records, the way a broker answers a consumer that has caught up. When the recording shows the app producing and then consuming in rounds, as a request and reply service does, the mock holds each round's records until the app has produced that round.
- **Consumer groups.** `JoinGroup`, `SyncGroup`, `Heartbeat` and `LeaveGroup` run against a coordinator inside the mock, so a consumer joins its group and gets its partitions. `OffsetFetch`, `OffsetCommit` and `ListOffsets` are answered.

Run against the six-record recording on the [record page](./record/kafka.md#what-gets-recorded), a console producer gets its acknowledgements and a console consumer in the group `billing` reads the same six records, with every call a `HIT` and no broker running.

**Misses.** A call the recording has no answer for, and the mock cannot answer on its own, is written to the results as a miss, and the mock closes that connection. Kafka clients reconnect and retry, so a miss usually shows up as a client retrying or timing out rather than as an error in the app. The usual causes are a topic, partition or offset the recording never fetched, and a call the app did not make while you recorded. Record the app doing the work you want to test, so the recording covers the topics and partitions it reads.

**Clients that authenticate.** The mock answers SASL itself instead of replaying the recorded handshake. With SASL/PLAIN it accepts any username and password. SCRAM-SHA-256 and SCRAM-SHA-512 need the password your app uses, because the client checks the server's proof. Put it in the `responder.kafka` section of a [test config](../guides/test-configs.md), and run the mock as part of a replay with `--test-config`:

```json
{
  "responder": {
    "kafka": {
      "username": "${{secret:kafka-credentials/username}}",
      "password": "${{secret:kafka-credentials/password}}",
      "saslMechanism": "PROTOCOL_SASL_MECHANISM_SCRAM_SHA_512"
    }
  }
}
```

Without it, the mock answers a SCRAM handshake with `UNSUPPORTED_SASL_MECHANISM` and logs a warning. [Connect to the broker](./connect-to-the-broker.md#secret-references) explains where a secret reference is read from.

## RabbitMQ and Amazon MQ {#rabbitmq}

```bash
proxymock mock --in proxymock/recorded-<timestamp> --map 15672=amqp://localhost:5672
```

Point your app at `amqp://localhost:15672`. For Amazon MQ, keep the `amqps://` URL and map the TLS port, `--map 15671=amqps://b-1234.mq.us-east-1.amazonaws.com:5671`, then point your app at `amqps://localhost:15671`.

- **Connection, channels, heartbeats, publisher confirms and closing** behave like a broker. Any username, password and virtual host are accepted. The client picks the heartbeat interval, and the mock sends heartbeats at half of it.
- **Declares, binds, `Basic.Qos`, `Basic.Get`, `Basic.Recover` and transactions** are answered with the recorded response, including a recorded refusal such as `NOT_FOUND`, which closes the channel the way the broker did. A call the recording does not have gets the answer a broker that accepted it would give, so the client keeps going, and it shows as a miss. A server-named queue gets a generated name.
- **`Basic.Consume`** delivers, in order and without waiting between them, the messages a recorded consumer of the same queue received, with your consumer's tag and delivery tags numbered for its channel. A queue recorded with several consumers hands their recordings out in turn.
- **`Basic.Publish`** is accepted, and acknowledged in confirm mode. A publish to an exchange and routing key the recording has is a hit.

Not simulated: queues and routing, so a message published to the mock is never delivered to a consumer; message TTL and dead-lettering; consumer prefetch limits, so `Basic.Qos` does not hold deliveries back; `Basic.Return` for an unroutable mandatory message; and connection-level errors.

## Google Pub/Sub {#google-pubsub}

When the service under test is a Pub/Sub subscriber, the mock answers its subscriber calls from the messages recorded for its subscription, so it runs with no Google Cloud project and no emulator. Run the mock with the same mapping you recorded with, as for any [gRPC dependency](../grpc/mock-a-grpc-dependency.md). With the emulator, set `PUBSUB_EMULATOR_HOST` to the mapped port.

A subscriber's keepalives, lease extensions and acknowledgement batches differ on every run, so the mock does not match these calls by signature:

| Call | What the mock does |
|---|---|
| `StreamingPull` | Matches the stream by the subscription in its first request only. Pushes the messages recorded for that subscription, with their data, attributes, ordering key and message ID, at the pace they arrived in the recording. Then keeps the stream open until the client cancels it. |
| `Pull` | Answers from the same recorded messages, up to `max_messages`, and returns an empty response once none are left. |
| `Acknowledge` and `ModifyAckDeadline` | Answers success whatever the ack IDs. |
| Publisher calls such as `Publish`, and other subscriber calls such as `GetSubscription` | Matched by signature, like any other gRPC call. |

The mock answers these four calls this way for a Pub/Sub host once the recording holds at least one of them for that host.

The mock uses the messages of every recorded `StreamingPull` and `Pull` call for the subscription, in the order they were recorded, including streams recorded as several parts and streams the client cancelled. A message recorded twice with the same ack ID is sent once, and a redelivery recorded with a new ack ID is sent again as recorded. Use `proxymock mock --grpc-streaming-immediate` to send the messages without the recorded gaps.

**Flow control.** The mock honors the `max_outstanding_messages` and `max_outstanding_bytes` that the client sends in its first `StreamingPull` request. It stops sending while the messages it sent and the client has not acknowledged reach either limit, and splits a recorded response when only part of it fits. An acknowledgement frees room whether it arrives on the stream or as an `Acknowledge` call, and so does a nack, which is a `ModifyAckDeadline` of 0 seconds. A lease extension frees nothing, and keepalives are ignored.

**Shared subscriptions.** Each recorded message is sent once per mock instance and subscription. Two subscribers on the same subscription share the recorded messages, as they share a real subscription, instead of both receiving all of them. A `Pull` takes from the same messages, so it gets only what the streams have not taken. Restart or reload the mock to send the messages again.

**Misses.** A `StreamingPull` for a subscription with no recorded `StreamingPull` or `Pull` call returns `NOT_FOUND`. A `Pull` for such a subscription goes to the normal gRPC match instead, which can answer it from a `Pull` recorded by an older release. A subscription whose recordings hold no messages keeps its stream open and answers `Pull` with an empty response. Every call is saved to the mock's output as a match or a miss. A `StreamingPull` is saved when the stream ends, with the requests the client sent and the messages the mock sent.

Not simulated: redelivery of a message that is nacked, never acknowledged, or left outstanding on a stream the client cancelled, as Pub/Sub would do after the ack deadline; exactly-once delivery; and ordering-key delivery rules.

## Redis Pub/Sub {#redis-pubsub}

```bash
proxymock mock --map 56379=redis://127.0.0.1:6379 --in ./recordings --no-passthrough
```

- **Subscribe and unsubscribe commands** are answered the way the server would, whether or not the recording has them.
- **Each new subscription** then gets the messages a recorded subscriber of the same channel or pattern received, in order and with the gaps the recording had between them. The first message is sent right after the confirmation. When the recording has several subscribers of one channel, such as one per app instance, each new subscriber gets the next one's messages in turn.
- **Ordinary commands** on a RESP3 connection are answered as usual between messages. A RESP2 connection with subscriptions accepts only the subscribe commands, `PING`, `QUIT` and `RESET`, as on the server.
- **`PUBLISH` and `SPUBLISH`** get the recorded reply when the recording has the same command. Otherwise the mock answers with the number of live subscribers on the mock that the message would reach. The message itself is not routed to them.

The rest of the Redis mock, such as transactions and scripts, is covered in [Redis Mocking and Replay](../databases/record/redis.md#run-without-redis).

## Mock the broker in a replay

A replay mocks outbound traffic by default, so a Speedscale replay in your cluster, or `proxymock replay` with `proxymock mock` serving the dependencies, runs the app against the same mocks. Leave the broker mocked to [test a producer](./test-a-consumer.md#test-a-producer). [Improve Mock Match Rate with AI](../guides/mock-match-rate.md) has an AI assistant find the calls that missed and fix them.

## Test against a real broker instead

Mocking replaces the broker. To send a real broker the recorded messages and watch a consumer process them, see [Test a consumer](./test-a-consumer.md).
