---
description: "Unconditionally redact an extracted field with the dlp_field transform in Speedscale, replacing the value with a deterministic REDACTED-<category>-<hash> token, with an optional reverse mode that regenerates plausible values from existing redacted tokens."
sidebar_position: 10
---

# dlp_field

The `dlp_field` transform redacts a single extracted token unconditionally. It does **not** consult the global DLP redact list to decide whether to redact — when the chain hands it a value, it redacts it. The output is a deterministic `REDACTED-<category>-<hash>` token whose category is inferred from the value's shape (UUID, email, SSN, credit card, JWT, etc.) and whose hash is derived from the original bytes, so the same input always produces the same redacted output.

An opt-in `reverse=true` mode flips the behavior: tokens that already look redacted are regenerated back into plausible category-shaped values, leaving non-redacted tokens alone.

- **Transform type name (config/API):** `dlp_field`
- **Shorthand format:** `dlp_field(reverse=...)`

## Quick Start

Unconditionally redact whatever the chain extracts:

```json
"type": "dlp_field",
"config": {}
```

```
req_body() → json_path(path="customerId") → dlp_field()
```

The extracted `customerId` value is replaced with a `REDACTED-<category>-<hash>` token, regardless of the DLP redact list or category configuration.

## How It Works

`dlp_field` runs entirely in the first phase. The second phase is a no-op.

### Default mode (`reverse=false`)

1. **Detect the category.** The DLP engine inspects the incoming bytes and assigns a data pattern (e.g. `UUID`, `EMAIL`, `SSN`, `CREDIT_CARD`, `JWT`, `DATETIME`, `IP`, `E164_PHONE_NUMBER`). If the value doesn't match a known pattern, the category falls back to a generic label.
2. **Hash the original.** A hash of the original bytes is computed so the redacted output is deterministic — the same input always produces the same output, allowing match-rate signatures to remain stable across runs.
3. **Emit the redacted token** in the form `REDACTED-<CATEGORY>-<HASH>`. The category portion only appears when data pattern discovery is enabled at the redactor level.
4. **Record metadata.** The transform reports the data token to the RRPair (so the body's redaction state is tracked) and marks the RRPair as containing redacted content under the active DLP configuration's ID.

### Reverse mode (`reverse=true`)

The same transform with `reverse=true` does the opposite — given an already-redacted token, it generates a new, random, category-shaped value.

| Input | Behavior |
|---|---|
| Starts with `REDACTED-` and the category is recognized | A fresh random value of the right shape is emitted (e.g. a new UUID, a new email-shaped string). |
| Starts with `REDACTED-` but the category cannot be parsed | The token is returned unchanged. |
| Does **not** start with `REDACTED-` | Falls back to the default redaction path — i.e. the value is redacted normally. |

This is the mechanism for "make redacted recordings useful for replay" — you can capture a redacted snapshot, then in a replay chain use `dlp_field(reverse=true)` to materialize plausible values for the SUT.

### Why "no DLP configuration is necessary"

Unlike [`dlp_json`](./dlp_json.md), `dlp_field` does not call into the engine's key-blocking logic. Whatever the chain selects gets redacted. The DLP engine still needs to be present (the transform errors with `dlp redactor is missing` if not), but its redact list is **not** consulted to decide whether to act.

## Configuration

```json
"type": "dlp_field",
"config": {
    "reverse": "<true|false>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `reverse` | No | `false` | When `true`, regenerate values from existing `REDACTED-*` tokens instead of redacting. Non-redacted tokens still fall through to the default redaction path. |

### Output Format

```
REDACTED-<CATEGORY>-<HASH>
```

- **CATEGORY** examples: `UUID`, `EMAIL`, `SSN`, `CREDIT_CARD`, `JWT`, `PHONE_NUMBER`, `IP`, `DATETIME`. The set is the data pattern catalog Speedscale's DLP engine knows about. Category appears only when data pattern discovery is enabled.
- **HASH** is derived from the original token's bytes, so the same input value always produces the same redacted output.

This determinism matters: a request that originally carried the same customer ID across multiple fields will, after redaction, carry the same redacted token across those fields, preserving relational integrity for downstream consumers (and signature matching).

## Examples

### Example 1 — Redact a customer ID

```json
{
    "type": "dlp_field"
}
```

```
req_body() → json_path(path="customerId") → dlp_field()
```

| Before | After |
|---|---|
| `4E216B8D-E6CE-4FC6-B566-D44ACB6642F4` | `REDACTED-UUID-B2291A2A7EED78CDB627354103A6EBA35D2E448C20C831ECFC7F3C3B18432F31` |
| `john.doe@example.com` | `REDACTED-EMAIL-8F14E45FCEEA167A5A36DEDD4BEA2543` |
| `123-45-6789` | `REDACTED-SSN-A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3` |
| `4532-1234-5678-9012` | `REDACTED-CREDIT_CARD-C3499C2729730A7F807EFB8676A92DCB6F8A3F8F` |

### Example 2 — Redact an Authorization header

```
http_req_header(header="Authorization") → dlp_field()
```

The header's value is replaced with a redacted token. If the value is a JWT, the category will be `JWT`.

### Example 3 — Reverse: regenerate plausible values from a redacted recording

```json
{
    "type": "dlp_field",
    "config": {
        "reverse": "true"
    }
}
```

```
req_body() → json_path(path="customerId") → dlp_field(reverse=true)
```

| Before | After |
|---|---|
| `REDACTED-EMAIL-abc123def4` | A fresh email-shaped string |
| `REDACTED-UUID-abc123def4` | A fresh UUID |
| `user@example.com` (not redacted) | `REDACTED-EMAIL-<hash>` (falls back to redaction) |
| `REDACTED-INVALID_PATTERN-abc123` | `REDACTED-INVALID_PATTERN-abc123` (unrecognized category, returned unchanged) |

### Example 4 — Same input produces the same redacted output

Run `dlp_field` on `customer-42` in two different RRPairs. Both produce the same `REDACTED-<category>-<hash>` token, so any signature that depends on the same customer ID appearing in two places will still match after redaction.

## Common Misconceptions

1. **"`dlp_field` consults the DLP redact list."**
   No. It redacts unconditionally. The redact list governs `dlp_json`; it does not gate `dlp_field`.

2. **"The hash is random."**
   No. It is deterministic — the same input always produces the same output. This preserves cross-field relationships and signature stability.

3. **"`reverse=true` undoes a specific previous redaction."**
   No. It generates a **new** plausible value of the same category. It does not recover the original.

4. **"`reverse=true` will only act on redacted tokens."**
   No. Non-redacted tokens fall through to the standard redaction path. If you only want to act on redacted inputs, gate the chain upstream.

5. **"Category names always appear in the output."**
   The category only appears when data pattern discovery is enabled in the active DLP configuration. With discovery off, the output is still a redacted token but the category portion is omitted.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Error: `dlp redactor is missing` | The chain is running in a context that has no DLP engine attached | Run inside the generator, responder, or analyzer where the DLP engine is initialized |
| Output has no category portion | Pattern discovery is disabled in the DLP configuration | Enable pattern discovery, or rely on the hash for cross-field stability |
| `reverse=true` returned the input unchanged | The redacted token's category isn't in the regenerator catalog | Confirm the category portion of the input matches a supported pattern |
| Same input produces different outputs across runs | The DLP engine's hash salt or configuration changed between runs | Pin the DLP configuration; the hash is deterministic per configuration |
| Wanted to redact a whole JSON body, not one field | Wrong transform | Use [`dlp_json`](./dlp_json.md) |

## Related Transforms

- [`dlp_json`](./dlp_json.md) — walks an entire JSON body and redacts values whose keys are in the DLP redact list. Use when you have a body-level redaction policy rather than a specific field to redact.
- [`scrub`](./scrub.md) — substring-replace a specific extracted value across the body. Use for match-rate scrubbing, not policy-driven redaction.
- [`constant`](./constant.md), [`replace`](./replace.md) — when you want a fixed, hand-chosen replacement rather than a generated `REDACTED-*` token.

## Advanced Notes

- The transform reports its activity to the RRPair via two side channels: a data-token record (used by the dashboard's data-pattern view) and a "redacted under this DLP config ID" marker (used to track which RRPairs have already been processed).
- The redaction hash is deterministic per DLP configuration. Two RRPairs processed under the same configuration with the same input produce the same redacted output, supporting both signature stability and cross-field relational integrity.
- Reverse mode is intended for replay scenarios where the recording was redacted before replay, and the SUT needs values that look real (correct shape, parseable) without the original sensitive bytes. The regenerated value is unrelated to the original — it shares only the category.
- The transform does not require the recorded response to be present in the action file.
