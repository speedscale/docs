---
description: "How Speedscale and proxymock match Postgres and MySQL mocks, what they ignore by default, and the SQL transforms that make a mock match on the values that matter."
sidebar_position: 7
---

# Matching SQL mocks

When your app queries Postgres or MySQL during a replay, the mock server looks for a recording of the same statement and answers with it. This page explains what counts as the same statement, what the mock server already ignores for you, and how to tune matching with the SQL transforms.

## What a SQL mock matches on

A Postgres or MySQL mock matches on the kind of message (a query, a prepare, an execute, and so on) and on the SQL statement, normalized so that whitespace and comments do not matter.

Two things are deliberately left out:

- **Statement and portal names.** Drivers name prepared statements per connection, such as `S_1` from JDBC or `lrupsc_3_0` from pgx, so the same statement gets a different name on every run. Speedscale ignores these names, including in recordings made before this behavior existed.
- **Bound parameter values.** The values sent with a prepared statement, such as the id in `WHERE id = $1`, are not part of the match. Every execute of the statement matches every recording of it, and the recordings are served in turn. Use [`sql_key_params`](#match-each-value-to-its-own-recording) when the value should pick the recording.

Transaction control does not need a recording at all. `BEGIN`, `COMMIT`, `ROLLBACK`, `SET`, `SAVEPOINT`, `RELEASE SAVEPOINT` and `DEALLOCATE` are answered by the mock server directly, so savepoint names that an ORM generates per transaction never cause a miss.

## When nothing matches exactly

If no recording matches a statement exactly, the mock server tries two looser matches before it reports a miss:

1. **Fingerprint.** Every literal and bound parameter is masked, and IN lists and multi-row VALUES are collapsed. `WHERE id = 42`, `WHERE id = 7` and `WHERE id = $1` all match each other.
2. **Shape.** For a SELECT, the list of selected columns is also ignored, so a statement still matches after your code adds or reorders a column.

A looser match answers with any recording of the same statement, which may hold a different row. That is usually better than a miss, but the data may not be what the replay expects. Each mock served this way carries a `matchTier` tag of `fingerprint` or `shape` in the mock output, so you can find them and decide whether to make the match exact with a transform.

## Tuning matching with transforms

The SQL transforms change only the mock signature, the key the mock server matches on. The recording and the live request keep the statement as written. Pair each of them with the [`sql_query`](../transformation/extractors/sql_query.md) extractor, and add them as mock (responder) transforms.

| Transform | Makes a mock match |
|---|---|
| [`sql_key_params`](../transformation/transforms/sql_key_params.md) | Only the parameter values it was recorded with |
| [`sql_fingerprint`](../transformation/transforms/sql_fingerprint.md) | Whatever literal values the statement carries |
| [`sql_collapse_lists`](../transformation/transforms/sql_collapse_lists.md) | However many items an IN list or VALUES carries |
| [`sql_strip_pagination`](../transformation/transforms/sql_strip_pagination.md) | Any LIMIT, OFFSET or FETCH value |
| [`sql_shape`](../transformation/transforms/sql_shape.md) | Whatever columns a SELECT lists |

Three SQL extractors let the rest of the transform library work on database traffic:

- [`sql_query`](../transformation/extractors/sql_query.md) reads the statement of any Postgres or MySQL request.
- [`sql_literal`](../transformation/extractors/sql_literal.md) reads or rewrites one literal in a statement, for example to send a new unique value on every replay.
- [`sql_column`](../transformation/extractors/sql_column.md) reads or rewrites one cell of a query result, so `date` or `rand_string` can fix up timestamps and generated ids in mock responses.

## Match each value to its own recording

A service that looks up users by id with a prepared statement is the common case. Without keyed parameters, the three recordings of `SELECT name FROM users WHERE id = $1` are served in rotation, so a replay that asks for ids in a different order gets the wrong users.

This proxymock blueprint keys lookups on their parameters and ignores paging. Save it as `proxymock/blueprints/sql-keys.json` in your workspace:

```json
{
  "id": "sql-keys",
  "name": "Key lookups on their parameters, ignore paging",
  "active": true,
  "tokenizeConfig": {
    "responder": [
      {
        "extractor": { "type": "sql_query" },
        "transforms": [{ "type": "sql_key_params" }]
      },
      {
        "extractor": { "type": "sql_query" },
        "transforms": [{ "type": "sql_strip_pagination" }]
      }
    ]
  }
}
```

With ids 1, 2 and 3 recorded and a replay that asks for 3, 1 and 2:

| Replay asks for | Without the blueprint | With the blueprint |
|---|---|---|
| id 3 | user1 | user3 |
| id 1 | user2 | user1 |
| id 2 | user3 | user2 |

An id that was never recorded still gets an answer. The mock server drops the keyed parameters when it falls back to a fingerprint match, so the lookup is served by a recording of the same statement instead of missing.

`sql_key_params` leaves date and time parameters out by default, because they differ on every run. List positions in `params` to key on exactly those, or in `exclude` to leave some out.

## Limits

- `sql_column` changes text-format cells only. Postgres drivers such as pgx often ask for binary results on prepared statements, and those cells are skipped.
- `sql_column` finds columns by name only where the response carries column names: a Postgres simple query or any MySQL result. Select Postgres prepared-statement columns by position.
- `sql_literal` counts string and number literals. MySQL strings in double quotes are read as identifiers and are not counted.
