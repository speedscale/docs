---
description: "Look up a single cell from a tabular dataset loaded as a runtime variable with the dataframe_lookup transform in Speedscale — primary key and field both support ${{...}} variable substitution so lookups can be driven by values captured earlier in replay."
sidebar_position: 6
---

# dataframe

The `dataframe_lookup` transform reads a single cell out of a pre-loaded dataframe. You give it a **primary key value** and a **field (column) name** and it returns the matching cell as the new token value. Both the key and the field name support `${{...}}` variable substitution, so a lookup can be driven by values captured from earlier RRPairs.

It is the keyed counterpart to the [`csv`](./csv.md) / [`csv_iter`](./csv_iter.md) transforms — those walk a CSV row by row, while `dataframe_lookup` jumps directly to a row identified by its primary key.

- **Transform type name (config/API):** `dataframe_lookup`
- **UI name:** Dataframe (shown in transform pickers)
- **Shorthand format:** `dataframe_lookup(dataframe_name=...,key=...,field=...)`

## Quick Start

Given a runtime variable named `employees` whose source CSV uses `ID` as the primary key, look up a known employee's email:

```json
"type": "dataframe_lookup",
"config": {
    "dataframe_name": "employees",
    "key": "12345",
    "field": "Email"
}
```

To drive the lookup dynamically from a value captured in a previous step, substitute the key with a runtime variable:

```json
"type": "dataframe_lookup",
"config": {
    "dataframe_name": "employees",
    "key": "${{var:customer_id}}",
    "field": "Email"
}
```

## How It Works

`dataframe_lookup` does all of its work in the first phase. The second phase is a no-op.

1. **Resolve `key`** by passing it through `${{...}}` variable substitution against the variable cache.
2. **Resolve `field`** the same way.
3. **Look up** `dataframe_name → key → field` in the dataframe map provided by the replay session.
4. **Emit** the cell value as the new token. If anything is missing (dataframe, primary key value, or field), the original token is left in place and the call returns an error.

The input token (whatever the extractor pulled out of the RRPair) is **discarded** — `dataframe_lookup` overwrites it with the looked-up cell.

### What is a Dataframe?

A dataframe is a lookup table — a CSV with a header row where one column is designated the **primary key**. Every other column becomes a field accessible by name. For example:

| ID    | Name          | Email                     |
|-------|---------------|---------------------------|
| 12345 | John Doe      | john.doe@example.com      |
| 67890 | Jane Smith    | jane.smith@example.com    |
| 24680 | Alice Johnson | alice.johnson@example.com |

With `ID` as the primary key, `dataframe_lookup(dataframe_name="employees", key="12345", field="Email")` returns `john.doe@example.com`.

Primary key values must be unique. If a CSV has duplicate primary key values, the **last** row wins — earlier rows are overwritten as the dataframe is built.

### Loading a Dataframe

Dataframes are defined as **runtime variables** using the `csv_dataframe` variable type. The runtime variable's name becomes the `dataframe_name` you pass to the transform.

```json
{
  "GeneratorVariables": [
    {
      "Name": "employees",
      "Config": {
        "Extractor": {
          "Type": "file",
          "Config": { "filename": "dataframe:employees.csv" }
        },
        "Transforms": [
          {
            "Type": "csv_dataframe",
            "Config": { "primary_key": "ID" }
          }
        ]
      }
    }
  ]
}
```

The dataframe is parsed once at startup and held in memory for the life of the replay. The transform itself never re-reads the file.

### Portable Filenames

The `dataframe:` filename prefix is a portable scheme:

- During local replay, it resolves to `proxymock/dataframes/<name>.csv` in the current workspace.
- In the Speedscale cloud, it resolves to [user data](../../../reference/glossary.md#user-data) of the same name.
- For files in a subdirectory, encode the path separator as `__` (e.g. `dataframe:lookup__people.csv` for `proxymock/dataframes/lookup/people.csv`).

You can also pass a cloud-only `s3://name.csv` or an absolute local path. See the [file extractor](../extractors/file.md) for the full description of all three forms.

## Configuration

```json
"type": "dataframe_lookup",
"config": {
    "dataframe_name": "<runtime variable name>",
    "key": "<primary key value, or ${{...}}>",
    "field": "<field/column name, or ${{...}}>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `dataframe_name` | Yes | — | The name of a runtime variable defined with `csv_dataframe`. Missing names produce `dataframe <name> doesn't exist` at runtime. |
| `key` | Yes | — | Primary key value to look up. Supports `${{...}}` variable substitution. |
| `field` | Yes | — | Column name (from the source CSV header row) whose value should be returned. Supports `${{...}}` variable substitution. Case-sensitive exact match. |

### Variable Substitution

Both `key` and `field` are passed through the variable cache before the lookup, so either value can be wired to data captured earlier in replay:

- `key="${{var:customer_id}}"` — look up by an ID extracted from a prior response.
- `field="${{env:TARGET_COLUMN}}"` — switch which column is returned based on an environment variable.

If substitution fails, the original token is preserved and the transform reports an error. The dataframe is **not** consulted in that case.

## Examples

### Example 1 — Static key, static field

```json
"type": "dataframe_lookup",
"config": {
    "dataframe_name": "employees",
    "key": "12345",
    "field": "Email"
}
```

Always returns the `Email` cell for the row whose primary key is `12345`.

### Example 2 — Dynamic key from a captured variable

Capture the customer name from a response body and use it to look up an ID:

```
# First chain: capture the customer name as a runtime value
res_body() → json_path(path=".customer.name") → variable_store(name="customer_name")

# Second chain: use it to look up the corresponding ID
req_body() → json_path(path=".customer.id") → dataframe_lookup(
    dataframe_name="employees",
    key="${{var:customer_name}}",
    field="ID"
)
```

For this to work, the source dataframe's primary key must be the customer name column.

### Example 3 — Inline reference instead of a transform

The same lookup is also available as the [`${{dataframe:...}}` embedded keyword](../embedded-syntax.md#dataframe-lookup), so you can reference a dataframe cell directly from any transform field without adding a `dataframe_lookup` step:

```json
"type": "constant",
"config": {
    "value": "${{dataframe:employees:${{var:customer_name}}:Email}}"
}
```

Use the transform when the lookup is the whole step. Use the embedded form when the result is just one piece of a larger string.

### Example 4 — Different primary key, same CSV

The primary key is chosen at load time, not at lookup time. Loading the same CSV twice with different primary keys gives you two dataframes:

```json
"GeneratorVariables": [
    {
        "Name": "employees_by_id",
        "Config": {
            "Extractor": { "Type": "file", "Config": { "filename": "dataframe:employees.csv" } },
            "Transforms": [{ "Type": "csv_dataframe", "Config": { "primary_key": "ID" } }]
        }
    },
    {
        "Name": "employees_by_name",
        "Config": {
            "Extractor": { "Type": "file", "Config": { "filename": "dataframe:employees.csv" } },
            "Transforms": [{ "Type": "csv_dataframe", "Config": { "primary_key": "Name" } }]
        }
    }
]
```

Now `dataframe_lookup(dataframe_name="employees_by_id", key="12345", field="Email")` and `dataframe_lookup(dataframe_name="employees_by_name", key="John Doe", field="Email")` both return `john.doe@example.com`.

## Common Misconceptions

1. **"`dataframe_lookup` transforms the value the extractor pulled out."**
   No. The input token is discarded. The output is whatever cell the lookup returns.

2. **"The dataframe is searched by column value."**
   No. The lookup is keyed by the **primary key value only**. To look up by another column, load a second dataframe variable that uses that column as the primary key.

3. **"`field` supports JSON paths or wildcards."**
   No. `field` is an exact, case-sensitive column name from the source CSV header row.

4. **"Variable substitution only applies to `key`."**
   No. Both `key` and `field` are passed through `${{...}}` substitution.

5. **"Duplicate primary keys throw an error at load time."**
   No. The dataframe is built row by row and a later row with the same primary key silently overwrites the earlier one. Validate uniqueness in your source CSV.

6. **"A missing field reports a different error from a missing key."**
   No. Both surface as `lookup for <key> as primary key failed`. Treat this error as "the key/field pair didn't resolve" and check both.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Runtime: `dataframe <name> doesn't exist` | No runtime variable with that name, or it wasn't of type `csv_dataframe` | Define the runtime variable; confirm the `Name` matches `dataframe_name` exactly |
| Runtime: `lookup for <key> as primary key failed` | The resolved key isn't in the dataframe, **or** the field isn't a column | Verify the resolved `key` matches a row's primary key value, and the `field` matches a header name (both case-sensitive) |
| Variable substitution result is empty | `${{var:...}}` references a variable that hasn't been populated yet for the current RRPair | Make sure the chain that stores the variable runs on an earlier RRPair, or on an earlier extractor on the same RRPair |
| Wrong row returned for a duplicate key | Source CSV has multiple rows with the same primary key; last one wins | De-duplicate the CSV, or pick a different primary key column |
| Chain init: `supplied key not found in header row` (on the source variable) | The `primary_key` config on `csv_dataframe` doesn't match a header in the CSV | Confirm the header row spelling and case |
| Chain init: `empty key supplied for indexing` (on the source variable) | `primary_key` is empty | Set `primary_key` on the `csv_dataframe` variable |

## Related Transforms

- [`csv`](./csv.md) — walks a single column row by row instead of looking up by key. Use when you need a deterministic sequence rather than a keyed fetch.
- [`csv_iter`](./csv_iter.md) — chain-level walker that shares a cursor across all callers naming the same CSV. Use for sequential iteration coordinated across chains.
- [`constant`](./constant.md) with `${{dataframe:...}}` embedded syntax — for inline lookups inside a larger string template. Equivalent for simple cases; use the transform when the lookup is the entire step.
- [`variable_store`](./variable_store.md) — typically paired with `dataframe_lookup` so a value captured earlier in replay drives the `key` parameter.

## Advanced Notes

- The dataframe is loaded once at startup and held in memory. There is no cache invalidation — a CSV that changes during a replay run is not re-read.
- Variable substitution happens on every call, so the `key` (and `field`) values are re-resolved per RRPair. Loading the dataframe is cheap relative to the lookup itself.
- The internal storage is a `primary_key → field → cell` two-level map. Lookup is O(1) per call regardless of the dataframe's size.
- The primary key column is **excluded** from the field map, so requesting `field` equal to the primary key column name returns the "lookup failed" error even when the row exists. To return the primary key itself, you already have it — pass it through unchanged.
- See the [`${{dataframe:...}}` embedded keyword](../embedded-syntax.md#dataframe-lookup) for the inline equivalent.
