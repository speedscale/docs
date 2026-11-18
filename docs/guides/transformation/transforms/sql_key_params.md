---
description: "Make each recording of a Postgres, MySQL or SQL Server prepared statement answer only the parameter values it was recorded with, using the sql_key_params transform."
sidebar_position: 39
---

# sql_key_params

The `sql_key_params` transform adds the values bound to a Postgres, MySQL or SQL Server prepared statement to the mock signature, so each recording answers only the values it was recorded with.

- **Transform type name (config/API):** `sql_key_params`
- **Shorthand format:** `sql_key_params(params=...,exclude=...)`
- **Where it has effect:** mock (responder) only. It changes the mock signature, not the recording or the request.

## Quick Start

```json
{
  "extractor": { "type": "sql_query" },
  "transforms": [{ "type": "sql_key_params" }]
}
```

## How It Works

Without this transform, every execute of `SELECT name FROM users WHERE id = $1` matches every recording of it, and the recordings are served in turn. With it, the bound values become part of the signature, so an execute with id 7 is answered by the recording made with id 7.

It reads the parameters of Postgres bind and execute messages, MySQL statement executes and SQL Server RPCs. For an RPC such as `sp_executesql`, `sp_prepexec` or `sp_execute`, the positions count the values bound to the statement, such as `@P0` as 1, not the statement, declaration or handle the procedure takes first; for a stored procedure called by name, they count its parameters. Date and time parameters are left out by default because they differ on every run: Postgres parameters typed as a date, time, timestamp or interval, untyped Postgres parameters whose value reads as a date or timestamp, MySQL date, time, datetime and timestamp parameters, and SQL Server date, time, datetime, datetime2, smalldatetime and datetimeoffset parameters.

A value that was never recorded still gets an answer. When nothing matches exactly, the mock server drops the keyed parameters and falls back to a recording of the same statement.

## Configuration

| Parameter | Required | Default | Description |
|---|---|---|---|
| `params` | No | all | Comma-separated one-based positions to key on, such as `1,3`. When set, only these are used, dates and times included. |
| `exclude` | No | none | Comma-separated one-based positions never to key on. |

## Example

```json
{
  "extractor": { "type": "sql_query" },
  "transforms": [{ "type": "sql_key_params", "config": { "exclude": "2" } }]
}
```

With ids 1, 2 and 3 recorded and a replay that asks for 3, 1 and 2, the mock answers user3, user1 and user2. Without the transform it answers user1, user2 and user3.

## Related

- [Matching SQL mocks](../../databases/mock-a-database.md) walks through this example with a proxymock blueprint.
- The `postgres_param`, [`mysql_param`](../extractors/mysql_param.md), [`mssql_param`](../extractors/mssql_param.md) and [`oracle_param`](../extractors/oracle_param.md) extractors read a single parameter, for example to regenerate a unique value on every replay.
