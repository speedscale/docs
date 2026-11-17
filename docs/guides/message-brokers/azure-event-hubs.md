---
title: Replaying Azure Event Hubs
description: "Record, mock and replay Azure Event Hubs traffic through its Kafka endpoint with Speedscale and proxymock. The Event Hubs AMQP clients are not supported yet."
sidebar_position: 9
---

## Background

Azure Event Hubs has two ways in: a Kafka-compatible endpoint on port 9093, and AMQP 1.0, which the Azure Event Hubs SDKs use. Speedscale supports the Kafka endpoint, as Kafka. AMQP 1.0 is not supported yet.

| Client | Protocol | Support |
| --- | --- | --- |
| A Kafka client connected to `<namespace>.servicebus.windows.net:9093` | Kafka over TLS, with SASL PLAIN | Record, mock and replay, as [Kafka](./kafka.md) |
| An Azure Event Hubs SDK, such as `azure-messaging-eventhubs` or `Azure.Messaging.EventHubs` | AMQP 1.0 | Not supported yet |

For more information about Azure Event Hubs, see the [Azure Event Hubs documentation](https://azure.microsoft.com/en-us/products/event-hubs), and its guide to the [Kafka endpoint](https://learn.microsoft.com/azure/event-hubs/azure-event-hubs-kafka-overview).

## Use the Kafka endpoint

Port 9093 is one of the ports Speedscale recognizes as Kafka, so a Kafka client's traffic to Event Hubs is recorded as Kafka once its TLS is decrypted: by the sidecar's TLS interception or the eBPF collector in a cluster. Everything in the proxymock [message brokers](../../proxymock/message-brokers/index.md) section for Kafka then applies:

- [Record Kafka traffic](../../proxymock/message-brokers/record/kafka.md#in-a-cluster)
- [Mock a broker](../../proxymock/message-brokers/mock-a-broker.md#kafka). The mock accepts SASL PLAIN with any credentials, so your app keeps its connection string.
- [Test a consumer](../../proxymock/message-brokers/test-a-consumer.md#kafka), and the [Kafka guide](./kafka.md) for a replay in your cluster

A replay that produces to Event Hubs authenticates the way Kafka clients do with Event Hubs: SASL PLAIN, the username `$ConnectionString`, and the namespace's connection string, from **Shared access policies** in the Azure portal, as the password. Keep the connection string in a secret:

```json
{
  "generator": {
    "kafka": {
      "username": "$ConnectionString",
      "password": "${{secret:event-hubs/connection-string}}",
      "saslMechanism": "PROTOCOL_SASL_MECHANISM_PLAIN",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

The event hub's name is the Kafka topic. See [Connect to the broker](../../proxymock/message-brokers/connect-to-the-broker.md#kafka).

## Write your own load driver

To publish recorded records to Event Hubs yourself, extract them from a snapshot and send them with a Kafka producer. [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#kafka) has the extraction path, the producer code and the Event Hubs settings.
