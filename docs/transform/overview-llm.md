---
description: "A practical, LLM-friendly guide to Speedscale transforms: mental model, building blocks, common patterns, and end-to-end examples."
sidebar_position: 2
---

# Overview (LLM Friendly)

This guide gives an LLM (or any automation) a concrete mental model and recipes for working with Speedscale transforms. It summarizes how transforms are built, where they run, how to compose them, and how to express them in JSON. Examples are included for common tasks like PII redaction, request ID normalization, date shifting, and auth signing.

## Mental Model

- Token: A string value extracted from an RRPair (request/response) by an extractor. Every chain starts by extracting a token.
- Chain: `Extractor -> Transform -> Transform -> ...` sequentially mutates the token, then re-inserts it in the same place.
- Direction: Chains run in different phases and sides:
  - generator: before sending a request to the SUT; and after receiving the SUT response
  - responder (mocks): after receiving a request (before signature matching); and before sending a mocked response
- Variables: Short‑lived key/value storage per request context (with options to persist across requests). Use to pass values between chains or reuse learned values.
- Templates: A Traffic Transform Template (TTT) is a portable JSON of all chains you want applied.

Reference: See Overview, Extractors, and individual Transforms pages in this section for deep dives.

## Where Transforms Apply

- generator
  - RRPair request: mutate before sending to SUT (e.g., auth signing, date shifting)
  - RRPair response: read/learn values from SUT (e.g., harvest new IDs, set variables)
- responder (mocks)
  - RRPair request: normalize dynamic inputs to improve signature matching
  - RRPair response: mutate recorded response (e.g., DLP on payloads)
- forwarder (ingest)
  - The Speedscale forwarder can apply configured rules before data leaves your environment and is sent to Speedscale Cloud. This is commonly used to:
    - Redact PII early (e.g., via DLP rules or `dlp_json`/`dlp_field` when applicable)
    - Tag sessions as data is ingested (e.g., using patterns described in the session identification guide) so you can filter and group traffic immediately in the viewer
- See Identify Session guide and DLP setup docs for applying these rules to the forwarder deployment.

Tip: Whether the request or response is affected depends on the extractor you choose (e.g., `req_body` vs `res_body`).

## Building Blocks

### Extractors (start of every chain)

Extractors select a specific data location and return it as a token string. Common extractors:

- `req_body` / `res_body`: raw HTTP body or JSONified non‑HTTP body
- `http_req_header` / `http_res_header`: value of an HTTP header
- `http_queryparam`, `http_req_cookie`, `http_res_cookie`, `http_status_code`, `http_url`
- `json_path` (extractor flavor): operate on the flattened RRPair JSON to target any field, including headers/cookies/URL parts
- `variable`: read/write the variable cache
- `file`: read a local file during generation (useful for example fixtures)

Use `json_path` or `json_selector` (transform) when paths are complex, dynamic, or nested.

### Transforms (mutate/extract/replace)

Common families and examples:

- Selection / navigation
  - `json_path`: select or create JSON nodes by path
  - `json_selector`: find path recursively or by value match
  - `regex`: extract via Golang‑flavor regex with optional capture groups
  - `split`: split by delimiters and choose an index

- String/value mutation
  - `replace`, `trim`, `constant`, `one_of`, `rand_string`
  - `date`: auto shift relative to recording or apply manual offset

- Encoding/decoding
  - `url_decode` and `url_encode` (one‑way steps so you control when to re‑encode)
  - `base64`, `gzip`

- Data protection / normalization
  - `dlp_json`: redact sensitive keys according to DLP settings
  - `dlp_field`: always redact the current token
  - `scrub`: replace values broadly (improves mock signature match rate)

- Identity/session/signature
  - `smart_replace`: learn replacement mappings for encountered values
  - `smart_replace_recorded`: tie recorded values to replay‑time values
  - `tag_session`: mark a token as a session identifier for grouping
  - `store_sig`: add fields to mock signature analysis (responder only)
  - `jwt_resign`, `aws_auth`: sign/refresh auth headers after other changes

- Variables
  - `var_store`: save the current token to a variable
  - `var_load`: replace the token with a variable value

## Chain Syntax (pseudocode)

Use this readable shorthand to think through a chain:

```
req_body() -> json_path(path="user.email") -> regex(pattern="@(.+)$", captureGroup=1)
```

It means: take the request body, get `user.email`, extract the domain with regex.

When serialized into a TTT JSON, the same idea becomes a list of objects with an `extractor` and `transforms` array.

## Transform Template (TTT) JSON Structure

Minimal shape:

```json
{
  "id": "my_template",
  "generator": [
    {
      "extractor": { "type": "req_body" },
      "transforms": [
        { "type": "json_path", "config": { "path": "user.email" } },
        { "type": "regex", "config": { "pattern": "@(.+)$", "captureGroup": 1 } }
      ]
    }
  ],
  "responder": [
    {
      "extractor": { "type": "http_req_header", "config": { "name": "X-Request-ID" } },
      "transforms": [ { "type": "scrub", "config": { "new": "*" } } ]
    }
  ]
}
```

Notes:
- Top‑level sections are `generator` and/or `responder`, each a list of chains.
- Each chain has exactly one `extractor` and a sequential list of `transforms`.
- Config objects are specific to each extractor/transform and documented per page.

## Patterns and Recipes

Below are practical patterns you can adapt.

### 1) Redact PII in JSON payloads

Goal: ensure emails, API keys, or secrets are never sent or displayed.

Chain (pseudocode):

```
req_body() -> json_path(path="user.email") -> dlp_field()
res_body() -> json_path(path="apiKey") -> dlp_field()
```

Variant (bulk): use `dlp_json` at a higher node to apply DLP configuration to multiple keys in one pass.

### 2) Normalize dynamic IDs for mocks

Goal: responder should match recorded signatures despite rotating IDs.

Chains (responder request):

```
smart_replace_recorded() -> http_req_header(name="X-Request-ID") -> regex(pattern="req_([0-9]+)", captureGroup=1)
http_req_header(name="X-Request-ID") -> scrub(new="*")
```

Explanation: first chain teaches mapping between recorded and live values. The second chain scrubs remaining variance to improve signature matching.

### 3) Shift timestamps relative to recording

Goal: replay with a realistic “current time” offset.

Chain:

```
http_req_header(name="If-Modified-Since") -> date(layout="auto", precision="24h")
```

Result: token becomes `{speedscale_date(<relative>)}` which the generator resolves at send time.

### 4) Update a query parameter and re‑sign AWS auth

Goal: tweak a query param then re‑sign `Authorization` v4 header.

Chains (generator request):

```
http_url() -> regex(pattern="[?&]page=([0-9]+)", captureGroup=1) -> constant(new="2")
http_req_header(name="Authorization") -> aws_auth(secretPath="${{secret:awscreds/secretkey}}", idPath="${{secret:awscreds/id}}")
```

Ensure signing runs after all mutating transforms that should be reflected in the signature.

### 5) Replace user IDs consistently with learned values

Goal: replace `userId` across the entire test run with stable, generated tokens.

Chain (run early in generator):

```
smart_replace() -> req_body() -> json_path(path="userId") -> rand_string(pattern="user_[a-z0-9]{12}")
```

Later requests containing the same original `userId` will receive the same replacement.

### 6) Extract nested value with dynamic path

Goal: select data when array positions or object keys vary.

Chain:

```
req_body() -> json_selector(match="address.zip=30303", recursive=true, levelsUp=2)
```

This lifts the object containing the matched zip code into the token for further mutation.

### 7) Work with URL‑encoded payloads

Goal: edit a field that is currently URL‑encoded.

Chain:

```
req_body() -> json_path(path="user.encodedData") -> url_decode() -> replace(old="prod", new="staging") -> url_encode()
```

Decode before editing; re‑encode when done. These steps are intentionally one‑way so you control ordering.

### 8) Carry data across requests via variables

Goal: store a value from a response, reuse it in a later request.

Chains:

```
res_body() -> json_path(path="auth.token") -> var_store(name="session_token")
http_req_header(name="Authorization") -> var_load(name="session_token")
```

Variables are scoped to the vUser by default and persist across requests within a vUser.

## Authoring Tips

- Start simple: validate a single extractor and transform before chaining more.
- Order matters: e.g., decode -> edit -> encode, or mutate -> sign.
- Use `regex101.com` (Golang flavor) to validate complex patterns.
- Use `smart_replace_recorded` early in responder chains when aligning recorded vs. live values.
- Prefer `json_selector` when exact JSONPath is unstable between requests.
- For DLP, use `dlp_json` to apply policy, or `dlp_field` to force redaction regardless of policy.

## Troubleshooting Checklist

- Extractor points to the correct side and location? (`req_body` vs `res_body`, header name casing, etc.)
- Token format matches transform expectation? (e.g., JSON for `json_path`, encoded vs. plain for URL transforms)
- Transform order correct? (e.g., signing last; decoding before editing)
- Variables initialized and names consistent? (`var_store`/`var_load`)
- For mocks, excessive variance scrubbed? (`scrub`, `trim`, limited `replace` count)

## See Also

- Overview: conceptual diagrams and where transforms run
- Extractors reference: how to target data
- Transforms reference: config for each transform type
- Traffic Transform Templates: saving, sharing, and reusing chains
