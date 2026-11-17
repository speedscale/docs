---
title: Apache ActiveMQ
description: "Apache ActiveMQ's OpenWire, AMQP 1.0, STOMP and MQTT protocols are not supported by Speedscale yet, for ActiveMQ Classic, ActiveMQ Artemis and Amazon MQ for ActiveMQ."
sidebar_position: 3
---

## Background

Apache ActiveMQ Classic and ActiveMQ Artemis accept several protocols: OpenWire, the protocol of the ActiveMQ JMS client, on port 61616; AMQP 1.0 on 5672; STOMP on 61613; and MQTT on 1883. Speedscale does not decode any of them yet, so it cannot record ActiveMQ messages, mock an ActiveMQ broker or replay ActiveMQ messages. The same applies to Amazon MQ for ActiveMQ.

ActiveMQ's AMQP is AMQP 1.0, a different protocol from the AMQP 0.9.1 that RabbitMQ speaks. A RabbitMQ broker, including Amazon MQ for RabbitMQ, [is supported](./rabbitmq.md).

For more information about Apache ActiveMQ, see the [Apache ActiveMQ documentation](https://activemq.apache.org/).

## What you can do today

- **Mock your own messaging wrapper.** If your app reaches ActiveMQ through a service of your own over HTTP or gRPC, that service can be recorded and mocked.
- **Load test with your own driver.** A producer you write can publish test messages to ActiveMQ. The recording holds no ActiveMQ messages to extract, so the messages have to come from elsewhere; see [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md).

The [message broker overview](../../proxymock/message-brokers/index.md#not-supported-yet) lists the protocols that are not supported yet. Contact [Speedscale support](mailto:support@speedscale.com) if you need ActiveMQ.
