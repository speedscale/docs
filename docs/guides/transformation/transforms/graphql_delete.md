---
description: "Remove a selection, an argument or a variables key from a GraphQL request with the graphql_delete transform in Speedscale, including the field shorthand that strips __typename everywhere in a document."
sidebar_position: 11.2
---

# graphql_delete

The `graphql_delete` transform removes a node from a GraphQL request document: a field selection, an argument, a field inside an input object, an element of a list, or a key in `variables`. It is the GraphQL counterpart to the `json_delete` transform and the structural sibling of [`graphql`](./graphql.md), which rewrites values rather than removing them.

The reason it exists is signature drift. Client tooling injects selections — `__typename` above all — that change the query text without changing what the request asks for, so two clients issuing the same operation sign differently and miss the same mock.

- **Transform type name (config/API):** `graphql_delete`
- **Shorthand format:** `graphql_delete(path=...)` or `graphql_delete(field=...)`
- **Path syntax:** [Speedscale's GraphQL semantic paths](../../graphql/semantic-paths.md), extended so a path may stop at a field selection
- **Side:** request bodies

## Quick Start

Strip `__typename` from the whole document:

```json
"type": "graphql_delete",
"config": {
    "field": "__typename"
}
```

Remove one specific node:

```
req_body() → graphql_delete(path="cart.items.__typename")
```

Unlike most transforms, `graphql_delete` is the *end* of the chain — it does not narrow the body to a value for anything downstream. It edits the request and passes it on, the same way `json_delete` does.

## How It Works

The transform parses the request body, removes the addressed node, and re-serializes — in the same form the body arrived in (AST JSON or raw; see [Body forms](./graphql.md#body-forms)).

```
input:  query Cart { cart(id: "c-1") { __typename total items { __typename sku } } }
config: field=__typename
output: query Cart { cart(id: "c-1") { total items { sku } } }
```

### `path` versus `field`

Exactly one of the two is required, and they answer different questions.

| Setting | Removes |
|---|---|
| `path` | The single node the [semantic path](../../graphql/semantic-paths.md) addresses. A path may stop at a selection (`cart.items.__typename`) or descend into an argument (`createUser.args.input.plan`). |
| `field` | Every selection with that name, everywhere in the document — all operations, all named fragments, inside inline fragments. |

Configuring both is rejected at chain initialization.

### Empty selection sets

A selection set with no selections is not a valid GraphQL document, so a removal that would produce one is refused:

- With `path`, the transform errors: `removing the only selection would leave an empty selection set`.
- With `field`, that one selection is kept and the sweep continues. A query containing `owner { __typename }` keeps that `__typename`, while every other occurrence is removed.

This is why `field` is not guaranteed to remove every occurrence. It is a deliberate trade: a document that still parses is worth more than a perfectly uniform sweep.

### Missing paths

A `path` that resolves cleanly to nothing, or a `field` that matches no selection, leaves the request byte-for-byte unchanged rather than failing the chain. As with the [`graphql`](./graphql.md) transform, this is what lets one chain sweep a snapshot of mixed operations.

### Persisted queries

A persisted-query request carries no document, so there is nothing to remove and the request passes through untouched. `variables.` paths still apply. See [Persisted queries](../../graphql/index.md#persisted-queries).

## Configuration

```json
"type": "graphql_delete",
"config": {
    "path": "<semantic path>",
    "field": "<field name>",
    "op": "<operation name>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `path` | One of `path` / `field` | — | The semantic path to the node to remove. |
| `field` | One of `path` / `field` | — | A field name to remove everywhere in the document. |
| `op` | No | — | Which operation `path` applies to, when the document defines more than one. Ignored with `field`, which sweeps every operation. |

Both `path` and `field` support `${{...}}` variable substitution, resolved at runtime against the variable cache.

## Examples

### Example 1 — Strip `__typename`

```
req_body() → graphql_delete(field="__typename")
```

- Input: `query Cart { cart(id: "c-1") { __typename total items { __typename sku } } }`
- Output: `query Cart { cart(id: "c-1") { total items { sku } } }`

### Example 2 — Remove one selection

```
req_body() → graphql_delete(path="createUser.__typename")
```

Only that selection goes; `__typename` elsewhere in the document stays.

### Example 3 — Remove an argument

```
req_body() → graphql_delete(path="createUser.args.input")
```

- Input: `createUser(input: {email: $email, plan: "pro"}) { id }`
- Output: `createUser { id }`

### Example 4 — Remove a field inside an input object

```
req_body() → graphql_delete(path="createUser.args.input.tags")
```

- Input: `createUser(input: {plan: "pro", tags: ["beta", "early"]})`
- Output: `createUser(input: {plan: "pro"})`

### Example 5 — Remove one element of a list argument

```
req_body() → graphql_delete(path="createUser.args.input.tags.0")
```

- Input: `tags: ["beta", "early"]`
- Output: `tags: ["early"]`

### Example 6 — Remove a variables key

```
req_body() → graphql_delete(path="variables.trace")
```

The key is dropped from the `variables` object; the rest of the request is untouched.

## Common Misconceptions

1. **"It narrows the body for the next transform."**
   It does not. It is a terminal edit, like `json_delete`. Put value transforms in their own chain with [`graphql`](./graphql.md).

2. **"`field` removes every occurrence."**
   Every occurrence *except* one that is the only selection in its set, which would leave an invalid document.

3. **"Deleting a required argument is fine because the request still parses."**
   It parses, but the server may reject it. Removing an argument is a schema-level change — validate against the service before relying on it in a replay.

4. **"It removes a whole operation or fragment definition."**
   It does not. It removes selections, arguments and variables keys. A document defines the operations it defines.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `graphql_delete needs a path or a field` | Neither set | Set exactly one |
| Chain init: `graphql_delete takes either a path or a field, not both` | Both set | Remove one |
| `removing the only selection would leave an empty selection set` | The path names the only selection its parent has | Remove the parent instead, or use `field`, which skips this case |
| `body is not a GraphQL request` | The chain ran against non-GraphQL traffic | Scope the chain with an endpoint filter |
| `field "x" is ambiguous (N matches)` | The path segment matches more than one field | Alias the field in the client, or use `field` |
| Nothing changed, no error | Nothing matched, or the request is a persisted query | Check the path against the **Raw** tab |
| The server rejects the replayed request | A removed argument or selection was required by the schema | Target something the schema treats as optional |

## Related Transforms

- [`graphql`](./graphql.md) — address a value in a GraphQL request and rewrite it.
- [`json_path`](./json_path.md) — the JSON counterpart for addressing values; `json_delete` is the JSON removal transform.
- [`store_sig`](./store_sig.md) and [`delete_sig`](./delete_sig.md) — change which fields contribute to a signature, the other lever on match rates.

## Advanced Notes

- The transform does not require recorded response data.
- Removals are applied to the parsed document, so the re-serialized request is always well-formed GraphQL — a malformed edit is impossible by construction.
- A field is addressed by its alias when it has one; see [Alias before name](../../graphql/semantic-paths.md#alias-before-name).
- Apply the same removal to both sides of a comparison — the recorded traffic and the live requests matched against it — or the difference simply moves.
