---
description: "Extract the SQL statement of a Postgres or MySQL request with the sql_query extractor."
sidebar_position: 21
---

# sql_query

### Purpose

**sql_query** extracts the SQL statement of a Postgres or MySQL request: a simple query, or the statement behind a prepare, describe, bind or execute.

### Usage

```json
"extractor": {
  "type": "sql_query"
}
```

It takes no configuration. It applies to requests only.

Pair it with the SQL signature transforms, such as [`sql_fingerprint`](../transforms/sql_fingerprint.md) or [`sql_key_params`](../transforms/sql_key_params.md), to tune how mocks match. Those transforms leave the statement unchanged. Any other transform that changes the extracted text rewrites the statement itself.

### Example

A request for `SELECT name FROM users WHERE id = $1`, sent as a prepared statement, extracts the text `SELECT name FROM users WHERE id = $1` from every message of that statement.

## Related

- [Matching SQL mocks](../../mocking/sql-matching.md) explains how SQL mocks match and how the SQL transforms change that.
