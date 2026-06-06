---
description: "Re-sign existing JWT tokens with the jwt_resign transform in Speedscale, preserving the original algorithm while rewriting claims and re-issuing with a new signing key from a mounted secret or inline value."
sidebar_position: 15
---

# jwt_resign

The `jwt_resign` transform decodes a JWT, rewrites a configurable subset of claims, and re-signs the token with a new key — **preserving the original signing algorithm**. It works on both request-side tokens (`Authorization: Bearer ...`) and response-side tokens returned by an auth endpoint.

- **Transform type name (config/API):** `jwt_resign`
- **Shorthand format:** `jwt_resign(secretPath=...,claims=...)`
- **Algorithms supported:** every algorithm that the underlying parser accepts — HS256/384/512, RS256/384/512, ES256/384/512, EdDSA (Ed25519). The algorithm is taken from the original token's header and matched against the supplied key.

## Quick Start

For most replay scenarios with a Kubernetes-mounted secret:

```json
"type": "jwt_resign",
"config": {
    "secretPath": "${{secret:my-jwt-secret/private.pem}}"
}
```

This rewrites timing claims (`iat`, `exp`, `nbf` — see [Automatic Claim Rewrites](#automatic-claim-rewrites)) and re-signs with the mounted key. No claim overrides applied.

## How It Works

`jwt_resign` does all of its work in the first phase. The second phase is a no-op.

1. **Strip a recognised prefix.** The token is checked against the configured `prefixes` list (defaults: `"Bearer "`, `"JWTBearer "`); a matching prefix is stripped and remembered to be prepended back at the end.
2. **Parse the token.** The header and claims are decoded. **Signature is not verified** — the transform's job is to produce a re-signed token, not to validate the original.
3. **Apply automatic claim rewrites.** `iat`, `exp`, and `nbf` are rewritten to standard values (see below).
4. **Apply variable substitution to existing string claims.** Any string-valued claim in the original token is passed through `${{...}}` variable resolution against the variable cache.
5. **Apply user-supplied claim overrides.** Values from `iss`, `aud`, `sub`, and `claims` config are written into the claims map, also after `${{...}}` substitution. User overrides take precedence over original values.
6. **Apply header overrides.** Currently only `kid` is supported in the header.
7. **Look up the signing key.** From `secretPath` (preferred) or inline `key`. The result is cached after the first lookup so re-signs in the same session don't repeat the disk read.
8. **Re-sign** with the original algorithm and emit `prefix + newToken`.

### Automatic Claim Rewrites

These are applied unconditionally when present in the original token:

| Claim | New value |
|---|---|
| `iat` | Current time (replay time). |
| `exp` | Current time + 2 days. |
| `nbf` | `2015-10-10` (a fixed past date so the token is always "valid from"). |

If your service rejects tokens whose `exp` is more than 2 days in the future, override `exp` explicitly via `claims`.

### Precedence Order for Claims

Lowest to highest:

1. Original claim value from the recorded token.
2. Variable substitution result on the original value (if it contains `${{...}}`).
3. User-supplied value from `iss` / `aud` / `sub` / `claims` config (also passed through variable substitution).

## Configuration

```json
"type": "jwt_resign",
"config": {
    "secretPath": "<path or secret reference>",
    "key": "<inline key>",
    "iss": "<issuer>",
    "aud": "<audience>",
    "sub": "<subject>",
    "kid": "<key id (header)>",
    "claims": "key1=val1,key2=val2",
    "prefixes": "Bearer ,JWTBearer "
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `secretPath` | **Yes** (or `key`) | — | Path to the signing key. Supports the Kubernetes form `${{secret:secret_name/key_inside_the_secret}}` which the operator auto-mounts (see [Re-sign JWTs guide](/guides/replay/resign-jwt.md)). |
| `key` | **Yes** (or `secretPath`) | — | Inline signing key material. Useful for HS* algorithms in local testing; prefer `secretPath` for production. |
| `iss` | No | unchanged | Override the `iss` claim. |
| `aud` | No | unchanged | Override the `aud` claim. |
| `sub` | No | unchanged | Override the `sub` claim. |
| `kid` | No | unchanged | Override the `kid` **header** field (not a claim). |
| `claims` | No | none | Additional claim overrides as a comma-separated list of `key=value` pairs. Malformed pairs fail chain initialization. |
| `prefixes` | No | `"Bearer ,JWTBearer "` | Comma-separated list of prefixes that may appear before the JWT. The first matching prefix is stripped before parsing and re-prepended after re-signing. Whitespace at the end of each prefix is significant — `"Bearer "` (with trailing space) is different from `"Bearer"`. |

At least one of `secretPath` or `key` must be set. The transform fails chain initialization otherwise.

### Key Format by Algorithm

| Algorithm class | Key format expected at `secretPath` / `key` |
|---|---|
| `HS256` / `HS384` / `HS512` | Raw shared secret bytes. UTF-8 text in a file works. |
| `RS256` / `RS384` / `RS512` | PEM-encoded RSA private key. |
| `ES256` / `ES384` / `ES512` | PEM-encoded ECDSA private key on the curve matching the algorithm. |
| `EdDSA` | PEM-encoded Ed25519 private key. |

The algorithm is read from the original token's header, so the same chain configuration handles whichever JWT shape the recorded traffic carries — as long as the supplied key matches the algorithm.

### Variable Substitution

`${{...}}` substitution is applied to:

- Every existing string-valued claim in the original token.
- Every value in the `iss` / `aud` / `sub` / `claims` overrides.
- Every entry in `prefixes`.

This lets you re-issue a JWT whose `sub` matches a dynamic identity captured earlier in replay (e.g. `"sub": "${{var:current_user_id}}"`).

## Examples

### Example 1 — Re-sign with a mounted Kubernetes secret

```json
"type": "jwt_resign",
"config": {
    "secretPath": "${{secret:auth-keys/jwt-private.pem}}"
}
```

The operator mounts the `jwt-private.pem` key from the `auth-keys` secret into the generator pod and substitutes the path. No claim overrides; the token's `iat`/`exp`/`nbf` are still rewritten to current time.

### Example 2 — Override audience and subject for a specific environment

```json
"type": "jwt_resign",
"config": {
    "secretPath": "${{secret:auth-keys/jwt-private.pem}}",
    "aud": "api.staging.example.com",
    "claims": "tenant_id=stg-01,role=admin"
}
```

### Example 3 — Inline HMAC secret for a local test

```json
"type": "jwt_resign",
"config": {
    "key": "No one will ever guess this super secret secret"
}
```

Use only for local development. Anything checked into a config file is recoverable history.

### Example 4 — Custom token prefix

```json
"type": "jwt_resign",
"config": {
    "secretPath": "${{secret:auth-keys/jwt-private.pem}}",
    "prefixes": "Bearer ,Token "
}
```

Strips and re-prepends either `Bearer ` or `Token ` depending on which is present.

## Common Misconceptions

1. **"It verifies the original signature."**
   No. The transform decodes the token and re-signs it. If the original signature is invalid or the original key is unavailable, the token still gets re-signed and emitted.

2. **"The algorithm changes when I change the key."**
   No. The algorithm is read from the original token's header. To change the algorithm, change the original recorded token — `jwt_resign` will not switch algorithm classes for you.

3. **"`secretPath` always points to a local file."**
   Local file paths work, but the common production form is the operator-resolved `${{secret:name/key}}` syntax, which is rewritten to an in-pod mount path at chain construction time.

4. **"`exp` is left alone if I don't override it."**
   No. `exp` is automatically rewritten to `now + 2 days`. Override explicitly via `claims` if you need a different expiry.

5. **"The `prefixes` list is matched by substring."**
   No. It's a prefix match against the start of the token string. Order matters — the first prefix that matches wins.

6. **"`kid` is a claim."**
   No. `kid` is a **header** field. The transform handles this distinction internally — `kid` is the only header override currently supported.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: `a key or path to a key for re-signing jwts is required` | Neither `secretPath` nor `key` is set | Provide one |
| Chain init: `claims config entry malformed (must be key=value,...)` | An entry in `claims` is missing the `=` or has more than one | Reformat as `key1=val1,key2=val2` |
| Token returned unchanged with no error | Token was empty (`len(token) == 0`) | Verify the upstream extractor is returning the right field |
| Runtime: `failed to parse secret at path ...` | Key file format does not match the algorithm | Match the [key format table](#key-format-by-algorithm) to the original algorithm |
| Re-signed token rejected by the SUT as expired | The SUT requires `exp` within a window narrower than 2 days | Set `claims` to override `exp` with a smaller offset, or check the SUT's tolerance |
| Re-signed token rejected as not-yet-valid | The SUT requires `nbf` within a recent window | Override `nbf` via `claims` (default is `2015-10-10`, which most validators accept) |
| `Bearer ` prefix lost in the output | A custom prefix is in use but `prefixes` config wasn't updated | Add the prefix string (with trailing space if present) to `prefixes` |

## Related Transforms

- [`smart_replace`](./smart_replace.md) — pair with `jwt_resign` on the response side to propagate a re-signed token learned from `/login` into subsequent request `Authorization` headers.
- [`constant`](./constant.md) — for replacing a JWT with a static, hand-issued token when re-signing isn't necessary.
- [`regex`](./regex.md) — for plucking a JWT out of an unusual envelope before feeding it to `jwt_resign`.

## Advanced Notes

- The signing key is loaded on first use and cached for subsequent re-signs. Concurrent transform instances maintain independent caches.
- The transform reports its required Kubernetes secrets to the Speedscale operator so the right secrets are auto-mounted into the generator pod. The reported list is derived from the `secretPath` config and follows the `secret:name/key` form.
- The set of header overrides is intentionally limited to `kid`. Other JOSE header parameters (`typ`, `alg`, `cty`) are not overridable by design — `alg` is taken from the original token, and the rest are rarely needed in replay.
- See [Re-sign JWTs guide](/guides/replay/resign-jwt.md) for end-to-end operator setup of the mounted secret.
