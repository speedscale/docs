---
title: Amazon MQ
description: "Record, mock, and replay Amazon MQ for RabbitMQ traffic with Speedscale and proxymock. Speedscale reads AMQP 0.9.1 over TLS on port 5671. Amazon MQ for ActiveMQ is not supported yet."
sidebar_position: 2
---

## Background

Amazon MQ is a managed message broker service with two engines, RabbitMQ and ActiveMQ.

| Engine | Protocol Speedscale reads | Support |
| --- | --- | --- |
| RabbitMQ | AMQP 0.9.1 over TLS on port 5671 | Record, mock and replay. See the [RabbitMQ guide](./rabbitmq.md). |
| ActiveMQ | OpenWire, AMQP 1.0, STOMP, MQTT | Not supported yet. |

Amazon MQ for RabbitMQ only accepts AMQPS, which is AMQP 0.9.1 over TLS, on port 5671. Speedscale handles it the same way as any RabbitMQ broker once it has decrypted the TLS. Everything in the [RabbitMQ guide](./rabbitmq.md) applies, and this page covers what is different about TLS.

For more information about Amazon MQ, see the [Amazon MQ documentation](https://aws.amazon.com/amazon-mq/).

## Prerequisites

1. [speedctl](/reference/glossary.md#speedctl) is installed
1. Your app connects to a RabbitMQ broker on Amazon MQ, with a URL such as `amqps://username:password@b-1234.mq.us-east-1.amazonaws.com:5671`

## Record in your cluster

The sidecar decrypts outbound TLS so it can read the AMQP 0.9.1 inside. It ends your app's TLS session with a certificate from the Speedscale CA and opens its own TLS session to the broker. Your app must trust the Speedscale CA, as for any TLS capture. See [TLS capture](/guides/tls/).

Port 5671 needs no setting. Speedscale finds AMQP from the protocol header the client sends once TLS is decrypted, not from the port.

## Record locally with proxymock

Map a local port to the broker and point your app at that port:

```bash
proxymock record --map 15671=amqps://b-1234.mq.us-east-1.amazonaws.com:5671
```

Your app connects to `amqps://username:password@localhost:15671` and must trust the proxymock CA at `~/.speedscale/certs/tls.crt`. `proxymock record` prints the environment variables that make most clients trust it, and a Java client can use the trust store at `~/.speedscale/certs/cacerts.jks`. The recording is AMQP 0.9.1 with each message marked as TLS, the same as a recording of a plaintext broker.

## Mock Amazon MQ

The AMQP mock accepts AMQPS and plain AMQP on the same port, so your app keeps its `amqps://` URL. It presents a certificate from the Speedscale CA, which your app must trust as it does when you record.

```bash
proxymock mock --in proxymock/recorded-<timestamp> --map 15671=amqps://b-1234.mq.us-east-1.amazonaws.com:5671
```

Point your app at `amqps://localhost:15671`. What the mock answers is described in the [RabbitMQ guide](./rabbitmq.md#mock-rabbitmq).

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

To publish to a different broker than the one you recorded, add `--test-against '<recorded broker>=<broker host>:5671'`.

## Amazon MQ for ActiveMQ

Amazon MQ for ActiveMQ is not supported yet. Its brokers speak OpenWire, AMQP 1.0, STOMP and MQTT, all over TLS, and Speedscale does not read any of these protocols yet.
