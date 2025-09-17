# LLM Playbook: Choosing And Chaining Transforms

This guide teaches an LLM how to choose extractors and transforms to solve common data‑transformation tasks in Speedscale. Use it to propose precise, minimal transform chains that improve replay accuracy and mock match rate.

## Mental Model

- Token: Each chain operates on a single extracted token (string/bytes) and then reinserts it back in place.
- Start With An Extractor: Always begin with an extractor that identifies what to change (e.g., `http_req_header`, `req_body`, `json_path`).
- Chain Transforms: Apply one or more transforms to mutate the token (e.g., `date`, `regex`, `replace`).
- Reinsert: The system encodes and writes the final token back to the same spot in the RRPair.

Notation used below:

```
<extractor>(...)
  <-> <transform A>(...)
  <-> <transform B>(...)
```

## Extract First, Then Transform

Common extractors you’ll likely use:

- `http_req_header(name)`: Target a request header, e.g., Authorization, Date.
- `http_queryparam(name)`: Target a request query parameter.
- `http_url(index?)`: Target path segment or entire URL.
- `req_body` / `res_body`: Work on raw body (HTTP) or JSON representation (non‑HTTP).
- `json_path(path)`: Navigate the RRPair JSON or a JSON body to a specific field.
- `xml_path(path)`: Navigate XML body content by XPath.
- `variable(name)`: Read/write transient variables during a request.
- `file(filename)`: Load file or user data (e.g., CSV) into a variable.

Tip: If a JSON path varies slightly across requests, use `json_selector` to find a nearby match and then operate on adjacent data.

## Choose By Problem Type

Below are common transformation goals and recommended chains. Adjust extractor and config to match where the value lives.

### IDs, Request Correlation, And Dynamic Values

- Replace recorded IDs with values learned at replay time (best for rotating IDs):
  - On analysis/learning: extract the original value and tag it for future replacement.
  - Chain: `... <-> smart_replace_recorded`
  - During replay, the recorded value is replaced everywhere the key occurs.
  - To improve matching in the current request, follow with `scrub` to blank the field after learning.

- Replace arbitrary occurrences globally using a CSV mapping:
  - Seed mapping: `smart_replace_csv(headers=?, existing=..., new=...)`
  - Result: all future occurrences of existing→new are replaced across headers, params, bodies, SQL, etc.

- Replace or normalize a value in place:
  - `... <-> constant(new="...")`
  - `... <-> replace(old="...", new="...", count?)`
  - `... <-> trim(type=left|right|spaces, value?)`

- Generate values:
  - Random to regex: `... <-> rand_string(pattern="user_[a-z0-9]{10,20}")`
  - Rotate through fixed set: `... <-> one_of(strategy=sequential|random, options="a,b,c")`
  - Iterate from CSV column each call:
    - Load once: `my_csv = file("s3://employees.csv") -> csv(hasHeader=true, header="Email")`
    - Use per call: `... <-> csv_iter(csv_name="my_csv")`

- Look up replacement values by primary key (dataframe):
  - Prepare: `my_df = file("s3://dataframe.csv") -> csv_dataframe(primary_key="Name")`
  - Use: `... <-> dataframe_lookup(dataframe_name="my_df", key="Bob Brown", field="Email")`

### Timestamps And Dates

- Shift timestamps relative to record time (automatic) or by fixed offset:
  - `... <-> date(layout="auto|<Go layout>|epoch|epoch_ms", precision?, offset?)`
  - Example: `http_req_header("Date") <-> date(layout="auto")`
  - For JSON bodies: `req_body <-> json_path(path="foo.bar.timestamp") <-> date(layout="auto")`

- Scrub all dates in a JSON payload to stabilize signature matching:
  - `req_body <-> scrub_date(ignorePaths="optional,keys,to,skip")`

### Structured Payload Extraction/Rewrite

- JSON exact path:
  - `... <-> json_path(path="a.b.c", create?=true|false)` for read/write.

- JSON path that moves slightly across requests:
  - `... <-> json_selector(match="path[.to.key][=value]", recursive=true, levelsUp=N)`
  - Then operate on the selected object with additional transforms.

- XML content:
  - `... <-> xml_path(path="/feed/entry/epoch/text()")`

### Authentication And Signing

- Re‑sign a JWT (respect original alg; update nbf/iat/exp):
  - `http_req_header("Authorization") <-> regex(pattern="^(?i)Bearer (.*)$", captureGroup=1) <-> jwt_resign(secretPath=..., iss?, aud?, sub?, claims?, prefixes?)`
  - Place `jwt_resign` after any upstream changes that should be covered by the signature.

- Re‑sign AWS SigV4 Authorization header:
  - `http_req_header("Authorization") <-> aws_auth(secretPath=..., idPath=...)`
  - Must be the last transform in the chain for that request, so it signs the final state.

### Encoding, Decoding, And Binary

- URL encode/decode: `... <-> url_encode` or `... <-> url_decode`
- Base64 encode/decode: `... <-> base64`
- Gzip compress/decompress bytes: `... <-> gzip`

### Data Loss Prevention, Redaction, And Scrubbing

- Redact specific token consistently: `... <-> dlp_field` → becomes `REDACTED-<sha256> (pattern)`
- Redact specific JSON keys using configured DLP policy: `req_body <-> dlp_json`
- Scrub arbitrary dynamic fields in current RRPair (increase mock match rate):
  - `req_body <-> scrub(ignorePaths="keys,to,skip", new?="*")`

### Variables And Cross‑Request State

- Store per‑request or persistent values:
  - Per‑request cache: `variable(variable="name")`
  - Persistent store: `... <-> var_store(name="my_variable")`
  - Load later: `... <-> var_load(name="my_variable")`

### Mocks, Matching, And Session Grouping

- Improve mock matching by storing signature pieces: `... <-> store_sig(key?="label")`
- Group requests by session identifier visible in traffic: `... <-> tag_session`

### Traffic Timing

- Delay a request: `... <-> sleep(duration="150ms|1s|1m|...")`

## Text Manipulation Toolbox

- Extract with regex: `... <-> regex(pattern, captureGroup?)`
- Split token by delimiters and take index: `... <-> split(index=N, separator="|,.")`
- Replace in token: `... <-> replace(old, new, count?)`
- Trim prefix/suffix/spaces: `... <-> trim(type=left|right|spaces, value)`

## End‑To‑End Recipes

1) Rotate request IDs learned at replay time and stabilize matching:

```
res_body
  <-> json_path(path="response.requestId")
  <-> smart_replace_recorded

req_body
  <-> scrub(ignorePaths="requestId")
```

2) Make Authorization header current by re‑signing JWT:

```
http_req_header("Authorization")
  <-> regex(pattern="^(?i)Bearer (.*)$", captureGroup=1)
  <-> jwt_resign(secretPath="${{secret:jwt/secret}}", prefixes="Bearer ")
```

3) Update timestamps in JSON body to keep original relative offsets but current time:

```
req_body
  <-> json_path(path="metadata.createdAt")
  <-> date(layout="auto", precision="1s")
```

4) Replace many redacted values with test values from a CSV globally:

```
smart_replace_csv(headers=true, existing="Original Value", new="New Value for Testing")
```

5) Iterate unique emails from a CSV for each request:

```
my_csv = file("s3://employees.csv") -> csv(hasHeader=true, header="Email")

req_body
  <-> json_path(path="user.email")
  <-> csv_iter(csv_name="my_csv")
```

6) Re‑sign AWS SigV4 header after other changes:

```
http_req_header("X-Custom")
  <-> replace(old="dev", new="staging")

http_req_header("Authorization")
  <-> aws_auth(secretPath="${{secret:aws/secret}}", idPath="${{secret:aws/id}}")
```

## Guardrails And Tips

- Signing last: Put `jwt_resign` / `aws_auth` after all mutating transforms that should be signed.
- Create vs. update with `json_path`: set `create=false` to avoid inserting missing keys.
- Date formats: Prefer `layout="auto"` unless a precise format is required; use `precision` to round.
- Match stability: Use `scrub`/`scrub_date` to blank dynamic fields that interfere with mock matching.
- CSV/dataframe prep: Load data once as a variable via `file` + `csv(...)` or `csv_dataframe(...)`, then reference with `csv_iter`/`dataframe_lookup`.
- Regex flavor: Use Go regex flavor; test at regex101.com with Golang selected.
- URL parts: If you need a path segment, use `http_url(index=N)`; remember leading `/` is segment 0.
- Variable scope: Test variables are per‑vUser; stable within a vUser, different across vUsers.

## What To Return In Future Requests

When asked “how to transform X”, respond with:

1) The extractor to use and why (where the value lives)
2) The minimal transform chain, each with the key config fields
3) Any ordering caveats (e.g., signing last, create=false)
4) Optional validation tips (e.g., regex, date layout)

Example answer snippet:

```
Goal: Update `Date` header to current relative time.

Chain:
http_req_header("Date") <-> date(layout="auto", precision="1s")

Notes: Keep `date` near the end. If the header was missing, it will be created.
```

