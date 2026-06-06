---
description: "Cycle through a configured list of values, sequentially or randomly, using the one_of transform in Speedscale. Useful for rotating user accounts, region codes, and other fixed sets across replayed RRPairs."
sidebar_position: 16
---

# one_of

The `one_of` transform replaces the extracted token with a value drawn from a configured list. Two strategies are supported: **sequential** cycles through the list in order (and wraps to the start), and **random** picks uniformly at random on each call.

Typical use: rotate a fixed set of user accounts, account IDs, tenant codes, or region values across replayed RRPairs so each request looks like it came from a different identity.

- **Transform type name (config/API):** `one_of`
- **Shorthand format:** `one_of(strategy=...,options=...)`

## Quick Start

Cycle through a list of usernames in order:

```json
"type": "one_of",
"config": {
    "strategy": "sequential",
    "options": "alice,bob,carol,dave,erin"
}
```

The first invocation writes `alice`, the second `bob`, and so on, wrapping back to `alice` after `erin`.

## How It Works

`one_of` runs in the **second phase**. This is the opposite of most value-generating transforms (`constant`, `rand_string`) — it lets `one_of` sit at the end of a chain and override whatever earlier transforms produced.

1. **First phase** — no-op. The original extracted value passes through untouched.
2. **Second phase** — resolve any `${{...}}` tokens inside the options list against the variable cache, pick an entry (sequentially or randomly), and write it back. The previously extracted value is discarded.

### Sequential Counter

In `sequential` mode, `one_of` stores its position on the variable cache under a unique key (`oneof_<uuid>`) generated when the chain is constructed. Each call reads the counter, picks `options[counter]`, increments, and wraps to `0` when it reaches the end of the list.

- The UUID-keyed counter means multiple `one_of` chains on the same RRPair don't share state — each rotates independently.
- In **analysis mode** the UUID is replaced with the fixed string `analysis`, so analysis-time output is deterministic.

### Random Selection

In `random` mode, each call picks an index uniformly at random from the resolved options list. Calls are independent — successive calls can return the same value.

## Configuration

```json
"type": "one_of",
"config": {
    "strategy": "<sequential|random>",
    "options": "<comma-delimited list>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `strategy` | No | `sequential` | `sequential` cycles through `options` in order and wraps. `random` picks uniformly at random. Any other value fails chain initialization. |
| `options` | **Yes** | — | Comma-separated list of values. Missing this fails chain initialization. Each entry is resolved through `${{...}}` substitution on every call. |

### Options Syntax

`options` is split on `,` — there is no escaping. Commas inside an individual option value cannot be represented.

Each entry runs through `${{...}}` substitution at call time, so options can reference variables, environment variables, or any other supported [embedded syntax](../embedded-syntax.md):

```json
"options": "${{env_var:USER_A}},${{env_var:USER_B}},${{env_var:USER_C}}"
```

The substitution happens on every call, so options that resolve to mutable variables can change between invocations.

## Examples

### Example 1 — Rotate through user accounts

```
req_body() → json_path(path="username") → one_of(strategy=sequential, options="alice,bob,carol,dave,erin")
```

| Invocation | Result |
|---|---|
| 1 | `alice` |
| 2 | `bob` |
| 3 | `carol` |
| 4 | `dave` |
| 5 | `erin` |
| 6 | `alice` (wrapped) |

### Example 2 — Pick a random region code

```
http_req_header(header="X-Region") → one_of(strategy=random, options="us-east-1,us-west-2,eu-west-1,ap-southeast-1")
```

Each request gets one of the four regions selected uniformly at random; consecutive calls may return the same value.

### Example 3 — Use environment variables as the option set

```json
"type": "one_of",
"config": {
    "strategy": "sequential",
    "options": "${{env_var:USER_A}},${{env_var:USER_B}},${{env_var:USER_C}}"
}
```

Each invocation resolves all three env vars, then picks the next one in order. This lets the operator pod control the option set without editing the action file.

### Example 4 — Pair with `smart_replace` for cross-field propagation

```
smart_replace() → req_body() → json_path(path="userId") → one_of(strategy=sequential, options="user_1,user_2,user_3")
```

The first time a `userId` is seen in a request body, the next value from the rotation is picked and `smart_replace` registers `<original> → <picked>`. Every subsequent occurrence of the original `userId` anywhere in the RRPair — and in later RRPairs in the same session — is rewritten to the same picked value. Without `smart_replace`, only the directly extracted field is rewritten.

## Common Misconceptions

1. **"`random` is independent of `sequential` state."**
   Correct — they are. But within `sequential`, switching strategies mid-run resets nothing automatically; the counter stays on the variable cache for the configured chain instance.

2. **"Two `one_of` chains with the same options stay in lockstep."**
   No. Each chain gets its own UUID-scoped counter on the variable cache, so identically configured chains rotate independently.

3. **"`one_of` runs in the first phase like `constant`."**
   No. `one_of` is one of the few transforms that does its work in the **second phase**. The original token reaches the next transform in the chain unchanged; the rotation value is written at the end.

4. **"Commas inside an option value can be escaped."**
   No. `options` is split on every `,`. If you need commas in a value, use [`constant`](./constant.md) with an `${{...}}` reference instead.

5. **"In `random` mode each value appears exactly once before repeats."**
   No. Selection is uniform-random with replacement. Repeated values are possible from one call to the next.

6. **"Analysis mode picks values randomly."**
   No. In analysis mode the counter key is fixed (`oneof_analysis`), so sequential output is deterministic across runs. This is intentional — analysis output should not drift between runs.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `missing options` | `options` is required | Provide a comma-delimited list |
| Chain init: `unknown strategy: ...` | `strategy` is something other than `sequential` or `random` | Use one of the two valid values, or omit for the default |
| Same value every time in `sequential` mode | The chain is being reconstructed on each call (e.g. the action file is reloaded per RRPair), generating a new counter UUID each time | Confirm the chain instance is persistent across calls |
| Value contains an unwanted comma split | An option value literally contained a `,` | Move the comma-containing value into a variable and reference it as `${{var_name}}` |
| `${{var:foo}}` written through literally | The variable wasn't stored before this chain ran | Populate it with [`variable_store`](./variable_store.md) on an earlier RRPair, or check chain ordering |

## Related Transforms

- [`constant`](./constant.md) — write a fixed value (with `${{...}}` substitution) every call instead of cycling.
- [`rand_string`](./rand_string.md) — generate a random string from a regex pattern instead of picking from a fixed list.
- [`csv_iter`](./csv_iter.md) — iterate through rows of a CSV file when the option set is large or has multiple fields per entry.
- [`smart_replace`](./smart_replace.md) — propagate the picked value across every occurrence of the original in the RRPair.

## Advanced Notes

- The transform's per-instance counter is keyed on a UUID generated at construction time, so the counter survives across calls but is scoped to the specific chain instance. Re-creating the chain restarts the rotation.
- In `random` mode, selection uses Go's default `math/rand` source. It is not cryptographically secure; do not use it for secret rotation.
- `options` entries are resolved through `${{...}}` substitution on every call, not just at construction time, so the option set can change mid-run if it references mutable variables.
- `one_of` does not require recorded response data to run.
