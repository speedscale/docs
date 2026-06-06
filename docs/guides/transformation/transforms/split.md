---
description: "Pick one segment of a delimited string with the split transform in Speedscale, let downstream transforms rewrite that segment, then re-join the segments with the same separator."
sidebar_position: 26
---

# split

The `split` transform divides a token into segments using a literal substring separator, exposes one segment to the rest of the chain, and on the way out re-joins the segments with the same separator — so the surrounding segments are preserved.

It's the simplest way to address one piece of a delimited string (CSV cell, path segment, header value list) without resorting to regex.

- **Transform type name (config/API):** `split`
- **Shorthand format:** `split(index=...,separator=...)`

## Quick Start

Take the first comma-separated value:

```json
"type": "split",
"config": {
    "index": "0"
}
```

Take the third path segment of a slash-delimited URL field:

```
res_body() → json_path(path="path") → split(index=2, separator="/")
```

## How It Works

The transform runs in two phases as a bookend around the rest of the chain.

1. **First phase** — split the token into segments using `separator` as a literal substring. Return the segment at `index` to the downstream chain. The segment list is remembered.
2. **Second phase** — replace the segment at `index` in the remembered list with whatever the downstream chain produced, then re-join the list with `separator`. The rebuilt string is the chain's output.

```
input:    "shortest,straw"
          └─ 1st phase, separator=",", index=0:
                segments = ["shortest", "straw"]
                returns "shortest"
          └─ downstream produces "challenge"
          └─ 2nd phase: segments[0] = "challenge", rejoin
output:   "challenge,straw"
```

### `separator` Is a Single Literal Substring

`separator` is a single literal string, **not** a character class and **not** a list of alternative delimiters. `separator=",;"` splits on the two-character substring `,;`, not on either `,` or `;`. Use [`regex`](./regex.md) when you need character-class or alternation behavior.

The separator can be any length:

| Input | Separator | Segments |
|---|---|---|
| `a,b,c` | `,` | `["a", "b", "c"]` |
| `a||b||c` | `\|\|` | `["a", "b", "c"]` |
| `riding{asdf}{}{}through` | `{asdf}{}{}` | `["riding", "through"]` |

### Index Out of Range

If `index` is greater than or equal to the number of segments, both phases are no-ops:

- The first phase returns the original token unchanged.
- The downstream chain runs on the original token.
- The second phase re-joins the original segments (no edit), returning the un-modified string.

This is intentional — a chain configured against optional segments doesn't crash on payloads that lack them. It also means **you cannot use `split` to append a new segment** when the index is past the end. Use [`replace`](./replace.md) or construct the value upstream if you need to grow the field.

### Empty Token

An empty input string yields `[""]` (a single empty segment). With the default `index=0`, the first phase returns the empty string and the downstream chain operates on it. The re-join is also the original empty string.

## Configuration

```json
"type": "split",
"config": {
    "index": "<non-negative integer>",
    "separator": "<literal substring>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | No | `0` | Zero-based index of the segment to extract. Negative values fail chain initialization. |
| `separator` | No | `,` | Literal substring used as the delimiter. Treated as a single string, not as a list of alternatives. |

## Examples

### Example 1 — First tag from a comma-separated list

```
req_body() → json_path(path="tags") → split(index=0)
```

- Input field: `javascript,react,frontend,typescript`
- After `split`: `javascript`
- If the downstream chain rewrites that segment to `vue`, the field becomes `vue,react,frontend,typescript`.

### Example 2 — Pick a path segment

```
res_body() → json_path(path="path") → split(index=2, separator="/")
```

- Input field: `/api/v1/users/profile`
- Segments: `["", "api", "v1", "users", "profile"]`
- After `split`: `v1` — note the leading empty segment from the leading `/`.

If the downstream chain rewrites `v1` to `v2`, the field becomes `/api/v2/users/profile`.

### Example 3 — Take the primary language

```
http_req_header(header="Accept-Language") → split(index=0, separator=",")
```

- Input: `en-US,en;q=0.9,fr;q=0.8`
- After `split`: `en-US`.

To strip the optional weight (e.g. `en;q=0.9` → `en`), follow with another `split(index=0, separator=";")`.

### Example 4 — Multi-character separator

```
req_body() → json_path(path="message") → split(index=3, separator="{asdf}{}{}")
```

- Input field: `riding{asdf}{}{}through{asdf}{}{}shortest{asdf}{}{}straw{asdf}{}{}has{asdf}{}{}been`
- After `split`: `straw` (index 3).

### Example 5 — Out-of-range index passes through unchanged

```
split(index=500, separator=",")
```

- Input: `shortest,straw`
- Output of both phases: `shortest,straw`. No transformation, no error.

## Common Misconceptions

1. **"`separator` is a list of delimiters."**
   No. It's a single literal substring. `separator=",;"` splits on the two-character substring `,;`, not on either `,` or `;`. For alternation, use [`regex`](./regex.md).

2. **"It's a character class like `strings.Trim`."**
   No. Each character of `separator` is part of one literal delimiter.

3. **"Index `-1` means the last segment."**
   No. Negative indices are rejected at chain initialization.

4. **"An out-of-range index is an error."**
   No. The first phase returns the input unchanged, the downstream chain runs on the original token, and the second phase re-joins the original segments. The field passes through.

5. **"`split` works on bytes."**
   It works on the UTF-8 string form of the token. Multi-byte separators (e.g. unicode characters) split correctly.

6. **"You can extend a field by writing to an index past its length."**
   No. Out-of-range writes are dropped. Build the new field upstream with `constant`/`replace` instead.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `index not parsable as an integer (or a negative number)` | `index` is non-numeric or negative | Use a non-negative integer |
| Field passes through unchanged | `index` is past the end of the segment list, or the separator never matches | Verify the separator literally appears in the token; check the segment count |
| Wrong segment extracted from a path with a leading delimiter | Leading delimiters produce an empty first segment | Account for the empty `""` at index 0, e.g. use `index=N+1` |
| `;`-separated values not splitting on `,` and `;` together | `separator` is a single literal substring | Use [`regex`](./regex.md) for alternation, or chain two `split` transforms |
| Output is unchanged after a downstream `constant` | The downstream output went to an out-of-range index | Lower `index` to point at a real segment |

## Related Transforms

- [`replace`](./replace.md) — whole-string literal replacement when you don't need segment indexing.
- [`regex`](./regex.md) — pattern-based extraction with alternation, capture groups, and character classes.
- [`json_path`](./json_path.md) — for JSON-aware extraction before splitting.
- [`smart_replace`](./smart_replace.md) — pair with `split` to propagate a segment's new value across the entire RRPair.

## Advanced Notes

- The transform does not require recorded response data.
- The segment list is held on the transform instance, so concurrent invocations on the same instance are not supported. (Each transform-chain construction yields its own instance — this only matters for very unusual configurations.)
- Re-joining uses the configured `separator` verbatim. If `separator` is empty, the join produces the concatenation of the segments.
