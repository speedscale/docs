---
description: "Use the scrub transform in Speedscale to replace a specific value with a masked substitute across the entire current RRPair body, improving responder signature match rates by blanking out rotating values."
sidebar_position: 20
---

# scrub

The `scrub` transform takes a value extracted by the chain and rewrites every occurrence of that value across the **current RRPair's JSON bodies** with a replacement string (default `*`). It is purpose-built for "blank this rotating value out everywhere it appears so the responder can match the request" workflows — request IDs, correlation IDs, dynamic tokens that change every call but should not affect signature matching.

It is **not** a scoped substitution. Even when the chain only extracts one field, `scrub` walks both the request and response bodies (depending on `selector`) and replaces every occurrence of the extracted value as a substring inside any JSON string value.

- **Transform type name (config/API):** `scrub`
- **Shorthand format:** `scrub(ignore=...,new=...)`

## Quick Start

Blank out a rotating request ID:

```json
"type": "scrub",
"config": {}
```

```
req_body() → json_path(path="requestId") → scrub()
```

This extracts `requestId` from the request body and replaces every occurrence of that value across the JSON body with `*`. Combine with [`smart_replace_recorded`](./smart_replace_recorded.md) when you also need the responder to **remember** the new value for downstream RRPairs (see Example 4 below).

## How It Works

`scrub` runs in two phases.

1. **First phase** — receive the extracted token (the "old value"), and register a deferred substitution against the current RRPair's request body, response body, or both (controlled by `selector`). The transform returns the configured `new` value so the rest of the chain sees the post-scrub form.
2. **Second phase** — no-op. The deferred substitution registered in the first phase runs after the chain completes and walks the JSON body, replacing every occurrence of the old value (as a substring) inside any non-ignored field's string value with `new`.

### Substring Replacement

The replacement is a substring scan within each JSON string value, not a whole-field equality check. If the extracted value is `SCRUB_ME`:

- `"name": "SCRUB_ME"` becomes `"name": "*"`.
- `"email": "myname@SCRUB_ME.com"` becomes `"email": "myname@*.com"`.
- `"FirstName": "FirstSCRUB_ME"` becomes `"FirstName": "First*"`.

This is what makes the transform useful for partial-match scrubbing — but it also means a short or common extracted value (e.g. `false`, `1`, `e`) will collide with unrelated text. Pick an extraction path whose value is unique enough to scrub safely.

### Scope: Current RRPair Only

`scrub` only touches the current RRPair's JSON body. It does **not**:

- Walk URL path segments, query strings, or HTTP headers.
- Cross over into other RRPairs in the replay session.
- Operate on non-JSON bodies.

If you need cross-RRPair propagation, use [`smart_replace`](./smart_replace.md) (live values) or [`smart_replace_recorded`](./smart_replace_recorded.md) (recorded → live mapping).

## Configuration

```json
"type": "scrub",
"config": {
    "ignorePaths": "<comma-separated key names>",
    "new": "<replacement string>",
    "selector": "<request|response|both>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `ignorePaths` | No | empty | Comma-separated list of JSON key names to skip. Matched against the **last key** in the path only — `"foo"` skips any field named `foo` at any depth. |
| `new` | No | `*` | The replacement string that overwrites occurrences of the extracted value. |
| `selector` | No | `request` | Which side of the RRPair the substitution targets. `request` (default), `response`, or `both`. |

### `ignorePaths` Matching

The match is a **last-segment exact string compare**, not a JSONPath. Given a body like `{"user": {"profile": {"name": "..."}}}`, `ignorePaths=name` skips the `name` field regardless of nesting depth. You do not need (and cannot use) the full dotted path — just the leaf key name.

### `selector` Behavior

| Value | Scope |
|---|---|
| `request` (default) | Only the request body of the current RRPair is scrubbed. |
| `response` | Only the response body of the current RRPair is scrubbed. |
| `both` | Both the request and response bodies are scrubbed. |

## Examples

### Example 1 — Blank out a request ID

```json
{
    "type": "scrub",
    "config": {}
}
```

```
req_body() → json_path(path="requestId") → scrub()
```

If the request body contains `{"requestId": "req_abc123", "data": {"correlationId": "req_abc123"}}`, both occurrences become `*`.

### Example 2 — Custom replacement and ignored fields

```json
{
    "type": "scrub",
    "config": {
        "ignorePaths": "userId,version",
        "new": "REDACTED"
    }
}
```

```
res_body() → scrub(selector=response, ignorePaths="userId,version", new="REDACTED")
```

Walks the response body and replaces the extracted value everywhere except in any `userId` or `version` field. Common when you want a scrubbed value for matching but still need a particular field (a stable user ID, an API version) preserved.

### Example 3 — Scrub both sides

```json
{
    "type": "scrub",
    "config": {
        "selector": "both",
        "new": "*"
    }
}
```

Useful when the same dynamic value appears in both the request and the response and you want symmetric scrubbing for matching.

### Example 4 — Pairing with smart_replace_recorded

```
smart_replace_recorded() → req_body() → json_path(path="requestId") → scrub()
```

`smart_replace_recorded` records the mapping `recorded_requestId → live_requestId` so the responder can rewrite the recorded value to the live one in subsequent RRPairs. `scrub` then blanks out the live `requestId` in the current request so the signature match isn't sensitive to the rotating value. This is the canonical "match-and-learn" pattern.

## Common Misconceptions

1. **"`scrub` only changes the extracted field."**
   No. It rewrites every substring occurrence of the extracted value across the chosen sides of the RRPair body.

2. **"`ignorePaths` accepts full JSONPaths."**
   No. Only the last key name is matched. `ignorePaths=metadata` ignores any field named `metadata` at any depth; `ignorePaths=data.metadata` matches no field at all.

3. **"`scrub` works on headers, URL, or non-JSON bodies."**
   No. The deferred substitution runs against the RRPair's JSON request/response bodies only. Headers and URL components are not touched.

4. **"`scrub` propagates to other RRPairs."**
   No. The substitution is scoped to the current RRPair. For cross-RRPair behavior, see [`smart_replace`](./smart_replace.md).

5. **"The match is a whole-field equality check."**
   No. It is a substring replacement. Be careful with extracted values that are short or appear inside larger strings unintentionally.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Body unchanged after the transform | The body wasn't valid JSON, or the extracted value never appears in the body | Confirm the body is JSON and the extracted value matches at least one substring |
| Unintended fields got scrubbed | Extracted value is short or common, hitting unrelated substrings | Choose a more unique extraction, or add the affected key to `ignorePaths` |
| Response body wasn't scrubbed | `selector` defaults to `request` | Set `selector=response` or `selector=both` |
| `ignorePaths` not honored | Used a dotted path instead of a leaf key | Use just the last key name (e.g. `metadata`, not `data.metadata`) |
| Wanted both scrub and downstream propagation | `scrub` is single-RRPair only | Combine with [`smart_replace_recorded`](./smart_replace_recorded.md) for cross-RRPair learning |

## Related Transforms

- [`scrub_date`](./scrub_date.md) — sibling transform that targets any date-shaped value in the body. Use when the goal is to neutralize timestamps, not a specific extracted value.
- [`smart_replace_recorded`](./smart_replace_recorded.md) — pair with `scrub` to remember the live value before blanking it out.
- [`smart_replace`](./smart_replace.md) — for cross-RRPair propagation of live values.
- [`dlp_field`](./dlp_field.md) — when the goal is policy-driven redaction (PII, secrets), not match-rate improvement.
- [`constant`](./constant.md), [`replace`](./replace.md) — for scoped substitution on a single field.

## Advanced Notes

- The substitution is registered as a finalizer on the current RRPair and runs after the chain completes, so transforms that follow `scrub` in the chain see the configured `new` value, not the original.
- The substring scan walks JSON string scalars only. Numeric, boolean, and `null` values are not rewritten unless the extracted value's bytes happen to appear in the serialized output of a string field.
- Errors decoding the body are swallowed silently — the transform may be running on a partial RRPair that only has one side, and the other side is allowed to be absent.
- `scrub` does not require the recorded response to be present in the action file.
