---
title: Record Kafka traffic
description: "Record a Kafka producer or consumer with proxymock: give the broker a listener that advertises proxymock's port so every call goes through it, map that port with --map, and read what each recorded call holds."
---

# Record Kafka traffic

proxymock records Kafka the way it records a database: you start the recorder with a port mapped to the broker and point your app at that port. Kafka needs one more step, because of how its clients find brokers.

## Why the broker must advertise proxymock

A Kafka client uses its bootstrap address only to ask for cluster metadata. The metadata names the address each broker advertises, and the client opens every later connection, for producing, fetching, joining its group and committing, to that advertised address.

If your broker advertises its own address, the client goes straight to it after the first `Metadata` call, and the recording holds only `ApiVersions`, `Metadata` and a few other bootstrap calls. So the broker has to advertise proxymock's port on the listener your app uses.

## Add a listener for recording

Give your local broker a second listener that advertises proxymock's port, and leave the normal one alone. Clients on the normal listener keep working, and only the app you point at proxymock is recorded. In the broker's `server.properties`:

```properties
listeners=PLAINTEXT://127.0.0.1:9092,RECORD://127.0.0.1:9094
advertised.listeners=PLAINTEXT://127.0.0.1:9092,RECORD://localhost:19094
listener.security.protocol.map=PLAINTEXT:PLAINTEXT,RECORD:PLAINTEXT
```

A broker in a container takes the same settings from its environment, such as `KAFKA_LISTENERS`, `KAFKA_ADVERTISED_LISTENERS` and `KAFKA_LISTENER_SECURITY_PROTOCOL_MAP`. If the broker only serves the app you are recording, you can instead change its one listener to advertise proxymock's port.

The listener proxymock forwards to must use a port proxymock recognizes as Kafka: 9092, 9093, 9094, 9095, 9096, 9098, 9194, 9196 or 9198. proxymock identifies Kafka by the broker's port, so traffic to any other port is not recorded as Kafka.

## Start the recorder

Map the port the listener advertises to the listener itself:

```bash
proxymock record --map 19094=kafka://localhost:9094
```

Then point your app at proxymock's port:

```bash
KAFKA_BOOTSTRAP_SERVERS=localhost:19094 ./your-app
```

Or in a Spring Boot application:

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BROKERS:localhost:9092}
```

```bash
KAFKA_BROKERS=localhost:19094 java -jar target/your-app.jar
```

Use the app as you normally would, then stop the recorder with Ctrl-C. The recording is written to `proxymock/recorded-<timestamp>`. The `kafka://` scheme is optional when recording; it matters when you [mock the broker](./mock-kafka.md) with the same mapping.

## What gets recorded

Each call your app made is one file, under a directory named after the broker it went to, such as `localhost-9094`. A console producer that sent six records and a console consumer that read them back in the group `billing` record as:

| Command | Count | Location |
|---|---|---|
| `ApiVersions` | 5 | `N/A` |
| `Metadata` | 3 | `N/A` |
| `InitProducerId` | 2 | `N/A` |
| `Produce` | 1 | `orders` |
| `FindCoordinator` | 2 | `N/A` |
| `JoinGroup`, `SyncGroup`, `LeaveGroup` | 2, 1, 1 | `N/A` |
| `OffsetFetch`, `ListOffsets` | 1, 1 | `N/A` |
| `Fetch` | 2 | `orders` for the one that returned the records |
| `OffsetCommit` | 1 | `N/A` |

For each call, the file holds:

- **The command**, the Kafka API name, such as `Produce`, `Fetch` or `JoinGroup`.
- **The location**, the topics the call named, or `N/A` when it named none.
- **The decoded request and response.** Produce requests and Fetch responses hold their record batches: base offset and timestamps, compression codec, producer id, and each record's key, value, headers, offset delta and timestamp delta. Compressed batches (gzip, snappy, lz4 and zstd) are decompressed, and a key, value or header that is UTF-8 is also shown as text, so a JSON value reads as JSON.
- **Timing**, when the call started and how long it took.

proxymock decodes the produce, fetch, offset, consumer-group, metadata, topic-administration and SASL calls of current Kafka clients. It is tested against Kafka 3.9, 4.1 and 4.3 brokers with the Java client, franz-go, librdkafka (which backs the Python, .NET and Node clients) and sarama, with both the classic group protocol and the KIP-848 consumer protocol.

## Brokers that use SASL

To record a client that authenticates, map the recording listener to `SASL_PLAINTEXT` in `listener.security.protocol.map` and set it up as you would any SASL listener. proxymock decodes the client's `SaslHandshake` and `SaslAuthenticate` requests along with the rest of the connection.

:::caution
The recording holds the bytes the client authenticated with. With SASL/PLAIN those include the username and password in clear. Record with a local or test account, and do not share or commit a recording made with real credentials.
:::

## Read the recording

Open it in proxymock web:

```bash
proxymock web
```

Select a call in **Requests**: **Info** shows its command and location, and **Request** and **Response** show the decoded call as JSON. The filter `(tech IS Kafka) AND (command IS "Fetch") AND (location IS "orders")` lists what your consumer read from `orders`, and `(command IS "Produce")` what your producer sent.

To see how the app's consumer groups behaved, run [`proxymock kafka-report`](./consumer-group-health.md) on the recording.

## In Kubernetes

The Speedscale operator records Kafka traffic in your cluster with no listener changes, because it captures each connection where the app opens it. See [Kubernetes and eBPF](../../guides/message-brokers/kafka.md#kubernetes).

## Next

- [Kafka consumer-group health](./consumer-group-health.md)
- [Mock a Kafka broker](./mock-kafka.md)
- [Replay Kafka traffic](./replay.md)
