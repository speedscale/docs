---
title: Apache ActiveMQ
description: "What Speedscale can and cannot do with Apache ActiveMQ traffic today. The ActiveMQ messaging protocols (OpenWire, AMQP 1.0, STOMP and MQTT) are not supported yet."
sidebar_position: 3
---

## Background

Apache ActiveMQ brokers accept several messaging protocols: OpenWire, AMQP 1.0, STOMP and MQTT. Speedscale does not decode any of them today.

For more information about Apache ActiveMQ, see the [Apache ActiveMQ documentation](https://activemq.apache.org/).

## What is not supported

| Protocol | Support |
| --- | --- |
| OpenWire | Not supported yet. |
| AMQP 1.0 | Not supported yet. |
| STOMP | Not supported yet. |
| MQTT | Not supported yet. |

Messages sent over these protocols cannot be inspected, mocked or replayed as messages, and `speedctl extract data` has no ActiveMQ message fields to read.

AMQP 1.0 is a different wire protocol from AMQP 0.9.1. Speedscale reads AMQP 0.9.1, the protocol RabbitMQ speaks, so the [RabbitMQ guide](./rabbitmq.md) does not apply to ActiveMQ. The same limit applies to ActiveMQ brokers on [Amazon MQ](./amazon-mq.md).

## What works today

Calls your application makes to an ActiveMQ broker over HTTP, such as the REST API in ActiveMQ Classic, are ordinary HTTP. Speedscale captures, mocks and replays them like any other HTTP traffic. To get started, [create a snapshot](/guides/creating-a-snapshot.md) of that traffic.
