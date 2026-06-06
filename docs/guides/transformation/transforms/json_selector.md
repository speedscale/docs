---
description: "Find a JSON value by key (and optional value) anywhere in a document with the json_selector transform in Speedscale — useful when the exact path varies across requests."
sidebar_position: 14
---

# json_selector

The `json_selector` transform finds a value in a JSON document by **what it is** rather than by a fixed path. It supports recursive searches, optional value matching, and "extract N levels above the match" so a chain can target the *containing* object instead of the matched scalar.

Use it when the JSON path may differ between requests (e.g. randomly-keyed objects, ordering you can't rely on, optional nesting). For static paths, [`json_path`](./json_path.md) is faster and clearer.

- **Transform type name (config/API):** `json_selector`
- **Shorthand format:** `json_selector(match=...,recursive=...,levelsUp=...)`

## Quick Start

Find the first occurrence of a `nick_name` field anywhere in the document and replace it:

```json
"type": "json_selector",
"config": {
    "match": "nick_name",
    "recursive": "true"
}
```

Find the object that contains a specific zip code and extract the whole containing object:

```json
"type": "json_selector",
"config": {
    "match": "address.zip=30303",
    "recursive": "true",
    "levelsUp": "2"
}
```

## How It Works

The transform runs in two phases as a bookend around the rest of the chain.

1. **First phase** — parse the JSON document, recursively (or non-recursively) walk it looking for a match described by `match`, optionally walk `levelsUp` levels up from the match, and return that sub-document as the value the downstream chain sees. The original document bytes are remembered for re-insertion.
2. **Second phase** — find the same match in the remembered original, then write whatever the downstream chain produced into that location. Raw JSON values (objects, arrays) are written as JSON; everything else is written as a JSON string.

```
input:  {"top": {"foo": "bar"}}
        └─ 1st phase, match="foo=bar", recursive=true: extracted = "bar"
        └─ downstream produces "baz"
        └─ 2nd phase: writes "baz" back into the same matched location
output: {"top": {"foo": "baz"}}
```

### `match` Syntax

The `match` value is either a key path or a key path plus an expected value:

| Form | Meaning |
|---|---|
| `key` | Match by existence — return the value at `key` wherever it's found. |
| `key=value` | Match only when `key` exists *and* its value equals `value` (string comparison). |
| `key==value` | Same as `key=value`. The double-equals form is normalized to single-equals at chain construction time, so users coming from query DSLs can use either. |

`key` is a dotted path into a JSON object. With `recursive=true`, the path doesn't need to start at the document root — it just needs to *exist* somewhere in the document.

### Recursion

| `recursive` | Behavior |
|---|---|
| `false` (default) | Match the path relative to the document root only. |
| `true` | Walk every object and array recursively looking for the match. The first match wins. |

Recursion is depth-first. When multiple matches exist, only the first one encountered is used — `json_selector` does not iterate. Build separate chains for each match if you need to.

### `levelsUp`

After finding the matched value's path, walk `levelsUp` levels up the path and extract whatever sub-document lives there. This lets you say "find the address with this zip — give me the whole *person* object."

```
matched path:   people.a59dFc1.address.zip
levelsUp=0:     extract  30303              (the zip itself)
levelsUp=1:     extract  {"street":..., "zip":30303, ...}
levelsUp=2:     extract  {"id":7592, "first_name":..., "address":{...}}
```

`levelsUp=0` (or unset) is the common case. Use higher values to target the *containing* object so a downstream transform can rewrite it whole.

### Re-Insertion of JSON vs. Scalar Values

The downstream chain's output is checked when re-inserting:

- If it looks like a JSON object or array (starts with `{`/`[` and ends with `}`/`]`), it is written raw, preserving nested structure.
- Otherwise it is written as a JSON string — even for tokens that look like numbers or booleans.

This is a known quirk. If a downstream `constant` produces `333` for a numeric field matched by `json_selector`, the field becomes the *string* `"333"` rather than the number `333`. Use [`json_path`](./json_path.md) for type-preserving writes on numeric/boolean fields.

### Missing Matches

If the first phase finds no match, the downstream chain still runs but sees an empty token. The second phase then returns the original document with a "no match found" error and the document is unchanged. The chain does not halt; subsequent transforms in the chain continue to process the empty token.

## Configuration

```json
"type": "json_selector",
"config": {
    "match": "<key or key=value>",
    "recursive": "<boolean>",
    "levelsUp": "<integer>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `match` | **Yes** | — | Key or `key=value` to find. Empty config or missing `match` fails chain initialization. |
| `recursive` | No | `false` | Walk the entire document, not just the root. |
| `levelsUp` | No | `0` | After finding the match, ascend this many levels and use the sub-document there. |

`match` supports `${{...}}` variable substitution, resolved at runtime against the variable cache. This is useful when the value to find is captured from earlier traffic.

## Examples

### Example 1 — Key existence with `levelsUp`

Find the person object that has a `nick_name`:

```json
"type": "json_selector",
"config": {
    "match": "nick_name",
    "recursive": "true",
    "levelsUp": "1"
}
```

**Input:**

```
{
    "people": {
        "2ba4Cd4": {
            "first_name": "john",
            "last_name": "smith",
            "nick_name": "johnny"
        },
        "a59dFc1": {
            "id": 7592,
            "first_name": "steve",
            "last_name": "mould"
        }
    }
}
```

**Extracted (passed to the next transform):**

```
{
    "first_name": "john",
    "last_name": "smith",
    "nick_name": "johnny"
}
```

### Example 2 — Key/value match with `levelsUp`

Find the person who lives at zip `30303` and extract their full record:

```json
"type": "json_selector",
"config": {
    "match": "address.zip=30303",
    "recursive": "true",
    "levelsUp": "2"
}
```

**Input:**

```
{
    "people": {
        "2ba4Cd4": {
            "first_name": "john",
            "address": {"zip": 90210}
        },
        "a59dFc1": {
            "id": 7592,
            "first_name": "steve",
            "address": {"zip": 30303}
        }
    }
}
```

**Extracted:**

```
{
    "id": 7592,
    "first_name": "steve",
    "address": {"zip": 30303}
}
```

### Example 3 — Recursive value rewrite

```
req_body() → json_selector(match="foo=bar", recursive=true) → constant(value="baz")
```

- Input: `{"top": {"foo": "bar"}}`
- Output: `{"top": {"foo": "baz"}}`

The first match anywhere in the document is rewritten.

### Example 4 — Non-recursive fails for nested keys

```
req_body() → json_selector(match="foo=bar", recursive=false) → constant(value="baz")
```

- Input: `{"top": {"foo": "bar"}}`
- Output: `{"top": {"foo": "bar"}}` — no change because `foo` isn't at the root.

### Example 5 — Number field becomes a string

```
req_body() → json_selector(match="id=222", recursive=true) → constant(value="333")
```

- Input: `{"products": [{"id": 111}, {"id": 222}]}`
- Output: `{"products": [{"id": 111}, {"id": "333"}]}` — note `"333"` is now a string. See [Re-Insertion of JSON vs. Scalar Values](#re-insertion-of-json-vs-scalar-values).

## Common Misconceptions

1. **"It iterates over every match."**
   No. Only the first match (depth-first) is used. Build separate chains if you need to act on multiple.

2. **"`levelsUp` extracts only — re-insertion happens at the original match."**
   No. Re-insertion happens at the same level the extraction did. If you extracted the parent object, the downstream chain's output replaces that whole parent.

3. **"Numeric and boolean writes preserve JSON type."**
   They don't — `json_selector` writes JSON-shaped tokens (`{...}`/`[...]`) raw and everything else as a string. For type-preserving scalar writes, use [`json_path`](./json_path.md).

4. **"`recursive=true` returns every match."**
   It only changes *where* it looks, not how many it returns. Still first-match-wins.

5. **"`match=foo` matches any key named `foo`."**
   Only when `recursive=true`. With `recursive=false`, `foo` must be a top-level key.

6. **"No match means the chain fails."**
   The first phase returns an empty token; the second phase returns the document unchanged with a non-fatal error. The chain continues; the document is just not modified.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `JSON selector config not found` | Empty config map | Provide `match` |
| Chain init: `config value "match" not found` | `match` not set | Add `"match": "..."` |
| Field unchanged, "no match found" error | Path doesn't exist, or the value doesn't equal the expected value, or `recursive=false` and the path isn't at the root | Set `recursive=true`, or fix the path/value |
| Wrong sub-object extracted | `levelsUp` value too small or too large | Walk the document mentally to count levels from the matched key |
| Numeric field becomes a string after replacement | Re-insertion writes non-JSON tokens as strings | Use [`json_path`](./json_path.md) for typed numeric/boolean fields |
| Downstream `smart_replace` does not propagate | Match found a unique value but the propagation key landed before the value was finalized | Confirm `smart_replace` is first in the chain; see [smart_replace](./smart_replace.md) |

## Related Transforms

- [`json_path`](./json_path.md) — fixed-path extraction with proper JSON type preservation on re-insertion. Prefer it when the path is stable.
- [`xml_path`](./xml_path.md) — XPath equivalent for XML documents.
- [`smart_replace`](./smart_replace.md) — pair with `json_selector` to propagate a found value across the entire RRPair.
- [`regex`](./regex.md) — when the JSON is opaque (e.g. embedded as a string in a non-JSON envelope), reach for `regex` first.

## Advanced Notes

- The transform does not require recorded response data.
- The first phase copies the original document bytes, so downstream mutations do not disturb re-insertion.
- For documents with many candidate matches, prefer `json_path` with a precise path — recursion walks every node and is more expensive.
- Only one match path may be acted on per chain by design. If you need to rewrite every match, run a separate chain for each, or extract the containing collection with `json_path` and walk it with a wildcard.
