---
title: Replaying AWS Kinesis
description: "Record, mock and replay Amazon Kinesis Data Streams traffic as ordinary HTTP calls with Speedscale and proxymock, and check what a producer sends with the httpOutput assertion."
sidebar_position: 5
---

## Background

Amazon Kinesis Data Streams has an HTTPS API, so Speedscale records Kinesis calls as ordinary HTTP calls and replays and mocks them like any other API. Kinesis has no Kafka-compatible API; apps that use a Kafka client talk to a Kafka service such as Amazon MSK, which Speedscale records as [Kafka](./kafka.md).

For more information about Amazon Kinesis Data Streams, see the [Amazon Kinesis Data Streams documentation](https://aws.amazon.com/kinesis/data-streams/).

## What is recorded

- **A producer** sends `PutRecord` or `PutRecords`, with each record's data, base64 encoded in a JSON request, and its partition key.
- **A polling consumer** calls `GetShardIterator` and then `GetRecords`, and each response holds the records it returned.

Some SDKs, such as the AWS SDK for Java, send Kinesis requests as CBOR instead of JSON by default.

Record it like any HTTPS dependency. In Kubernetes, the sidecar records the calls once it decrypts outbound TLS, and the [eBPF collector](/reference/ebpf-traffic-collection/) reads them without TLS interception. Locally, run your app with `proxymock record` and set `HTTPS_PROXY` and the proxymock CA as the [language reference](../../proxymock/getting-started/language-reference.md) shows for your runtime.

## Mock and replay

Your app's calls to the service are outbound, so a replay answers them from the recording, like any other API your app calls. A polling consumer's `GetRecords` calls get the recorded responses, so it receives the recorded records with no stream behind it.

- To run your app without the service, [create a snapshot](/guides/creating-a-snapshot.md) and run a [standard replay](/quick-start.md), or mock the service locally with [`proxymock mock`](/proxymock/getting-started/quickstart/quickstart-cli/).
- To check what a producer sent, add the [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion, which compares the app's outbound calls with the recording field by field.
- The [message broker overview](../../proxymock/message-brokers/index.md) compares this with the brokers Speedscale speaks natively.

## Write your own load driver

To publish the recorded messages to the service yourself, with your own pacing, extract them from a snapshot and send them with a small producer. [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#kinesis) has the extraction path and producer code in Go, Java, TypeScript and Python.
