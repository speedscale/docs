---
description: "Learn how the smart_replace transform in Speedscale builds value mappings during traffic replay and applies them across the entire RRPair, so a single replacement consistently propagates everywhere the original value appears."
sidebar_position: 23
---

# smart_replace

The `smart_replace` transform builds a key→value mapping during one transform chain and applies that mapping across the **entire RRPair** after all chains finish. It is the mechanism behind session ID propagation, user ID re-write, JWT swap-through, and most other "I changed it here, it needs to follow everywhere" workflows.

It does **not** modify only the field its chain extracts. Once a mapping is learned, every occurrence of the original value anywhere in the request or response — headers, body, URL, signature fields — is rewritten.

- **Transform type name (config/API):** `smart_replace`
- **Aliases:** `train` is accepted as a synonym for backwards compatibility.
- **Shorthand format:** `smart_replace(overwrite=...)`

## Quick Start

```json
"type": "smart_replace",
"config": {
    "overwrite": "false"
}
```

Place `smart_replace` at the **start** of the transform chain. The transforms after it produce the new value that gets paired with the original. See [How It Works](#how-it-works).

## How It Works

`smart_replace` runs in two phases as a bookend around the rest of the chain.

1. **First phase** (before downstream transforms run) — capture the original token as the **key**. The token is returned unchanged so subsequent transforms in the chain see the original value.
2. **Second phase** (after downstream transforms run) — read whatever value the chain's tail produced and register `key → newValue` in the replay session's substitution table.

After every transform chain on the RRPair completes, the substitution table is applied across the entire RRPair: every registered key is rewritten to its replacement value wherever it appears.

```
            ┌────────────── chain runs here ──────────────┐
extract ──► smart_replace (1st) ──► (other transforms) ──► smart_replace (2nd)
            (records original)                              (registers mapping)

after every chain completes:
    every registered key is rewritten to its mapped value, everywhere it appears in the RRPair
```

### Cross-Field Propagation

The substitution scans the whole RRPair. A mapping learned from a response body's `sessionId` field rewrites:

- The same value in other JSON fields.
- The same value in HTTP headers.
- The same value in URL path segments and query strings.
- The same value in subsequent RRPairs replayed in the same session.

This is the property that makes `smart_replace` distinct from `replace` or `constant` — it is not a scoped substitution.

### JSON-String Unwrapping

Before storing or matching, both the key and the new value are unwrapped if they are JSON string scalars. A response body of `"<JWT>"` (a JSON-quoted string) is stored as `<JWT>` so it matches the unquoted form found in headers like `Authorization: Bearer <JWT>`.

Without this, a smart-replaced JWT returned from `/api/auth/user` would never substitute into downstream `Authorization` headers.

## Configuration

```json
"type": "smart_replace",
"config": {
    "overwrite": "<boolean>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `overwrite` | No | `false` | Whether a second sighting of the same key updates the stored value. |

### `overwrite` Behavior

| Setting | First sighting | Subsequent sightings of the same key |
|---|---|---|
| `false` (default) | Stores `key → newValue1`. | Returns the **previously stored** replacement — i.e. data still gets transformed, just back to the first-learned value. Mapping is not updated. |
| `true` | Stores `key → newValue1`. | Stores `key → newValueN`; future RRPair-wide substitutions use the newest mapping. |

Use `overwrite=true` when you need to rotate values (e.g. each iteration through a `csv_iter` chain should produce a fresh mapping). Use the default for stable user/session/JWT propagation.

## Operating Patterns

### Pattern 1: User ID rewriting

```
smart_replace() → res_body() → json_path(path="userId") → rand_string(pattern="user_[0-9]{6}")
```

The first time a `userId` is seen in a response body, a random replacement is generated. Every occurrence of that user ID anywhere in the RRPair — and in later RRPairs that share the variable cache — is rewritten to the same generated value.

### Pattern 2: Session ID swap to a constant

```
smart_replace() → res_body() → json_path(path="sessionId") → constant(value="test_session_123")
```

The first session ID seen in any response is mapped to `test_session_123`. All subsequent requests that carry that session ID — in cookies, headers, body fields — get rewritten on the way out.

### Pattern 3: Rotating values with `overwrite=true`

```
smart_replace(overwrite=true) → req_body() → json_path(path="iterationId") → csv_iter(...)
```

Each request in the replay pulls a fresh value from the CSV. Because `overwrite=true`, the mapping for `iterationId` updates each time, so the RRPair-wide substitution always uses the current iteration's value.

## When To Reach For It

- The value appears in more than one location and must stay consistent across them.
- The downstream service echoes a value back that needs to feed into later requests.
- A response carries an authentication artifact (JWT, session cookie) that must propagate into the next request's headers.

If the value only appears in one place and you have no need for cross-field propagation, prefer [`constant`](./constant.md), [`replace`](./replace.md), or [`rand_string`](./rand_string.md) directly — they are cheaper and easier to reason about.

## Related Transforms

- [`smart_replace_recorded`](./smart_replace_recorded.md) — same propagation mechanic, but the **key** is the value from the **recorded** RRPair and the **new value** is the live one. Use when you need to map recorded → actual without an in-chain generator.
- [`smart_replace_csv`](./smart_replace_csv.md) — bulk-load `key → value` pairs from a CSV without running a chain per pair.
- [`constant`](./constant.md), [`replace`](./replace.md), [`rand_string`](./rand_string.md) — for scoped, single-field substitution without propagation.

## Common Misconceptions

1. **"It only changes the field its chain targets."**
   No. The chain registers a mapping; the mapping is applied to every occurrence of the original value across the entire RRPair after all chains run.

2. **"`overwrite=false` means subsequent sightings are left alone."**
   No. The token is still rewritten on subsequent sightings — it just gets rewritten to the **first-learned** replacement, not the latest one.

3. **"Putting `smart_replace` at the end of the chain works the same as at the start."**
   It needs to be at the start. The first phase runs in chain order to capture the original value; the second phase runs in reverse to register the final value. Moving the transform's position changes which value is treated as the key.

4. **"It works without anything downstream."**
   A bare `smart_replace` chain captures the original as the key and registers `original → original` — a no-op. You need a downstream transform (`rand_string`, `constant`, `csv_iter`, etc.) to produce the new value.

5. **"Mapping is per-RRPair."**
   Mappings live on the variable cache for the duration of the replay/responder session, so a JWT learned in one response can substitute into headers many RRPairs later.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| The value stays the same after replay | `smart_replace` is the only transform in the chain, or the downstream transform returned the original | Add a transform that produces a different value (e.g. `rand_string`, `constant`) |
| Mapping locks to the wrong replacement on retry | `overwrite=false` and an earlier (bad) value was learned first | Set `overwrite=true`, or clear/restart the replay session |
| Replacement appears in the targeted field but not in other places | The downstream RRPair was already processed before the mapping was registered | Make sure the chain that registers the mapping runs on an earlier RRPair than the one that needs the substitution |
| Quoted JSON value (e.g. `"<jwt>"`) won't substitute into header | This is the case the JSON-string unwrap handles automatically — if it still fails, the value in the header has extra whitespace or prefix not present in the body | Check for `Bearer ` or other prefixes; use [`jwt_resign`](./jwt_resign.md) or [`trim`](./trim.md) as appropriate |
| Mapping not applied at all | Chain is on the responder request side and the mapping was registered after the responder already matched the request | Move the registering chain to an earlier step (request-side responder transforms see the keyed value before signature matching) |

## Advanced Notes

- Mappings persist for the duration of the replay or mock-server session, so a value captured early can be substituted into RRPairs processed much later in the run.
- The original token bytes are copied at capture time, so subsequent transforms in the chain can mutate the value without disturbing the recorded key.
- Concurrent processing of multiple RRPairs through the same chain does not share captured state — each in-flight evaluation maintains its own original value while the registered mappings remain shared across the session.
- `smart_replace` does not require the recorded response to be present in the action file. The sibling `smart_replace_recorded` does.
- The `train` alias is accepted for legacy configurations. Prefer `smart_replace` in new chains.
