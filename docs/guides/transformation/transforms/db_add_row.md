---
description: "Inject new rows into recorded PostgreSQL and MySQL response payloads using the db_add_row transform in Speedscale, with control over append/prepend/index position, multi-resultset targeting, NULL handling, and variable-substituted row values."
sidebar_position: 8
---

# db_add_row

The `db_add_row` transform inserts a new row into the result set of a recorded database response — PostgreSQL or MySQL — and emits the modified response. It is the way to add test data, simulate "one more record" scenarios, or grow a fixture row count during replay or mocking without re-recording.

It does **not** synthesize a response from scratch. It works against an existing recorded response body, using the first existing row (when present) as a template for column types and binary-vs-string encoding, then writes the new row into the right position.

- **Transform type name (config/API):** `db_add_row`
- **Shorthand format:** `db_add_row(position=...,index=...)`
- **Supported protocols:** PostgreSQL simple-query responses, MySQL text-protocol resultsets, MySQL binary-protocol resultsets.

## Quick Start

Append a new row to a recorded response, with the row values supplied by the next transform in the chain:

```
res_body() → db_add_row() → constant(value="[\"new1\",\"new2\"]")
```

Equivalent JSON form for the `db_add_row` step:

```json
"type": "db_add_row",
"config": {
    "position": "append"
}
```

The row values fed into `db_add_row` must be a **JSON array of strings** (one entry per column). See [Row Values Format](#row-values-format).

## How It Works

`db_add_row` runs in both phases of the transform chain.

1. **First phase (top-down through the chain).** `db_add_row` receives the recorded database response body, stores it on the transform instance, and returns it unchanged. Subsequent transforms in the chain see the original response and can transform it into the row values they want to insert (typically via `constant`, `rand_string`, `csv_iter`, `${{var:...}}` substitutions, etc.).
2. **Second phase (reverse order through the chain).** `db_add_row.Insert` receives whatever the later transforms produced — the new row values as a JSON array — applies `${{...}}` variable substitution to it, parses the array, **auto-detects** which database protocol the stored response uses, and writes the new row into the response payload at the configured position.

The transform requires the recorded response to be present on the RRPair — it cannot add rows to something that wasn't recorded. The chain must extract a response body.

### Protocol Auto-Detection

The transform inspects the stored response JSON and picks the handler based on the top-level shape:

| Detected shape | Treated as |
|---|---|
| Top-level `"query"` key | PostgreSQL simple-query response (`QueryResponse`) |
| Top-level `"resultsets"` key, first entry has `"includedMetadata"` | MySQL text protocol |
| Top-level `"resultsets"` key, no `"includedMetadata"` | MySQL binary protocol |
| Anything else | Error: `unable to detect database tech from JSON structure` |

If the detection fails, the chain returns an error and the response is left unmodified.

### Template Row and Column Count

When the recorded response has at least one existing data row, the first row is used as a **template**:

- **Column count** is taken from the template row (or, for MySQL, from the resultset's column descriptors if rows are empty).
- **Per-column encoding** is copied from the template — PostgreSQL columns recorded as `asBytes` produce a new value as `asBytes`; columns recorded as `asString` produce `asString`.
- **MySQL column types and names** are copied verbatim onto each new field (`MYSQL_FIELD_TYPE_*`, `Unsigned`, `Name`). The new field's `Value` is always written as `AsString` regardless of the recorded type — the database engine accepts string-encoded values for all of its types.

If the response contains no existing data rows, the new row's column count defaults to the number of values you supply.

### Postgres `Complete` Tag Handling

If the recorded PostgreSQL response ends with a `CommandComplete` message whose tag starts with `SELECT ` (e.g. `SELECT 2`), the tag is automatically updated to reflect the new row count (`SELECT 3`). The `Complete` message is always kept as the last message in the response, regardless of where the new row is inserted.

Tags that don't start with `SELECT ` (e.g. `INSERT 0 1`, `UPDATE 2`) are left untouched.

### NULL and Length Mismatches

| Situation | Behavior |
|---|---|
| You supply fewer values than columns | Missing trailing columns are set to NULL — empty `Value` for Postgres, `null: true` for MySQL. |
| You supply more values than columns | Extra values are truncated. The loop is bounded by the column count of the template (or response). |
| You supply an empty string `""` for a column | Treated as NULL (same as missing) — set as an empty `Value` (Postgres) or `null: true` (MySQL). To insert a literal empty string, the recorded protocol must distinguish empty from NULL; use a non-empty placeholder if your engine treats them differently. |

## Configuration

```json
"type": "db_add_row",
"config": {
    "position": "<append|prepend|<numeric index>>",
    "index": "<resultset index (MySQL only)>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `position` | No | `append` | Where to insert the new row. See [Position Semantics](#position-semantics). |
| `index` | No | unset (all resultsets) | **MySQL only.** Which resultset to modify when the recorded response carries more than one. If unset, the row is added to every resultset. If the index is out of range, no resultset is modified. Must be a parseable integer — chain init fails with `invalid index value: ...` otherwise. |

### Position Semantics

| `position` value | PostgreSQL behavior | MySQL behavior |
|---|---|---|
| `append` (default) | Insert as the last data row, immediately before the trailing `CommandComplete` message if present. | Insert as the last row of the targeted resultset(s). |
| `prepend` | Insert as the first message in the `QueryResponse.Messages` slice — **before** any `RowDescription`. Most clients still accept this but it is unusual; consider numeric `position` to land after the row description. | Insert as the first row of the targeted resultset(s). |
| `"0"`, `"1"`, `"2"`, … | Numeric index into the **messages slice** (not just data rows). For example, `position="1"` lands the new row after a leading `RowDescription` but before the first existing `DataRow`. Out-of-range or negative indices fall back to `append`. | Numeric index into the **rows slice** of the targeted resultset(s). Out-of-range falls back to `append`. |

The PostgreSQL numeric-index semantics differ from MySQL's — Postgres counts messages (which interleaves `RowDescription`, `DataRow`s, and `Complete`), MySQL counts rows. When in doubt for PostgreSQL, use `append` and rely on the automatic `Complete`-tag-preserving placement.

## Row Values Format

The values to insert come **from the transform chain**, not from `db_add_row`'s own config. The transform expects them as a JSON array of strings — exactly one entry per column:

```json
["new-user-456","Jane","Smith","jane@example.com"]
```

Variable substitution runs against this string before it is parsed, so the array can reference cache variables:

```json
["user-${{var:current_user_id}}","${{var:first_name}}","${{var:last_name}}","${{var:email}}"]
```

If the supplied string isn't valid JSON or isn't an array of strings, the transform returns `failed to unmarshal values as JSON array`.

The simplest way to feed values in is a [`constant`](./constant.md) downstream of `db_add_row`:

```
res_body() → db_add_row() → constant(value="[\"new1\",\"new2\"]")
```

Any chain that produces a JSON array of strings as its output works — `csv_iter`, `rand_string`, computed templates, etc.

## Examples

### Example 1 — Append a row to a PostgreSQL response

Recorded response (abbreviated):

```json
{
  "query": {
    "messages": [
      { "rowDescription": { "fields": [{ "name": "col1" }, { "name": "col2" }] } },
      { "dataRow": { "values": [{ "asString": "original1" }, { "asString": "original2" }] } },
      { "complete": { "tag": "SELECT 1" } }
    ]
  }
}
```

Chain:

```
res_body() → db_add_row() → constant(value="[\"new1\",\"new2\"]")
```

After the transform:

- A second `dataRow` with values `new1`, `new2` is appended **before** the `complete` message.
- The `complete` tag is updated to `SELECT 2`.

### Example 2 — Prepend on a MySQL text resultset

```
res_body() → db_add_row(position="prepend") → constant(value="[\"prepended.com\",\"99\"]")
```

The first row of the (single) recorded MySQL text resultset becomes `["prepended.com", "99"]`; the original rows shift down by one.

### Example 3 — Insert into the second of three MySQL resultsets

```json
"type": "db_add_row",
"config": {
    "index": "1",
    "position": "append"
}
```

Only the resultset at zero-based index `1` is modified. The others are returned unchanged.

### Example 4 — NULL columns via missing values

Recorded PostgreSQL response has three columns. Chain supplies two values:

```
res_body() → db_add_row() → constant(value="[\"a\",\"b\"]")
```

The new row has three `Value` entries: `asString="a"`, `asString="b"`, and an empty `Value` (NULL). An empty string in either supplied position would also produce NULL — `["a","","c"]` yields a row where column 2 is NULL, not the string `""`.

### Example 5 — Variable-substituted row values

```
res_body() → db_add_row() → constant(value="[\"user-${{var:user_id}}\",\"${{var:first_name}}\",\"${{var:last_name}}\"]")
```

The cache variables are resolved when `db_add_row.Insert` runs, so values learned earlier in the chain (e.g. from a `smart_replace` mapping or a previous response) flow into the new row.

## Common Misconceptions

1. **"Values are comma-separated strings."**
   No. Values are a **JSON array of strings**. `["a","b","c"]`, not `a,b,c`. The chain step that produces them must emit valid JSON.

2. **"`position` controls where the new row lands among data rows."**
   For MySQL, yes — numeric `position` is an index into the rows slice. For PostgreSQL, numeric `position` is an index into the **messages slice**, which includes `RowDescription` and other non-row messages. `append` and `prepend` are the safe choices when you don't want to think about message ordering.

3. **"It works on extended-query (`ExecuteResponse`) PostgreSQL traffic."**
   The transform detects and modifies simple-query responses (top-level `"query"`). Extended-query responses with a different top-level shape will fall into the `unable to detect database tech` branch.

4. **"It re-types the new row's values from the supplied strings."**
   No. New values are always written as strings (`AsString` for both Postgres and MySQL). The recorded **column type** is copied across (for MySQL) so the wire format reads correctly; the **value encoding** is string-only. For PostgreSQL, the per-column choice between `asString` and `asBytes` is taken from the template row.

5. **"`index` works on PostgreSQL too."**
   No. `index` is MySQL-only. PostgreSQL responses are single result sets in this transform; `index` is silently ignored.

6. **"An empty string inserts a literal empty value."**
   No. An empty supplied value is treated as NULL. Use a placeholder if your engine distinguishes the two.

7. **"It modifies the row count metadata too."**
   Only for PostgreSQL `Complete` tags that start with `SELECT `. MySQL row counts are derived from the resultset rows themselves and update automatically. PostgreSQL `INSERT`/`UPDATE`/`DELETE` tags are left alone.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `invalid index value: ...` | `index` is not a parseable integer | Set `index` to a number (as a string) or omit it |
| Runtime: `no source JSON stored - Mutate must be called before Insert` | `db_add_row` is placed where the first phase never receives a response body | Make sure `res_body()` (or another response-side extractor) is the chain's source, and that `db_add_row` is in the chain that handles it |
| Runtime: `unable to detect database tech from JSON structure` | The response body isn't a Postgres `QueryResponse` or MySQL `*Resultsets` shape | Verify the recording protocol; extended-query PostgreSQL and non-DB JSON are not supported |
| Runtime: `failed to unmarshal values as JSON array` | Downstream transforms produced something other than a JSON array of strings | Wrap row values in `[...]`; remember strings need quoting |
| Runtime: `failed to unmarshal postgres Response` / `MySQLTextResultsets` / `MySQLBinaryResultsets` | The recorded response JSON is malformed | Re-record the traffic or inspect the action file |
| New row appears with all NULLs | Empty strings or no values supplied | Confirm the JSON array contains the expected number of non-empty entries |
| Postgres `Complete` tag still says the original count | The tag did not start with `SELECT ` | Expected — only `SELECT N` tags are auto-incremented |
| Numeric `position` lands in the wrong place on PostgreSQL | Index counts all messages, not just data rows | Use `append`/`prepend`, or pick an index that accounts for `RowDescription` |
| MySQL row added to every resultset when only one was wanted | `index` is unset | Set `index` to the target resultset's zero-based position |
| MySQL row not added at all when `index` is set | Out-of-range index | Check the resultset count; out-of-range silently skips |

## Related Transforms

- [`constant`](./constant.md) — the typical source of the JSON array of row values.
- [`csv_iter`](./csv_iter.md) — feed a different row on each replay iteration.
- [`rand_string`](./rand_string.md) — generate synthetic row values per replay.
- [`smart_replace`](./smart_replace.md) — propagate values from the inserted row across the RRPair (e.g. an injected `userId` that needs to show up in later request paths).

## Advanced Notes

- The recorded response is required on the RRPair. The transform reports `RequiresResponses() = true` so the chain runner won't dispatch it without one. Chains that target requests only will never see this transform run.
- Variable substitution is applied to the **values JSON string** as a whole before parsing, not per element. This means `${{...}}` references in the string can contain commas or quotes as long as the post-substitution string is still a valid JSON array of strings.
- PostgreSQL `prepend` puts the new `DataRow` at message index 0, which precedes the `RowDescription`. Most drivers still parse the response correctly, but `position="1"` is a more conventional choice when a `RowDescription` is present.
- For MySQL, when the targeted resultset has zero existing rows, the column count comes from the resultset's column descriptors (not from the supplied values). Supplying fewer or more values than the descriptor count is handled the same way as the row-template case — pad with NULL, truncate the surplus.
- The transform makes no attempt to recompute MySQL field byte lengths or other low-level wire metadata beyond what the protocol marshaller produces from the typed value — recorded payloads that depend on exact byte-positions for the new row may need a re-record.
