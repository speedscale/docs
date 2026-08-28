---
description: "Reference for Speedscale's GraphQL semantic path grammar: address variables, arguments, selections, operation names and fragments inside a GraphQL request by meaning instead of by AST position."
sidebar_position: 1
---

# Semantic paths

A semantic path addresses a value inside a GraphQL request by what it *means* rather than by where it sits in the parsed document. It is what the [`graphql`](../transformation/transforms/graphql.md) and [`graphql_delete`](../transformation/transforms/graphql_delete.md) transforms take as their `path`.

The same value addressed both ways:

```
semantic:  createUser.args.input.plan
AST JSON:  query.Definitions.0.SelectionSet.Selections.0.Arguments.0.Value.Fields.1.Value.Value
```

The AST path breaks the moment an argument is added, a field is reordered, or the client library changes its output. The semantic path does not.

## Grammar

| Path | Addresses |
|---|---|
| `operation` | The operation type — `query`, `mutation`, `subscription`. Read-only. |
| `operationName` | The envelope's `operationName`. |
| `variables.<gjson path>` | A value inside the `variables` JSON object. |
| `<selection path>` | A field selection. Only [`graphql_delete`](../transformation/transforms/graphql_delete.md) accepts a path that stops here — a selection is not a value. |
| `<selection path>.args.<arg path>` | An argument value. |
| `fragment.<Name>.<selection path>.args.<arg path>` | The same, inside a named fragment definition. |

`<selection path>` is dotted field names descending the selection set. `<arg path>` starts with an argument name and then descends input objects by field name and lists by index.

## Examples

Against this request:

```graphql
mutation CreateUser($email: String!) {
  createUser(input: {email: $email, plan: "pro", retries: 3, tags: ["beta", "early"]}) {
    id
    profile { avatar(size: "large") }
    __typename
  }
}
```

```json
{ "operationName": "CreateUser", "variables": { "email": "a@b.com" } }
```

| Path | Value |
|---|---|
| `operation` | `mutation` |
| `operationName` | `CreateUser` |
| `variables.email` | `a@b.com` |
| `createUser.args.input.plan` | `pro` |
| `createUser.args.input.retries` | `3` |
| `createUser.args.input.tags.0` | `beta` |
| `createUser.args.input.email` | `$email` — see [Arguments that reference a variable](#arguments-that-reference-a-variable) |
| `createUser.profile.args.size` | `large` |
| `createUser.__typename` | the selection itself — deletable, not editable |

## Rules

### Alias before name

A field is addressed by its alias when it has one, and by its name otherwise. In this query the two selections are `me` and `teammate`, not `user` twice:

```graphql
query Dashboard {
  me: user(id: "u-1") { id }
  teammate: user(id: "u-2") { id }
}
```

`teammate.args.id` addresses `u-2`. This is the intended way to disambiguate a repeated field: add an alias in the client, or address the value through a variable instead.

### Inline fragments are transparent

Fields inside `... on Type { }` are reached as though the inline fragment were not there:

```graphql
query Find($q: String!) {
  search(q: $q) {
    ... on User { profile(scope: "public") { id } }
  }
}
```

`search.profile.args.scope` addresses `public`. Named fragments are *not* transparent — they are separate definitions, addressed with the `fragment.<Name>` prefix.

### Ambiguity is an error

If a path segment matches more than one field in the same selection set — the union case above, or a repeated field with no alias — resolution fails with `field "x" is ambiguous (2 matches); use an alias to disambiguate` rather than silently picking one. A transform that guessed would corrupt a request in a way nothing downstream could catch.

### Choosing the operation

A document may define more than one operation. The transform's `op` setting picks which one a path applies to:

```json
"type": "graphql",
"config": { "path": "user.args.id", "op": "GetUser" }
```

Without `op`, the envelope's `operationName` chooses. If that is empty and the document defines exactly one operation, that one is used; if it defines several, resolution fails with `document has 2 operations; set op to choose one`.

`op` is ignored for `variables.` paths, which belong to the envelope rather than to any one operation.

### Missing paths

A path that resolves cleanly to nothing — a field that is not selected, an argument that is not passed, a variables key that is absent — is treated as *not applicable* rather than as an error, and the request passes through untouched. This matters when one chain sweeps a whole snapshot: operations that do not carry the field are skipped instead of failing the chain.

Structural problems are different, and do raise errors: ambiguity, an unknown fragment name, an `op` that names no operation in the document, or a segment that descends into something with no children.

### Type preservation

Writing a value back preserves the GraphQL kind of the value it replaced. A string stays a string, an enum stays an enum, and an `Int` that is handed non-numeric text fails rather than emitting an invalid document:

```
new value "abc" is not an Int (original argument is an Int)
```

For `variables.` paths the JSON type is preserved instead, the same way [`json_path`](../transformation/transforms/json_path.md) does it.

### Arguments that reference a variable

An argument written as `input: {email: $email}` holds no literal — it points at a variable. Reading such a path returns `$email`, and writing to it fails with a message naming the path to use instead:

```
argument references variable $email; target variables.email instead
```

Target `variables.email` and the value reaches the server through the variable, which is where the client intended it to come from.

### Composite values

A path must terminate on a scalar. Pointing at a whole input object or list and trying to replace it fails — descend to the field or index you actually mean. Reading one is allowed, and returns its GraphQL source text.

### Creating values

`create` applies only to `variables.` paths. Document nodes cannot be synthesized: a selection or argument that a query does not contain is one the server's schema may not accept, and inventing it would produce a request the recording never made.

## JSON embedded in an argument

APIs frequently pass a JSON document as a GraphQL string argument. Chain a `json_path` after the `graphql` transform — the semantic path yields the string, and `json_path` addresses inside it:

```
req_body()
  → graphql(path="trackEvent.args.payload")
  → json_path(path="client.os")
  → constant(new="linux")
```

Each layer re-inserts on the way back out, so the edited JSON is re-embedded in the argument and the argument back into the document. See [Recipes](./recipes.md#json-embedded-in-an-argument).
