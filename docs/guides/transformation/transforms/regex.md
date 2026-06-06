---
description: "Extract a regex match (or capture group) from a token using the regex transform in Speedscale, then re-insert the downstream transform's output back into the original string at the matched position."
sidebar_position: 18
---

# regex

The `regex` transform extracts a regular-expression match from a token and acts as a window onto that sub-string for the rest of the transform chain. Downstream transforms see only the match; when they're done, `regex` re-inserts the result back into the original token in place of every identical occurrence of the original match.

- **Transform type name (config/API):** `regex`
- **Shorthand format:** `regex(pattern=...,captureGroup=...)`
- **Engine:** RE2 syntax — no lookbehind, no backreferences. Validate at [regex101.com](https://regex101.com) with the **Golang** flavor.

## Quick Start

Extract a date from a longer string and let the rest of the chain rewrite it:

```json
"type": "regex",
"config": {
    "pattern": "\\d{4}-\\d{2}-\\d{2}"
}
```

For a single capture group:

```json
"type": "regex",
"config": {
    "pattern": "Bearer ([A-Za-z0-9._-]+)",
    "captureGroup": "1"
}
```

## How It Works

The transform runs in two phases as a bookend around the rest of the chain.

1. **First phase** — run the pattern against the token, return the match (or specified capture group) as the value passed to the next transform. Internally remember the surrounding context by holding the original token with a placeholder marker in place of the matched portion.
2. **Second phase** — take whatever value downstream transforms produced and write it into the placeholder's position in the remembered original. The result is the original token with the match replaced.

```
input:  "filter=... ReceivedDateTime ge 2021-04-19"
        └─ 1st phase: match = "2021-04-19", remembered = "filter=... ReceivedDateTime ge <placeholder>"
        └─ downstream transforms see and modify "2021-04-19"
        └─ 2nd phase: <placeholder> is overwritten with the downstream output
output: "filter=... ReceivedDateTime ge <new-value>"
```

### Capture Groups

| `captureGroup` | Meaning |
|---|---|
| Unset / `0` | Use the full match (group 0). Default. |
| `1`, `2`, ... | Use the Nth parenthesised group. Groups are 1-indexed; group 0 is the full match. |

If the pattern matches but the specified capture group's index is out of range, the transform returns the token **unchanged** silently (no error).

### Multiple-Occurrence Behavior

The first phase extracts only the **first** match in the token. The second phase, however, replaces **every** byte-identical occurrence of that original match with the downstream value — so if the same substring appears multiple times, all instances are rewritten, not just the first.

This is useful for "rewrite all occurrences of the matched value" but is a footgun when matches vary:

| Input | Pattern | Behavior |
|---|---|---|
| `date1: 2021-04-19 date2: 2021-04-19` | `\d{4}-\d{2}-\d{2}` | Both replaced (same matched substring). |
| `date1: 2021-04-19 date2: 2022-05-20` | `\d{4}-\d{2}-\d{2}` | Only `2021-04-19` is extracted, downstream sees `2021-04-19`, only that substring is replaced; `2022-05-20` is left alone. |

If you need to rewrite multiple distinct matches independently, combine `regex` with [`smart_replace`](./smart_replace.md) or build separate chains.

## Configuration

```json
"type": "regex",
"config": {
    "pattern": "<go regex>",
    "captureGroup": "<int>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `pattern` | **Yes** | — | Go RE2-syntax regular expression. Patterns are compiled once at chain construction; invalid patterns fail chain initialization. |
| `captureGroup` | No | `0` (full match) | 1-indexed capture group number. `0` or unset means use the entire match. |

## Examples

### Example 1 — Extract and rewrite a date

```
req_body() → json_path(path="filter") → regex(pattern="\\d{4}-\\d{2}-\\d{2}") → date(layout=2006-01-02, precision=24h)
```

- Input field: `filter=... ReceivedDateTime ge 2021-04-19`
- `regex` extracts `2021-04-19`.
- `date` shifts it relative to replay time and returns the new date.
- `regex` re-inserts: `filter=... ReceivedDateTime ge <new-date>`.

### Example 2 — Capture the Chrome version from User-Agent

```
http_req_header(header="User-Agent") → regex(pattern="Chrome/([0-9.]+)", captureGroup=1) → constant(value="120.0.0.0")
```

- Input: `Mozilla/5.0 (...) Chrome/91.0.4472.124 Safari/537.36`
- Group 1 is `91.0.4472.124`.
- Downstream replaces with `120.0.0.0`.
- Re-insert: `Mozilla/5.0 (...) Chrome/120.0.0.0 Safari/537.36`.

### Example 3 — Pull a location name out of a URL path

```
res_body() → json_path(path="url") → regex(pattern="location/(.*)/info", captureGroup=1)
```

- Input field: `/location/Miami/info`.
- Group 1 is `Miami`.
- Without a downstream transform, the chain's effect is to **replace `Miami` with `Miami`** — a no-op in terms of bytes. Add a transform (`smart_replace`, `constant`, `rand_string`) to make the chain do work.

### Example 4 — Extract a token for `smart_replace`

```
smart_replace() → http_req_header(header="X-Request-ID") → regex(pattern="req_([0-9]+)", captureGroup=1) → rand_string(pattern="[0-9]{8}")
```

- `regex` exposes the numeric portion to `rand_string`.
- `rand_string` produces an 8-digit replacement.
- `regex` re-inserts the new digits in place of the captured group: `req_98765` → `req_45821736`.
- `smart_replace` registers the mapping so the same `X-Request-ID` value in other places is rewritten consistently. See [smart_replace](./smart_replace.md) for propagation details.

## Common Misconceptions

1. **"It uses PCRE / supports lookbehind."**
   No. Go's `regexp` is RE2-based. No backreferences, no lookahead/lookbehind, no atomic groups.

2. **"Capture groups are 0-indexed."**
   No. `captureGroup=1` is the first parenthesised group. Group 0 (the full match) is the default when `captureGroup` is unset.

3. **"It rewrites every match in the string."**
   It extracts only the first match, but re-inserts by replacing every byte-identical occurrence of that match with the downstream value. Distinct matches are not touched. See [Multiple-Occurrence Behavior](#multiple-occurrence-behavior).

4. **"A non-matching pattern fails the chain."**
   No. If the pattern doesn't match (or the capture-group index is out of range), the transform returns the token unchanged and the chain proceeds with the original value.

5. **"Patterns are escaped like in JavaScript."**
   In JSON config, `\` must be escaped as `\\`. `\d{4}-\d{2}-\d{2}` becomes `"\\d{4}-\\d{2}-\\d{2}"` in the JSON file.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain initialization error: `invalid regex` | Pattern uses an RE2-unsupported construct or has a syntax error | Validate at regex101.com with the Golang flavor; replace unsupported features |
| Chain initialization error: `missing pattern` | `pattern` is not set in the config | Add `"pattern": "..."` |
| Downstream transform receives an empty token | Pattern matched but the chosen capture group is empty | Check `captureGroup` index and the pattern's parenthesisation |
| Field passes through unchanged | Pattern didn't match, or capture-group index is out of range | Test the pattern against representative input; use `0` (default) for the full match |
| Both occurrences of a value get replaced when only one was intended | Insert replaces every byte-identical occurrence of the original match | Tighten the pattern to be more specific, or split into multiple chains |
| Pattern works on regex101 but fails here | regex101 default flavor is PCRE, which Go does not support | Switch the flavor selector to Golang |

## Related Transforms

- [`replace`](./replace.md) — straight string-to-string replacement when no pattern matching is needed.
- [`smart_replace`](./smart_replace.md) — used together with `regex` to propagate the rewritten value across the rest of the RRPair.
- [`split`](./split.md) — when the value is delimited rather than pattern-bounded, splitting is cheaper and clearer than a regex.
- [`trim`](./trim.md) — when you only need to strip a known prefix or suffix.

## Advanced Notes

- The pattern is compiled once when the chain is constructed; per-token execution does no recompilation work.
- The placeholder marker is unique per transform instance, so multiple `regex` transforms processing the same RRPair concurrently do not collide with each other.
- `regex` chains do not require the recorded response to be present, so they work on either request or response traffic without an action file.
