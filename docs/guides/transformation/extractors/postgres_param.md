---
description: "Extract one parameter of a recorded PostgreSQL prepared statement with postgres_param, so a replay can regenerate values such as unique keys instead of repeating the recorded ones."
sidebar_position: 21
---

# postgres_param

### Purpose

**postgres_param** extracts one parameter of a recorded PostgreSQL prepared statement. Pair it with a transform such as [rand_string](../transforms/rand_string.md) to send a new value on every replay, for example a unique email that would otherwise fail with `23505 duplicate key value violates unique constraint` the second time it is inserted.

It applies only to requests, and only to recorded statement executions and the Bind messages they carry. Other RRPairs are left alone.

### Usage

```json
"type": "postgres_param",
"config": {
    "index": "3"
}
```

- **index** - the placeholder number in the statement, so `3` selects `$3`.

The extracted value is text, and `NULL` is an empty value. Parameters your client sent in binary format are decoded for common types such as integers, floats, booleans, dates, timestamps and UUIDs. When a transform writes a new value, the parameter is sent in text format, so PostgreSQL parses it for the parameter's type and converts or rejects it as it would a literal in the statement.

### Example

Regenerate the email, `$3`, of every replayed user insert:

```json
{
    "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
    "extractor": {"type": "postgres_param", "config": {"index": "3"}},
    "transforms": [{"type": "rand_string", "config": {"pattern": "[a-z0-9]{12}@load\\.test"}}]
}
```

See [PostgreSQL Load and Regression Testing](/proxymock/guides/postgres-load-testing#regenerate) for the full walkthrough.
