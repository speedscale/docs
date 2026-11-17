---
title: Azure Service Bus
description: "Azure Service Bus clients use AMQP 1.0, which Speedscale does not support yet. Calls to the Service Bus REST API are recorded as ordinary HTTP calls."
sidebar_position: 10
---

## Background

The Azure Service Bus SDKs, such as `azure-messaging-servicebus` and `Azure.Messaging.ServiceBus`, send and receive messages over AMQP 1.0. Speedscale does not decode AMQP 1.0 yet, so it cannot record those messages, mock Service Bus for them or replay them. AMQP 1.0 is a different protocol from the AMQP 0.9.1 that RabbitMQ speaks, which [is supported](./rabbitmq.md).

Service Bus also has an HTTPS REST API for sending and receiving messages. An app that calls it directly is recorded, mocked and replayed like any other HTTP API, and the [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion checks what it sent.

For more information about Azure Service Bus, see the [Azure Service Bus documentation](https://azure.microsoft.com/en-us/products/service-bus).

## What you can do today

- **Mock your own Service Bus wrapper.** If your app reaches Service Bus through a service of your own over HTTP or gRPC, that service can be recorded and mocked.
- **Load test with your own driver.** A producer you write can publish test messages to Service Bus with the Azure SDK. The recording holds no Service Bus messages to extract, so the messages have to come from elsewhere, such as the inbound requests that caused them; see [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md).

The [message broker overview](../../proxymock/message-brokers/index.md#not-supported-yet) lists the protocols that are not supported yet. Contact [Speedscale support](mailto:support@speedscale.com) if you need Service Bus.
