---
description: "Decode percent-encoded values with the url_decode transform in Speedscale — a one-way unescape using Go's path-unescape rules. Pair with url_encode to round-trip URL-escaped fields."
sidebar_position: 30
---

# url_decode

The `url_decode` transform URL-unescapes a value, converting each `%AB` sequence back to the corresponding byte. It is **one-way** — the second phase does not re-encode, so the field is left in its decoded form when written back to the RRPair.

URL encoding and decoding are deliberately split into two transforms ([`url_decode`](./url_decode.md) and [`url_encode`](./url_encode.md)) so a chain can decide exactly when to re-encode.

- **Transform type name (config/API):** `url_decode`
- **Shorthand format:** `url_decode()`

## Quick Start

Decode an encoded field so downstream transforms see the plain value:

```json
"type": "url_decode"
```

No configuration parameters.

## How It Works

1. **First phase.** The extracted token is URL path-unescaped and passed to the next transform.
2. **Second phase.** No-op. The decoded value flows through to the RRPair unchanged.

To round-trip — decode, modify, re-encode — chain `url_decode` at the front and [`url_encode`](./url_encode.md) at the tail.

### Unescape Rules

The transform unescapes percent-encoded sequences (Go `url.PathUnescape`):

| Input | Decoded as |
|---|---|
| `%20` | space |
| `%26` | `&` |
| `%3F` | `?` |
| `%40` | `@` |
| `%25` | `%` |
| `%2F` | `/` |
| `+` | `+` (kept as-is — path-unescape does **not** convert `+` to space) |

Note: in query-string semantics, `+` decodes to a space. Path-unescape leaves `+` alone. If your value is from a query string and uses `+`-for-space, pre-process with [`replace`](./replace.md) or use a different decoder.

### Invalid Input Raises an Error

Unlike [`base64`](./base64.md) (which silently passes through invalid input), `url_decode` returns an error if the input contains malformed escape sequences — a `%` not followed by two hexadecimal digits, for example. The chain surfaces this as a runtime decode error.

## Configuration

No configuration parameters.

## Examples

### Example 1 — Decode a JSON body field

```
req_body() → json_path(path="user.encodedData") → url_decode()
```

- `hello%20world%20%26%20special%20chars` → `hello world & special chars`

### Example 2 — Decode then re-extract nested JSON

```
req_header(name="X-Encoded-Info") → url_decode() → json_path(path="email")
```

The header carries percent-encoded JSON; `url_decode` produces the raw JSON so `json_path` can read `email` from it.

### Example 3 — Round-trip: decode, transform, re-encode

```
req_body() → json_path(path="user.encodedData") → url_decode() → constant(value="foo") → url_encode()
```

Decode the value, replace with a constant, re-encode on the way out.

### Example 4 — Decode an email-like value

- `user%40example.com%3Fparam%3Dvalue` → `user@example.com?param=value`

## Common Misconceptions

1. **"The chain auto-encodes on the way back."**
   No. `url_decode` is one-way. Add [`url_encode`](./url_encode.md) at the end of the chain if you need the field re-encoded before insertion.

2. **"`+` decodes to space."**
   Path-unescape leaves `+` alone. Query-string `+`-for-space semantics are not applied. If your value uses `+`, normalize with [`replace`](./replace.md) first.

3. **"Invalid input is silently ignored."**
   No. A malformed escape (`%G1`, `%2`, etc.) returns an error. Compare with [`base64`](./base64.md), which silently passes through bad input.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Runtime decode error | Input contains a `%` not followed by two hex digits | Sanitize the upstream value, or check whether the field is actually encoded |
| `+` still present in output | Path-unescape does not convert `+` to space | Use [`replace`](./replace.md) to swap `+` for ` ` before or after `url_decode` |
| Value emitted decoded but downstream system expects encoded form | `url_encode` was not appended to the chain | Add [`url_encode`](./url_encode.md) at the tail |
| Double-decoded result | Field was decoded twice in the chain | Remove the extra `url_decode` step |

## Related Transforms

- [`url_encode`](./url_encode.md) — the inverse first-phase transform. Pair with `url_decode` to round-trip.
- [`base64`](./base64.md) — two-phase decode/re-encode for base64-wrapped fields.
- [`replace`](./replace.md) — for ad-hoc character fixes that path-unescape rules do not cover (e.g. `+`-for-space).
