---
description: "Pause the chain for a configured duration using the sleep transform in Speedscale, useful for pacing replay traffic or simulating client think-time."
sidebar_position: 22
---

# sleep

The `sleep` transform pauses the chain for a fixed duration. The chain's token is passed through unchanged — the only effect is the delay.

It is the simplest way to insert deliberate think-time between RRPairs or to slow a chain down for debugging.

- **Transform type name (config/API):** `sleep`
- **Shorthand format:** `sleep(duration=...)`

## Quick Start

Pause for 150 milliseconds before the rest of the chain proceeds:

```json
"type": "sleep",
"config": {
    "duration": "150ms"
}
```

If `duration` is omitted, the transform defaults to **1000ms** (1 second).

## How It Works

`sleep` does all of its work in the first phase. The second phase is a no-op.

1. **First phase** — block the current goroutine for the configured duration, then return the token unchanged.
2. **Second phase** — pass the token through.

The pause applies to the single chain evaluation the transform runs in. Concurrent chains on other RRPairs or other [vUsers](/reference/glossary.md#vuser) are unaffected — they have their own goroutines and are not blocked by this one's sleep.

### Scope of the Delay

- A `sleep` in a **request-side** chain delays the surrounding request flow for the current vUser before the request is sent.
- A `sleep` in a **response-side** chain delays processing after the response is received but before downstream chains and the next RRPair on the same vUser run.
- Other vUsers, other RRPairs, and other chains on different RRPairs continue independently.

There is no jitter, no skew correction, and no cancellation. Once the pause starts, it runs to completion.

## Configuration

```json
"type": "sleep",
"config": {
    "duration": "<Go duration string>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `duration` | No | `1000ms` | Length of the pause. Standard Go duration string: `ns`, `us` (or `µs`), `ms`, `s`, `m`, `h`. Examples: `150ms`, `2s`, `1m30s`. An unparseable value fails chain initialization. `0s` is accepted and produces effectively no delay. |

## Examples

### Example 1 — Pace request bursts

```json
"type": "sleep",
"config": {
    "duration": "200ms"
}
```

Inserts a 200ms pause in the chain — useful for slowing down a tight loop of requests on a single vUser.

### Example 2 — Default 1-second pause

```json
"type": "sleep"
```

With no `duration`, the pause is 1 second.

### Example 3 — Chain it after an extractor for diagnostic timing

```
req_body() → json_path(path="id") → sleep(duration=500ms)
```

The chain extracts `id`, waits 500ms, and continues. The token is unchanged through the pause.

## Common Misconceptions

1. **"`sleep` pauses the entire replay."**
   No. The pause is confined to the goroutine running the current chain — typically one vUser's traffic. Other vUsers and other chains continue running.

2. **"`sleep` modifies the token."**
   No. The token passes through unchanged. If you need both a delay and a value change, chain `sleep` together with another transform.

3. **"You can cancel a `sleep` partway through."**
   No. The pause runs to completion. Use a smaller duration if you need finer control.

4. **"Duration `0s` is rejected."**
   No. `0s` is a valid duration and produces effectively no pause; the chain continues immediately.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `could not parse duration: ...` | `duration` is not a valid Go duration string | Use formats like `150ms`, `2s`, `1m30s` |
| Replay throughput collapses | A long `sleep` is running on every RRPair across many vUsers | Reduce the duration, or move the `sleep` to a chain that runs less often |
| Pause is much longer than configured | The host is heavily loaded; Go runtime cannot wake the goroutine on time | Investigate generator host load — `sleep` itself does not over-shoot intentionally |
| Pause appears to do nothing | `duration` is very small relative to surrounding RRPair latency | Increase `duration`, or measure with a finer-grained tool |

## Related Transforms

- [`constant`](./constant.md), [`replace`](./replace.md) — for value-changing transforms when a pure delay isn't what you want.
- [`var_store`](./variable_store.md), [`var_load`](./variable_load.md) — for carrying values across RRPairs without delay.

## Advanced Notes

- `sleep` reports no required Kubernetes secrets and does not consult the variable cache.
- The default duration of 1 second is applied when `duration` is omitted entirely from the config. Passing `duration: ""` (empty string) is treated as missing and gets the default; passing `duration: "0s"` runs with no delay.
- The transform does not require recorded response data to run.
