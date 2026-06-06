---
description: "Decompress and re-compress gzip-wrapped payloads with the gzip transform in Speedscale, exposing the inner data to downstream transforms and re-compressing on the way back into the RRPair."
sidebar_position: 12
---

# gzip

The `gzip` transform decompresses a gzip-wrapped value so subsequent transforms in the chain see the raw payload, then re-compresses the result before it is written back to the RRPair. Use it whenever a request or response field carries a gzip-compressed body that you need to inspect or modify mid-chain.

- **Transform type name (config/API):** `gzip`
- **Shorthand format:** `gzip()`

## Quick Start

```json
"type": "gzip"
```

No configuration parameters. Drop it into a chain between an extractor and any downstream transforms that need to see the decompressed payload.

## How It Works

`gzip` runs in two phases.

1. **First phase (decompress).** The extracted token is decompressed and the raw bytes are passed to the next transform.
2. **Second phase (compress).** Whatever the chain produces is re-compressed and written back to the RRPair.

Compression uses the default gzip compression level. Internally the transform shares a pool of gzip readers/writers across invocations to keep per-call allocation low under high replay volume.

### Decompression Failure Surfaces an Error

If first-phase decompression fails — the input is not valid gzip, the stream is truncated, or the CRC check fails — the transform returns the original token along with an error. The chain reports a runtime decode error. Compare with [`base64`](./base64.md), which silently passes through bad input.

### Round-Trip Is Not Byte-Identical

Re-compressing the same payload does **not** necessarily produce the same byte sequence as the original. Gzip headers (mtime, OS byte, compressor metadata) and the compression-level choice can all differ. The decompressed payload is preserved exactly; the wrapper around it is not.

## Configuration

No configuration parameters.

## Examples

### Example 1 — Modify a gzipped response body field

```
res_body() → json_path(path="payload") → gzip() → json_path(path="status") → constant(value="OK")
```

Decompress the embedded payload, rewrite an inner field, re-compress on the way out.

### Example 2 — Decompress and inspect

```
res_body() → gzip() → json_path(path="user.id")
```

A response body that is wholly gzipped is decompressed so `json_path` can read a field from it. Because nothing follows that produces a value, the body is re-compressed unchanged from what the chain produced.

### Example 3 — Decompress, re-encode as base64

```
req_body() → json_path(path="compressedData") → gzip() → base64()
```

Decompress a gzip blob, then wrap it in base64 for transport in a context that cannot carry binary bytes. Because both transforms are two-phase, the chain re-applies gzip → base64 on the way out.

## Common Misconceptions

1. **"`gzip` only compresses."**
   It does both. First phase decompresses, second phase compresses. A field extracted as gzip ends up gzipped again when it is written back.

2. **"Re-compressed output is byte-identical to the original."**
   No. Gzip headers (timestamps, OS byte) and the chosen compression level can change, so byte equality is not preserved even when the decompressed payload is identical.

3. **"Bad input is passed through silently."**
   No. Decompression failure returns an error. Make sure the upstream extractor is pulling the full compressed byte range (not a truncated or text-stringified view of it).

4. **"It handles deflate, zstd, or brotli."**
   No. Only the gzip wire format. Other compression schemes are not supported by this transform.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Runtime decompress error | Field is not gzip, or the bytes are truncated / re-encoded as a string | Verify the extractor returns the raw compressed bytes; check `Content-Encoding` matches |
| Output bytes differ from original even with no in-chain changes | Re-compression produces a different gzip header / compression artifact | Expected; only the decompressed payload round-trips exactly |
| Downstream transform sees binary noise | A field was not actually gzipped but `gzip` was applied anyway | Remove `gzip` from the chain or extract a different field |

## Related Transforms

- [`base64`](./base64.md) — for fields that are gzip-then-base64-wrapped, chain `base64` then `gzip`.
- [`url_decode`](./url_decode.md) / [`url_encode`](./url_encode.md) — for fields that are also URL-escaped.
