---
title: Message brokers
description: "Record your app's Kafka, RabbitMQ, Amazon MQ, Google Pub/Sub and Redis Pub/Sub traffic with proxymock, run the app against a mock of the broker, and replay recorded messages into a real broker to test a consumer."
sidebar_label: Overview
---

# Message brokers

proxymock records the calls your app makes to its message broker while you use the app, by sitting between the app and the broker. From one recording you can see every message the app published and received, run the app with no broker at all, and feed a consumer the same messages again. You need no access to a shared cluster, no broker logs, and no change to the app beyond the address it connects to.

This section covers the brokers proxymock speaks natively: Kafka, RabbitMQ and other AMQP 0.9.1 brokers, Amazon MQ for RabbitMQ, Google Pub/Sub and Redis Pub/Sub. Brokers with an HTTP API, such as Amazon SQS, are recorded as ordinary HTTP calls and are listed [below](#http-and-grpc-apis).

## How it works

A broker client opens its connection to the broker, so every call on it is outbound from your app, including the messages the broker delivers to a consumer. That one fact shapes each mode:

- **Record.** Each call the client makes is kept: publishes, subscriptions, the deliveries the broker pushed or a fetch returned, acknowledgements, and housekeeping such as heartbeats and metadata lookups.
- **Mock.** The mock acts as a broker for everything that does not depend on stored state, such as the handshake, heartbeats and acknowledgements. It answers stateful calls, such as a queue declare or a consumer group join, from the recording, and hands a live consumer the messages a recorded consumer received. Messages your app publishes are accepted and go nowhere. See [Mock a broker](./mock-a-broker.md).
- **Test a consumer.** A replay turns each recorded delivery into a publish to a real broker, so the consumer under test receives the same messages again. A replay mocks outbound traffic by default, so you choose the deliveries as the replay's tests. See [Test a consumer](./test-a-consumer.md).
- **Test a producer.** A replay sends your app its recorded inbound requests with the broker mocked, and you check what the app published. See [Test a producer](./test-a-consumer.md#test-a-producer).

## What is supported

| Broker | Record with proxymock | Record in a cluster | Mock | Test a consumer | Test a producer | TLS |
|---|---|---|---|---|---|---|
| [Kafka](./record/kafka.md) | Yes, through a listener that advertises proxymock's port | Yes, sidecar and eBPF | Yes | Yes: recorded `Fetch` responses are produced to the broker | Yes: the `kafkaOutput` assertion compares the records and offset commits, in Speedscale cloud | Mock: yes. Replay: `tlsMode`. Record a plaintext listener with proxymock. |
| [RabbitMQ (AMQP 0.9.1)](./record/rabbitmq.md) | Yes | Yes, sidecar and eBPF | Yes | Yes: recorded `Basic.Deliver` and `Basic.Get` messages are published | Partly: a publish to a recorded exchange and routing key is a hit; bodies are not compared | Yes, AMQPS |
| [Amazon MQ for RabbitMQ](./record/rabbitmq.md#amazon-mq) | Yes, AMQPS on 5671 | Yes, with TLS interception | Yes | Yes | As RabbitMQ | Required by the broker |
| [Google Pub/Sub](./record/google-pubsub.md) | Yes, gRPC and REST | Yes, gRPC and REST | Yes, including redelivery for pull subscribers | Yes, republish mode for pull subscribers; inbound HTTP replay for push | Yes, `httpOutput` compares gRPC publishes per message | Yes. The emulator is plaintext. |
| [Redis Pub/Sub](./record/redis-pubsub.md) | Yes | Yes, sidecar and eBPF | Yes | Yes: recorded messages are sent with `PUBLISH` | Partly: `PUBLISH` gets the recorded reply; messages are not compared | Replay: `rediss://` or `tlsMode`. Recording and mocking over TLS were not qualified. |

Every broker in the table can be recorded with the sidecar or the eBPF collector in Kubernetes, with no listener changes or `--map` setting, because they capture each connection where the app opens it. Kafka still has to be on one of its well-known ports. The record pages cover the details, and [Connect to the broker](./connect-to-the-broker.md) covers credentials and TLS for a replay.

## Brokers recorded as HTTP or gRPC calls {#http-and-grpc-apis}

These services have an HTTP or gRPC API, so their calls are recorded, mocked and replayed like any other API call. A consumer that polls, such as an SQS `ReceiveMessage` loop, gets the recorded messages from the mock, and the [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion checks what a producer sent.

- [Amazon SQS](../../guides/message-brokers/aws-sqs.md)
- [Amazon SNS](../../guides/message-brokers/aws-sns.md)
- [Amazon Kinesis Data Streams](../../guides/message-brokers/aws-kinesis.md)
- [Amazon Data Firehose](../../guides/message-brokers/aws-kinesis-data-firehose.md)
- [Azure Event Hubs](../../guides/message-brokers/azure-event-hubs.md), through its Kafka endpoint on port 9093, which is recorded as Kafka

## Not supported yet

These protocols are not decoded, so their traffic cannot be recorded as messages, mocked or replayed:

- **ActiveMQ OpenWire and STOMP**, which [Apache ActiveMQ](../../guides/message-brokers/apache-activemq.md) and Amazon MQ for ActiveMQ use.
- **The Apache Pulsar binary protocol.** See [Apache Pulsar](../../guides/message-brokers/apache-pulsar.md).
- **AMQP 1.0**, which [Azure Service Bus](../../guides/message-brokers/azure-service-bus.md), the Event Hubs AMQP clients and the ActiveMQ AMQP clients use. AMQP 1.0 is a different protocol from RabbitMQ's AMQP 0.9.1.
- **MQTT.**

NATS core protocol traffic is recorded and decoded, but cannot be mocked or replayed yet.

## Write your own load driver

When you need full control over message content and pacing, or your broker is not supported, extract the recorded messages and publish them with a small producer of your own. See [Write your own load driver](./write-your-own-load-driver.md).

## In the Speedscale cloud

Traffic recorded in Kubernetes has the same calls, and a snapshot replays in your cluster the same way. The broker guides cover snapshots and in-cluster replays: [Kafka](../../guides/message-brokers/kafka.md), [RabbitMQ](../../guides/message-brokers/rabbitmq.md), [Amazon MQ](../../guides/message-brokers/amazon-mq.md) and [Google Pub/Sub](../../guides/message-brokers/google-pubsub.md). [Message broker performance issues](../../guides/message-brokers/performance-issues.md) lists what a load test against a real broker can find.
