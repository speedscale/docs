---
description: "Make a Postgres or MySQL mock match any LIMIT, OFFSET or FETCH value, with the sql_strip_pagination transform."
sidebar_position: 37
---

# sql_strip_pagination

The `sql_strip_pagination` transform makes a Postgres or MySQL mock match whatever page of results a statement asks for.

- **Transform type name (config/API):** `sql_strip_pagination`
- **Shorthand format:** `sql_strip_pagination()`
- **Where it has effect:** mock (responder) only. It changes the mock signature, not the recording or the request.

## Quick Start

```json
{
  "extractor": { "type": "sql_query" },
  "transforms": [{ "type": "sql_strip_pagination" }]
}
```

## How It Works

The numbers after `LIMIT`, `OFFSET` and `FETCH FIRST` or `FETCH NEXT` become `?`, including both numbers of the MySQL `LIMIT offset, count` form. Every other literal is kept.

The transform rewrites the SQL statement in the signature of Postgres and MySQL requests and passes the token through unchanged, so the statement the recording shows and the statement the app sends stay as written. Chains of SQL transforms compose: each one starts from the statement the previous one left in the signature. On any other traffic, and during load generation, it does nothing.

## Example

Recorded:

```sql
SELECT id FROM orders WHERE tenant = 3 ORDER BY id LIMIT 20 OFFSET 0
```

Live request:

```sql
SELECT id FROM orders WHERE tenant = 3 ORDER BY id LIMIT 20 OFFSET 40
```

Both are matched on:

```sql
SELECT id FROM orders WHERE tenant = 3 ORDER BY id LIMIT ? OFFSET ?
```

## When To Use It

Use it when a replay pages further or in a different order than the recording, and any recorded page is an acceptable answer.

## Related

- [Matching SQL mocks](../../mocking/sql-matching.md) explains what SQL mocks match on by default and when the mock server falls back to looser matches.
- [`sql_query`](../extractors/sql_query.md) is the extractor to pair it with.
