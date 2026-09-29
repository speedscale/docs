---
description: "Make a Postgres or MySQL mock match its statement whatever literal values it carries, with the sql_fingerprint transform."
sidebar_position: 35
---

# sql_fingerprint

The `sql_fingerprint` transform makes a Postgres or MySQL mock match its SQL statement whatever literal values the statement carries.

- **Transform type name (config/API):** `sql_fingerprint`
- **Shorthand format:** `sql_fingerprint()`
- **Where it has effect:** mock (responder) only. It changes the mock signature, not the recording or the request.

## Quick Start

```json
{
  "extractor": { "type": "sql_query" },
  "transforms": [{ "type": "sql_fingerprint" }]
}
```

## How It Works

Every string and number literal and every bound parameter placeholder becomes `?`, and IN lists and multi-row VALUES collapse to a single `(?)`. This is exactly the fingerprint the mock server falls back to when nothing matches exactly, so adding the transform turns that fallback into the normal match for the statements it covers.

The transform rewrites the SQL statement in the signature of Postgres and MySQL requests and passes the token through unchanged, so the statement the recording shows and the statement the app sends stay as written. Chains of SQL transforms compose: each one starts from the statement the previous one left in the signature. On any other traffic, and during load generation, it does nothing.

## Example

Recorded:

```sql
SELECT name FROM users WHERE tenant = 3 AND id IN (1, 2)
```

Live request:

```sql
SELECT name FROM users WHERE tenant = 4 AND id IN (7)
```

Both are matched on:

```sql
SELECT name FROM users WHERE tenant = ? AND id IN (?)
```

## When To Use It

Use it when a driver writes values into the SQL text instead of binding them, and any recording of the statement is a good enough answer. If the mock output shows statements served with `matchTier` set to `fingerprint` and the answers are right, this transform makes those matches exact.

A fingerprint match answers with any recording of the same statement, whatever values it was recorded with. When the value should pick the recording, use [`sql_key_params`](./sql_key_params.md) for prepared statements or [`sql_literal`](../extractors/sql_literal.md) to keep one literal and mask the others.

## Related

- [Matching SQL mocks](../../mocking/sql-matching.md) explains what SQL mocks match on by default and when the mock server falls back to looser matches.
- [`sql_query`](../extractors/sql_query.md) is the extractor to pair it with.
