---
description: "Extract or rewrite one cell of a Postgres or MySQL query result with the sql_column extractor."
sidebar_position: 23
---

# sql_column

### Purpose

**sql_column** extracts one cell of a Postgres or MySQL result set, so transforms such as `date` or `rand_string` can fix up timestamps and generated ids in mock responses the same way they do in JSON bodies.

### Usage

```json
"extractor": {
  "type": "sql_column",
  "config": {
    "row": "1",
    "name": "created_at"
  }
}
```

| Parameter | Required | Description |
|---|---|---|
| `row` | No | The row, counting from 1 across every result set in the response. Defaults to 1. |
| `column` | One of `column` or `name` | The column position, counting from 1. |
| `name` | One of `column` or `name` | The column name. |

It applies to responses only. NULL extracts as an empty value and stays NULL when a transform passes it through unchanged.

### Limits

- Only text-format cells can be read and changed. Postgres drivers such as pgx often ask for binary results on prepared statements, and the extractor skips those cells.
- Column names are only available where the response carries them: a Postgres simple query or any MySQL result. A Postgres prepared statement describes its columns in a separate message, so select its columns by position.
- A MySQL prepared statement returns binary rows, where each cell keeps its column's type. A new value that does not fit the type, such as text in an integer column, is refused and the cell keeps its recorded value.
- A name selects the first column with that name. When a join returns two columns with the same name, select the later ones by position.

### Example

Shift a recorded timestamp to the time of the replay:

```
sql_column(row=1,name=created_at) -> date(layout=auto)
```

## Related

- [Matching SQL mocks](../../databases/mock-a-database.md) explains how SQL mocks match and how the SQL transforms change that.
