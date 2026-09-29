---
description: "Make a Postgres or MySQL mock match however many items an IN list or VALUES carries, with the sql_collapse_lists transform."
sidebar_position: 36
---

# sql_collapse_lists

The `sql_collapse_lists` transform makes a Postgres or MySQL mock match however many items an IN list or a multi-row VALUES carries.

- **Transform type name (config/API):** `sql_collapse_lists`
- **Shorthand format:** `sql_collapse_lists()`
- **Where it has effect:** mock (responder) only. It changes the mock signature, not the recording or the request.

## Quick Start

```json
{
  "extractor": { "type": "sql_query" },
  "transforms": [{ "type": "sql_collapse_lists" }]
}
```

## How It Works

The contents of every `IN (...)` list and all the rows of a `VALUES (...), (...)` list become a single `(?)`. Every other literal is kept, so the statement still has to match on them. An `IN (SELECT ...)` subquery is left alone.

The transform rewrites the SQL statement in the signature of Postgres and MySQL requests and passes the token through unchanged, so the statement the recording shows and the statement the app sends stay as written. Chains of SQL transforms compose: each one starts from the statement the previous one left in the signature. On any other traffic, and during load generation, it does nothing.

## Example

Recorded:

```sql
SELECT id FROM orders WHERE tenant = 3 AND status IN ('new', 'paid')
```

Live request:

```sql
SELECT id FROM orders WHERE tenant = 3 AND status IN ('shipped')
```

Both are matched on:

```sql
SELECT id FROM orders WHERE tenant = 3 AND status IN (?)
```

## When To Use It

Use it for batch lookups and batch inserts whose size varies from run to run, when the other values in the statement should still decide the match.

## Related

- [Matching SQL mocks](../../mocking/sql-matching.md) explains what SQL mocks match on by default and when the mock server falls back to looser matches.
- [`sql_query`](../extractors/sql_query.md) is the extractor to pair it with.
