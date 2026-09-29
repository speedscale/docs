---
description: "Make a Postgres or MySQL mock match whatever columns a SELECT lists, with the sql_shape transform."
sidebar_position: 38
---

# sql_shape

The `sql_shape` transform makes a Postgres or MySQL mock match whatever columns a SELECT lists.

- **Transform type name (config/API):** `sql_shape`
- **Shorthand format:** `sql_shape()`
- **Where it has effect:** mock (responder) only. It changes the mock signature, not the recording or the request.

## Quick Start

```json
{
  "extractor": { "type": "sql_query" },
  "transforms": [{ "type": "sql_shape" }]
}
```

## How It Works

The select list of every top-level SELECT becomes `*`. Subqueries and the bodies of WITH clauses are kept, because they change what the statement reads. Statements other than SELECT are unchanged.

The transform rewrites the SQL statement in the signature of Postgres and MySQL requests and passes the token through unchanged, so the statement the recording shows and the statement the app sends stay as written. Chains of SQL transforms compose: each one starts from the statement the previous one left in the signature. On any other traffic, and during load generation, it does nothing.

## Example

Recorded:

```sql
SELECT id, name FROM users WHERE id = 1
```

Live request:

```sql
SELECT id, name, email FROM users WHERE id = 1
```

Both are matched on:

```sql
SELECT * FROM users WHERE id = 1
```

## When To Use It

Use it when your code adds, removes or reorders selected columns between the recording and the replay, for example after an ORM upgrade.

The mock still answers with the recorded columns. If the app now reads a column the recording does not have, it will not find it, so record again once the change settles.

## Related

- [Matching SQL mocks](../../mocking/sql-matching.md) explains what SQL mocks match on by default and when the mock server falls back to looser matches.
- [`sql_query`](../extractors/sql_query.md) is the extractor to pair it with.
