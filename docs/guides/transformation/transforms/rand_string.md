---
description: "Generate a random string that matches a regex pattern with the rand_string transform in Speedscale. A new value is produced on every invocation, useful for randomising IDs, session tokens, and other unique fields during replay."
sidebar_position: 17
---

# rand_string

The `rand_string` transform replaces the extracted token with a freshly generated random string that matches a configured regex pattern. A new value is produced on every invocation, so the same chain run twice will write two different strings.

It is the simplest way to produce per-request unique values during replay. Most regex syntax is supported; the underlying generator follows the [goregen](https://pkg.go.dev/github.com/zach-klippenstein/goregen) rules (Perl-compatible).

- **Transform type name (config/API):** `rand_string`
- **Shorthand format:** `rand_string(pattern=...)`

## Quick Start

```json
"type": "rand_string",
"config": {
    "pattern": "user_[a-z0-9]{10,20}"
}
```

Each call produces a different `user_<random>` string between 10 and 20 alphanumeric characters long.

## How It Works

All work happens in the first phase. The second phase is a no-op (the random value is generated once and passed through to whatever the chain writes back).

1. **First phase** — resolve any `${{...}}` tokens inside `pattern` against the variable cache, then generate a string that matches the resulting regex.
2. **Second phase** — pass through unchanged.

The original extracted value is discarded.

### Variable Substitution in `pattern`

`pattern` itself is run through `${{...}}` resolution before being handed to the regex generator. That lets you build a pattern out of values stored in the variable cache:

```json
"type": "rand_string",
"config": {
    "pattern": "${{tenant_prefix}}_[a-z0-9]{12}"
}
```

If `tenant_prefix` resolves to `acme`, the generated string will look like `acme_4f2k9q1z8c7b`.

## Configuration

```json
"type": "rand_string",
"config": {
    "pattern": "<regular expression>"
}
```

| Parameter | Required | Default | Description |
|---|---|---|---|
| `pattern` | **Yes** | — | A regex describing the shape of the generated string. Missing this fails chain initialization. Supports `${{...}}` substitution. |

### Pattern Syntax

The pattern is compiled by [goregen](https://pkg.go.dev/github.com/zach-klippenstein/goregen) under Perl syntax. Useful constructs:

| Construct | Example | Sample output |
|---|---|---|
| Character class with quantifier | `[a-z0-9]{16}` | `4f2k9q1z8c7byx0w` |
| Variable-length quantifier | `[a-z0-9]{10,20}` | `gp2yzc9509tiy` |
| Literal prefix or suffix | `user_[0-9]{6}` | `user_847291` |
| Alternation | `(red|green|blue)` | `green` |
| Optional group | `Hello,?( world)?` | `Hello world` or `Hello, world` or `Hello` |
| Nested alternation | `Hello,? (world|you( (fantastic|wonderful) (human|person))?)[.!]` | `Hello, you fantastic human!` |

Patterns that the generator cannot compile cause a runtime error on the call that triggers them.

## Examples

### Example 1 — Random user ID

```
req_body() → json_path(path="userId") → rand_string(pattern="user_[a-z0-9]{10,20}")
```

- Before: `user_john_doe_123`
- After: `user_2mkfazc946jz5o`

### Example 2 — 32-character session ID

```
res_body() → json_path(path="sessionId") → rand_string(pattern="[A-Z0-9]{32}")
```

- Before: `ABC123XYZ789DEF456GHI789JKL012MN`
- After: `K8J3H7F9D2S1A6Q4Z9X8C7V5B3N1M0P2`

### Example 3 — Random request ID in a header

```
http_req_header(header="X-Request-ID") → rand_string(pattern="req_[0-9]{16}")
```

- Before: `req_1234567890123456`
- After: `req_8765432109876543`

### Example 4 — Pair with `smart_replace` for cross-field propagation

```
smart_replace() → res_body() → json_path(path="userId") → rand_string(pattern="user_[a-z0-9]{12}")
```

The first time a `userId` is seen in a response body, a random replacement is generated. Every other occurrence of that `userId` across the RRPair — and across later RRPairs in the same session — is rewritten to the same generated value. Without `smart_replace`, the rewrite stays scoped to the single extracted field.

## Common Misconceptions

1. **"The same value is reused across the RRPair."**
   No. `rand_string` only rewrites the extracted field. To propagate the new value everywhere the original appeared, wrap the chain with [`smart_replace`](./smart_replace.md).

2. **"It uses Go's standard `regexp` package."**
   No. It uses the [goregen](https://pkg.go.dev/github.com/zach-klippenstein/goregen) generator under Perl syntax. Most patterns are compatible, but unbounded quantifiers (`*`, `+` without an upper bound) may produce surprisingly long or empty strings.

3. **"`pattern` is treated literally."**
   No. `${{...}}` substitution is applied to `pattern` first; the resolved string is the actual regex.

4. **"Each call produces a unique value forever."**
   The generator is statistically uniform across the regex, but collisions are possible with small character spaces or short lengths. Choose `pattern` widths that match the uniqueness you need.

5. **"It runs in the second phase like `one_of`."**
   No. `rand_string` runs in the first phase. The second phase is a no-op.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Chain init: missing `pattern` | `pattern` is required | Add `pattern` to the config |
| Runtime: `cannot process regexp pattern to generate random string` | Pattern is invalid Perl regex | Test the pattern in a Perl-syntax regex tool first |
| Generated string is empty | Pattern is `.*` or similar with zero-length minimum | Use a bounded quantifier like `{1,20}` |
| Same value seen repeatedly | The chain only runs once, or the value is being cached upstream | Confirm the chain is firing per RRPair in Preview Mode |
| Pattern with `${{var:foo}}` writes literal `${{var:foo}}` | The variable isn't in the cache when this chain runs | Populate the variable earlier with [`variable_store`](./variable_store.md), or check chain ordering |

## Related Transforms

- [`constant`](./constant.md) — write a fixed value, optionally with inline `${{rand_string:"..."}}` for one-shot generation.
- [`one_of`](./one_of.md) — pick from a fixed list of options instead of generating a random match.
- [`smart_replace`](./smart_replace.md) — register the generated value as a mapping so every occurrence of the original is rewritten consistently.
- [`regex`](./regex.md) — extract or substitute with a regex, rather than generate from one.

## Advanced Notes

- `pattern` is resolved against the variable cache on every call, so a chain whose `pattern` references a variable can change shape mid-replay if that variable is updated.
- The generator is seeded by Go's default `math/rand` source. Output is not cryptographically secure; do not use it for secrets, only for unique-ish identifiers.
- `rand_string` does not require recorded response data to run.
