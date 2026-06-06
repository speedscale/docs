---
description: "Add a custom entry to an RRPair's signature map with the store_sig transform in Speedscale, so the responder (mock server) can match incoming requests on data the default signature would otherwise ignore."
sidebar_position: 27
---

# store_sig

The `store_sig` transform writes a value into the **signature map** of the RRPair the chain is processing. The signature map is what the [responder](../../mocking/signature.md) (Speedscale's mock server) uses to match an incoming request to a recorded response — any key/value pair in that map becomes part of the match criteria.

Use `store_sig` when you need to make the responder match on a piece of data that is not part of the default signature (e.g. a custom header, a derived value from the body, a normalised form of an identifier).

- **Transform type name (config/API):** `store_sig`
- **Shorthand format:** `store_sig(key=...)`
- **Where it has effect:** responder (mock server) only. Has no effect during generator-side replay.

## Quick Start

Store the value flowing through the chain under a named signature key:

```json
"type": "store_sig",
"config": {
    "key": "tenant_id"
}
```

Or, with no `key`, store it under an auto-assigned numeric key:

```json
"type": "store_sig",
"config": {}
```

## How It Works

All of the work happens in the first phase. The second phase is a no-op — the token passes through unchanged.

1. **First phase** — copy the token's bytes and write them into the RRPair's signature map. If a `key` is configured, that key is used; otherwise a numeric key is auto-assigned (see below). Any existing entry under the same key is overwritten.
2. **Second phase** — return the token unchanged.

The chain that runs `store_sig` doesn't replace data in the RRPair — it only **adds to** (or **overwrites in**) the signature map.

### Key Assignment

| `key` config | Behaviour |
|---|---|
| Set to a name | That name is used as the signature-map key. Existing entries under the same name are replaced. |
| Empty / not set | An auto-assigned numeric key is used: the transform picks the lowest non-colliding integer starting from the current map size. Multiple unnamed `store_sig` calls in the same chain produce `"0"`, `"1"`, `"2"`, etc. |

Auto-assigned keys are stable within a single signature build, but the actual integers depend on how many keys are already present. Prefer a named `key` whenever you'll later need to reference or delete the entry (e.g. via [`delete_sig`](./delete_sig.md)).

### When the Signature Map Is Read

The signature map this transform writes into is one of three inputs the responder reconciles when computing the **final** signature for an RRPair:

- The pre-transform signature (baseline).
- The post-transform signature (after every chain has run — this is where `store_sig` shows up).
- The signature generated directly from the RRPair's transformed fields.

Entries that `store_sig` adds will appear in the post-transform signature and survive into the final signature. Entries that conflict with auto-generated values from the RRPair's fields are resolved in favour of the post-transform value — `store_sig` wins over the auto-generated form.

## Configuration

```json
"type": "store_sig",
"config": {
    "key": "<optional name>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `key` | No | auto-assigned numeric | Name to assign this signature entry. Omit for an auto-numbered key. Existing entries under the same name are overwritten. |

## Examples

### Example 1 — Match on a tenant ID from the request body

```
req_body() → json_path(path="tenant.id") → store_sig(key="tenant_id")
```

The responder will only return a recorded response for requests whose `tenant.id` value matches the recorded one — even if the request bodies differ in other fields.

### Example 2 — Match on a normalised form of a header

```
http_req_header(header="X-Correlation-Id") → trim(type=spaces) → store_sig(key="correlation_id")
```

The trimmed correlation ID is added to the signature; whitespace-only differences between recorded and live correlation IDs no longer block a match.

### Example 3 — Add multiple custom signature keys

```
req_body() → json_path(path="userId") → store_sig(key="user_id")
req_body() → json_path(path="action")  → store_sig(key="action")
```

Each chain adds one signature entry; the responder matches on both.

### Example 4 — Unnamed signature key

```
req_body() → json_path(path="payload.session") → store_sig()
```

The session value is added under an auto-assigned numeric key like `"0"`. Useful when the key name doesn't matter for matching, but the value does.

## Common Misconceptions

1. **"It changes the value in the request."**
   No. The token passes through the chain unchanged. The transform only writes to the signature map.

2. **"It has an effect during load generation."**
   No. The signature map is consumed by the responder during mock matching. Generator-side replay ignores it.

3. **"Unnamed `store_sig` calls always start from `0`."**
   No. The auto-assigned key is the lowest non-colliding integer **starting from the current map size**. If the default signature already has 6 entries, the first unnamed `store_sig` will likely be keyed `"6"`, not `"0"`.

4. **"Calling `store_sig` twice with the same key creates two entries."**
   No. The signature map is keyed by name. The second call overwrites the first.

5. **"Generator-side transforms that change fields override `store_sig`."**
   No. The signature reconciler gives precedence to post-transform signature entries (including those from `store_sig`) over values generated from the transformed fields.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Mock does not match a request even though the value is in the body | Signature map is missing the field, or the `store_sig` chain didn't run because the upstream extractor returned empty | Confirm the chain extracts a non-empty value; preview the signature in the dashboard |
| Multiple `store_sig` calls overwrite each other | Same `key` is reused across chains | Use distinct `key` values, or omit `key` for auto-numbered slots |
| Signature entry appears for the recorded RRPair but not the live request | `store_sig` runs on the request side; if it's configured on the response side it won't help inbound matching | Move the chain to a request-side extractor |
| Want to remove an existing default signature entry | `store_sig` doesn't remove, it only writes | Use [`delete_sig`](./delete_sig.md) |

## Related Transforms

- [`delete_sig`](./delete_sig.md) — remove an entry from the signature map. Inverse operation.
- [`constant`](./constant.md), [`replace`](./replace.md) — for changing the **value** in a request rather than its signature contribution.

For an overview of how Speedscale builds and matches signatures, read the [signature reference](../../mocking/signature.md) and the [signature refinement guide](../../signature-refinement-guide.md).

## Advanced Notes

- The transform copies the token's bytes before writing them, so subsequent transforms in the chain can mutate the value without disturbing the stored signature entry.
- If the RRPair has no signature map at the point `store_sig` runs (e.g. the chain ran in a context that doesn't build signatures), the transform is silently a no-op.
- The transform does not require recorded responses; it operates purely on whatever value the chain produces.
