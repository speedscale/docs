---
description: "Replace a token with a static string using the constant transform in Speedscale. Supports embedded ${{...}} substitution for variables, environment variables, mounted secrets, files, dataframes, and inline random strings."
sidebar_position: 3
---

# constant

The `constant` transform replaces whatever the chain extracted with a fixed string. The string is free-form text and supports the full embedded `${{...}}` substitution syntax, so the "constant" can include dynamic values resolved at replay time — variables from earlier in the chain, environment variables, file contents, mounted Kubernetes secrets, and more.

- **Transform type name (config/API):** `constant`
- **Shorthand format:** `constant(new=...)`

## Quick Start

Replace the extracted field with a literal string:

```json
"type": "constant",
"config": {
    "new": "production"
}
```

Inject a mounted Kubernetes secret:

```json
"type": "constant",
"config": {
    "new": "${{secret:db-creds/password}}"
}
```

## How It Works

The substitution happens in the first phase. The second phase passes the value through unchanged.

1. **First phase** — emit the configured `new` string with every `${{...}}` token resolved against the variable cache. The original extracted value is discarded.
2. **Second phase** — no-op for the rewritten value; the chain continues with whatever comes next.

### `${{...}}` Substitution

The `new` string is treated as a template. Any `${{...}}` tokens it contains are resolved at replay time. Supported forms include:

| Form | Resolves to |
|---|---|
| `${{my_var}}` | A [variable](../variables.md) previously stored on the variable cache. |
| `${{env_var:BUILD_VERSION}}` | An environment variable on the generator pod. |
| `${{rand_string:"order-[a-z0-9]{12}"}}` | A regex-driven random string, generated fresh on each call. |
| `${{file:s3://payload.json}}` | The full contents of a file, including [user data](../../../reference/glossary.md#user-data) from the cloud. |
| `${{dataframe:people:${{id}}:Email}}` | A cell lookup against a loaded [dataframe](./dataframe.md). |
| `${{secret:mongo-creds/password}}` | A key from a mounted Kubernetes secret. |

See [Embedded Syntax](../embedded-syntax.md) for the complete reference.

### Mounted Secrets

When `new` contains one or more `${{secret:name/key}}` references, the transform reports those secrets to the Speedscale operator, which auto-mounts them into the generator pod. On first use, the transform reads each secret from disk, stores its contents in the variable cache under a unique key, and rewrites the template so subsequent runs resolve straight from the cache. The disk read happens once per transform instance.

## Configuration

```json
"type": "constant",
"config": {
    "new": "<string>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `new` | **Yes** | — | The literal string to write into the extracted field. May contain any number of `${{...}}` tokens, which are resolved at replay time. |

## Examples

### Example 1 — Hard-code an environment field

```
req_body() → json_path(path="environment") → constant(new="production")
```

- Before: `"environment": "development"`
- After: `"environment": "production"`

### Example 2 — Override a header

```
http_req_header(header="User-Agent") → constant(new="SpeedscaleBot/1.0")
```

- Before: `User-Agent: Mozilla/5.0 (...)`
- After: `User-Agent: SpeedscaleBot/1.0`

### Example 3 — Inject a mounted secret into a request body

```json
"type": "constant",
"config": {
    "new": "${{secret:db-creds/password}}"
}
```

The operator mounts the `db-creds` secret into the generator pod. The first invocation reads `password` from disk and caches it; every subsequent invocation in the same session pulls from cache.

### Example 4 — Combine literals, variables, and a random string

```json
"type": "constant",
"config": {
    "new": "order-${{customer_id}}-${{rand_string:\"[0-9]{6}\"}}"
}
```

- `${{customer_id}}` resolves from the variable cache (typically populated earlier by a `variable_store` chain).
- `${{rand_string:...}}` generates a fresh six-digit number on each call.

### Example 5 — Inline a file's contents

```json
"type": "constant",
"config": {
    "new": "${{file:s3://my-bucket/golden-payload.json}}"
}
```

The entire file is substituted in place. Useful for swapping out a recorded body with a fixed golden payload at replay time.

## Common Misconceptions

1. **"`constant` always writes the literal `new` string."**
   No. It writes `new` with `${{...}}` tokens resolved. If `new` contains a `${{rand_string:...}}`, every invocation produces a different value.

2. **"The original extracted value is preserved."**
   No. The original value is discarded — `constant` is a replacement, not a modification.

3. **"Secrets need to be configured separately."**
   No. Secrets referenced as `${{secret:name/key}}` inside `new` are reported to the operator automatically and mounted into the generator pod.

4. **"`constant` is the same as `replace`."**
   No. `replace` performs substring substitution on the existing token. `constant` discards the existing token entirely and writes the configured value.

5. **"Variable substitution happens at config time."**
   No. `${{...}}` resolution happens on every invocation, against the live variable cache. A value stored by an earlier chain in the same RRPair is visible to a later `constant` chain.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Field unchanged | Chain isn't extracting the intended field | Verify the upstream extractor in Preview Mode |
| `failed to read secret file at ...` | Secret not mounted, or path mismatch | Confirm the secret name/key is correct and that the operator has access to it |
| `${{var:foo}}` written through literally | The variable wasn't stored before this chain ran | Use [`variable_store`](./variable_store.md) on an earlier RRPair, or check chain ordering |
| Same "random" value each call | Used `${{rand_string:...}}` outside `constant`, or hit the known reserved-keyword caching issue — multiple identical `${{rand_string:...}}` tokens in the same string resolve to the same value | Use distinct patterns, or split into multiple chains |

## Related Transforms

- [`replace`](./replace.md) — substring substitution that preserves the surrounding text.
- [`rand_string`](./rand_string.md) — generate a random string without the template wrapper.
- [`one_of`](./one_of.md) — cycle through a configured list of values.
- [`smart_replace`](./smart_replace.md) — pair with `constant` to propagate the new value across every occurrence in the RRPair.

## Advanced Notes

- The first call into a `constant` transform with secret references performs the disk read and cache population. Subsequent calls re-use the cached values, so secret rotation requires restarting the replay session.
- `requiredSecrets` is computed at construction time from the `new` template. Adding a secret reference at runtime (e.g. via a variable that itself expands to `${{secret:...}}`) will not register an additional mount.
- `constant` does not require recorded response data to run, so it is safe to use in any chain regardless of whether the RRPair carries a response.
