---
description: "Extract one value a recorded SQL Server RPC binds to its statement with mssql_param, such as an @P0 of an sp_executesql or a stored procedure parameter, to reuse or rewrite it in a transform chain."
sidebar_position: 21
---

# mssql_param

### Purpose

**mssql_param** extracts one value that a recorded SQL Server RPC binds to its statement: a parameter of an `sp_executesql`, `sp_prepexec` or `sp_execute`, or of a stored procedure called by name. Pair it with [var_store](../transforms/variable_store.md) to reuse the value, for example in a mocked result, or with a transform that rewrites it.

It applies only to requests, and only to RPCs. SQL batches carry their values as literals in the T-SQL; reach those with [sql_literal](./sql_literal.md). To make a mock match on bound values, use [sql_key_params](../transforms/sql_key_params.md).

### Usage

```json
"type": "mssql_param",
"config": {
    "index": "1"
}
```

- **index** - the position of the bound value, counting from 1. The statement and parameter declaration an `sp_executesql` or `sp_prepexec` sends first, and the handle an `sp_execute` sends first, are not counted, so `@P0` is 1.
- **name** - (optional, instead of **index**) the parameter's name, such as `@id`, with or without the `@`.

The extracted value is text, as SQL Server Management Studio shows it: numbers in decimal, `bit` as 1 or 0, binary as `0x` hex, dates in ISO 8601, and `NULL` as an empty value. When a transform writes a new value, it keeps the parameter's type, and a value that does not fit the type, such as letters for an `int`, is an error.

### Example

Store the order id an `sp_executesql` lookup asks for, its first bound value, in a variable:

```json
{
    "filters": {"filters": [{"include": true, "detectedLocation": "FROM dbo.orders WHERE id", "operator": "CONTAINS"}]},
    "extractor": {"type": "mssql_param", "config": {"index": "1"}},
    "transforms": [{"type": "var_store", "config": {"name": "order_id"}}]
}
```

See [Record SQL Server](/proxymock/databases/record/sqlserver#mock) for mocking SQL Server.
