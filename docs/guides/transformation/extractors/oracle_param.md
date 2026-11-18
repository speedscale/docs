---
description: "Extract one value a recorded Oracle statement execution binds to its statement with oracle_param, such as a :1 or :id bind variable, to reuse or rewrite it in a transform chain."
sidebar_position: 21
---

# oracle_param

### Purpose

**oracle_param** extracts one value that a recorded Oracle statement execution binds to its statement, whether the SQL uses positional binds such as `:1` or named binds such as `:id`. Pair it with [var_store](../transforms/variable_store.md) to reuse the value, for example in a mocked result, or with a transform such as [rand_string](../transforms/rand_string.md) that rewrites it.

It applies only to requests, and only to statement executions that carry bind values. Values written into the SQL text as literals are not binds, so it does not read them.

### Usage

```json
"type": "oracle_param",
"config": {
    "index": "1"
}
```

- **index** - the position of the bind value, counting from 1 in the order the statement's bind variables appear, so the first bind is 1.
- **name** - (optional, instead of **index**) the bind variable's name, with or without its colon and in any case, such as `:id` or `ID`. `1` selects the bind `:1`.
- **row** - (optional) for an array insert, update or delete that binds several rows in one execution, which row to read, counting from 1. The default is the first row.

The extracted value is text, and a NULL value extracts as empty text. When a transform writes a new value, it keeps the bind's type, and a value that does not fit the type is an error. An OUT bind of a PL/SQL call has no value in the request, so it is not found.

### Example

Store the order id an Oracle lookup asks for, its first bind value, in a variable:

```json
{
    "filters": {"filters": [{"include": true, "detectedLocation": "FROM orders WHERE id", "operator": "CONTAINS"}]},
    "extractor": {"type": "oracle_param", "config": {"index": "1"}},
    "transforms": [{"type": "var_store", "config": {"name": "order_id"}}]
}
```

See [Record Oracle](/proxymock/databases/record/oracle#mock) for mocking Oracle.
