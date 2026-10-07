---
title: Redis Mocking
description: Capture Redis traffic and replay recorded RESP2 and RESP3 responses without a live Redis backend.
sidebar_position: 5
---

# Redis Mocking

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

## Kubernetes capture and replay

The [eBPF collector](/reference/ebpf-traffic-collection) can capture Redis traffic from selected Kubernetes workloads. Confirm the decoded commands in the [Redis traffic view](/guides/capture/bodies#redis), create a snapshot that includes the complete connection history, then start a [TrafficReplay](/guides/replay/via-speedctl) to run the application against the Redis responder.

Do not confuse the mocked application dependency with the Redis instance that Speedscale can deploy internally for replay coordination. The `replayComponents.redis` Helm values configure that internal component; they do not select the Redis dependency being mocked.

## Older recordings

Complete recordings created before Redis response mocking was released can work without recapture when they contain connection IDs, connection start times, proxy identity, network endpoints, and complete chronological transaction history. Recapture traffic if those fields or transaction commands are missing.
