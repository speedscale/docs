---
description: "Strip a prefix, suffix, or surrounding whitespace from a token using the trim transform in Speedscale — a literal-match operation backed by Go's strings.TrimPrefix, TrimSuffix, and TrimSpace."
sidebar_position: 29
---

# trim

The `trim` transform strips characters from one end (or both ends) of a token. It is a literal, single-pass operation — not a character-class match — and runs against whichever end (or both) the configured mode targets.

- **Transform type name (config/API):** `trim`
- **Shorthand format:** `trim(type=...,value=...)`

## Quick Start

Strip a fixed prefix:

```json
"type": "trim",
"config": {
    "type": "left",
    "value": "REQID_"
}
```

Strip surrounding whitespace:

```json
"type": "trim",
"config": {
    "type": "spaces"
}
```

## How It Works

`trim` does all of its work in the first phase. The second phase is a no-op — the trimmed value is passed through to whatever the next transform produces, and the chain does not re-attach the stripped portion.

| `type` | Behavior |
|---|---|
| `left` | If the token starts with `value`, remove that exact prefix once. Otherwise return the token unchanged. |
| `right` | If the token ends with `value`, remove that exact suffix once. Otherwise return the token unchanged. |
| `spaces` | Remove all leading and trailing Unicode whitespace characters. `value` is ignored. |

The trimmed output replaces the value in the chain. Because nothing puts the stripped portion back, **what gets trimmed off is lost** — there is no automatic round-trip to the original token. If you need the surrounding text preserved, use [`regex`](./regex.md) instead.

## Configuration

```json
"type": "trim",
"config": {
    "type": "<left|right|spaces>",
    "value": "<prefix or suffix>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `type` | No | `spaces` | Trim mode: `left` (prefix), `right` (suffix), or `spaces` (whitespace). An unrecognized value fails chain initialization. |
| `value` | No | `" "` (single space) | The literal string to strip. Ignored when `type=spaces`. |

## Examples

### Example 1 — Strip an ID prefix

```
req_body() → json_path(path="requestId") → trim(type=left, value="REQID_")
```

- `REQID_abc123` → `abc123`
- `abc123` → `abc123` (no prefix; unchanged)

### Example 2 — Strip a token suffix before re-issuing

```
http_req_header(header="X-Custom-Token") → trim(type=right, value="_TOKEN")
```

- `user_session_12345_TOKEN` → `user_session_12345`

### Example 3 — Normalise a message field's whitespace

```
res_body() → json_path(path="message") → trim(type=spaces)
```

- `"   Welcome to our API service   "` → `"Welcome to our API service"`

### Example 4 — Combine with `smart_replace`

```
smart_replace() → http_req_header(header="Authorization") → trim(type=left, value="Bearer ") → jwt_resign(...)
```

Strip `Bearer ` so `jwt_resign` receives the raw JWT. Use this only when `jwt_resign`'s own prefix handling isn't sufficient — `jwt_resign` strips and re-prepends `Bearer ` natively (see [jwt_resign](./jwt_resign.md)).

## Common Misconceptions

1. **"`value` is a character class."**
   No. `trim(type=left, value="abc")` strips the literal three-character prefix `abc`, not any of `a`, `b`, or `c`. Use [`regex`](./regex.md) for character-class trimming.

2. **"It strips repeated occurrences of the prefix/suffix."**
   No. The prefix or suffix is removed only once per run. `Bearer Bearer foo` with `value="Bearer "` becomes `Bearer foo`, not `foo`.

3. **"`spaces` strips ASCII spaces only."**
   It strips all Unicode whitespace characters — tabs, newlines, non-breaking space, etc.

4. **"The original prefix/suffix is restored downstream."**
   No. `Insert` is a no-op. Whatever the chain produces gets written back to the extracted field without the trimmed portion. If you need the surrounding text preserved, use [`regex`](./regex.md) with a capture group on the inner portion.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `unknown trim type ...` | `type` is set to something other than `left`, `right`, or `spaces` | Use one of the three valid values |
| Field unchanged after the transform | The prefix/suffix didn't match exactly | Check for extra whitespace, case mismatch, or a different surrounding character |
| Only one occurrence stripped from a repeated prefix | This is the documented behavior | Add another `trim` in the chain, or switch to [`regex`](./regex.md) |
| `Bearer ` prefix appears in re-signed token | `jwt_resign` already handles `Bearer `; a manual `trim` may be unnecessary | Remove the `trim` and let `jwt_resign`'s `prefixes` config handle it |

## Related Transforms

- [`regex`](./regex.md) — for character-class or pattern-based stripping, or when the surrounding context must be re-inserted.
- [`replace`](./replace.md) — for general literal-to-literal substitution rather than edge stripping.
- [`jwt_resign`](./jwt_resign.md) — already handles `Bearer ` / `JWTBearer ` prefixes internally.
