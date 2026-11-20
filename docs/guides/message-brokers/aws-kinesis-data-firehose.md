---
title: Replaying AWS Kinesis Data Firehose
description: "Record, mock and replay Amazon Data Firehose traffic as ordinary HTTP calls with Speedscale and proxymock, and check what a producer sends with the httpOutput assertion."
sidebar_position: 6
---

## Background

Amazon Data Firehose, formerly Kinesis Data Firehose, has an HTTPS API, so Speedscale records Firehose calls as ordinary HTTP calls and replays and mocks them like any other API. Firehose delivers the records it receives to destinations such as Amazon S3, Amazon Redshift, Amazon OpenSearch Service and Splunk.

For more information, see the [Amazon Data Firehose documentation](https://aws.amazon.com/firehose/).

## What is recorded

- **A producer** sends `PutRecord` or `PutRecordBatch`, with each record's data base64 encoded in the JSON request.

Your app only sends to Firehose; it does not read from it, so there is no consumer side to record.

Record it like any HTTPS dependency. In Kubernetes, the sidecar records the calls once it decrypts outbound TLS, and the [eBPF collector](/reference/ebpf-traffic-collection/) reads them without TLS interception. Locally, run your app with `proxymock record` and set `HTTPS_PROXY` and the proxymock CA as the [language reference](../../proxymock/getting-started/language-reference.md) shows for your runtime.

## Mock and replay

Your app's calls to the service are outbound, so a replay answers them from the recording, like any other API your app calls. A producer's `PutRecord` calls get their recorded responses, so it runs with no delivery stream behind it.

- To run your app without the service, [create a snapshot](/guides/creating-a-snapshot.md) and run a [standard replay](/quick-start.md), or mock the service locally with [`proxymock mock`](/proxymock/getting-started/quickstart/quickstart-cli/).
- To check what a producer sent, add the [`httpOutput`](/reference/configuration/assertions/httpoutput.md) assertion, which compares the app's outbound calls with the recording field by field.
- The [message broker overview](../../proxymock/message-brokers/index.md) compares this with the brokers Speedscale speaks natively.

## Write your own load driver

To publish the recorded messages to the service yourself, with your own pacing, extract them from a snapshot and send them with a small producer. [Write your own load driver](../../proxymock/message-brokers/write-your-own-load-driver.md#firehose) has the extraction path and producer code in Go, Java, TypeScript and Python.
