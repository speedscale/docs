---
title: Amazon MQ
description: "Replay Amazon MQ for RabbitMQ traffic from a Speedscale snapshot over AMQPS on port 5671. Amazon MQ for ActiveMQ is not supported yet."
sidebar_position: 2
---

## Background

Amazon MQ is a managed message broker service with two engines, RabbitMQ and ActiveMQ.

| Engine | Protocol Speedscale reads | Support |
| --- | --- | --- |
| RabbitMQ | AMQP 0.9.1 over TLS on port 5671 | Record, mock and replay, as for any [RabbitMQ](./rabbitmq.md) broker |
| ActiveMQ | OpenWire, AMQP 1.0, STOMP, MQTT | Not supported yet |

Amazon MQ for RabbitMQ only accepts AMQPS, which is AMQP 0.9.1 over TLS, on port 5671. Speedscale handles it the same way as any RabbitMQ broker once it has decrypted the TLS. Everything in the [RabbitMQ guide](./rabbitmq.md) applies, and this page covers what is different about TLS.

For more information about Amazon MQ, see the [Amazon MQ documentation](https://aws.amazon.com/amazon-mq/).

## Record and mock

[Record RabbitMQ and Amazon MQ traffic](../../proxymock/message-brokers/record/rabbitmq.md#amazon-mq) covers recording Amazon MQ with proxymock and with the sidecar, which must decrypt outbound TLS. [Mock a broker](../../proxymock/message-brokers/mock-a-broker.md#rabbitmq) covers the mock, which accepts AMQPS and plain AMQP on the same port, so your app keeps its `amqps://` URL and trusts the Speedscale or proxymock CA.

## Replay against Amazon MQ

A replay publishes the recorded deliveries to the broker, as described in the [RabbitMQ guide](./rabbitmq.md#replay-in-your-cluster). For Amazon MQ, add `generator.amqp` to the test config with the broker's user, the virtual host as `database`, and a `tlsMode`:

```json
{
  "generator": {
    "amqp": {
      "username": "${{secret:amazon-mq-credentials/username}}",
      "password": "${{secret:amazon-mq-credentials/password}}",
      "database": "/",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

- `PROTOCOL_TLS_MODE_VERIFY_FULL` verifies the broker's certificate. Amazon MQ presents a certificate from a public CA, so this works without extra setup.
- `PROTOCOL_TLS_MODE_REQUIRE` connects over TLS without verifying the certificate, for a test broker with a self-signed certificate.
- Without a `tlsMode` the replay connects without TLS, which Amazon MQ refuses.

To publish to a different broker than the one you recorded, add `--test-against '<recorded broker>=<broker host>:5671'`. [Connect to the broker](../../proxymock/message-brokers/connect-to-the-broker.md#rabbitmq) lists every field.

## Amazon MQ for ActiveMQ

Amazon MQ for ActiveMQ is not supported yet. Its brokers speak OpenWire, AMQP 1.0, STOMP and MQTT, all over TLS, and Speedscale does not read any of these protocols yet.
