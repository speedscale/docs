---
title: Kafka
description: "Record your app's Kafka producer and consumer traffic with proxymock, then read it record by record, check the health of its consumer groups, run the app against a mock broker, and replay the recorded records into a real broker to test a consumer or a producer."
sidebar_label: Overview
---

# Kafka

proxymock records the Kafka calls your app makes while you use it, by sitting between the app and the broker. From one recording you can see exactly what the app produced and consumed, find out how its consumer groups behaved, test the app with no broker at all, and test a consumer by feeding it the same records again. You need no access to a shared cluster, no broker logs or JMX, and no change to the app beyond the address it connects to.

What that gives you:

- **See what your client really does.** Kafka clients hide most of their work: bootstrap, metadata lookups, group joins, polls that return nothing, offset commits. proxymock shows every call, with each record's key, value, headers, partition and timestamp decoded.
- **Find consumer problems before production.** Lag, a record the consumer keeps re-reading, a member dropped for going too long between polls, a partition that started at the latest offset and skipped records, and repeated rebalances show up from one local recording.
- **Run without a broker.** Mock it from the recording, so tests and coding agents run offline and get the same records every time.
- **Test a consumer with real records.** Replay the records your consumer read into a broker, with their original keys, partitions, timestamps and compression, and watch it process them again.

Every step works from the proxymock CLI, and the report also works from an AI coding assistant through the [proxymock MCP server](../how-it-works/mcp-tools.md).

## Record your Kafka traffic

Kafka clients connect to the bootstrap address only once, then to whatever address the broker advertises. So the broker must advertise proxymock's port, or every call after the first goes around it. The simplest way is a second listener on your local broker just for recording:

```properties
listeners=PLAINTEXT://127.0.0.1:9092,RECORD://127.0.0.1:9094
advertised.listeners=PLAINTEXT://127.0.0.1:9092,RECORD://localhost:19094
listener.security.protocol.map=PLAINTEXT:PLAINTEXT,RECORD:PLAINTEXT
```

Then start the recorder in front of that listener and point your app at proxymock's port:

```bash
proxymock record --map 19094=kafka://localhost:9094
KAFKA_BOOTSTRAP_SERVERS=localhost:19094 ./your-app
```

[Record Kafka traffic](./record.md) covers why this is needed, the broker ports proxymock recognizes, SASL, and what each recorded call holds.

## Read the recording

Each call is one file in the recording directory, named after the broker it went to. Open the recording with `proxymock web` and select a call: **Info** shows its command, such as `Produce`, `Fetch` or `JoinGroup`, and its topics as the location, and **Request** and **Response** show the decoded call as JSON, with each record's key and value as text when they are UTF-8.

The Requests list filters on the same fields, so `(tech IS Kafka) AND (command IS "Fetch") AND (location IS "orders")` lists what your consumer read from `orders`.

## Check consumer-group health

`proxymock kafka-report` reads the recording and reports how each consumer group behaved: its members, every rebalance and what started it, each fetched partition's lag and commit lag, and findings for consumer lag, stuck partitions, poll timeouts, offset resets and repeated rebalances.

```bash
proxymock kafka-report --in proxymock/recorded-<timestamp> -o pretty
```

See [Kafka consumer-group health](./consumer-group-health.md).

## Mock the broker

`proxymock mock` answers your app's Kafka calls from the recording, so the app runs with no broker: producers get their acknowledgements, consumers join their group and read the recorded records, and offset commits succeed. See [Mock a Kafka broker](./mock-kafka.md).

## Replay records to test a consumer or a producer

`proxymock replay` produces recorded records to a real broker. Replaying the `Fetch` responses your consumer received sends it the same records again, with their original keys, partitions, timestamps and compression, so you can test a new version of the consumer against yesterday's traffic. Replaying the `Produce` calls your producer made sends its output again. See [Replay Kafka traffic](./replay.md).

## In the Speedscale cloud

Traffic recorded in Kubernetes has the same calls, with no listener setup, and a snapshot carries the same consumer-group health report. See [Kafka](../../guides/message-brokers/kafka.md) for snapshots and in-cluster replays.
