---
description: "Walk a JSON body and redact every field whose key is in the active DLP redact list using the dlp_json transform in Speedscale, with support for root objects, root arrays, nested arrays, and gzipped payloads."
sidebar_position: 11
---

# dlp_json

The `dlp_json` transform walks a JSON document and redacts the value of every field whose **key** is in the active DLP redact list. The redacted value follows the same `REDACTED-<category>-<hash>` shape as [`dlp_field`](./dlp_field.md), but the decision of *whether* to redact a given field is policy-driven — it comes from the DLP configuration loaded by the generator, responder, analyzer, or forwarder, not from the transform's local config.

Unlike `dlp_field`, `dlp_json` does **not** redact every value the chain hands it. It only redacts fields whose key name is in the configured redact list. Fields with non-blocked keys are walked through unchanged. See [Configuring DLP](/guides/dlp/) for how to populate the redact list.

- **Transform type name (config/API):** `dlp_json`
- **Shorthand format:** `dlp_json()`

## Quick Start

```json
"type": "dlp_json",
"config": {}
```

```
req_body() → dlp_json()
```

The entire request body is walked. Any field whose key matches an entry in the active DLP redact list — say `userId`, `email`, `ssn` — has its value replaced with a `REDACTED-<category>-<hash>` token. Other fields are left alone.

## How It Works

`dlp_json` runs entirely in the first phase. The second phase is a no-op.

1. **Decompress if needed.** Gzipped bodies are decompressed before traversal and re-compressed after, so a gzipped response can be redacted in place without an upstream decompression step.
2. **Parse the JSON.** The body is parsed once. The traversal handles three root shapes:
   - **Object** at the root — walked as a single map.
   - **Array** at the root — each element is walked recursively (so an array of objects, an array of arrays of objects, etc. all work).
   - **Non-structured** at the root (a bare string, number, boolean, `null`, or an unparseable body) — passes through unchanged.
3. **Walk every key/value.** At each level, for each key:
   - If the key is in the DLP redact list, the value is sent through the same redaction logic as [`dlp_field`](./dlp_field.md) — category detection, deterministic hashing, output as `REDACTED-<category>-<hash>`.
   - If the value is itself a nested object or array, the walk recurses into it before deciding.
4. **Re-serialize.** The (possibly modified) JSON is written back. If the input was gzipped, the output is re-compressed.

### Root-Array Handling

The traversal correctly handles bodies whose root is a JSON array — including:

| Shape | Example | Behavior |
|---|---|---|
| Flat array of objects | `[{"userId":"u1"},{"userId":"u2"}]` | Each object's blocked keys are redacted. |
| Nested arrays at root | `[[{"userId":"u1"}],[{"userId":"u2"}]]` | Recursion descends through the array nesting. |
| Array of objects with nested objects | `[{"info":{"userId":"u1"}}]` | Nested object's blocked keys are redacted. |
| Array of objects with nested arrays | `[{"items":[{"userId":"u1"}]}]` | Nested array elements are walked. |
| Mixed primitives and objects | `[{"userId":"u1"}, "plain", 42]` | Objects are walked; primitives pass through unchanged. |

### Pass-Through Inputs

The walk is non-destructive — bodies that have nothing to redact come back byte-equivalent to the input:

- Primitive roots: `42`, `"hello"`, `true`, `null` → unchanged.
- Empty containers: `{}`, `[]` → unchanged.
- Non-JSON bodies: `this is not json`, empty bytes → unchanged.
- Bodies whose keys are all outside the redact list → unchanged.

This makes `dlp_json` safe to place broadly in a chain — it never mangles bodies it isn't configured to act on.

### Key-Based, Not Value-Based

`dlp_json` decides by **key**. A field named `email` whose value is a UUID will still be redacted (and categorized by value). A field named `comment` whose value is an email will **not** be redacted, because `comment` isn't in the redact list. For value-based scanning, see [Related Transforms](#related-transforms).

## Configuration

```json
"type": "dlp_json"
```

`dlp_json` has no local configuration. All behavior is driven by the active DLP configuration on the generator, responder, analyzer, or forwarder running the chain.

| Source | What it controls |
|---|---|
| DLP redact list | Which key names trigger redaction. Configured on the service running the chain. |
| DLP pattern discovery | Whether the `<category>` portion appears in `REDACTED-<category>-<hash>`. |
| DLP configuration ID | Used to tag the RRPair as redacted under a specific configuration. |

See [Configuring DLP](/guides/dlp/) for the full configuration surface.

## Examples

### Example 1 — Redact a body of mixed sensitive fields

Redact list: `email, ssn, creditCard, phoneNumber, userId`.

Before:

```json
{
  "user": {
    "id": "4E216B8D-E6CE-4FC6-B566-D44ACB6642F4",
    "profile": {
      "email": "john.doe@example.com",
      "contact": {
        "phoneNumber": "+1-555-123-4567"
      }
    }
  },
  "payment": {
    "creditCard": "4532-1234-5678-9012",
    "identity": {
      "ssn": "123-45-6789"
    }
  }
}
```

After:

```json
{
  "user": {
    "id": "4E216B8D-E6CE-4FC6-B566-D44ACB6642F4",
    "profile": {
      "email": "REDACTED-EMAIL-8F14E45FCEEA167A5A36DEDD4BEA2543",
      "contact": {
        "phoneNumber": "REDACTED-PHONE_NUMBER-D0941E68D8C82D3C87D0C8E73C7D0E8A"
      }
    }
  },
  "payment": {
    "creditCard": "REDACTED-CREDIT_CARD-C3499C2729730A7F807EFB8676A92DCB6F8A3F8F",
    "identity": {
      "ssn": "REDACTED-SSN-A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3"
    }
  }
}
```

Note that `user.id` is **not** redacted: `id` isn't in the redact list. To also catch it, add `id` (or change the upstream payload to use `userId`).

### Example 2 — Root-array body

Redact list: `userId`.

Before:

```json
[
  {"userId": "u1", "name": "Alice"},
  {"userId": "u2", "name": "Bob"}
]
```

After:

```json
[
  {"userId": "REDACTED-...", "name": "Alice"},
  {"userId": "REDACTED-...", "name": "Bob"}
]
```

### Example 3 — Redact a JSON subtree extracted from a larger body

```
res_body() → json_path(path="user") → dlp_json()
```

The walk runs over the JSON subtree at `user` only. Useful when the surrounding envelope shouldn't be touched (e.g. when it contains keys that happen to collide with the redact list but aren't sensitive in context).

### Example 4 — Gzipped body

```
res_body() → dlp_json()
```

If the response body is gzipped, `dlp_json` decompresses, walks, redacts, and re-compresses. The output remains a gzipped JSON body the SUT or replay consumer can read directly.

## Common Misconceptions

1. **"`dlp_json` redacts based on the value's content."**
   No. It decides by **key**. A credit-card-shaped value in a non-blocked field stays in the clear. Use a separate pass with value-based scanning if that matters.

2. **"It walks every key automatically."**
   It walks every key, but only redacts the ones in the active DLP redact list. Without a populated redact list, the body passes through unchanged.

3. **"Root-array bodies aren't supported."**
   They are. The traversal handles object roots, array roots, nested arrays, and mixed-primitive arrays correctly.

4. **"Gzipped bodies need a manual decompress step before `dlp_json`."**
   They don't. The transform handles gzip transparently — input goes in compressed, output comes out compressed.

5. **"The local config can override the redact list."**
   There is no local config. All behavior comes from the DLP configuration of the service running the chain.

6. **"`dlp_json` is the same as `dlp_field` on a JSON body."**
   No. `dlp_field` redacts whatever the chain extracts unconditionally. `dlp_json` walks the whole body and redacts only fields whose keys match the policy.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Error: `dlp redactor is missing` | The chain is running in a context with no DLP engine attached | Run inside the generator, responder, analyzer, or forwarder where the DLP engine is initialized |
| Body unchanged after the transform | The redact list is empty, or none of the body's keys match | Confirm the active DLP configuration's redact list contains the keys you expect |
| Root-array body unchanged in older versions | Pre-S-11046 versions parsed only object roots | Upgrade — root-array support was added in S-11046 |
| Gzipped body comes back uncompressed | Output is re-compressed only if the **input** was compressed | Confirm the input was gzipped (`Content-Encoding: gzip`); if it wasn't, no re-compression is expected |
| A specific field with a sensitive value isn't redacted | The field's key isn't in the redact list (decision is key-based, not value-based) | Add the key to the redact list, or use a value-based scrub upstream |
| Want to redact only one field unconditionally | Wrong transform | Use [`dlp_field`](./dlp_field.md) |

## Related Transforms

- [`dlp_field`](./dlp_field.md) — unconditionally redacts a single extracted token, no redact list consulted. Use for per-field policy you want to express directly in the chain.
- [`scrub`](./scrub.md) — substring-replace a specific extracted value across the body. Use for match-rate scrubbing, not policy-driven redaction.
- [`scrub_date`](./scrub_date.md) — neutralizes date-shaped values in the body. Complementary to `dlp_json` when timestamps need to disappear from signature matching.
- [Configuring DLP](/guides/dlp/) — full reference for the redact list, pattern catalog, and discovery settings that govern `dlp_json`.

## Advanced Notes

- The traversal handles root-object, root-array, nested-array, and mixed-primitive cases. Pre-S-11046, root-array bodies were silently skipped; the current implementation walks them correctly. The root-array test suite (`TestDLPJsonRootArray`) exercises flat arrays of objects, arrays of objects with nested objects, arrays of objects with nested arrays, nested arrays at the root, and mixed primitive/object arrays.
- Non-structured roots (primitives, empty containers, non-JSON bytes) pass through byte-for-byte unchanged. This is by design: bodies the redactor cannot meaningfully act on should not be mangled.
- Gzip round-tripping is automatic. The body is decompressed before walking and re-compressed after. A redacted gzipped body comes back as a valid gzip stream the SUT can decode.
- The transform does not require the recorded response to be present in the action file.
- The redacted output format (`REDACTED-<category>-<hash>`) is deterministic per DLP configuration, so the same input value at the same key produces the same redacted token across runs. This preserves cross-field relationships within a single RRPair and across the replay session.
