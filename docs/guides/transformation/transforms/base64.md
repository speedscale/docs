---
description: "Decode and re-encode base64 values in traffic with the base64 transform in Speedscale — a two-phase wrapper that exposes the decoded payload to downstream transforms and re-encodes on the way out."
sidebar_position: 2
---

# base64

The `base64` transform decodes a base64-encoded value so subsequent transforms in the chain see the raw payload, then re-encodes the result before it is written back to the RRPair. It is the standard way to reach into a base64-wrapped field — an encoded JWT segment, a credentials header, an embedded JSON blob — without manually unwrapping and re-wrapping.

- **Transform type name (config/API):** `base64`
- **Shorthand format:** `base64(pad=...)`

## Quick Start

Decode a base64-wrapped JSON field, let downstream transforms work on the decoded form, then re-encode on the way out:

```json
"type": "base64",
"config": {
    "pad": "true"
}
```

`pad=true` (the default) tolerates the unpadded form commonly seen in JWTs and URL-safe contexts where trailing `=` characters are stripped.

## How It Works

`base64` runs in two phases.

1. **First phase (decode).** The extracted token is decoded as standard base64. The decoded bytes are passed to the next transform in the chain.
2. **Second phase (encode).** Whatever the chain produces is re-encoded as standard base64 and written back to the RRPair.

### `pad` Behavior

| `pad` | First-phase decode | Second-phase encode |
|---|---|---|
| `true` (default) | Decodes using standard base64 with **no padding required**. An input missing trailing `=` characters still decodes. | Encodes with standard base64, then **strips trailing `=`** characters from the output. |
| `false` | Decodes using strict standard base64. Inputs must include the correct number of trailing `=` characters. | Encodes with standard base64, leaving any trailing `=` in place. |

The `pad=true` default exists because HTTP and JWT contexts disallow `=` in many positions — JWT segments, query strings, certain headers — so the transform stays compatible with those forms out of the box.

### Decode Failure Is Silent

If first-phase decoding fails (the input is not valid base64), the transform returns the original token unchanged with **no error**. Downstream transforms see the raw, untransformed value. This makes a `base64` step safe to chain in front of fields that are sometimes — but not always — encoded.

The second-phase encode is unconditional: whatever the chain's tail produces will be base64-encoded on the way back into the RRPair.

### Empty Input

An empty token is returned unchanged from both phases.

## Configuration

```json
"type": "base64",
"config": {
    "pad": "<true|false>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `pad` | No | `true` | When `true`, decode tolerates missing padding and encode strips trailing `=`. When `false`, both phases use strict standard base64 padding. |

## Examples

### Example 1 — Decode a JWT payload segment

```
req_header(header="Authorization") → regex(match="Bearer ([^.]+)\\.([^.]+)\\.") → base64(pad=true) → json_path(path="sub") → constant(value="test-user")
```

Pull the payload segment of a JWT, decode it (no padding — JWT segments never carry `=`), rewrite a claim, then let `base64` re-encode it on the way out with padding stripped. For full JWT re-signing including the signature, prefer [`jwt_resign`](./jwt_resign.md) instead.

### Example 2 — Decode a base64-wrapped JSON config field

Before:

```json
{ "config": "eyJkYXRhYmFzZSI6InByb2R1Y3Rpb24ifQ==" }
```

Chain:

```
req_body() → json_path(path="config") → base64() → json_path(path="database") → constant(value="staging")
```

`base64` decodes `eyJkYXRhYmFzZSI6InByb2R1Y3Rpb24ifQ==` to `{"database":"production"}`. `json_path` rewrites `database` to `staging`. `base64`'s second phase re-encodes the modified JSON.

After:

```json
{ "config": "eyJkYXRhYmFzZSI6InN0YWdpbmcifQ" }
```

(The trailing `=` is stripped because `pad=true` is the default.)

### Example 3 — Decode Basic auth credentials

```
req_header(header="Authorization") → regex(match="Basic (.*)") → base64(pad=false) → replace(old="admin", new="testuser")
```

`pad=false` because Basic auth credentials are always sent with proper padding.

## Common Misconceptions

1. **"Invalid base64 input raises an error."**
   No. If first-phase decoding fails, the original token is passed through unchanged and no error is reported. Downstream transforms see whatever was extracted.

2. **"The output always includes `=` padding."**
   Only if `pad=false`. With the default `pad=true`, trailing `=` characters are stripped from the encoded output for compatibility with HTTP and JWT contexts.

3. **"`base64` works on URL-safe base64."**
   No. Both phases use standard base64 (with `+` and `/`). For URL-safe variants (`-` and `_`), pre-process with [`replace`](./replace.md) or pair with [`url_encode`](./url_encode.md) / [`url_decode`](./url_decode.md) as appropriate.

4. **"It's a one-way decoder."**
   No. The second phase re-encodes. If you want decoded output left in place without re-encoding, the field type itself needs to change — `base64` always rewraps.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Downstream transform sees the encoded string, not the decoded payload | Input was not valid base64; decode failed silently | Verify the extractor is pulling the correct, fully-formed base64 substring |
| Output contains `=` where the upstream system rejects them | `pad=false` is set, or downstream consumers strictly require unpadded form | Use the default `pad=true` |
| Output is missing `=` and the downstream parser is strict | Default `pad=true` is stripping padding | Set `pad=false` |
| JWT signature breaks after re-encoding | The signature segment was modified in the chain, or the header/claims segment was rewritten without re-signing | Use [`jwt_resign`](./jwt_resign.md) to handle JWTs end-to-end |

## Related Transforms

- [`jwt_resign`](./jwt_resign.md) — decode, rewrite, and re-sign JWTs in one step instead of manually unwrapping segments with `base64`.
- [`url_encode`](./url_encode.md) / [`url_decode`](./url_decode.md) — pair with `base64` when the value is also URL-escaped.
- [`gzip`](./gzip.md) — for compressed payloads that may also be base64-wrapped.
