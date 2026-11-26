---
title: Test a consumer or a producer
sidebar_label: Test a consumer or producer
description: "Replay recorded Kafka, RabbitMQ, Amazon MQ, Google Pub/Sub and Redis Pub/Sub deliveries into a real broker so the consumer under test receives them again, at the recorded pace or as a load test, and check what a producer publishes with the broker mocked."
---

# Test a consumer or a producer

`proxymock replay` can turn a recording of a consumer into a test of that consumer. Each message the consumer received when you recorded it is published to a real broker again, so the consumer, or a new version of it, receives the same messages and handles them as it would in production. The same replay, with more virtual users or a shorter pace, is a load test of the consumer and the broker together.

:::warning
A replay publishes real messages. Every consumer of the topic, queue or subscription receives them, again on every pass of a load test. Point the replay at a disposable broker or emulator that you can reset, never at a shared or production broker.
:::

## Choose the deliveries to replay {#choose-the-deliveries}

A consumer's calls to its broker are outbound, and a replay sends the recording's inbound traffic by default, so choose the deliveries as the replay's tests with `--tests-filter`. Without it, a recording of a consumer has nothing to replay. [Choose What a Replay Tests](../guides/choose-replay-tests.md) covers the filter syntax, and the Speedscale dashboard sets it with **Choose replay tests** on a snapshot's **Traffic** tab.

| Broker | What the replay publishes | Filter |
|---|---|---|
| Kafka | The records in each recorded `Fetch` response, produced to the same topic and partition | `(command IS "Fetch") AND (location IS "orders")` |
| RabbitMQ and Amazon MQ | Each recorded `Basic.Deliver`, published to the exchange and routing key it arrived through | `(command IS "Basic.Deliver")` |
| Google Pub/Sub | Each message a `StreamingPull`, `Pull` or REST `:pull` received, republished to the subscription's topic | gRPC: `(location CONTAINS "google.pubsub.v1.Subscriber")`. REST: `(location CONTAINS ":pull")`. |
| Redis Pub/Sub | Each message a subscription received, sent with `PUBLISH` or `SPUBLISH` | `(tech IS Redis) AND (command IS "message")` |

The replay does not consume for your app. Start the consumer against the same broker, subscribed as it is in production, and it receives the messages the replay publishes.

## Pace and load {#pace-and-load}

Each recorded delivery is one test, or for Kafka each recorded `Fetch` with all its records, and a test config's load stages decide how fast the tests go. A top-level stage of virtual users with no request delay sends each test as soon as the broker accepted the one before, as fast as it can. A stage inside a load group with no request delay keeps the recorded pace instead. To keep the gaps the recording had between deliveries, set the stage's request delay to the recorded time, or to a multiple of it: `0.5` halves every gap and `2` doubles it.

```json
{
  "generator": {
    "stages": [
      {
        "duration": "300s",
        "virtualUsers": {
          "virtualUsers": "2",
          "requestDelay": { "mode": "MULTIPLE", "requestDelayMultiple": 0.5 }
        }
      }
    ]
  }
}
```

`"mode": "RECORDED"` keeps the recorded gaps exactly. Each virtual user publishes the whole recording again, so raising the number of virtual users multiplies the volume, and a stage with a duration repeats the recording until the time is up. The first message of each pass goes at once.

Pass the test config to `proxymock replay` with `--test-config` and no load flags, so its stages run. The `--vus`, `--times`, `--for` and `--stage` flags replace the test config's stages with their own, which send as fast as the broker accepts:

```bash
proxymock replay --in proxymock/recorded-<timestamp> \
  --test-against localhost:9092 \
  --tests-filter '(command IS "Fetch") AND (location IS "orders")' \
  --vus 10 --for 1m
```

[Load Patterns](../../guides/load-patterns.md) covers stages in the Speedscale dashboard. The latency on the report is the time the broker took to accept each message, not the time your consumer took to process it.

## Kafka {#kafka}

Point `--test-against` at the broker the consumer will read from. This replays the records the consumer read from `orders`:

```bash
proxymock replay --in proxymock/recorded-<timestamp> \
  --test-against localhost:9092 \
  --tests-filter '(command IS "Fetch") AND (location IS "orders")'
```

| To replay | Filter |
|---|---|
| What a consumer read from `orders` | `(command IS "Fetch") AND (location IS "orders")` |
| Everything a consumer read | `(tech IS Kafka) AND (command IS "Fetch")` |
| What a producer sent | `(command IS "Produce")` |

Each recorded batch is produced to its partition's leader as one batch, with each record's key, value, headers and partition, its CreateTime timestamp and the batch's compression codec. The timestamps are the ones recorded, not the time of the replay, so a consumer that windows or expires records by time sees them as they were. Create the topic with at least as many partitions as the recording used, so each record can go back to its partition.

The broker must advertise an address `proxymock replay` can reach, because records are produced to each partition's leader. A local broker's normal listener does; the recording listener from [Record Kafka traffic](./record/kafka.md) advertises proxymock's port, which nothing is listening on during a replay.

Start the consumer against the same broker, before or after the replay. From the six-record recording on the record page, a console consumer reads back:

```text
CreateTime:1791834407471	Partition:0	order-1	{"id":1,"total":10}
CreateTime:1791834407475	Partition:0	order-4	{"id":4,"total":40}
CreateTime:1791834407475	Partition:0	order-5	{"id":5,"total":50}
CreateTime:1791834407475	Partition:1	order-2	{"id":2,"total":20}
CreateTime:1791834407475	Partition:1	order-3	{"id":3,"total":30}
CreateTime:1791834407475	Partition:1	order-6	{"id":6,"total":60}
```

Replaying the `Produce` calls a producer made, with `--tests-filter '(command IS "Produce")'`, sends its output again, so whatever consumes that topic downstream gets the same input.

proxymock prints a latency table per topic and API, and writes `replay-verdict.json` to the replay's output directory:

```text
LATENCY / THROUGHPUT
┌────────┬───────┬───────┬─────────────┬──────────┬──────────┬──────────┬──────────┬────────┬─────────────────┬──────────────┐
│ TOPIC  │ API   │ COUNT │ AVG LATENCY │     P 50 │     P 90 │     P 95 │     P 99 │ FAILED │ RESULT MISMATCH │ PER - SECOND │
├────────┼───────┼───────┼─────────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────────────┼──────────────┤
│ orders │ Fetch │     1 │       13 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │      0 │              0% │ 52.20        │
├────────┼───────┼───────┼─────────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────────────┼──────────────┤
│ TOTAL  │       │     1 │       13 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │      0 │              0% │ 52.20        │
└────────┴───────┴───────┴─────────────┴──────────┴──────────┴──────────┴──────────┴────────┴─────────────────┴──────────────┘
```

- **COUNT** is the number of recorded calls replayed. One recorded `Fetch` that returned six records is one row and produces all six.
- **Latency** is the time the broker took to accept the records.
- **FAILED** counts produces the broker rejected, and **RESULT MISMATCH** produces whose result differed from the recording.

To see whether the consumer kept up, record it while it consumes the replayed records and run [`proxymock kafka-report`](./consumer-group-health.md) on that recording for its lag, commits and rebalances. For SASL and TLS, see [Connect to the broker](./connect-to-the-broker.md#kafka).

## RabbitMQ and Amazon MQ {#rabbitmq}

Run your consumer against a broker, then replay the recorded deliveries into that broker:

```bash
proxymock replay --in proxymock/recorded-<timestamp> \
  --tests-filter '(command IS "Basic.Deliver")' \
  --test-against amqp://localhost:5672
```

An `amqp://` or `amqps://` address in `--test-against` sets only the host and port. The login, the virtual host and TLS come from `generator.amqp` in the test config; see [Connect to the broker](./connect-to-the-broker.md#rabbitmq). Amazon MQ needs a `tlsMode`, because it accepts only AMQPS.

- Each message is published with its recorded properties, headers and body, on a channel in confirm mode, so the replay waits for the broker to accept it.
- A message the broker cannot route to any queue fails, because a delivery that reaches no consumer tests nothing. The report shows `312 NO_ROUTE` with the exchange and routing key. Make sure the queue your consumer reads from exists and is bound before the replay starts; most consumers declare their own queues when they start.
- The recorded `user_id` property is not sent, because the broker refuses a message whose `user_id` is not the user that published it. The recording has no message priority, so none is set.
- A recorded `Basic.Get` result replays the same way with `(command IS "Basic.Get")`, and a recorded `Basic.Publish` replays the messages your app sent as load against the broker with `(command IS "Basic.Publish")`.

The replay prints a row per destination with the count and any failures.

## Google Pub/Sub {#google-pubsub}

Republish mode turns deliveries from a recorded `StreamingPull`, `Pull` or REST `:pull` into publishes to the subscription's topic. Run your subscriber against an emulator or a test project so it receives and acknowledges the messages itself. Follow [Replay locally with proxymock](../../guides/message-brokers/google-pubsub.md#replay-locally-with-proxymock) for the test config and command, and [Connect to the broker](./connect-to-the-broker.md#google-pubsub) for credentials and topic routing.

Publish latency measures broker acceptance. To see whether your subscriber kept up, [check backlog and acknowledgements](../../guides/message-brokers/google-pubsub.md#check-that-the-subscriber-kept-up). If the subscriber uses an HTTP push endpoint, [replay the inbound HTTP deliveries](../../guides/message-brokers/google-pubsub.md#push-subscriptions).

## Redis Pub/Sub {#redis-pubsub}

Run your app subscribed to the target server, then replay the messages it received:

```bash
REDISCLI_AUTH=<password> proxymock replay --in ./recordings \
  --tests-filter '(tech IS Redis) AND (command IS "message")' \
  --test-against redis://localhost:6379/0
```

Use `pmessage` for messages a pattern subscription received and `smessage` for shard channels, or `(direction IS OUT) AND (tech IS Redis)` to replay every recorded Redis command along with the messages.

- Each message is published with `PUBLISH`, or `SPUBLISH` for a shard channel. A pattern subscription's message is published to the channel that matched.
- The replay does not subscribe for your app, and skips the recorded subscribe and unsubscribe commands: your app makes its own subscriptions on the target.
- The app may subscribe a little after the replay starts. While a message reaches no subscriber, the replay publishes it again for up to five seconds. A message that no subscriber received fails with an error reply that names the channel, and later messages to that channel are published once without waiting. The generator's `redis.messages_published` and `redis.messages_unreceived` metrics count both outcomes.

The target must be a single-node server. [Replay against Redis or Valkey](../databases/record/redis.md#replay) covers the rest of a Redis replay, and [Connect to the broker](./connect-to-the-broker.md#redis) covers credentials and TLS.

## Test a producer {#test-a-producer}

To test the messages your app publishes, replay its recorded inbound requests, the default, with the broker mocked, and compare what it published with the recording. How far the comparison goes depends on the broker:

| Broker | What checks the published messages |
|---|---|
| Kafka | The [`kafkaOutput` assertion](#kafka-output), in Speedscale cloud reports |
| Amazon SQS, SNS, Kinesis and Firehose | The [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion, which compares outbound HTTP calls field by field |
| RabbitMQ and Amazon MQ | The mock's output: a publish to an exchange and routing key the recording has is a hit, and any other publish is a miss. Message bodies are not compared. |
| Google Pub/Sub | [`httpOutput`](../../reference/configuration/assertions/httpoutput.md#google-pubsub-publishes) compares gRPC publishes by topic and per message, including JSON fields, attributes and ordering keys. |
| Redis Pub/Sub | The mock's output: a `PUBLISH` the recording has gets its recorded reply. Messages are not compared. |

Locally, run the app behind `proxymock mock` and send it the recorded requests:

```bash
proxymock mock --in proxymock/recorded-<timestamp> --map 19094=kafka://localhost:9094 -- ./your-app
proxymock replay --in proxymock/recorded-<timestamp> --test-against localhost:8080
```

Then open the mock's output, `proxymock/results/mocked-<timestamp>`, in `proxymock web`, and filter on the publishes, such as `(command IS "Produce")` or `(command IS "Basic.Publish")`, to read what the app sent next to what it sent when you recorded.

### Compare Kafka output {#kafka-output}

The `kafkaOutput` assertion fails a replay with Kafka mocked when what the app wrote to Kafka differs from the recording. Records are matched by topic and key, in the order they were produced, so a record that only moved or was reordered is not reported as changed. Consumer group commits are matched by group, topic and partition. Add it to the test config's assertions:

```json
{
  "type": "kafkaOutput",
  "config": {
    "ignore": "timestamp,requestId"
  }
}
```

| Key | Description |
|---|---|
| **ignore** | Comma-separated value fields and headers to leave out, such as timestamps and generated IDs. A JSON value field is named by its JSON path; anything whose path or name contains one of these is left out. |
| **includeOnly** | Comma-separated value fields and headers. When set, only these are compared. |

| Difference | Meaning |
|---|---|
| `RECORD_VALUE` | One field of a produced record's value differs. JSON values are compared field by field, anything else as a whole. |
| `RECORD_HEADER` | A header of a produced record differs or is missing. |
| `RECORD_PARTITION` | A record with the same topic and key went to another partition. |
| `MISSING_RECORDS` | The recording produced records that the replay did not. |
| `UNEXPECTED_RECORDS` | The replay produced records that the recording did not, including records on topics the recording never wrote to. |
| `COMMIT` | A consumer group's final committed offset for a partition differs, or it committed in only one of the two runs. |

A difference adds a notification to the report, which then ends in Missed Goals, and the report's **Accuracy** tab lists the differences. They are also in the report artifact `kafka-diff.json`. The comparison cannot run, and the assertion fails with the reason, when Kafka was not mocked or when the responder ran in low data mode. A local `proxymock replay` reports the assertion as not evaluated.

## In your cluster

To replay a snapshot against a consumer running in Kubernetes, see the broker guides: [Kafka](../../guides/message-brokers/kafka.md), [RabbitMQ](../../guides/message-brokers/rabbitmq.md), [Amazon MQ](../../guides/message-brokers/amazon-mq.md) and [Google Pub/Sub](../../guides/message-brokers/google-pubsub.md).

## Related

- [Mock a broker](./mock-a-broker.md)
- [Connect to the broker](./connect-to-the-broker.md)
- [Write your own load driver](./write-your-own-load-driver.md)
