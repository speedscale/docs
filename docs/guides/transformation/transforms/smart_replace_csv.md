---
description: "Bulk-load key→value pairs from a CSV into Speedscale's smart_replace substitution table with the smart_replace_csv transform, so every recorded value listed in the CSV is rewritten to its replacement across the entire RRPair."
sidebar_position: 24
---

# smart_replace_csv

The `smart_replace_csv` transform parses a CSV out of the incoming token and bulk-registers every row as a `key → value` mapping in the replay session's substitution table — the same table used by [`smart_replace`](./smart_replace.md) and [`smart_replace_recorded`](./smart_replace_recorded.md). After every transform chain on the RRPair finishes, those mappings are applied across the **entire RRPair**: every key from the CSV is rewritten to its paired value wherever it appears (headers, body, URL, query strings, signature fields).

Think of it as a global find/replace whose lookup table is loaded from a CSV, with the same propagation guarantees as `smart_replace`.

- **Transform type name (config/API):** `smart_replace_csv`
- **Shorthand format:** `smart_replace_csv(headers=...,existing=...,new=...,existingNum=...,newNum=...)`

## Quick Start

For a CSV whose first row is a header and whose first two columns are the existing value and the new value:

```json
"type": "smart_replace_csv",
"config": {}
```

For a header-less CSV with non-default column positions:

```json
"type": "smart_replace_csv",
"config": {
    "headers": "false",
    "existingNum": "2",
    "newNum": "5"
}
```

`smart_replace_csv` consumes the CSV from the upstream extractor. The chain in front of it must produce CSV bytes (e.g. reading from a CSV file, reading from a field, or whatever else fits the action file).

## How It Works

All of the work happens in the first phase. The second phase is a no-op — the CSV bytes pass through unchanged, and the transform never modifies the field the chain extracted.

1. **First phase** — parse the incoming token as CSV. For each data row, register `row[existingColumn] → row[newColumn]` in the replay session's substitution table.
2. **Second phase** — return the input unchanged.

After every transform chain on the RRPair completes, the substitution table is applied across the entire RRPair: every CSV-loaded key is rewritten to its paired value wherever it appears.

### Header Resolution

The `headers` setting determines whether the **first row** of the CSV is consumed as a header row, **and** whether the `existing` / `new` column-name fields are honoured:

| `headers` | `existing` / `new` set? | Behaviour |
|---|---|---|
| `true` (default) | Yes | The first row is read as a header. `existing` and `new` are looked up in that header to resolve column **indices**. |
| `true` | No | The first row is **not** consumed as a header. `existingNum` / `newNum` apply directly (defaults: 0 and 1). |
| `false` | (ignored) | The first row is treated as data. `existingNum` / `newNum` apply directly. |

The interaction in row 2 is intentional: when `headers=true` is set but no column **names** are supplied, the transform skips the header-resolution step and treats every row — including the first — as data. Configure `existing` / `new` only if you want column-name lookup; otherwise specify positions with `existingNum` / `newNum`.

### Bulk-Loaded Mappings Use `overwrite=true`

Every row registered by `smart_replace_csv` is stored with overwrite enabled — a later row in the CSV (or a later CSV load) replaces an earlier mapping for the same key. This matches the bulk-load mental model: the CSV is the source of truth for the values it carries.

## Configuration

```json
"type": "smart_replace_csv",
"config": {
    "headers": "<boolean>",
    "existing": "<column name>",
    "new": "<column name>",
    "existingNum": "<column index>",
    "newNum": "<column index>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `headers` | No | `true` | Whether the CSV's first row is a header row that can be used to resolve column names. See the [header resolution table](#header-resolution). Must be `true` or `false`; any other value fails chain initialization. |
| `existing` | No | `""` | Column **name** of the existing (key) column. Requires `headers=true`. Falls back to `existingNum` when not supplied. |
| `new` | No | `""` | Column **name** of the new (value) column. Requires `headers=true`. Falls back to `newNum` when not supplied. |
| `existingNum` | No | `0` | Zero-indexed column **position** of the existing (key) column. Used when no column name is configured. |
| `newNum` | No | `1` | Zero-indexed column **position** of the new (value) column. Used when no column name is configured. |

If a configured column name is not found in the header row, chain runtime fails with `could not find column <name> in CSV data`. If a row has fewer columns than `existingNum` or `newNum`, the transform errors out for that load with `cannot parse CSV row - out of bounds`.

## Examples

### Example 1 — Header-less CSV, default columns

CSV input:

```
foo1,bar1,zibar1
foo2,bar2,zibar2
```

Config:

```json
"type": "smart_replace_csv",
"config": {
    "headers": "false"
}
```

Mappings registered:

- `foo1 → bar1`
- `foo2 → bar2`

### Example 2 — Header-less CSV, non-default columns

Same CSV input as above. Config:

```json
"type": "smart_replace_csv",
"config": {
    "headers": "false",
    "existingNum": "1",
    "newNum": "2"
}
```

Mappings registered:

- `bar1 → zibar1`
- `bar2 → zibar2`

### Example 3 — Headered CSV, look up by column name

CSV input:

```
record_id,replacement,notes
foo1,bar1,zibar1
foo2,bar2,zibar2
```

Config:

```json
"type": "smart_replace_csv",
"config": {
    "headers": "true",
    "existing": "record_id",
    "new": "replacement"
}
```

The first row is consumed as the header; `record_id` resolves to column 0 and `replacement` to column 1. Mappings registered:

- `foo1 → bar1`
- `foo2 → bar2`

### Example 4 — DLP redaction workflow

`smart_replace_csv` is the bulk-load entry point for the [data redaction and replacement workflow](/guides/dlp/). The DLP pipeline produces a CSV of `redacted_value → safe_value` pairs; `smart_replace_csv` loads that CSV once at the start of the chain, and every later occurrence of any redacted value in the RRPair is rewritten to its safe counterpart.

## Common Misconceptions

1. **"It modifies the CSV field the chain extracts."**
   No. The CSV is consumed as a lookup table; the field it was extracted from is left unchanged. The substitution is applied across the entire RRPair to the values **named in** the CSV's first column, not to the CSV body itself.

2. **"Setting `headers=true` always consumes the first row."**
   No. It only consumes the first row as a header when `existing` or `new` is also configured. With `headers=true` but no column-name fields, the first row is treated as data (and `existingNum` / `newNum` apply).

3. **"Mappings are per-RRPair."**
   No. Mappings registered by `smart_replace_csv` share the same session-scoped substitution table as `smart_replace` and `smart_replace_recorded`. They persist for the duration of the replay or mock-server session.

4. **"Reloading the CSV is additive — earlier mappings stick around."**
   Earlier mappings stay registered, but every row from `smart_replace_csv` is stored with overwrite enabled, so a later load that re-asserts the same key with a different value will replace the earlier mapping.

5. **"`existing` and `new` accept column indices as strings."**
   No. Use `existingNum` / `newNum` for indices; `existing` / `new` are column **names** that must appear in the header row.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `headers must be true or false` | `headers` is set to a non-boolean string | Set to `true` or `false` |
| Chain init: `could not parse existingNum to integer` / `newNum to integer` | A column-position field has a non-numeric value | Pass an integer index (e.g. `2`, not `"two"`) |
| Runtime: `could not find column <name> in CSV data` | The header row does not contain a column with the supplied name | Check spelling, case, or whether the CSV actually has headers |
| Runtime: `cannot parse CSV row - out of bounds` | A data row has fewer columns than `existingNum` or `newNum` | Audit the CSV for short rows or trailing newlines that produce empty rows |
| Runtime: `ErrMalformedCSV` while reading header | The CSV is empty or has a malformed first row | Confirm the upstream extractor produced valid CSV bytes |
| Mappings don't apply across the RRPair | Substitution is applied after the chain completes; if the consuming RRPair was processed before this load, it won't be retro-substituted | Load the CSV in a chain that runs on an earlier RRPair than the ones that need substitution |
| Wrong column got used as the key | Default `existingNum=0`, `newNum=1` were applied when you expected name lookup | Set both `existing` and `new` (with `headers=true`) or both `existingNum` and `newNum` (with `headers=false`) |

## Related Transforms

- [`smart_replace`](./smart_replace.md) — register a single mapping from an in-chain key/value pair. Shares the same substitution table.
- [`smart_replace_recorded`](./smart_replace_recorded.md) — register a single mapping from a recorded/live pair. Shares the same substitution table.
- [`constant`](./constant.md), [`replace`](./replace.md) — for scoped, single-field substitution without propagation.

## Advanced Notes

- The CSV is parsed every time the transform's first phase runs, so the cost scales with CSV size on each invocation. For large lookup tables, ensure the upstream extractor only produces the CSV bytes once per replay rather than once per RRPair.
- The substitution table is shared with `smart_replace` and `smart_replace_recorded`. A mapping registered by any of the three is honoured by all three for the rest of the session.
- The transform does not require recorded responses — it operates entirely on the incoming token.
- An empty input token is a no-op (no error). This makes the transform safe to chain after an optional upstream extractor that may not produce a value on every RRPair.
