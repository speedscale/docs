---
description: "Extract a JSON value by path with the json_path transform in Speedscale, let downstream transforms rewrite it, then re-insert the new value at the same location with type preservation."
sidebar_position: 13
---

# json_path

The `json_path` transform extracts a value from a JSON document using a JSONPath expression and acts as a window onto that value for the rest of the chain. Downstream transforms see only the extracted scalar; when they're done, `json_path` writes the new value back into the same location of the original document, preserving JSON types where possible.

It is the most common entry point for transforms that operate on JSON bodies — almost every chain that touches a JSON field starts with `req_body()` or `res_body()` followed by `json_path`.

- **Transform type name (config/API):** `json_path`
- **Shorthand format:** `json_path(path=...)`
- **Path syntax:** [gjson path syntax](https://github.com/tidwall/gjson#path-syntax). Not all features of every JSONPath spec are supported — when in doubt, test against the gjson playground.

## Quick Start

Extract a simple field:

```json
"type": "json_path",
"config": {
    "path": "client_secret"
}
```

Extract a nested field, then replace it with a random value:

```
req_body() → json_path(path="user.id") → rand_string(pattern="[0-9]{8}")
```

The chain extracts `user.id`, hands the value to `rand_string`, then writes the new digits back into `user.id` in the original body.

## How It Works

The transform runs in two phases as a bookend around the rest of the chain.

1. **First phase** — parse the JSON document, look up the configured `path`, and return the value at that path as a plain scalar so downstream transforms see just the inner value. The original document bytes are remembered for re-insertion.
2. **Second phase** — take whatever the downstream chain produced, coerce it to a JSON-compatible type matching the original value's type (see [Type Preservation](#type-preservation)), and write it back into the original document at the same path.

```
input:  {"foo": {"bar": "baz"}}
        └─ 1st phase, path="foo.bar": extracted = "baz", remembered = full body
        └─ downstream transforms see "baz" and produce, say, "bam"
        └─ 2nd phase: writes "bam" back into foo.bar
output: {"foo": {"bar": "bam"}}
```

### Path Syntax

Paths follow gjson's syntax. The most common forms:

| Form | Example | Meaning |
|---|---|---|
| Dot path | `foo.bar` | Nested object access. |
| Array index | `product.0` | Element 0 of an array. |
| Wildcard (root array) | `#.travelers.#.name` | Iterate every entry of a top-level array. See [Root-Array Wildcards](#root-array-wildcards). |

For advanced features (filters, queries, modifiers), consult the [gjson path syntax docs](https://github.com/tidwall/gjson#path-syntax). Not every feature there round-trips cleanly through re-insertion — stick to dot/index paths and root-array wildcards for production chains.

### Type Preservation

Re-insertion tries to keep the JSON type of the original value. The downstream chain produces text bytes; the transform coerces those bytes back to the original JSON type:

| Original type | Coercion of the new value |
|---|---|
| String | Used as-is (written as a JSON string). |
| Number | Parsed as float. If parsing fails, the field is written as `0` rather than changing the field's JSON type. |
| Boolean | Parsed as bool. If parsing fails, the value is dropped. |
| Null | The new value is guessed: bool first, then int, then float, then string. |
| JSON object/array | Written raw. |

The fallback to `0` for unparseable numbers is intentional — it keeps the document's shape valid even if a downstream chain emitted nonsense for a numeric field.

### Root-Array Wildcards

`gjson` and `sjson` disagree on how to write back into a root-level JSON array using the leading `#` wildcard. `json_path` expands a path like `#.travelers.#.name` against a root-level array by writing the downstream value into every concrete index. Without this expansion the body would be corrupted.

```
input:  [{"travelers":[{"name":"a"},{"name":"b"}]},{"travelers":[{"name":"c"}]}]
path:   #.travelers.#.name
new:    "*"
output: [{"travelers":[{"name":"*"},{"name":"*"}]},{"travelers":[{"name":"*"}]}]
```

This applies only when the top-level document is a JSON array. For object-rooted documents, use a concrete path.

### Missing Paths

What happens when the path doesn't exist depends on `create`:

| `create` | Path missing — first phase | Path missing — second phase |
|---|---|---|
| `true` (default) | Returns an empty token so downstream transforms don't see `nil`. | Treats the downstream output as the new value and inserts it at the path, creating the necessary structure. |
| `false` | Returns the original token with a "path value not found" error; the chain stops working on this token. | Returns the original document unchanged. |

Use `create=false` when you want to *only* operate on documents that already have the field — useful when the same chain runs on heterogeneous traffic.

## Configuration

```json
"type": "json_path",
"config": {
    "path": "<gjson path>",
    "create": "<boolean>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `path` | **Yes** | — | The gjson path to the value. Missing config fails chain initialization. |
| `create` | No | `true` | If the path is missing, create it at insert time. Set to `false` to skip transformation when the field is not present. |

`path` supports `${{...}}` variable substitution, resolved at runtime against the variable cache. This lets one chain target a dynamically chosen field.

## Examples

### Example 1 — Simple find/replace

```
req_body() → json_path(path="client_secret") → constant(value="redacted")
```

- Input: `{"client_id":"...","client_secret":"<long>"}`
- Output: `{"client_id":"...","client_secret":"redacted"}`

### Example 2 — Numeric field type preservation

```
req_body() → json_path(path="user.age") → constant(value="30")
```

- Input: `{"user":{"age":22}}`
- Output: `{"user":{"age":30}}` — written as a JSON number, not the string `"30"`.

### Example 3 — Create a missing field

```
req_body() → json_path(path="foo.bar") → constant(value="bam")
```

- Input: `{}`
- Output: `{"foo":{"bar":"bam"}}` — `create=true` (the default) builds the nesting.

### Example 4 — Top-level array wildcard

```
req_body() → json_path(path="#.travelers.#.name") → constant(value="*")
```

- Input: `[{"travelers":[{"name":"a"},{"name":"b"}]},{"travelers":[{"name":"c"}]}]`
- Output: `[{"travelers":[{"name":"*"},{"name":"*"}]},{"travelers":[{"name":"*"}]}]`

### Example 5 — JSON-inside-JSON (nested json_path chains)

Some payloads embed a JSON string as the value of an outer JSON field. Stack two `json_path` transforms to drill through:

```
req_body()
  → json_path(path="operations.0.eventDefinition.payload")   # extract the inner JSON string
  → json_path(path="additionInfo.SLAEventID")                # extract a field from it
  → constant(value="*")
```

- Input:
  ```
  {"operations":[{"eventDefinition":{"payload":"{\"additionInfo\":{\"SLAEventID\":\"goal:c7d...\"}}"}}]}
  ```
- Output:
  ```
  {"operations":[{"eventDefinition":{"payload":"{\"additionInfo\":{\"SLAEventID\":\"*\"}}"}}]}
  ```

The inner `json_path` operates on the string yielded by the outer one; both re-insert in reverse order on the way back up.

## Common Misconceptions

1. **"`json_path` only extracts."**
   It also re-inserts. The chain's tail produces a new value, and `json_path` writes it back at the same path on the way out.

2. **"It writes everything as a string."**
   No. The original JSON type is preserved on re-insertion when possible — number stays number, bool stays bool, null is guessed.

3. **"It supports full JSONPath spec (RFC 9535) including filters, recursive descent, slicing."**
   The path syntax is gjson's, which is similar but not identical. Recursive descent (`..`) and complex filter expressions may not round-trip through re-insertion. Use `json_selector` for recursive matching by key/value.

4. **"`create=true` means the chain always succeeds."**
   It means missing paths get created on insert. The downstream chain still has to produce a value worth inserting. If it produces an empty string, you get an empty value at the path.

5. **"Setting a field to non-numeric text on a number field fails the chain."**
   It doesn't fail — it writes `0` to preserve the JSON type. If you need the chain to halt instead, validate upstream or use `create=false` and a more specific path.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `missing parameter path` | `path` not set | Add `"path": "..."` |
| Token unchanged, "path value not found" error | The path doesn't exist in the input document and `create=false` | Either set `create=true` or fix the path |
| Numeric field becomes `0` | Downstream produced non-numeric text for a number field | Make the upstream transform produce numeric text, or restructure the chain |
| Output JSON has the new value but different formatting (whitespace, key order) | `sjson` rewrites the document on insert | This is expected; downstream consumers should parse JSON, not match byte-for-byte |
| Top-level array path doesn't work with `#` | Targeting a root-level array | Use the `#.field...` form — the transform expands it across all indices |
| Path with advanced gjson features doesn't round-trip | `sjson` doesn't support all `gjson` features for writes | Use a simpler path, or switch to [`json_selector`](./json_selector.md) for recursive matching |

## Related Transforms

- [`json_selector`](./json_selector.md) — match by key/value with optional recursion, useful when the exact path varies between requests.
- [`xml_path`](./xml_path.md) — the XML counterpart, using XPath.
- [`regex`](./regex.md) — same two-phase extract/re-insert pattern, but pattern-based rather than JSON-aware.
- [`smart_replace`](./smart_replace.md) — combine with `json_path` to propagate a value extracted from one field across the entire RRPair.

## Advanced Notes

- The transform does not require recorded response data.
- The original document bytes are copied at extract time, so the downstream chain may mutate the extracted token without disturbing the document used for re-insertion.
- gjson's path syntax is well-documented; sjson's *write* support is narrower. If you write an advanced path and the re-insertion mangles the document, fall back to a simpler dot path or use `json_selector`.
- `path` is re-resolved on both the first and second phases against the variable cache, so a `${{var:...}}` reference picks up whichever value is current at each phase.
