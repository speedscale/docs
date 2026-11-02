---
title: Mock a Kafka broker
description: "Run a Kafka producer or consumer against a mock broker built from a proxymock recording: producers get their acknowledgements, consumers join their group and read the recorded records, and no broker has to run."
---

# Mock a Kafka broker

`proxymock mock` answers your app's Kafka calls from a recording, so the app runs with no broker: no container to start, no topics to create, and the same records every time. A consumer reads the records it read when you recorded it, which makes its behavior repeatable on a laptop, in CI and for an AI coding assistant.

## Run the mock

Record once against a real broker, as described in [Record Kafka traffic](./record.md), then start the mock with the same mapping and point the app at it:

```bash
proxymock mock --in proxymock/recorded-<timestamp> --map 19094=kafka://localhost:9094
KAFKA_BOOTSTRAP_SERVERS=localhost:19094 ./your-app
```

The `kafka://` scheme tells the mock that the port speaks Kafka. Without it, the mock guesses the protocol from the port the recording was made on. The broker does not have to run, and its listener settings do not matter, because the mock tells the client that it is the only broker in the cluster and the coordinator of every group.

The mock writes what it served to `proxymock/results/mocked-<timestamp>`, one file per call, tagged `HIT` when it came from the recording.

## What the mock does

- **Bootstrap and metadata.** `ApiVersions`, `Metadata` and `FindCoordinator` are answered so the client keeps talking to the mock. The mock advertises the API versions it supports, and the client picks from them.
- **Produce.** A `Produce` is acknowledged, or not answered when the producer uses `acks=0`.
- **Fetch.** A consumer's `Fetch` is answered with the records recorded for that topic, partition and offset. Each recorded batch is served once, and later fetches return no records, the way a broker answers a consumer that has caught up. When the recording shows the app producing and then consuming in rounds, as a request and reply service does, the mock holds each round's records until the app has produced that round.
- **Consumer groups.** `JoinGroup`, `SyncGroup`, `Heartbeat` and `LeaveGroup` run against a coordinator inside the mock, so a consumer joins its group and gets its partitions. `OffsetFetch`, `OffsetCommit` and `ListOffsets` are answered.

Run against the six-record recording on the record page, a console producer gets its acknowledgements and a console consumer in the group `billing` reads the same six records, with every call a `HIT` and no broker running.

## When a call does not match

A call the recording has no answer for, and the mock cannot answer on its own, is written to the results as a miss, and the mock closes that connection. Kafka clients reconnect and retry, so a miss usually shows up as a client retrying or timing out rather than as an error in the app.

The usual causes are a topic, partition or offset the recording never fetched, and a call the app did not make while you recorded. Record the app doing the work you want to test, so the recording covers the topics and partitions it reads.

[Improve Mock Match Rate with AI](../guides/mock-match-rate.md) has an AI assistant find the calls that missed and fix them.

## Clients that authenticate

The mock answers SASL itself instead of replaying the recorded handshake. With SASL/PLAIN it accepts any username and password.

SCRAM-SHA-256 and SCRAM-SHA-512 need the password your app uses, because the client checks the server's proof. Put it in the `responder.kafka` section of a [test config](../guides/test-configs.md), and run the mock as part of a replay with `--test-config`. Use a secret reference such as `${{secret:kafka-credentials/password}}`, which reads the file `proxymock/secrets/kafka-credentials/password`, rather than a literal password; see [Secrets](../guides/secrets.md):

```json
{
  "responder": {
    "kafka": {
      "username": "${{secret:kafka-credentials/username}}",
      "password": "${{secret:kafka-credentials/password}}",
      "saslMechanism": "PROTOCOL_SASL_MECHANISM_SCRAM_SHA_512"
    }
  }
}
```

Without it, the mock answers a SCRAM handshake with `UNSUPPORTED_SASL_MECHANISM` and logs a warning.

## Test the consumer against a broker instead

Mocking replaces the broker. To send a real broker the recorded records and watch a consumer process them, see [Replay Kafka traffic](./replay.md).
