---
description: "Extract or rewrite one string or number literal in a Postgres or MySQL statement with the sql_literal extractor."
sidebar_position: 22
---

# sql_literal

### Purpose

**sql_literal** extracts one string or number literal from the SQL statement of a Postgres or MySQL request. Inserting a value rewrites that literal in the statement.

### Usage

```json
"extractor": {
  "type": "sql_literal",
  "config": {
    "index": "2"
  }
}
```

| Parameter | Required | Description |
|---|---|---|
| `index` | Yes | The literal's position in the statement, counting from 1. |

String literals are extracted without their quotes, and a doubled quote comes back as one. In MySQL, backslash escapes such as `\'` are undone too, and backslashes in a new value are escaped when it is written. Bind placeholders such as `$1` and `?`, booleans, and NULL are not counted. MySQL strings in double quotes are read as identifiers and are not counted either.

When a new value is inserted, a number literal stays a number if the new value is numeric. Anything else is written as a quoted string.

### Examples

In `SELECT name FROM users WHERE tenant = 3 AND token = 'x1'`, index 1 extracts `3` and index 2 extracts `x1`.

To send a fresh unique value on every replay of a statement that writes it inline:

```
sql_literal(index=2) -> rand_string(pattern=tok-[a-z0-9]{8})
```

To make a mock ignore one literal while still matching on the others, set it to the same value on both sides:

```
sql_literal(index=2) -> constant(new=any)
```

## Related

- [Matching SQL mocks](../../mocking/sql-matching.md) explains how SQL mocks match and how the SQL transforms change that.
