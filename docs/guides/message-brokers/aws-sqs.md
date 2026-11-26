---
title: Replaying AWS SQS
description: "Record, mock and replay Amazon SQS traffic as ordinary HTTP calls with Speedscale and proxymock, and check what a producer sends with the httpOutput assertion."
sidebar_position: 8
---

## Background

Amazon SQS has an HTTPS API, so Speedscale records SQS calls as ordinary HTTP calls and replays and mocks them like any other API. Current AWS SDKs send SQS requests with the AWS JSON protocol, and older ones with the form-encoded query protocol; both are recorded as sent.

For more information about Amazon SQS, see the [Amazon SQS documentation](https://aws.amazon.com/sqs/).

## What is recorded

- **A producer** sends `SendMessage` or `SendMessageBatch`, with each message's body and attributes in the request.
- **A consumer** polls with `ReceiveMessage`, and each response holds the messages it returned. It then calls `DeleteMessage` or `DeleteMessageBatch` for the messages it handled, and may call `ChangeMessageVisibility`.

Record it like any HTTPS dependency. In Kubernetes, the sidecar records the calls once it decrypts outbound TLS, and the [eBPF collector](/reference/ebpf-traffic-collection/) reads them without TLS interception. Locally, run your app with `proxymock record` and set `HTTPS_PROXY` and the proxymock CA as the [language reference](../../proxymock/getting-started/language-reference.md) shows for your runtime.

## Mock and replay

Your app's calls to the service are outbound, so a replay answers them from the recording, like any other API your app calls. A consumer's `ReceiveMessage` polls get the recorded responses in turn, so the consumer receives the recorded messages with no queue behind it.

- To run your app without the service, [create a snapshot](/guides/creating-a-snapshot.md) and run a [standard replay](/quick-start.md), or mock the service locally with [`proxymock mock`](/proxymock/getting-started/quickstart/quickstart-cli/).
- To check what a producer sent, add the [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion, which compares the app's outbound calls with the recording field by field.
- The [message broker overview](../../proxymock/message-brokers/index.md) compares this with the brokers Speedscale speaks natively.

## Write your own load driver

To publish the recorded messages to the service yourself, with your own pacing, extract them from a snapshot and send them with a small producer. [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#sqs) has the extraction path and producer code in Go, Java, TypeScript and Python.
