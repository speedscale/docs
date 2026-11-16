---
title: Redis Mocking and Replay
description: Capture Redis and Valkey traffic, mock it with recorded RESP2 and RESP3 responses, or replay the recorded commands against a disposable Redis or Valkey server.
sidebar_position: 5
---

# Redis Mocking and Replay

Speedscale 2.5.1008 and later can mock Redis and Valkey dependencies from recorded traffic. The responder matches each command and its arguments, including binary values, then returns the recorded RESP2 or RESP3 response while the real backend is offline.

Redis mocking is recorded-response playback. It does not create a stateful Redis server. Outcomes such as expiration, Lua execution, and `WATCH` conflicts come from the recording instead of being recalculated from new in-memory state.

## Support

| Capability | Support | Notes |
| --- | --- | --- |
| RESP2 and RESP3 | Full | The mock responds using the protocol version in the recorded exchange. |
| Command and argument matching | Full | Signatures include the command and arguments, including binary values. |
| Pipelines | Full | Record the complete pipeline so each response is available during playback. |
| `MULTI`, `EXEC`, and `WATCH` | Full with complete history | The recording must preserve the chronological connection history and connection metadata. |
| Lua and expiration outcomes | Recorded playback | The recorded result is returned; the script or expiration clock is not executed again. |
| Pub/Sub | Not supported | Pub/Sub mode is rejected. |
| `MONITOR` | Not supported | Monitor mode is rejected. |
| Replay against a real server | Full for a single-node server | See [Replay against Redis or Valkey](#replay). |

The release was qualified with Redis 7.4 and Valkey 8 using both RESP2 and RESP3. TLS and ACL configurations, Redis Cluster, Sentinel, and hosted Redis services were not part of that qualification. Contact [Speedscale support](mailto:support@speedscale.com) if your deployment depends on one of those configurations.

## Capture Redis with proxymock

Redis clients use a raw TCP protocol and usually ignore HTTP proxy environment variables. Use `--map` to make proxymock listen on a local port and forward that connection to Redis.

Start a recording:

```bash
proxymock record \
  --map 56379=redis://127.0.0.1:6379 \
  --out ./recordings
```

Point the application at the mapped port and run it:

```bash
export REDIS_ADDR=127.0.0.1:56379
./my-app
```

Exercise every command and transaction path that the mock must serve. For transactions, capture the complete history on each connection, including `WATCH`, `MULTI`, queued commands, and `EXEC`. Filtering or independently editing commands can make that history incomplete and prevent the recording from loading.

Stop the recording after the required traffic has been captured.

## Run without Redis

Stop the real Redis backend, then start the mock on the same mapped port:

```bash
proxymock mock \
  --map 56379=redis://127.0.0.1:6379 \
  --in ./recordings \
  --no-passthrough
```

Run the application again with `REDIS_ADDR=127.0.0.1:56379`. A matching command receives its recorded response without contacting Redis. `--no-passthrough` prevents an unmatched request from reaching the real backend.

If the mock cannot match a Redis request, it returns an error instead of inventing state. Capture the missing command sequence or restore transaction history that was filtered from the recording.

## Replay against Redis or Valkey {#replay}

You can also send the recorded commands to a real Redis or Valkey server. Use it to load test a cache with your app's real command mix, or to check a move from Redis to Valkey or Amazon ElastiCache by replaying the same recording against each and comparing the reports.

:::warning
Replay runs every recorded write, delete and `FLUSHDB` against the target, again on every pass of a load test. Point it at a disposable instance that you can reset, never at a shared or production cache.
:::

### Choose the Redis traffic as the tests {#replay-tests}

By default a replay sends your app's inbound traffic as tests and serves Redis from the mock. To test Redis itself, make the recorded Redis commands the tests with a tests filter. [Choose What a Replay Tests](../../guides/choose-replay-tests.md) explains the filter, and the Speedscale dashboard sets it with **Choose replay tests** on the snapshot's **Traffic** tab.

Regression test a server once, with the recorded commands:

```bash
REDISCLI_AUTH=<password> proxymock replay \
  --in ./recordings \
  --tests-filter '(direction IS OUT) AND (tech IS Redis)' \
  --test-against redis://localhost:6379/0
```

Load test it with several virtual users for a fixed time:

```bash
REDISCLI_AUTH=<password> proxymock replay \
  --in ./recordings \
  --tests-filter '(direction IS OUT) AND (tech IS Redis)' \
  --test-against redis://localhost:6379/0 \
  --vus 10 --for 1m --load-test
```

An AI coding assistant with the proxymock MCP server can run the same replay. Ask, for example, "Replay the recorded Redis traffic against redis://localhost:6379/0 and list every command that failed."

### Connect to the server {#replay-credentials}

The address is `redis://host:port/db`, or `rediss://host:port/db` for TLS. The path is the logical database the replay selects, and it defaults to 0. When the path or `generator.redis.database` names a database, the recorded `SELECT` commands are skipped so every command runs there; otherwise they are sent as recorded. Credentials in the address are rejected so they never end up in shell history or reports.

The replay never sends the recording's own `AUTH` or `HELLO` credentials. It authenticates every connection with the password from one of these places:

| Where | What to set |
|---|---|
| Your machine | The `REDISCLI_AUTH` environment variable, which `redis-cli` reads too |
| The test config | `generator.redis`: `username` (an ACL user, empty for the default user), `password`, `database`, `tlsMode` and `connectTimeout` |

```json
{
  "generator": {
    "redis": {
      "username": "replay",
      "password": "${{secret:redis-creds/password}}",
      "database": "0",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

The test config wins over `REDISCLI_AUTH`, and the database in the address wins over the test config. Prefer a secret reference such as `${{secret:redis-creds/password}}` to a typed password: a typed password is saved in plain text with the test config and every report that uses it. [Connect to the database](../load-and-regression-testing.md#credentials-secret) explains where a secret reference is read from on your machine and in a cluster. The dashboard's **Database credentials** form has no Redis tab yet, so set `generator.redis` in the test config's JSON.

| `tlsMode` | What it does |
|---|---|
| Unset or `PROTOCOL_TLS_MODE_DISABLE` | Plain text, unless the address is `rediss://`, which means `PROTOCOL_TLS_MODE_REQUIRE` |
| `PROTOCOL_TLS_MODE_PREFER` | Tries TLS and falls back to plain text when the handshake fails |
| `PROTOCOL_TLS_MODE_REQUIRE` | Always encrypts, without checking the server's certificate |
| `PROTOCOL_TLS_MODE_VERIFY_CA` | Checks that a trusted CA signed the certificate |
| `PROTOCOL_TLS_MODE_VERIFY_FULL` | Also checks that the certificate names the host |

Before any load starts, the replay connects once to each Redis server and sends `PING`. A wrong password stops the replay straight away with the server's `WRONGPASS` or `NOAUTH` message instead of failing every command.

### What gets replayed {#replay-commands}

The recording interleaves your app's connections. The replay opens one live connection for each recorded connection and sends that connection's commands in their recorded order, so transactions, `WATCH`, `SELECT` and pipelines keep their meaning. Pipelined commands are sent one at a time, in order, on their connection.

| Recorded command | What the replay does |
|---|---|
| Data commands, `MULTI`, `EXEC`, `DISCARD`, `WATCH` and `SELECT` | Sends them as recorded |
| `HELLO` | Sends it with the recorded protocol version and without its `AUTH` clause, so a RESP3 recording replays as RESP3 |
| `AUTH` | Skipped: each connection authenticates with the replay's own credentials |
| `EVALSHA` | Loads the script with `SCRIPT LOAD` first when the recording holds its body in an `EVAL` or `SCRIPT LOAD`, so a fresh server does not answer `NOSCRIPT`. Inside `MULTI`, when the script is not loaded on that connection yet, the command is sent as `EVAL` instead. |
| Blocking commands: `BLPOP`, `BRPOP`, `BRPOPLPUSH`, `BLMOVE`, `BLMPOP`, `BZPOPMIN`, `BZPOPMAX`, `BZMPOP`, `XREAD` and `XREADGROUP` with `BLOCK`, `WAIT`, `WAITAOF` | Sends them with the timeout capped at one second, because no other client will push what the recording waited for. A recorded timeout of 0 waits forever and is capped too. |
| `SUBSCRIBE`, `PSUBSCRIBE`, `SSUBSCRIBE` and their unsubscribe forms, `MONITOR`, `QUIT`, `RESET`, `SHUTDOWN`, `DEBUG`, replication commands, `CLIENT KILL`, `CLIENT PAUSE` and `CLIENT REPLY` | Skipped. The replay log names each skipped command once, and the generator's `redis.commands_skipped` metric counts them. |

Each replayed command keeps the server's reply in place of the recorded one, so the report shows both. A command scores as failed when the server answers with an error reply, and the report names it by its error code, such as `ERROR WRONGTYPE` or `ERROR NOSCRIPT`. Values that differ from the recording, such as counters and timestamps, do not count as failures. Each reply keeps at most 1,000 elements per list, set or map.

At the end of each pass, a transaction or `WATCH` left open is discarded so the next pass starts clean. Connections stay open between passes.

### Limits {#replay-limits}

- **Single-node targets only.** The replay does not follow cluster `MOVED` or `ASK` redirects. It checks `INFO cluster` before load starts and stops with a message that a single-node target is required when cluster mode is on. Replay against a standalone server, a primary with cluster mode disabled, or one shard's primary.
- **Amazon ElastiCache IAM authentication** is not supported yet. Use a password or an ACL user and password.
- **Functions** (`FCALL`) are sent as recorded. The replay does not load libraries with `FUNCTION LOAD`.
- **A recorded `NOSCRIPT`** is replayed as recorded. Once a script is loaded on the target, a later `EVALSHA` succeeds even where the recording failed.
- **Pub/Sub** is not replayed.
- **Scripts loaded before recording started** cannot be loaded for `EVALSHA`, because the recording does not hold their body. Start recording before your app loads its scripts.

## Kubernetes capture and replay

The [eBPF collector](/reference/ebpf-traffic-collection) can capture Redis traffic from selected Kubernetes workloads. Confirm the decoded commands in the [Redis traffic view](/guides/capture/bodies#redis), create a snapshot that includes the complete connection history, then start a [TrafficReplay](/guides/replay/via-speedctl) to run the application against the Redis responder.

Do not confuse the mocked application dependency with the Redis instance that Speedscale can deploy internally for replay coordination. The `replayComponents.redis` Helm values configure that internal component; they do not select the Redis dependency being mocked.

## Older recordings

Complete recordings created before Redis response mocking was released can work without recapture when they contain connection IDs, connection start times, proxy identity, network endpoints, and complete chronological transaction history. Recapture traffic if those fields or transaction commands are missing.
