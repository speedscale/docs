---
title: Replay Kafka traffic
description: "Test a Kafka consumer by replaying the records it read into a real broker, with their original keys, partitions, timestamps and compression, or replay a producer's output, with proxymock replay and --tests-filter."
---

# Replay Kafka traffic

`proxymock replay` produces recorded records to a real broker. It turns either side of a recording into a test:

- **Test a consumer.** The records your consumer received in its `Fetch` responses are produced to the broker again, so the consumer, or a new version of it, reads the same records it read when you recorded it.
- **Replay a producer's output.** The `Produce` requests your producer sent are produced again, so whatever consumes that topic downstream gets the same input.

Each record keeps its recorded key, value, headers and partition, its CreateTime timestamp and its batch's compression codec.

## Choose what to replay

A replay sends the recording's inbound traffic by default, and a Kafka client's calls are all outbound, so choose the Kafka calls to replay with `--tests-filter`. Without it, a recording of a Kafka client has nothing to replay and the run stops with "no records were added to the cache after filtering".

| To replay | Filter |
|---|---|
| What a consumer read from `orders` | `(command IS "Fetch") AND (location IS "orders")` |
| Everything a consumer read | `(tech IS Kafka) AND (command IS "Fetch")` |
| What a producer sent | `(command IS "Produce")` |

[Choose What a Replay Tests](../guides/choose-replay-tests.md) covers the filter syntax.

## Test a consumer

Point `--test-against` at the broker the consumer will read from. This replays the records the consumer read from `orders`:

```bash
proxymock replay --in proxymock/recorded-<timestamp> \
  --test-against localhost:9092 \
  --tests-filter '(command IS "Fetch") AND (location IS "orders")'
```

The broker must advertise an address `proxymock replay` can reach, because records are produced to each partition's leader. A local broker's normal listener does; the recording listener from [Record Kafka traffic](./record.md) advertises proxymock's port, which nothing is listening on during a replay.

Start the consumer against the same broker, before or after the replay. From the six-record recording on the record page, a console consumer reads back:

```text
CreateTime:1791834407471	Partition:0	order-1	{"id":1,"total":10}
CreateTime:1791834407475	Partition:0	order-4	{"id":4,"total":40}
CreateTime:1791834407475	Partition:0	order-5	{"id":5,"total":50}
CreateTime:1791834407475	Partition:1	order-2	{"id":2,"total":20}
CreateTime:1791834407475	Partition:1	order-3	{"id":3,"total":30}
CreateTime:1791834407475	Partition:1	order-6	{"id":6,"total":60}
```

The timestamps are the ones recorded, not the time of the replay, so a consumer that windows or expires records by time sees them as they were. Create the topic with at least as many partitions as the recording used, so each record can go back to its partition.

## Replay a producer's output

```bash
proxymock replay --in proxymock/recorded-<timestamp> \
  --test-against localhost:9092 \
  --tests-filter '(command IS "Produce")'
```

## Read the result

proxymock prints a latency table per topic and API, and writes `replay-verdict.json` to the replay's output directory:

```text
LATENCY / THROUGHPUT
┌────────┬───────┬───────┬─────────────┬──────────┬──────────┬──────────┬──────────┬────────┬─────────────────┬──────────────┐
│ TOPIC  │ API   │ COUNT │ AVG LATENCY │     P 50 │     P 90 │     P 95 │     P 99 │ FAILED │ RESULT MISMATCH │ PER - SECOND │
├────────┼───────┼───────┼─────────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────────────┼──────────────┤
│ orders │ Fetch │     1 │       13 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │      0 │              0% │ 52.20        │
├────────┼───────┼───────┼─────────────┼──────────┼──────────┼──────────┼──────────┼────────┼─────────────────┼──────────────┤
│ TOTAL  │       │     1 │       13 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │ 13.03 ms │      0 │              0% │ 52.20        │
└────────┴───────┴───────┴─────────────┴──────────┴──────────┴──────────┴──────────┴────────┴─────────────────┴──────────────┘
```

- **COUNT** is the number of recorded calls replayed. One recorded `Fetch` that returned six records is one row and produces all six.
- **Latency** is the time the broker took to accept the records, not the time your consumer took to process them.
- **FAILED** counts produces the broker rejected, and **RESULT MISMATCH** produces whose result differed from the recording.

The replay checks that the broker accepted the records. Whether your consumer handled them correctly is up to the consumer's own behavior: watch its output, its database, or record it while it consumes and run [`proxymock kafka-report`](./consumer-group-health.md) on that recording to see its lag, commits and rebalances.

## Brokers that require SASL or TLS

Put the credentials in the `generator.kafka` section of a [test config](../guides/test-configs.md) and pass it with `--test-config`:

```json
{
  "generator": {
    "kafka": {
      "username": "${{secret:kafka-credentials/username}}",
      "password": "${{secret:kafka-credentials/password}}",
      "saslMechanism": "PROTOCOL_SASL_MECHANISM_SCRAM_SHA_512",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

- `saslMechanism` is `PROTOCOL_SASL_MECHANISM_PLAIN`, `PROTOCOL_SASL_MECHANISM_SCRAM_SHA_256` or `PROTOCOL_SASL_MECHANISM_SCRAM_SHA_512`.
- `tlsMode` is `PROTOCOL_TLS_MODE_REQUIRE` to connect over TLS without verifying the broker's certificate, or `PROTOCOL_TLS_MODE_VERIFY_FULL` to verify it. Leave it out for a plaintext listener.
- Use secret references for the password, because a literal value is stored with the test config. Locally, `${{secret:kafka-credentials/password}}` reads the file `proxymock/secrets/kafka-credentials/password`; see [Secrets](../guides/secrets.md).

## In your cluster

To replay a snapshot against a consumer running in Kubernetes, see [Replay in your cluster](../../guides/message-brokers/kafka.md).
