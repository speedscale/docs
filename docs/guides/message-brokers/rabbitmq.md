---
title: RabbitMQ
description: "Replay a RabbitMQ (AMQP 0.9.1) consumer's recorded deliveries from a Speedscale snapshot in your Kubernetes cluster, so it consumes the same messages again."
sidebar_position: 13
---

## Background

Speedscale captures AMQP 0.9.1, the protocol RabbitMQ speaks, with the sidecar, eBPF and proxymock. This guide covers replaying a consumer from a Speedscale snapshot in your cluster. To record RabbitMQ locally, mock the broker, test a consumer or a producer, or set up credentials and TLS, see [Message brokers](../../proxymock/message-brokers/index.md) in the proxymock docs.

For more information about RabbitMQ, see the [official RabbitMQ documentation](https://www.rabbitmq.com/).

Your app opens the connection to the broker, so all of its AMQP traffic is outbound, including the `Basic.Deliver` messages the broker pushed to it. A replay mocks outbound traffic by default. Replaying a consumer works the other way round: Speedscale publishes each recorded `Basic.Deliver` to the exchange and routing key it arrived through, so your app consumes the same messages again. [Record RabbitMQ traffic](../../proxymock/message-brokers/record/rabbitmq.md) shows what a consumer's recording holds.

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
1. [Create a snapshot](/guides/creating-a-snapshot.md) containing the traffic you need.

## Replay in your cluster

**1. Choose the deliveries to replay** when you create the snapshot. This filter replays every message the consumer received:

```bash
speedctl create snapshot --name orders-consumer --service orders-consumer --tests-filter '(command IS "Basic.Deliver")'
```

In the dashboard, open the snapshot's **Traffic** tab and use **Choose replay tests** instead. [Choose What a Replay Tests](../../proxymock/guides/choose-replay-tests.md) covers the filter syntax. A recorded `Basic.Get` result can be replayed the same way with `(command IS "Basic.Get")`, and a recorded `Basic.Publish` replays the messages your app sent as load against the broker.

**2. Replay the snapshot.** Each message is published with its recorded properties, headers and body, in confirm mode, so the replay waits for the broker to accept it:

```bash
speedctl infra replay orders-consumer --snapshot-id <snapshot-id> --test-config-id <test-config-id> --no-mocks
```

To publish to a different broker, add `--test-against '<recorded broker>=<broker host>:<port>'`. An `amqp://` or `amqps://` URI works too, but only its host and port are used: the login, virtual host and TLS come from the test config, as described below.

A message the broker cannot route to any queue fails, because a delivery that reaches no consumer tests nothing. The report shows `312 NO_ROUTE` with the exchange and routing key. Make sure the queue your consumer reads from exists and is bound before the replay starts; most consumers declare their own queues when they start.

The recorded `user_id` property is not sent, because the broker refuses a message whose `user_id` is not the user that published it.

## Brokers that require credentials or TLS

Add `generator.amqp` to the test config with the user and password the replay logs in with, the virtual host as `database`, and a `tlsMode`. Without credentials the replay logs in as `guest`. [Connect to the broker](../../proxymock/message-brokers/connect-to-the-broker.md#rabbitmq) lists every field and TLS mode.

Use secret references for passwords, because a literal value is stored with the test config. Speedscale mounts every secret the test config references into the generator, so the secret only has to exist in the namespace of the workload you replay:

```json
{
  "generator": {
    "amqp": {
      "username": "${{secret:rabbitmq-credentials/username}}",
      "password": "${{secret:rabbitmq-credentials/password}}",
      "database": "orders",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

:::note
The latency on the report is the time for the broker to confirm each message, not the time for your consumer to process it.
:::

## Record, mock and test locally

- [Record RabbitMQ traffic](../../proxymock/message-brokers/record/rabbitmq.md) with proxymock or in a cluster
- [Mock a broker](../../proxymock/message-brokers/mock-a-broker.md#rabbitmq) so the app runs in development and CI with no RabbitMQ, and what the mock does not simulate
- [Test a consumer or a producer](../../proxymock/message-brokers/test-a-consumer.md#rabbitmq) with `proxymock replay`
- [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#rabbitmq) when you need full control over pacing or message content
