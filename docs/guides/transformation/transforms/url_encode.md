---
description: "URL-encode a value with the url_encode transform in Speedscale — a one-way escape using Go's path-escape rules. Pair with url_decode to round-trip URL-escaped fields."
sidebar_position: 31
---

# url_encode

The `url_encode` transform URL-escapes a value using path-escape rules so reserved characters such as space, `/`, `?`, `&`, `=`, and `%` are percent-encoded. It is **one-way** — the second phase of the chain does not undo the encoding, so the field is left in its encoded form when it is written back to the RRPair.

URL encoding and decoding are deliberately split into two transforms ([`url_encode`](./url_encode.md) and [`url_decode`](./url_decode.md)) so a chain can decide exactly when to re-encode.

- **Transform type name (config/API):** `url_encode`
- **Shorthand format:** `url_encode()`

## Quick Start

Encode a field on the way out of the chain:

```json
"type": "url_encode"
```

No configuration parameters.

## How It Works

1. **First phase.** The extracted token is URL path-escaped and passed to the next transform.
2. **Second phase.** No-op. The encoded value flows through to the RRPair unchanged.

Because the second phase does not reverse the encoding, anything written back to the field stays encoded. The common pattern is `url_decode → (intermediate transforms) → url_encode`, where decoding happens first so the intermediate transforms see the plain value, and encoding happens last to re-wrap before re-insertion.

### Escape Rules

The transform escapes using path-escape semantics (Go `url.PathEscape`). Notably:

| Character | Encoded as |
|---|---|
| space | `%20` |
| `&` | `%26` |
| `?` | `%3F` |
| `=` | `%3D` (when not in the safe set) |
| `*` | `%2A` |
| `%` | `%25` |
| `@` | `%40` |
| `/` | `%2F` |
| `+` | `%2B` |

Note: path-escape is **stricter than query-escape**. Characters that are safe inside a path segment but reserved in a query string (such as `&`) are still escaped here. If you need query-string semantics specifically, escape the value manually or use a different transform.

## Configuration

No configuration parameters.

## Examples

### Example 1 — Encode a search term in a JSON body field

```
req_body() → json_path(path="user.searchTerm") → url_encode()
```

- `hello world & special chars` → `hello%20world%20%26%20special%20chars`

### Example 2 — Encode a header value

```
req_header(name="X-Custom-Data") → url_encode()
```

- `user@example.com?param=value` → `user%40example.com%3Fparam%3Dvalue`

### Example 3 — Round-trip: decode, transform, re-encode

```
req_body() → json_path(path="user.encodedData") → url_decode() → constant(value="foo") → url_encode()
```

The field is decoded so downstream transforms see the plain value, replaced with a constant, then re-encoded before being written back.

### Example 4 — Encode a constant injected mid-chain

```
req_query(name="filter") → constant(value="name=value with spaces") → url_encode()
```

- Output: `name%3Dvalue%20with%20spaces`

## Common Misconceptions

1. **"The chain auto-decodes on the way back."**
   No. `url_encode` is one-way. To round-trip, pair it with [`url_decode`](./url_decode.md) at the start of the chain.

2. **"It uses query-string escape rules."**
   No. It uses path-escape rules. Characters like `&` are escaped even though they are sometimes legal unescaped in query values.

3. **"It double-encodes if the input is already encoded."**
   Yes — `%` becomes `%25`, so `hello%20world` becomes `hello%2520world`. If your value may already be encoded, decode first with [`url_decode`](./url_decode.md).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Value is double-encoded | Input was already URL-encoded | Run [`url_decode`](./url_decode.md) first, then re-encode at the end |
| Expected characters are not escaped | Path-escape considers them safe in path context | Escape manually with [`replace`](./replace.md), or use a regex-based approach |
| Downstream transform sees encoded text instead of plain text | `url_encode` was placed at the start of the chain | Move it to the end; use [`url_decode`](./url_decode.md) at the start if decoding is needed |

## Related Transforms

- [`url_decode`](./url_decode.md) — the inverse first-phase transform. Pair with `url_encode` to round-trip.
- [`base64`](./base64.md) — two-phase decode/re-encode for base64-wrapped fields.
- [`replace`](./replace.md) — for ad-hoc character substitutions that path-escape rules do not cover.
