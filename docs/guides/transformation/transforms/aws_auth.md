---
description: "Re-sign AWS SigV4 (AWS4-HMAC-SHA256) Authorization headers with the aws_auth transform in Speedscale, swapping the recorded access key and secret for new credentials while preserving the original signed-headers set and producing a fresh, valid signature."
sidebar_position: 1
---

# aws_auth

The `aws_auth` transform re-signs an AWS SigV4 (`AWS4-HMAC-SHA256`) `Authorization` header with new credentials, producing a fresh signature that matches the current request body, the current set of signed headers, and a current `x-amz-date`. It is the AWS-credential counterpart to [`jwt_resign`](./jwt_resign.md): the recorded token is decoded, key material is swapped, and a new token is emitted in its place.

It does **not** invent a SigV4 envelope from scratch. The recorded token must already be a valid AWS4-HMAC-SHA256 `Authorization` header — the transform reads the region, service, and signed-headers list out of it.

- **Transform type name (config/API):** `aws_auth`
- **Shorthand format:** `aws_auth(secretPath=...)`
- **Side:** request-side, generator only. The responder does not need to re-sign AWS auth headers because it does not call AWS — it matches recorded responses.

## Quick Start

For a Kubernetes generator with credentials mounted from a secret named `awscreds`:

```json
"type": "aws_auth",
"config": {
    "idPath":     "${{secret:awscreds/id}}",
    "secretPath": "${{secret:awscreds/secretkey}}"
}
```

`idPath` holds the equivalent of `AWS_ACCESS_KEY_ID`. `secretPath` holds the equivalent of `AWS_SECRET_ACCESS_KEY`. Both must be set — chain initialization fails otherwise.

Place the transform at the **end** of the chain for any chain that mutates a signed header or the request body. SigV4 covers the body hash and the signed headers, so anything that changes them must run before `aws_auth` produces the final signature.

## How It Works

`aws_auth` does all of its work in the first phase. The second phase is a no-op.

1. **Sync `x-amz-date`.** The transform looks up the active request time and rewrites the request's `x-amz-date` header to match — `YYYYMMDDTHHMMSSZ`. SigV4 ties the signature to a date; a stale `x-amz-date` would produce a token that AWS rejects as expired even though the math is correct.
2. **Parse the recorded token.** The header is split on commas and validated:
   - Must start with `AWS4-HMAC-SHA256 ` (with trailing space).
   - Must contain at least three comma-separated parts.
   - `Credential=` and `SignedHeaders=` fields must be present.
3. **Read region and service from `Credential`.** The recorded credential string is `AKID/YYYYMMDD/region/service/aws4_request`. Region and service are extracted and reused for the new signature; the date portion will come from the active request time.
4. **Drop unsigned headers.** Any header on the request that is **not** in the recorded `SignedHeaders` list is removed before signing. This keeps the canonical request identical in shape to the recording, even if other transforms added headers earlier in the chain.
5. **Load credentials.** `idPath` and `secretPath` are resolved (from a mounted file or inline value) and cached on the transform instance so subsequent re-signs in the same session don't repeat the disk read.
6. **Hash the body.** The current request body (post any earlier transforms) is hashed with SHA-256 to produce the SigV4 payload hash.
7. **Sign.** A SigV4 signature is computed over the canonical request using the new credentials, the original region and service, and the request time. The resulting `Authorization` header value is returned as the new token.

The original `Signature=...` portion of the recorded header is irrelevant — its only job is to keep the recording shaped like a real AWS request. The transform overwrites it.

### Side Effects

`aws_auth` is unusual: in addition to returning the new token, it **mutates the request's `x-amz-date` header** in place. This is required for the new signature to validate. If you have other transforms reading or writing `x-amz-date`, expect this transform to overwrite their work.

The body itself is not modified. Only `x-amz-date` and (via the returned token) `Authorization` change.

### Why the Recorded Token Must Be Valid

The SigV4 signing process needs to know:

- Which AWS region to sign for.
- Which AWS service to sign for.
- Which request headers were part of the recorded signature.

All three come from the recorded `Authorization` header. If you record traffic with a tampered or empty SigV4 header, `aws_auth` has nothing to read and returns an error. To change what gets signed, modify the **recorded** header before this transform runs — drop a header from `SignedHeaders` and `aws_auth` will exclude it from the new signature too.

## Configuration

```json
"type": "aws_auth",
"config": {
    "idPath":     "<path or secret reference for AWS_ACCESS_KEY_ID>",
    "secretPath": "<path or secret reference for AWS_SECRET_ACCESS_KEY>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `idPath` | **Yes** | — | Path to the access key ID. Plain text — the same value you would put in `AWS_ACCESS_KEY_ID`. Supports the Kubernetes form `${{secret:secret_name/key_inside_the_secret}}`, which the Speedscale operator auto-mounts into the generator pod. |
| `secretPath` | **Yes** | — | Path to the secret access key. Plain text — the same value you would put in `AWS_SECRET_ACCESS_KEY`. Supports the same `${{secret:...}}` form. |

Both fields must be set. The transform fails chain initialization with `a secretPath is required` or `an id is required` otherwise.

### Credential Sources

| Form | When to use |
|---|---|
| `${{secret:name/key}}` | Production — the Speedscale operator mounts the named secret's key into the generator pod and rewrites the reference to the in-pod file path. |
| Plain file path (e.g. `/etc/secrets/aws-secret`) | Local testing, or pre-mounted secrets you manage outside the operator. |
| Inline value (a literal string) | Only for very short-lived local runs. The value lives in the action file. |

The transform reports both `idPath` and `secretPath` to the operator as required secrets so they get auto-mounted into the generator pod alongside the action file.

## Examples

### Example 1 — Re-sign a Firehose request with a mounted secret

```json
"type": "aws_auth",
"config": {
    "idPath":     "${{secret:awscreds/id}}",
    "secretPath": "${{secret:awscreds/secretkey}}"
}
```

Given a recorded request with:

```
Authorization: AWS4-HMAC-SHA256 Credential=AKIARMCVI5QDT57Y4NSL/20250505/us-east-1/firehose/aws4_request, SignedHeaders=amz-sdk-invocation-id;amz-sdk-request;content-length;content-type;host;x-amz-date;x-amz-target, Signature=foozibar
x-amz-date: 20250505T232121Z
```

The transform:

- Updates `x-amz-date` to match the active request time.
- Reads region `us-east-1` and service `firehose` from `Credential=`.
- Drops any request header not in `SignedHeaders`.
- Computes a fresh SHA-256 of the current request body.
- Returns a new `Authorization` header with the same `Credential=...`, the same `SignedHeaders=...`, and a recomputed `Signature=`.

### Example 2 — Chain order with a body-mutating transform

```
req_body() → json_path(path="payload") → constant(value="${{var:new_payload}}")
http_req_header(name="Authorization") → aws_auth(idPath="${{secret:awscreds/id}}", secretPath="${{secret:awscreds/secretkey}}")
```

The body is rewritten first. Then `aws_auth` runs against the final body and produces a signature that AWS will accept. Swapping the chain order — `aws_auth` before the body change — would produce a token whose body hash no longer matches the request.

### Example 3 — Change which headers participate in the signature

`aws_auth` itself has no `SignedHeaders` knob. To exclude a header from the new signature, modify the recorded `Authorization` header so its `SignedHeaders=` list no longer contains it (e.g. via [`regex`](./regex.md)) before `aws_auth` runs. The transform also deletes any request header not in `SignedHeaders` before signing, so the canonical request is consistent with the recorded shape.

## Common Misconceptions

1. **"It works in the responder."**
   No. The transform is for the generator, where Speedscale sends signed requests to a real AWS endpoint. The responder serves recorded responses and does not re-sign anything.

2. **"It generates a SigV4 header from nothing."**
   No. It re-signs an existing valid SigV4 header. Region, service, and the signed-headers set are pulled from the recorded `Authorization`. Without that, there is nothing to re-sign.

3. **"It uses `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from the environment."**
   No. Credentials are loaded from `idPath` and `secretPath` — typically operator-mounted secret files. There is no environment-variable fallback.

4. **"It leaves `x-amz-date` alone."**
   No. `x-amz-date` is rewritten to the active request time so the signature validates. Other transforms that target `x-amz-date` must run **after** `aws_auth`, not before — and even then, changing it would invalidate the signature.

5. **"Putting `aws_auth` first in the chain is fine."**
   Not if anything later changes the request body or a signed header. SigV4 covers both. Run `aws_auth` last on chains that touch signed material.

6. **"It can switch from SigV4 to SigV2 (or vice versa)."**
   No. The algorithm is fixed at `AWS4-HMAC-SHA256` and is read from the recorded header. To change algorithms, change the recording.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `a secretPath is required (aka the contents of AWS_SECRET_ACCESS_KEY)` | `secretPath` not set | Provide it (operator secret reference or file path) |
| Chain init: `an id is required (aka the contents of AWS_ACCESS_KEY_ID)` | `idPath` not set | Provide it |
| Runtime: `cannot use aws_auth transform without a request` | The chain ran on a payload with no underlying HTTP request | Re-target the chain to a request-side token |
| Runtime: `invalid Authorization header format - too few parts` | The token isn't a complete SigV4 header | Verify the upstream extractor (`http_req_header(name="Authorization")`) is returning the right field |
| Runtime: `invalid Authorization header format - wrong hash type` | Token doesn't start with `AWS4-HMAC-SHA256 ` | The recorded token isn't SigV4 — check the recording |
| Runtime: `credential field missing` or `SignedHeaders field missing` | `Authorization` is malformed | Inspect the recorded header; restore the missing field |
| Runtime: `failed to parse credentials` | `Credential=` is not in the form `AKID/YYYYMMDD/region/service/aws4_request` | Fix the recording |
| Runtime: `failed to parse secret at path ...` | The credential file doesn't exist or is unreadable | Verify the mounted secret name and key; confirm the operator mounted it |
| AWS rejects the re-signed request as expired | Replay time skewed against AWS clock, or a downstream transform overwrote `x-amz-date` after signing | Ensure `aws_auth` runs last among transforms that touch `x-amz-date` or the body |
| AWS rejects with "SignatureDoesNotMatch" | A signed header or the body changed after `aws_auth` ran | Move `aws_auth` to the end of the chain |
| Re-signed request authenticates as the wrong account | `idPath` / `secretPath` swapped, or wrong secret mounted | Confirm `idPath` holds the access key ID and `secretPath` holds the secret access key |

## Related Transforms

- [`jwt_resign`](./jwt_resign.md) — same shape (decode + re-sign) for JWTs instead of AWS SigV4.
- [`smart_replace`](./smart_replace.md) — for propagating non-signature values across the RRPair (e.g. an account ID returned in one response that needs to flow into a later request).
- [`regex`](./regex.md) — for surgically editing the recorded `Authorization` header (e.g. dropping an entry from `SignedHeaders=`) before `aws_auth` runs.
- [`constant`](./constant.md) — for replacing the entire `Authorization` header with a hand-crafted value when SigV4 isn't required (e.g. an endpoint that accepts a static API key).

## Advanced Notes

- Credentials are loaded on first use and cached on the transform instance under a read/write mutex. Concurrent re-signs in the same session reuse the cached values without re-reading the files.
- The transform reports its required secrets to the Speedscale operator so the right secrets are auto-mounted into the generator pod. The reported list is derived from the `${{secret:name/key}}` references in `idPath` and `secretPath`.
- The set of signed headers is taken verbatim from the recorded `Authorization`. Headers on the request that are not in the signed set are removed before signing — including any that earlier transforms in the chain may have added.
- The payload hash is computed over the request body as it stands when `aws_auth` runs. There is no way to point the signer at a different body.
- SigV4 with chunked / streaming bodies (`STREAMING-AWS4-HMAC-SHA256-PAYLOAD`) is not a supported recorded form — `aws_auth` re-signs as a single canonical request.
