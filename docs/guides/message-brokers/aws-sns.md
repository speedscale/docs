---
title: Replaying AWS SNS
description: "Record, mock and replay Amazon SNS traffic as ordinary HTTP calls with Speedscale and proxymock, and replay the notifications an HTTP subscriber received."
sidebar_position: 7
---

## Background

Amazon SNS has an HTTPS API, so Speedscale records SNS calls as ordinary HTTP calls and replays and mocks them like any other API.

For more information about Amazon SNS, see the [Amazon SNS documentation](https://aws.amazon.com/sns/).

## What is recorded

- **A publisher** sends `Publish` or `PublishBatch`. The request is form-encoded, with the message in its `Message` parameter.
- **An HTTP or HTTPS subscription** receives each notification as a `POST` that SNS sends to your app. Those are inbound requests, so a replay sends them to your app again as tests.

Record it like any HTTPS dependency. In Kubernetes, the sidecar records the calls once it decrypts outbound TLS, and the [eBPF collector](/reference/ebpf-traffic-collection/) reads them without TLS interception. Locally, run your app with `proxymock record` and set `HTTPS_PROXY` and the proxymock CA as the [language reference](../../proxymock/getting-started/language-reference.md) shows for your runtime.

## Mock and replay

Your app's calls to the service are outbound, so a replay answers them from the recording, like any other API your app calls. A publisher's `Publish` calls get their recorded responses.

- To run your app without the service, [create a snapshot](/guides/creating-a-snapshot.md) and run a [standard replay](/quick-start.md), or mock the service locally with [`proxymock mock`](/proxymock/getting-started/quickstart/quickstart-cli/).
- To check what a producer sent, add the [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion, which compares the app's outbound calls with the recording field by field.
- The [message broker overview](../../proxymock/message-brokers/index.md) compares this with the brokers Speedscale speaks natively.

SNS delivers each message to every subscription on the topic, so a message you publish to a real topic reaches all of them.

## Write your own load driver

To publish the recorded messages to the service yourself, with your own pacing, extract them from a snapshot and send them with a small producer. [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#sns) has the extraction path and producer code in Go, Java, TypeScript and Python.
