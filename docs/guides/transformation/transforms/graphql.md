---
description: "Address a value inside a GraphQL request by semantic path with the graphql transform in Speedscale — variables, arguments and operation names — let downstream transforms rewrite it, then write it back into the document."
sidebar_position: 11.1
---

# graphql

The `graphql` transform extracts a value from a GraphQL request by *semantic path* — `variables.email`, `createUser.args.input.plan`, `operationName` — and acts as a window onto that value for the rest of the chain. Downstream transforms see a plain scalar; when they are done, `graphql` writes the new value back into the document, preserving the value's GraphQL kind.

It is the GraphQL counterpart to [`json_path`](./json_path.md), and it is how nearly every GraphQL chain begins.

- **Transform type name (config/API):** `graphql`
- **Shorthand format:** `graphql(path=...)` or `graphql(path=...,op=...)`
- **Path syntax:** [Speedscale's GraphQL semantic paths](../../graphql/semantic-paths.md)
- **Side:** request bodies. A GraphQL response is ordinary JSON — use [`json_path`](./json_path.md) for it.

## Quick Start

Replace a value carried in `variables`:

```json
"type": "graphql",
"config": {
    "path": "variables.token"
}
```

Replace a literal written into the query text, naming the operation because the document defines several:

```
req_body() → graphql(path="createUser.args.input.plan", op="CreateUser") → constant(new="enterprise")
```

The chain extracts `pro`, hands it to `constant`, and writes `enterprise` back into the same argument.

## How It Works

Like `json_path`, the transform is a bookend around the rest of the chain.

1. **First phase** — parse the request body, resolve the semantic path, and return the value as a plain scalar. The parsed document is remembered for re-insertion.
2. **Second phase** — take what the downstream chain produced, convert it to a node of the same GraphQL kind as the value it replaces, put it back in the document, and re-serialize the body.

```
input:  {"query":"mutation { createUser(input: {plan: \"pro\"}) { id } }", ...}
        └─ 1st phase, path="createUser.args.input.plan": extracted = "pro"
        └─ downstream transforms produce "enterprise"
        └─ 2nd phase: writes it back into the argument
output: {"query":"mutation { createUser(input: {plan: \"enterprise\"}) { id } }", ...}
```

### Body forms

A GraphQL request reaches transforms in one of two shapes, and the transform accepts both and writes back in the form it received:

| Form | Where it comes from |
|---|---|
| **AST JSON** | The `req_body` extractor's representation of a captured GraphQL request — what a chain sees during replay and analysis. |
| **Raw** | The request as it goes on the wire: `{"query": "mutation { ... }", "variables": {...}}`. |

You do not choose between them; the transform detects which it was handed.

### Type preservation

The replacement node keeps the kind of the value it replaces, so an edit cannot turn a valid document into one the server rejects for a type error:

| Original | New value |
|---|---|
| String | Used as-is. |
| Int | Must parse as an integer, or the transform errors. |
| Float | Must parse as a float, or the transform errors. |
| Boolean | Must parse as a boolean, or the transform errors. |
| Enum | Used as-is, as an enum value. |
| Variable reference | Cannot be replaced — target the variable instead (see below). |
| Object / list | Cannot be replaced wholesale — target a scalar inside it. |

For `variables.` paths the JSON type is preserved instead, exactly as [`json_path`](./json_path.md#type-preservation) does it.

### Arguments supplied by a variable

An argument written as `input: {email: $email}` holds a reference, not a literal. Reading it returns `$email`; writing to it fails with a message naming the path to use:

```
argument references variable $email; target variables.email instead
```

This is deliberate: rewriting the reference would decouple the request from the variable the client actually sends.

### Missing paths

A path that cleanly resolves to nothing — an argument that is not passed, a field that is not selected, a variables key that is absent — leaves the request untouched rather than failing the chain, so one chain can sweep a snapshot of mixed operations. Structural problems (an ambiguous field, an unknown fragment, an `op` that names no operation) are errors.

### Persisted queries

A request that carries only a persisted-query hash has no document to address. Document paths find nothing and the request passes through unmodified; `variables.` paths still work. See [Persisted queries](../../graphql/index.md#persisted-queries).

## Configuration

```json
"type": "graphql",
"config": {
    "path": "<semantic path>",
    "op": "<operation name>",
    "create": "<boolean>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `path` | **Yes** | — | The semantic path to the value. Missing config fails chain initialization. |
| `op` | No | — | Which operation the path applies to, when the document defines more than one. Defaults to the envelope's `operationName`. |
| `create` | No | `false` | Create the value if it is missing. Applies to `variables.` paths only — document nodes cannot be synthesized. Note this default is the opposite of `json_path`'s. |

`path` supports `${{...}}` variable substitution, resolved at runtime against the variable cache.

## Examples

### Example 1 — Replace a variable

```
req_body() → graphql(path="variables.email") → constant(new="z@y.com")
```

- Input: `{"query":"mutation CreateUser($email: String!) { ... }","variables":{"email":"a@b.com"}}`
- Output: the same request with `variables.email` set to `z@y.com`.

### Example 2 — Replace an inline argument

```
req_body() → graphql(path="createUser.args.input.plan") → constant(new="enterprise")
```

- Input: `createUser(input: {email: $email, plan: "pro"})`
- Output: `createUser(input: {email: $email, plan: "enterprise"})`

### Example 3 — Rename the operation

```
req_body() → graphql(path="operationName") → constant(new="MakeUser")
```

Both the envelope's `operationName` and the matching operation definition in the document are renamed, so the request stays executable.

### Example 4 — Pick one of several operations

```
req_body() → graphql(path="user.args.id", op="GetUser") → rand_string(pattern="u-[0-9]{3}")
```

Without `op`, a document defining both `GetPlans` and `GetUser` fails with `document has 2 operations; set op to choose one`.

### Example 5 — A value inside a named fragment

```
req_body() → graphql(path="fragment.UserFields.avatar.args.size") → constant(new="small")
```

### Example 6 — JSON embedded in an argument

```
req_body()
  → graphql(path="trackEvent.args.payload")
  → json_path(path="client.os")
  → constant(new="linux")
```

The `graphql` transform yields the argument's string; `json_path` addresses inside it. Both re-insert in reverse order on the way back out.

## Common Misconceptions

1. **"It works on GraphQL responses."**
   It does not, and does not need to. Responses are plain JSON — use `res_body()` with `json_path`.

2. **"The path is a JSONPath into the AST."**
   No. It is a semantic path. Positional AST paths with `json_path` still work for backward compatibility, but see [Migrating legacy AST-path chains](../../graphql/recipes.md#migrating-legacy-ast-path-chains).

3. **"`create` works like `json_path`'s."**
   It defaults to `false` and only applies to `variables.` paths. A selection or argument the query never contained is not invented.

4. **"An ambiguous field picks the first match."**
   It errors. Add an alias in the client, or address the value through its variable.

5. **"A missing path fails the replay."**
   It leaves the request alone. This is what lets one chain cover a snapshot of mixed operations.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `missing parameter path` | `path` not set | Add `"path": "..."` |
| `body is not a GraphQL request` | The chain ran against traffic that is not GraphQL, or against a response | Scope the chain with an endpoint filter; use `json_path` for responses |
| `document has N operations; set op to choose one` | Multi-operation document, no `operationName` in the envelope | Set `op` |
| `field "x" is ambiguous (N matches)` | The same field label appears more than once in the selection set | Alias the field in the client, or target its variable |
| `argument references variable $x` | The argument holds a variable reference, not a literal | Target `variables.x` |
| `new value "abc" is not an Int` | The downstream chain produced text that does not fit the argument's kind | Produce a value of the right kind |
| `the operation type is read-only` | Writing to `operation` | Read it if you need it; `query`/`mutation` cannot be rewritten |
| Nothing changed, no error | The path resolved cleanly to nothing, or the request is a persisted query | Check the path against the **Raw** tab; see [Persisted queries](../../graphql/index.md#persisted-queries) |

## Related Transforms

- [`graphql_delete`](./graphql_delete.md) — remove a selection or argument instead of rewriting it.
- [`json_path`](./json_path.md) — the JSON counterpart, and what chains after `graphql` when a JSON document is embedded in an argument.
- [`smart_replace`](./smart_replace.md) — propagate a value extracted from a GraphQL request across the rest of the RRPair.

## Advanced Notes

- The transform does not require recorded response data.
- `path` is re-resolved on both phases against the variable cache, so a `${{var:...}}` reference picks up whichever value is current at each phase.
- Renaming `operationName` also renames the matching operation definition, keeping the envelope and the document consistent.
- Inline fragments are transparent to a path; named fragments are addressed explicitly with the `fragment.<Name>` prefix.
