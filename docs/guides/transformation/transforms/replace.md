---
description: "Find and replace a literal substring in a token using the replace transform in Speedscale. Supports unlimited or count-limited replacement with simple string-to-string substitution."
sidebar_position: 19
---

# replace

The `replace` transform performs literal substring substitution on the extracted token: every occurrence of `old` is rewritten to `new`. By default it replaces every occurrence; setting `count` caps the number of replacements made per call.

It is a plain literal-to-literal substitution. No regex, no character classes, no `${{...}}` templating.

- **Transform type name (config/API):** `replace`
- **Shorthand format:** `replace(old=...,new=...,count=...)`

## Quick Start

```json
"type": "replace",
"config": {
    "old": "production",
    "new": "staging"
}
```

Every occurrence of `production` in the extracted token becomes `staging`.

## How It Works

All work happens in the first phase. The second phase is a no-op.

1. **First phase** — scan the token for occurrences of `old` and rewrite them to `new`. If `count` is unset (or `-1`), every occurrence is replaced; otherwise only the first `count` occurrences are.
2. **Second phase** — pass through unchanged.

`old` and `new` are matched and substituted as literal byte sequences. There is no regex, no character class, and no `${{...}}` resolution.

## Configuration

```json
"type": "replace",
"config": {
    "old": "<string>",
    "new": "<string>",
    "count": "<int>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `old` | **Yes** | — | The literal substring to find. Missing this fails chain initialization. |
| `new` | **Yes** | — | The literal substring to insert in place of `old`. Missing this fails chain initialization. |
| `count` | No | `-1` (unlimited) | Maximum number of replacements per call. Must parse as an integer; non-integer values fail chain initialization. |

## Examples

### Example 1 — Rewrite an environment value

```
req_body() → json_path(path="environment") → replace(old="production", new="staging")
```

- Before: `production`
- After: `staging`

### Example 2 — Substitute a hostname inside a header

```
http_req_header(header="Host") → replace(old="api.example.com", new="api-test.example.com")
```

- Before: `api.example.com`
- After: `api-test.example.com`

### Example 3 — Limit to the first occurrence

```
res_body() → json_path(path="database.connectionString") → replace(old="prod-db", new="test-db", count=1)
```

- Before: `host=prod-db port=5432 fallback=prod-db`
- After: `host=test-db port=5432 fallback=prod-db`

### Example 4 — Strip a fixed substring

Set `new` to the empty string:

```json
"type": "replace",
"config": {
    "old": "DEBUG: ",
    "new": ""
}
```

- Before: `DEBUG: user-1234 logged in`
- After: `user-1234 logged in`

## Common Misconceptions

1. **"`old` is a regex."**
   No. `old` is a literal substring. To match a pattern, use [`regex`](./regex.md).

2. **"`replace` supports `${{...}}` substitution like `constant`."**
   No. Neither `old` nor `new` is run through variable substitution. If you need a dynamic value, generate it upstream and use [`constant`](./constant.md), or use [`smart_replace`](./smart_replace.md) for cross-field propagation.

3. **"Setting `count=0` means unlimited replacements."**
   No. The "unlimited" sentinel is the default (or `-1`). `count=0` means zero replacements (effectively a no-op).

4. **"`replace` operates on the whole RRPair."**
   No. It operates only on the token its chain extracted. For cross-field, RRPair-wide substitution see [`smart_replace`](./smart_replace.md).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `missing required configuration: old` or `missing required configuration: new` | One of the two required fields is missing | Provide both |
| Chain init: `count value ... is not a valid integer` | `count` is a non-integer string | Use an integer (`"3"`) or omit for unlimited |
| Token unchanged | `old` does not appear in the extracted token (case mismatch, whitespace, encoding) | Verify the extractor output in Preview Mode; use [`regex`](./regex.md) for case-insensitive or pattern matching |
| Only some occurrences rewritten | `count` is set to a finite number | Remove `count` (or raise the value) for unlimited |
| Want to remove a substring entirely | `new` is missing, which fails init | Set `new` to the empty string `""` |

## Related Transforms

- [`constant`](./constant.md) — replace the entire token with a static (templated) value rather than substituting a substring.
- [`regex`](./regex.md) — pattern-based find and replace with capture groups.
- [`smart_replace`](./smart_replace.md) — record a mapping that propagates across every occurrence in the RRPair, not just inside one field.
- [`trim`](./trim.md) — remove a prefix or suffix specifically (one occurrence per end).
