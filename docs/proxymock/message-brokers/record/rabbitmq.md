---
title: Record RabbitMQ traffic
sidebar_label: RabbitMQ and Amazon MQ
description: "Record a RabbitMQ (AMQP 0.9.1) publisher or consumer with proxymock or in Kubernetes, including Amazon MQ for RabbitMQ over AMQPS on port 5671, and read the deliveries each consumer received."
---

# Record RabbitMQ traffic

proxymock records AMQP 0.9.1, the protocol RabbitMQ speaks, with the sidecar, the eBPF collector and `proxymock record`. Amazon MQ for RabbitMQ is the same protocol over TLS, covered [below](#amazon-mq).

## What a consumer really does

Most people picture a consumer like this:

```mermaid
sequenceDiagram
    RabbitMQ->>App: Message Delivered
    App-->>RabbitMQ: Ack
```

On the wire it looks more like this:

```mermaid
sequenceDiagram
    App->>RabbitMQ: Open Connection
    RabbitMQ-->>App: Connection OK
    App->>RabbitMQ: Open Channel
    RabbitMQ-->>App: Channel OK
    App->>RabbitMQ: Subscribe to Queue (Basic.Consume)
    RabbitMQ-->>App: Consume OK
    RabbitMQ->>App: Basic.Deliver (Message)
    App-->>RabbitMQ: Basic.Ack
```

Your app opened the connection, so all of this traffic is outbound, including the `Basic.Deliver` messages the broker pushed. That is why a recording holds many protocol calls around the deliveries, and why a replay that tests a consumer has to be told to use the deliveries as its tests; see [Test a consumer](../test-a-consumer.md#rabbitmq).

## Record locally

Map a local port to the broker and point your app at that port:

```bash
proxymock record --map 15672=amqp://localhost:5672
```

```bash
AMQP_URL=amqp://guest:guest@localhost:15672/ ./your-app
```

Use the app, then stop the recorder with Ctrl-C. proxymock finds AMQP from the protocol header the client sends first, not from the port, so any broker port works. The `amqp://` scheme matters when you [mock the broker](../mock-a-broker.md#rabbitmq) with the same mapping.

## What gets recorded

Each AMQP method is one entry, named by its class and method, such as `Queue.Declare`, `Basic.Consume`, `Basic.Publish`, `Basic.Deliver` or `Basic.Ack`. The location is the queue or exchange the method names.

- **A consumer** is recorded as one stream that starts with its `Basic.Consume` and holds, in order, every `Basic.Deliver` the broker sent it, with each message's exchange, routing key, properties, headers and body.
- **A `Basic.Get`** keeps the message it returned, or that the queue was empty.
- **A publisher** keeps each `Basic.Publish` with its exchange, routing key, properties and body. Publishes on a channel in confirm mode are recorded together as a stream.
- **Declares, binds and `Basic.Qos`** keep the broker's answer, including a refusal such as `NOT_FOUND`.

These filters pick out the calls that matter:

| To see | Filter |
|---|---|
| Every message a consumer received | `(command IS "Basic.Deliver")` |
| What your app published | `(command IS "Basic.Publish")` |
| Messages read with `Basic.Get` | `(command IS "Basic.Get")` |

:::caution
The recording holds the credentials the client logged in with, in clear for the PLAIN mechanism. Record with a local or test account, and do not share a recording made with real credentials.
:::

## In a cluster

In Kubernetes, the Speedscale sidecar and the [eBPF collector](/reference/ebpf-traffic-collection/) record AMQP 0.9.1 with no `--map` setting or app change. A consumer's deliveries are recorded the same way.

## Amazon MQ for RabbitMQ {#amazon-mq}

Amazon MQ for RabbitMQ only accepts AMQPS, which is AMQP 0.9.1 over TLS, on port 5671. Once the TLS is decrypted it is recorded like any RabbitMQ broker, and each message is marked as TLS.

**Locally,** map a local port to the broker:

```bash
proxymock record --map 15671=amqps://b-1234.mq.us-east-1.amazonaws.com:5671
```

Your app connects to `amqps://username:password@localhost:15671` and must trust the proxymock CA at `~/.speedscale/certs/tls.crt`. `proxymock record` prints the environment variables that make most clients trust it, and a Java client can use the trust store at `~/.speedscale/certs/cacerts.jks`. proxymock opens its own TLS session to the broker.

**In a cluster,** the sidecar decrypts outbound TLS so it can read the AMQP 0.9.1 inside. It ends your app's TLS session with a certificate from the Speedscale CA and opens its own TLS session to the broker, so your app must trust the Speedscale CA, as for any TLS capture. See [TLS capture](/guides/tls/). Port 5671 needs no setting.

Amazon MQ for ActiveMQ speaks OpenWire, AMQP 1.0, STOMP and MQTT, none of which is supported yet.

## Next

- [Mock a broker](../mock-a-broker.md#rabbitmq)
- [Test a consumer](../test-a-consumer.md#rabbitmq)
- [Connect to the broker](../connect-to-the-broker.md#rabbitmq)
