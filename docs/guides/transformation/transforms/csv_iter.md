---
description: "Inject the next row from a pre-loaded CSV runtime variable with the csv_iter transform in Speedscale — all callers naming the same CSV share one cursor that wraps after the last row."
sidebar_position: 5
---

# csv_iter

The `csv_iter` transform pulls the next value from a CSV that was loaded into the replay session as a runtime variable. Every call advances a **shared atomic counter** and returns the value at the new position. When the counter passes the last row, it wraps back to the first.

It is the **chain-level** counterpart to the `csv` transform. While `csv` (used inside a runtime variable) defines and walks the column, `csv_iter` is what transform chains drop into a step to fetch a fresh value from that shared sequence.

- **Transform type name (config/API):** `csv_iter`
- **Shorthand format:** `csv_iter(csv_name=...)`

## Quick Start

Given a runtime variable named `users` (defined with the `csv` transform):

```json
"type": "csv_iter",
"config": {
    "csv_name": "users"
}
```

Each call advances the cursor on the `users` CSV and returns the next column value.

## How It Works

`csv_iter` does all of its work in the first phase. The second phase is a no-op.

1. Look up the runtime CSV named by `csv_name`. This CSV must already exist in the replay session — it is populated at startup from a runtime variable whose chain uses the `csv` transform.
2. Atomically advance the shared cursor and return the value at the new position.
3. When the cursor passes the last row, it wraps modulo the row count and the next call returns the first row's value.

The input token is **ignored**. `csv_iter` does not transform whatever the chain extracted — it overwrites it with the next CSV value.

### Shared Cursor Semantics

All `csv_iter` callers that name the same CSV share **one** cursor. This is the most important thing to understand about the transform:

- Two chains that both call `csv_iter(csv_name="users")` will **interleave** values from the CSV. They do not each get their own walk.
- The cursor advances **once per call**, not once per RRPair. A single chain that calls `csv_iter` twice in one RRPair consumes two rows.
- The cursor is **process-global** for the run and uses an atomic counter, so concurrent chains are safe to advance it without locking but cannot be coordinated to "stay aligned" with one another.

If you need a per-chain or per-RRPair walk, define a separate runtime CSV variable for each consumer.

### Relationship to `csv`

- `csv` is the **column walker**: it parses CSV bytes and produces a sequence of values from one column.
- `csv_iter` is the **chain step** that fetches the next value from a CSV the runtime has already loaded and pre-walked into a flat list.

Defining the variable with `csv` is what makes `csv_iter` work at all — it is the side effect of the runtime variable being registered that creates the shared cursor `csv_iter` reads from.

## Configuration

```json
"type": "csv_iter",
"config": {
    "csv_name": "<runtime variable name>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `csv_name` | Yes | (none) | The name of a runtime variable whose chain uses the `csv` transform. Missing or unknown names produce `csv <name> doesn't exist` at runtime. |

## Setting Up the Source CSV

`csv_iter` cannot run without a matching runtime variable. The variable's extractor produces the CSV bytes; the variable's `csv` transform picks the column.

```json
{
  "GeneratorVariables": [
    {
      "Name": "users",
      "Config": {
        "Extractor": {
          "Type": "file",
          "Config": { "filename": "dataframe:employees.csv" }
        },
        "Transforms": [
          {
            "Type": "csv",
            "Config": { "hasHeader": "true", "header": "Email" }
          }
        ]
      }
    }
  ]
}
```

The `dataframe:` prefix is portable: it resolves to `proxymock/dataframes/employees.csv` for local replay and to [user data](../../../reference/glossary.md#user-data) named `employees.csv` in the Speedscale cloud. For files in a subdirectory, encode the separator as `__` (e.g. `dataframe:hr__employees.csv` for `proxymock/dataframes/hr/employees.csv`). You can also use `s3://employees.csv` for cloud-only or an absolute local path for local-only — see the [file extractor](../extractors/file.md).

With the variable above defined, `csv_iter(csv_name="users")` returns successive email addresses.

## Examples

### Example 1 — Walk a column of emails

CSV at `proxymock/dataframes/employees.csv`:

```csv
Name,Email,ID
John Doe,john.doe@example.com,12345
Jane Smith,jane.smith@example.com,67890
Alice Johnson,alice.johnson@example.com,24680
Bob Brown,bob.brown@example.com,13579
```

Runtime variable:

```
users = file("dataframe:employees.csv") → csv(hasHeader=true, header="Email")
```

Transform usage:

```
req_body() → json_path(path="user.email") → csv_iter(csv_name="users")
```

Successive RRPairs receive:

```
john.doe@example.com
jane.smith@example.com
alice.johnson@example.com
bob.brown@example.com
john.doe@example.com   ← wraps
```

### Example 2 — Rotating values inside `smart_replace`

```
smart_replace(overwrite=true) → req_body() → json_path(path="iterationId") → csv_iter(csv_name="iter_ids")
```

`smart_replace` registers a new RRPair-wide mapping per iteration, with the fresh value coming from `csv_iter`. `overwrite=true` is important here so the mapping updates each cycle — see [smart_replace](./smart_replace.md).

### Example 3 — Two chains, one CSV → interleaved values

If two separate transform chains both reference `csv_iter(csv_name="users")` and both run on every RRPair, the first RRPair's chains consume rows 1 and 2, the second RRPair's chains consume rows 3 and 4, and so on. The two chains do **not** independently start from row 1.

To give each chain its own walk, define a second runtime variable that loads the same CSV under a different name.

## Common Misconceptions

1. **"Each chain gets its own walk through the CSV."**
   No. The cursor is shared across every `csv_iter` caller that names the same CSV.

2. **"`csv_iter` reads the file each time it runs."**
   No. The CSV is parsed once at startup by the runtime variable that owns the `csv` transform. `csv_iter` only reads from the pre-built list.

3. **"`csv_iter` operates on the value the extractor produced."**
   No. The input token is discarded. Whatever the extractor pulled out is overwritten with the next CSV value.

4. **"It stops at the end of the CSV."**
   No. The counter wraps modulo the row count. Replays continue indefinitely.

5. **"I can pass CSV contents inline."**
   No. `csv_iter` only references a named runtime variable; it does not take CSV bytes directly. The bytes are supplied via the variable's extractor.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Runtime: `csv <name> doesn't exist` | No runtime variable with that name, or the variable doesn't use the `csv` transform | Define a runtime variable named in `csv_name` whose chain has a `csv` transform |
| Two chains receive interleaved values when each was expected to start from row 1 | Both chains reference the same `csv_name` | Define one runtime variable per chain that needs an independent walk |
| Same value emitted on every call | The source CSV has only one data row, or the runtime variable failed to load and the cursor is stuck | Verify the source CSV has multiple rows; check chain init logs for variable load errors |
| Off-by-one — first call returns the second row instead of the first | The cursor uses 1-based modulo arithmetic, so the **first** call returns the first row. If you see row 2 first, an earlier consumer has already advanced the cursor | Track all `csv_iter` callers that share the name; consolidate or split as needed |

## Related Transforms

- [`csv`](./csv.md) — the transform used inside the runtime variable that backs `csv_iter`. Use directly when you want a self-contained walker (no separate runtime variable) or when configuring the source CSV's column selection.
- [`dataframe`](./dataframe.md) — for keyed lookups (`primary_key → field`) rather than sequential iteration.
- [`smart_replace`](./smart_replace.md) — pair with `csv_iter` (with `overwrite=true`) to propagate each iteration's value across the full RRPair.
- [`constant`](./constant.md) with `${{var:...}}` syntax — when you want the current value of the runtime variable rather than advancing the cursor.

## Advanced Notes

- The cursor is an atomic 64-bit counter. Concurrent chains can safely advance it from multiple goroutines without locks.
- The row data is materialised once at startup from the `csv` transform's column walk, so `csv_iter` does not re-read the CSV file at runtime.
- `csv_iter` does not require a response to run, and it ignores both the request and response sides of the RRPair beyond providing a value to whatever step in the chain follows it.
