---
title: Apache Pulsar
description: "The Apache Pulsar binary protocol is not supported by Speedscale yet. Pulsar's HTTP admin API is recorded as HTTP, and Kafka clients talking to a Kafka protocol handler are recorded as Kafka."
sidebar_position: 4
---

## Background

Pulsar clients connect to brokers with the Pulsar binary protocol, on port 6650, or 6651 over TLS. Speedscale does not decode that protocol yet, so it cannot record Pulsar messages, mock a Pulsar broker or replay Pulsar messages.

| Client | Protocol | Support |
| --- | --- | --- |
| A Pulsar client library | Pulsar binary protocol | Not supported yet |
| The Pulsar admin REST API, on the broker's web service port | HTTP | Recorded, mocked and replayed like any other HTTP API |
| A Kafka client talking to a broker with a Kafka protocol handler, such as Kafka-on-Pulsar | Kafka | Recorded, mocked and replayed as [Kafka](./kafka.md) when the handler listens on a port Speedscale recognizes as Kafka, such as 9092 |

Pulsar topics have names such as `persistent://public/default/orders`. A Kafka protocol handler maps a Kafka topic name to a Pulsar topic, so a recording of a Kafka client shows the Kafka name.

For more information about Apache Pulsar, see the [Apache Pulsar documentation](https://pulsar.apache.org/).

## What you can do today

- **Use the Kafka protocol.** If your Pulsar deployment runs a Kafka protocol handler and your app uses a Kafka client, follow the [Kafka](./kafka.md) guide and the proxymock [message brokers](../../proxymock/message-brokers/index.md) section. The ports Speedscale recognizes as Kafka are listed in [Record Kafka traffic](../../proxymock/message-brokers/record/kafka.md#add-a-listener-for-recording).
- **Load test with your own driver.** For a Kafka client, extract the recorded records and produce them yourself; see [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#kafka).

Contact [Speedscale support](mailto:support@speedscale.com) if you need the Pulsar binary protocol.
