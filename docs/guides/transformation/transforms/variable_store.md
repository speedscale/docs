---
description: "Capture the chain's current token into a named variable using the var_store transform in Speedscale, so a value seen in one RRPair can be loaded into a later one with var_load."
sidebar_position: 33
---

# var_store

The `var_store` transform writes the chain's current token into a named entry on the session's [variable cache](../variables.md). The stored value can be retrieved later in the same replay session by [`var_load`](./variable_load.md), or referenced inline by `${{var:name}}` inside other transform values.

It does **not** modify the token. The bytes it stores pass through untouched, so `var_store` is safe to drop anywhere in a chain that already produces the value you want to capture.

- **Transform type name (config/API):** `var_store`
- **Shorthand format:** `var_store(name=...)`

## Quick Start

Capture a value into a named variable for later use:

```json
"type": "var_store",
"config": {
    "name": "access_token"
}
```

This is the typical last step in a chain that extracts a token from a response (`res_body() → json_path(path="access_token") → var_store(name=access_token)`).

## How It Works

`var_store` performs the write **during the first phase** of the chain and is a no-op on the second phase.

1. **First phase** — receive the chain's current token, store it under `name` in the variable cache, and return the token unchanged so the rest of the chain still sees the original bytes.
2. **Second phase** — the token is passed through unchanged. Nothing else happens.

Because the token is returned untouched, the chain's extractor writes the field back to its **original value**, not to a marker. From the RRPair's perspective the transform is invisible — the only side effect is the new cache entry.

A small `transform` event is emitted to the run's event log with the stored name and value, which is useful when verifying chains in Preview Mode.

### Variable Cache Scope

The cache is shared by every chain running in the same replay or mock-server session. A value written by `var_store` is available to:

- A later `var_load` chain on any RRPair in the same session.
- A `${{var:name}}` reference inside a [`constant`](./constant.md), [`jwt_resign`](./jwt_resign.md), or other transform that supports embedded substitution.
- The Speedscale analyzer's grouping logic, which keeps `var_store` / `var_load` pairs that share a name logically associated when reorganizing chains.

### Repeated Stores

Each call to `var_store` overwrites any previous value under the same name. If multiple RRPairs in a session run the same `var_store` chain, the most recently observed value wins. There is no "first write" guard — use chain ordering or filters to control which RRPair stores the canonical value.

## Configuration

```json
"type": "var_store",
"config": {
    "name": "<string>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `name` | **Yes** | — | Cache key the current token will be stored under. Must be a non-empty string; missing `name` fails chain initialization. |

`name` is the only configuration knob — there is no namespace, prefix, or TTL.

## Examples

### Example 1 — Capture an access token from a login response

```
res_body() → json_path(path="access_token") → var_store(name=access_token)
```

A subsequent RRPair can replay the token with:

```
http_req_header(header="Authorization") → var_load(name=access_token)
```

### Example 2 — Capture a resource ID created by an earlier call

```
res_body() → json_path(path="id") → var_store(name=order_id)
```

Then reference it in a later URL:

```
http_url(subdirIndex=2) → var_load(name=order_id)
```

### Example 3 — Capture a value to feed an embedded template

Store an ID once:

```
res_body() → json_path(path="user.id") → var_store(name=current_user_id)
```

Reference it from a later transform that supports `${{...}}` substitution:

```json
"type": "constant",
"config": {
    "new": "user-${{var:current_user_id}}"
}
```

### Example 4 — Token is preserved through the chain

```
res_body() → json_path(path="session") → var_store(name=session_id) → tag_session()
```

`var_store` does not consume the token, so `tag_session` still sees the session value and tags it on the RRPair.

## Common Misconceptions

1. **"`var_store` modifies the field."**
   No. The original bytes pass through untouched. The RRPair field stays the same; the variable cache picks up a new entry.

2. **"Storing a JSON scalar stores the unquoted string."**
   No. The transform stores exactly what the extractor produced. If the upstream extractor returns `"abc123"` (with JSON quotes), the cache holds the quoted form. Use [`trim`](./trim.md) or [`regex`](./regex.md) earlier in the chain to strip quotes before storing.

3. **"Each request gets its own variable."**
   No. Variables live on the session cache, shared by every RRPair. A second call to `var_store(name=foo)` overwrites the first.

4. **"`var_store` and `var_load` have to be in the same chain."**
   No. They communicate through the session cache. The expected pattern is `var_store` on one RRPair and `var_load` on a later one.

5. **"Storing nothing is safe."**
   A missing variable read later by `var_load` produces an **empty** field, not the original. If conditional storage is required, use a chain filter so `var_store` only runs when the value is present.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `missing variable name (key=name)` | `name` is not set in the config | Add `name: <variable>` |
| `var_load` returns an empty value later | The `var_store` chain didn't run on the expected RRPair, or it ran after the loading RRPair | Check chain filters and RRPair ordering; verify the store chain is matching its intended RRPair |
| Wrong (older) value loaded later | A later RRPair ran `var_store` again and overwrote the value | Use a chain filter to restrict the store to the RRPair you intend, or rename the variable |
| Stored value contains JSON quotes | The extractor returned a JSON-quoted scalar | Add [`trim`](./trim.md) or [`regex`](./regex.md) before `var_store` |
| Value not visible across services | The two services were replayed in separate sessions | Use a single multi-service replay so they share the variable cache |
| Variable visible in event log but `var_load` still empty | `var_load` is running on a different replay session, or a name mismatch | Confirm exact name match (case-sensitive) and that both chains run inside the same session |

## Related Transforms

- [`var_load`](./variable_load.md) — the read half of this pair. Pulls a named entry from the cache and emits it as the chain's token.
- [`constant`](./constant.md) — accepts `${{var:name}}` references for embedding a stored value inside a larger string.
- [`tag_session`](./tag_session.md) — also a "store and pass through" pattern, but writes to the RRPair's session field rather than the variable cache.
- [`smart_replace`](./smart_replace.md) — value-based propagation that does not require a named variable.

See [Variables](../variables.md) for an end-to-end view of how variables flow through a replay session, and [Multi-service replay](../../replay/multi-service-replay.md) for a worked example that stores a token in one service and loads it in another.

## Advanced Notes

- The transform reports no required Kubernetes secrets — `name` is the only configuration it consumes.
- The token bytes are stored by reference; subsequent transforms in the same chain that mutate the slice are not expected to do so in place. If you need to capture a snapshot you intend to mutate later, place `var_store` before any in-chain mutators.
- The session-scoped cache persists across every RRPair in the replay or mock-server run, regardless of how long the run is.
- The Speedscale analyzer's tuner emits `var_store` / `var_load` pairs together when it identifies a server-generated ID that needs to be threaded between requests. The shared `name` is what keeps the pair associated when chains are regrouped.
