---
description: "Extract one parameter of a recorded MySQL prepared statement with mysql_param, so a replay can regenerate values such as unique keys instead of repeating the recorded ones."
sidebar_position: 20
---

# mysql_param

### Purpose

**mysql_param** extracts one parameter of a recorded MySQL prepared statement execution. Pair it with a transform such as [rand_string](../transforms/rand_string.md) to send a new value on every replay, for example a unique email that would otherwise fail with `1062 Duplicate entry` the second time it is inserted.

It applies only to requests, and only to recorded statement executions. Other RRPairs are left alone.

### Usage

```json
"type": "mysql_param",
"config": {
    "index": "3"
}
```

- **index** - the position of the `?` placeholder in the statement, counting from 1.
- **name** - (optional, instead of **index**) the name of a parameter set with MySQL query attributes.

The extracted value is text: numbers in decimal, dates as MySQL literals such as `2026-04-30 09:15:00`, and `NULL` as an empty value. When a transform writes a new value, it keeps the recorded type if the value fits, so an integer column still gets an integer. Anything else is sent as a string, which MySQL converts or rejects as it would a literal in the statement.

### Example

Regenerate the email, the third placeholder, of every replayed user insert:

```json
{
    "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
    "extractor": {"type": "mysql_param", "config": {"index": "3"}},
    "transforms": [{"type": "rand_string", "config": {"pattern": "[a-z0-9]{12}@load\\.test"}}]
}
```

See [MySQL Load and Regression Testing](/proxymock/guides/mysql-load-testing#regenerate) for the full walkthrough.
