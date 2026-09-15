---
description: "Working GraphQL transform recipes for Speedscale: replace a variable, re-sign a JWT, strip __typename to raise mock match rates, edit JSON embedded in an argument, and migrate legacy AST-path chains."
sidebar_position: 3
---

# GraphQL recipes

Each recipe is a complete transform chain. Chains are written here in shorthand — `extractor() → transform() → transform()` — which is the same order the chain editor shows.

## Replace a variable value

The common case, and the one to reach for first: a well-behaved client puts everything that varies into `variables`, so nothing in the query text needs to change.

```
req_body() → graphql(path="variables.cartValidationRequest.channel") → constant(new="horse_and_buggy")
```

The path after `variables.` is an ordinary [gjson path](https://github.com/tidwall/gjson#path-syntax), so it descends nested objects and arrays the same way [`json_path`](../transformation/transforms/json_path.md) does. JSON types are preserved: a number stays a number.

## Re-sign an expired JWT

A recorded session token is expired by the time you replay it. Extract it from `variables`, re-sign it, and put it back:

```
req_body() → graphql(path="variables.token") → jwt_resign(secretPath="/etc/speedscale/jwt/key")
```

If the token rides in a header instead — the more usual arrangement — this is an ordinary [`jwt_resign`](../transformation/transforms/jwt_resign.md) chain with an `http_req_header` extractor, and GraphQL has nothing to do with it.

## Strip `__typename` for a better mock match rate

Client tooling (Apollo among others) injects `__typename` into selection sets. It changes the query text without changing what the request asks for, so two clients issuing the same operation can produce different signatures and miss the same mock.

```
req_body() → graphql_delete(field="__typename")
```

The `field` shorthand removes the name everywhere in the document — every operation, every named fragment, inside inline fragments. A selection set that contains nothing else keeps it, since an empty selection set is not a valid GraphQL document.

Apply the same chain to both the recorded traffic and the incoming requests being matched against it and the difference disappears from both sides. To remove one specific selection rather than a name everywhere, address it by path:

```
req_body() → graphql_delete(path="cart.items.__typename")
```

See [`graphql_delete`](../transformation/transforms/graphql_delete.md) for the full reference, and [Improving mock match rate](../../proxymock/guides/mock-match-rate.md) for the broader workflow.

## JSON embedded in an argument

Some APIs pass a JSON document as a GraphQL string argument. Reach inside it by stacking a `json_path` after the `graphql` transform — each layer re-inserts on the way back out:

```
req_body()
  → graphql(path="trackEvent.args.payload")
  → json_path(path="client.os")
  → constant(new="linux")
```

- Input: `trackEvent(payload: "{\"action\":\"login\",\"client\":{\"os\":\"macos\"}}")`
- Output: `trackEvent(payload: "{\"action\":\"login\",\"client\":{\"os\":\"linux\"}}")`

## Send each virtual user a different value

Combine a semantic path with any data-producing transform. The GraphQL part of the chain does not change:

```
req_body() → graphql(path="createUser.args.input.plan") → one_of(options="free,pro,enterprise", strategy="random")
req_body() → graphql(path="variables.id") → rand_string(pattern="[0-9a-f]{8}")
req_body() → graphql(path="variables.email") → var_load(name="next_email")
```

The last one pulls from a [CSV-backed variable](../transformation/transforms/csv.md), which is how a replay drives a different row per request.

## Migrating legacy AST-path chains

Before semantic paths, the only way to edit a GraphQL document was to address the AST JSON positionally with `json_path`. Those chains still work — nothing has been removed — but they break whenever the document's shape shifts, and they are unreadable in review.

The migration is mechanical: replace the `json_path` transform with a `graphql` transform carrying the semantic path, and leave the rest of the chain alone.

| Legacy | Replacement |
|---|---|
| `json_path(path="variables.email")` | `graphql(path="variables.email")` |
| `json_path(path="query.Definitions.0.SelectionSet.Selections.0.Arguments.0.Value.Fields.1.Value.Value")` | `graphql(path="createUser.args.input.plan")` |
| `json_path(path="operationName")` | `graphql(path="operationName")` |

Two things change for the better in the process:

- **Reordering stops breaking the chain.** An argument added to a selection shifts every index after it; a semantic path names the argument.
- **The operation is explicit.** A document with more than one operation forced the legacy path to encode which definition it meant as `Definitions.<n>`; the `op` setting names it.

Note that a `variables.` path is identical in both forms — the variables are plain JSON in either representation — so chains that only touch variables can be migrated for consistency, or left alone with no loss.
