---
description: "Remove an entry from an RRPair's signature map with the delete_sig transform in Speedscale, so the responder (mock server) stops requiring that key for a match — useful for relaxing match criteria that would otherwise block replay."
sidebar_position: 9
---

# delete_sig

The `delete_sig` transform removes a named entry from the RRPair's **signature map** — the keyed structure the [responder](../../mocking/signature.md) (Speedscale's mock server) uses to match incoming requests to recorded responses. It is the inverse of [`store_sig`](./store_sig.md), and the standard tool for **relaxing** signature match criteria when an auto-generated key (like the request body hash, or a volatile header) prevents replay from finding a recorded response.

- **Transform type name (config/API):** `delete_sig`
- **Shorthand format:** `delete_sig(key=...)`
- **Where it has effect:** responder (mock server) only. Has no effect during generator-side replay.

## Quick Start

Remove a single signature entry by name:

```json
"type": "delete_sig",
"config": {
    "key": "http:requestBodyJSON"
}
```

The chain still needs an upstream extractor (often `empty()`) because Speedscale transform chains always begin with one. `delete_sig` itself ignores the token flowing through the chain.

## How It Works

All of the work happens in the first phase. The second phase is a no-op — the token passes through unchanged.

1. **First phase** — look up `key` in the RRPair's signature map and delete it. The token flowing through the chain is **not used** as the lookup value; only the configured `key` matters.
2. **Second phase** — return the token unchanged.

If `key` is not present in the signature map, the delete is silently a no-op. There is no error.

### Interaction With the Signature Reconciler

The responder builds the final signature for an RRPair from three sources:

- The pre-transform signature (baseline).
- The post-transform signature (after every chain has run — this is where `delete_sig` shows up as a **missing** key).
- The signature generated directly from the RRPair's transformed fields.

`delete_sig` removes a key from the post-transform signature. The reconciler only includes keys that are present in the post-transform signature, so a key removed by `delete_sig` is excluded from the final signature **even if** the generated signature still contains it.

This is how `delete_sig` reliably suppresses an auto-generated signature key — the reconciler treats its absence from the post-transform map as intentional.

## Configuration

```json
"type": "delete_sig",
"config": {
    "key": "<signature key to remove>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `key` | **Yes** | — | Name of the signature entry to remove. If not present in the map, the transform is a no-op. |

## Examples

### Example 1 — Allow any request body to match

```
empty() → delete_sig(key="http:requestBodyJSON")
```

The default signature includes a serialised form of the JSON request body, so even small body differences block a mock match. Deleting `http:requestBodyJSON` makes the responder match recorded responses on the rest of the signature (method, URL, etc.) regardless of body shape.

### Example 2 — Allow any endpoint path under a host to match

```
empty() → delete_sig(key="http:url")
```

The responder ignores the URL when matching. Use this when you want a single recorded response to cover an entire path family.

### Example 3 — Drop a volatile custom signature

If you previously added a request-correlation ID to the signature with `store_sig(key="correlation_id")` and now want to stop matching on it:

```
empty() → delete_sig(key="correlation_id")
```

The match falls back to the rest of the signature.

### Example 4 — Before and after

Recorded signature:

```json
{
    "http:method": "POST",
    "http:url": "/api/v1/orders",
    "http:requestBodyJSON": "timestamp=1234567890|session=abc123",
    "content_type": "application/json",
    "body_hash": "a8f5f167f44f4964e6c998dee827110c"
}
```

After `delete_sig(key="http:requestBodyJSON")`:

```json
{
    "http:method": "POST",
    "http:url": "/api/v1/orders",
    "content_type": "application/json",
    "body_hash": "a8f5f167f44f4964e6c998dee827110c"
}
```

Requests with different body contents but the same method, URL, content type, and body hash will now match.

## Common Misconceptions

1. **"`delete_sig` uses the token to decide what to delete."**
   No. The chain's token is ignored. The only input is the `key` config.

2. **"It has an effect during load generation."**
   No. The signature map is consumed by the responder during mock matching. Generator-side replay ignores it.

3. **"Missing keys produce an error."**
   No. Deleting a non-existent key is silently a no-op.

4. **"It removes the field from the request payload."**
   No. `delete_sig` only edits the signature map. The underlying request body, header, or URL is unchanged.

5. **"Deleting a key here also deletes it from the recorded response's signature."**
   No. The transform only edits the in-flight signature map for the current RRPair as the responder evaluates the match. Recorded data is untouched.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Mock still doesn't match after deleting a key | A different signature key (not the one you deleted) is the actual mismatch | Inspect the full signature in the responder logs or dashboard preview and identify the diff |
| `delete_sig` appears to do nothing | The `key` name doesn't match what's in the map (case, prefix, namespacing) | Preview the recorded signature and copy the exact key name |
| Match rate increased too much — wrong responses returned | The deleted key was load-bearing for distinguishing requests | Add it back, or add a different signature entry via [`store_sig`](./store_sig.md) to disambiguate |

## Related Transforms

- [`store_sig`](./store_sig.md) — add an entry to the signature map. Inverse operation.
- [`constant`](./constant.md), [`replace`](./replace.md) — for normalising the **value** of a field so its contribution to the auto-generated signature is stable, as an alternative to removing the signature entry entirely.

For background on signatures and how the responder uses them, read the [signature reference](../../mocking/signature.md) and the [signature refinement guide](../../signature-refinement-guide.md).

## Advanced Notes

- If the RRPair has no signature map at the point `delete_sig` runs (e.g. the chain ran in a context that doesn't build signatures), the transform is silently a no-op.
- Multiple `delete_sig` chains can be combined to strip several keys at once. Each chain targets exactly one key.
- The transform does not require recorded responses; it operates purely on the in-flight signature map.
