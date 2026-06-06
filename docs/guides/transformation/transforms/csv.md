---
description: "Walk a single column of CSV data row by row with the csv transform in Speedscale, supplying a fresh value to each request and wrapping back to the first row after the last one is consumed."
sidebar_position: 4
---

# csv

The `csv` transform walks a single column of CSV data one row at a time. Every time the chain runs, it advances to the next row and emits that column's cell as the new value. When it runs out of rows, it wraps back to the first data row and keeps going indefinitely.

It is typically used as a **runtime-variable source** — the CSV is loaded once (from local user data, S3, or a portable `dataframe:` filename) and the transform produces a sequence of values that other transform chains consume via `${{var:...}}`.

- **Transform type name (config/API):** `csv`
- **Shorthand format:** `csv(index=...,header=...,headersPresent=...)`
- **Aliases:** `column` is accepted as a legacy synonym for `index`.

## Quick Start

Load a CSV from the workspace and walk the `email` column:

```json
{
  "name": "next_email",
  "config": {
    "extractor": { "type": "file", "config": { "filename": "dataframe:users.csv" } },
    "transforms": [
      {
        "type": "csv",
        "config": {
          "hasHeader": "true",
          "header": "email"
        }
      }
    ]
  }
}
```

Then reference `${{var:next_email}}` from any transform chain to get a fresh value per RRPair.

## How It Works

The `csv` transform does all of its work in the first phase. The second phase is a no-op — the source CSV is treated as immutable, and no value is written back into the original CSV data.

1. On the first run, the configured CSV bytes are parsed and a streaming reader is initialised.
2. If `hasHeader=true`, the first row is consumed as headers. When `header` is configured, the reader scans the header row for an exact, case-sensitive match and converts it to a numeric column index.
3. Each call reads the next row and emits the cell at the configured column index.
4. On EOF, the reader is reset to the start of the file and the next call resumes from the first data row. There is no "end of CSV" — replays continue indefinitely.

### Picking a Column

Configure exactly one of `index` or `header`:

- `index` — zero-based column number. Works with or without a header row.
- `header` — column name. Requires `hasHeader=true` and an exact, case-sensitive match in the header row.

Setting both is rejected at chain construction. Setting neither is also rejected.

### Row Handling Quirks

- Rows with **different numbers of fields** are accepted. A row that is shorter than the configured index produces an "index out of bounds" error for that single call; the reader still advances and the next call reads the next row.
- **Empty rows** in the middle of the file are tolerated and counted as rows.
- The reader wraps after the last row. A broken/empty trailing row causes the wrap to skip past it on the next read.

### Runtime Variable Pattern

`csv` is almost always wired up as a runtime variable. The variable is populated once per RRPair (by the run-vars populator), so a chain that loads from `${{var:next_email}}` gets a new value per request without ever calling the `csv` transform inline.

Inline use inside a per-RRPair chain is supported but unusual — the transform tracks its own row pointer on the transform instance, not in the run-vars layer.

## Configuration

```json
"type": "csv",
"config": {
    "index": "<integer>",
    "header": "<string>",
    "hasHeader": "<boolean>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `index` | Yes (or `header`) | none | Zero-based column number. Cannot be combined with `header`. Also accepted as `column` for backwards compatibility. |
| `header` | Yes (or `index`) | none | Header name to look up. Requires `hasHeader=true`. Case-sensitive exact match. |
| `hasHeader` | No | `false` | Whether the first row of the CSV is a header row. Must be `true` whenever `header` is set. |

### CSV Source

The CSV bytes come from the transform chain's **extractor**, not from the `csv` transform itself. In practice the extractor is `file`, which accepts:

- `dataframe:NAME.csv` — portable; resolves to local `proxymock/dataframes/NAME.csv` for local replay and to [user data](../../../reference/glossary.md#user-data) in the Speedscale cloud. For files inside a subdirectory, encode the path separator as `__` (e.g. `dataframe:lookup__users.csv` for `proxymock/dataframes/lookup/users.csv`).
- `s3://NAME.csv` — cloud-only.
- An absolute local path — local-only.

See the [file extractor](../extractors/file.md) and the [embedded `${{file:...}}`](../embedded-syntax.md) keyword for the full description of each form.

## Examples

### Example 1 — No header row, pick by index

CSV:

```csv
c0r0,c1r0,c2r0
c0r1,c1r1,c2r1
c0r2,c1r2,c2r2
```

Config:

```json
"type": "csv",
"config": {
    "index": "1"
}
```

Successive calls produce `c1r0`, `c1r1`, `c1r2`, then wrap to `c1r0`.

### Example 2 — Header row, pick by name

CSV:

```csv
firstName,lastName,email
John,Doe,john@example.com
Jane,Doe,jane@example.com
Wanda,Brown,wanda@example.com
```

Config:

```json
"type": "csv",
"config": {
    "hasHeader": "true",
    "header": "email"
}
```

Successive calls produce `john@example.com`, `jane@example.com`, `wanda@example.com`, then wrap.

### Example 3 — Wired up as a runtime variable

```json
{
  "GeneratorVariables": [
    {
      "Name": "current_sku",
      "Config": {
        "Extractor": { "Type": "file", "Config": { "filename": "dataframe:skus.csv" } },
        "Transforms": [
          {
            "Type": "csv",
            "Config": { "hasHeader": "true", "header": "sku" }
          }
        ]
      }
    }
  ]
}
```

Other transform chains can then write that value into request bodies:

```
req_body() → json_path(path="product.sku") → constant(value="${{var:current_sku}}")
```

## Common Misconceptions

1. **"The transform stops after the last row."**
   No. It wraps back to the first data row and continues indefinitely. There is no terminal state.

2. **"`header` searches case-insensitively."**
   No. The header lookup is an exact, case-sensitive string match. `Email` and `email` are different.

3. **"`hasHeader=false` works with `header`."**
   No. Setting `header` without `hasHeader=true` is rejected at chain construction.

4. **"A short row stops the walk."**
   No. A row that lacks the configured index produces an error for that call, but the reader has already advanced. The next call reads the next row.

5. **"`csv` and `csv_iter` are the same thing."**
   No. `csv` parses CSV bytes from its extractor and maintains its own row pointer. [`csv_iter`](./csv_iter.md) reads from a pre-loaded global CSV (defined as a runtime variable using `csv`) and pulls the next value from a shared atomic counter — so multiple `csv_iter` callers that name the same CSV advance the **same** pointer.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `you must provide either "index" or "header"` | Neither set | Set exactly one |
| Chain init: `both "index" and "header" cannot be specified` | Both set | Remove one |
| Chain init: `"headersPresent" must be true when "header" is specified` | `header` set without `hasHeader=true` | Set `hasHeader=true` |
| Runtime: `cannot find header in CSV input` | `header` name doesn't match the header row (case-sensitive) | Check the exact spelling and case in the CSV header row |
| Runtime: `column data at the given "index" is missing from the CSV row` | A row is shorter than the configured index | Tolerate (next call advances), or normalize the CSV so every row has enough columns |
| Runtime: `malformed CSV input` | Reader could not parse the file (truncated, encoding issue) | Re-export the file as standard CSV |
| Same value emitted every call | Likely using `csv_iter` against a single-row CSV, or the chain is being re-instantiated per call | Confirm the runtime variable is registered once at startup; verify the CSV actually has multiple rows |

## Related Transforms

- [`csv_iter`](./csv_iter.md) — the chain-level counterpart that reads from a CSV loaded as a runtime variable (typically using `csv`). All `csv_iter` callers that name the same variable share one cursor.
- [`dataframe`](./dataframe.md) — for keyed lookups (`primary_key → field`) instead of sequential walks.
- [`constant`](./constant.md) with `${{var:...}}` substitution — to pull the current value of a runtime variable directly into a field.
- [`rand_string`](./rand_string.md) — when you want a random value per call rather than a deterministic walk through known data.

## Advanced Notes

- The reader is re-initialised on every transition between EOF and the next call. Header rows are re-consumed (and re-validated) on each wrap. This is why a malformed header is reported on the first call **and** every subsequent call after a wrap.
- The CSV parser accepts rows with varying field counts (`FieldsPerRecord = -1`). It does not, however, accept malformed quoting; a truly broken row aborts the read with `malformed CSV input`.
- The `column` parameter name is retained for backwards compatibility with older configs. New chains should prefer `index`.
- A runtime variable backed by `csv` is iterated by the run-vars populator once per RRPair, so the cadence of value rotation is "one new value per replayed RRPair," not "one new value per transform chain call."
