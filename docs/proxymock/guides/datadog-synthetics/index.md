# Datadog Synthetics Guide

Create a full Datadog Synthetics test suite from your Speedscale recorded traffic.

---

## Quick Start

```bash
# 1. Record traffic (already done if you have existing RRPair files)

# 2. Export to Datadog Synthetics
proxymock export datadog-synthetics \
  --in ./proxymock \
  --out tests.json \
  --format json

# 3. Create global variables - see output in tests.variables.md

# 4. Run tests in Datadog
datadog-ci synthetics run-tests --files tests.json
```

---

## Detailed Steps

### 1. Single Test Export (Default)

Creates individual API tests, one per recorded request.

```bash
proxymock export datadog-synthetics \
  --in ./proxymock \
  --out tests.json \
  --format json \
  --bundle single
```

**Output:**
- `tests.json` - Datadog Synthetics bundle (importable via UI, API, or CLI)
- `tests.variables.md` - Sidecar file listing global variables to create

### 2. Multistep Test Export

Creates a single multistep test with automatic variable extraction between steps.

```bash
proxymock export datadog-synthetics \
  --in ./proxymock \
  --out flow.json \
  --bundle multistep \
  --limit 10
```

**Limit:** Multistep tests are capped at 10 steps (Datadog limit). Use `--limit` or `--service` to narrow input.

### 3. Upload Bundle to Datadog

#### Using CLI

```bash
datadog-ci synthetics run-tests \
  --files tests.json \
  --location pl:YOUR_DATACENTER_ID
```

#### Using API

```bash
curl -X POST https://api.datadoghq.com/api/v1/synthetics/tests/api \
  -H "Auth-Token: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @tests.json
```

**Endpoint:** `POST /api/v1/synthetics/tests/api`

### 4. Create Global Variables

Before running tests, create global variables from the sidecar file:

**Open** `tests.variables.md`:

```
# Datadog Synthetics — Global Variables

| Variable       | Source header | Hosts        | Sample value    |
|----------------|---------------|--------------|-----------------|
| AUTHORIZATION_1| Authorization| localhost    | Bearer eyJhbG...|
| COOKIE_1       | Cookie        | localhost    | session=abc...  |
```

**Create in Datadog:**
1. Go to **Synthetics** → **Settings** → **Global Variables**
2. Click **New global variable**
3. Name: `AUTHORIZATION_1`
4. Value: The actual value from the sidecar (or paste if available)

Repeat for each global variable listed.

---

## Configuration Reference

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--in` | `./proxymock` | Input directory with RRPair files |
| `--out` | `datadog-synthetics.json` | Output bundle file |
| `--format` | `json` | Output format (`json` or `yaml`) |
| `--bundle` | `single` | Bundle layout (`single` or `multistep`) |
| `--service` | `` | Filter by HTTP Host header (case-insensitive) |
| `--limit` | `-1` | Maximum tests to emit |
| `--redact-headers` | `true` | Replace sensitive headers with placeholders |
| `--auth-header` | 5 defaults | Additional headers to redact |
| `--allow-insecure` | `false` | Allow self-signed certificates |
| `--tick-every` | `0` | Scheduled run interval |
| `--assert-response-time` | `false` | Add response time assertion |

**Default auth headers:** Authorization, Cookie, X-Api-Key, X-Auth-Token, Proxy-Authorization

### Filter Options

```bash
# By host/service
proxymock export datadog-synthetics --service api.example.com

# By inbound traffic only (default)
proxymock export datadog-synthetics --inbound-only false

# With time limit
proxymock export datadog-synthetics --limit 50

# Override URL scheme
proxymock export datadog-synthetics --scheme https
```

### Test Configuration Options

```bash
# Prefix all test names
proxymock export datadog-synthetics --name-prefix "Production-"

# Add custom tags
proxymock export datadog-synthetics --tag "env:prod" --tag "team:payments"

# Set run location
proxymock export datadog-synthetics --location "aws:us-east-1"

# Schedule interval (tick_every)
proxymock export datadog-synthetics --tick-every 60s

# Fail if response time exceeds 2000ms (approx)
proxymock export datadog-synthetics --assert-response-time
```

---

## Common Patterns

### Pattern 1: Export All Traffic

```bash
# Full export of recorded traffic
proxymock export datadog-synthetics \
  --in ./proxymock \
  --out bundle.json \
  --bundle single
```

### Pattern 2: Export Specific Service

```bash
# Focus on one service for easier testing
proxymock export datadog-synthetics \
  --service api.example.com \
  --out api-tests.json \
  --limit 50
```

### Pattern 3: Multistep Flow Export

```bash
# Create one test covering an entire user flow
proxymock export datadog-synthetics \
  --bundle multistep \
  --service checkout.example.com \
  --limit 8 \
  --out checkout-flow.json
```

### Pattern 4: Tagged Export for CI/CD

```bash
proxymock export datadog-synthetics \
  --name-prefix "$SERVICE_NAME-" \
  --tag "env:$ENVIRONMENT" \
  --tag "build:$CI_BUILD_NUMBER" \
  --out integration-tests.json
```

---

## Filtering and Limitations

### Body Size Limit
- **Maximum:** 50KB per request body
- **Result:** Larger bodies are omitted with tag `body-omitted:too-large`

### Non-Text Bodies
- **Supported:** JSON, XML, form-urlencoded, GraphQL
- **Result:** Binary content with unknown Content-Type is omitted

### Multistep Limit
- **Maximum:** 10 steps (Datadog Synthetics API limit)
- **Result:** Extra requests are dropped with warning in output

### Service Filtering
Use `--service` to filter by the HTTP Host header. This is case-insensitive and handles subdomains appropriately.

---

## Multistep Features

### Automatic Variable Extraction

In multistep mode, the exporter:
1. Scans each step's JSON response for string values
2. Checks if those values appear in later steps' requests
3. Replaces them with `{{ EXTRACTED_1 }}`, `{{ EXTRACTED_2 }}`, etc.
4. Automatically wires up the parser to extract at the producing step

**Example flow:**
- Step 1: GET /users → Response contains `"token": "abc123"`
- Step 2: POST /orders with `Authorization: Bearer abc123`
- Result: Step 2 references `{{ EXTRACTED_1 }}`, Step 1 extracts from `.token`

### When to Use Multistep

✅ **Ideal for:**
- Complete user workflows (login → purchase → confirmation)
- Multi-step API sequences where variables flow between calls
- Testing end-to-end scenarios as single tests

❌ **Avoid when:**
- Large traffic sets (>10 steps)
- Independent API tests needed
- Different services with minimal correlation

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `no eligible RRPairs to export` | Filter removed all traffic | Check `--service` filter; increase `--limit` |
| `multistep truncated` | More than 10 steps | Use `--service` or `--limit` |
| `body omitted:too-large` | Request >50KB | Use `--limit` for smaller subsets |
| `tests fail with 403` | Missing global variables | Create variables from sidecar file |
| `connection refused` | Wrong scheme | Use `--scheme http` or `https` |

### Verification Checklist

- [ ] Global variables created in order (AUTHORIZATION_1, COOKIE_1, etc.)
- [ ] Test locations set correctly
- [ ] Auth headers redact with `--redact-headers` enabled
- [ ] Scheme matches actual endpoint
- [ ] Response time assertion set appropriately

---

## Example Demo Setup

### Quick Test with Node-Auth Demo

```bash
# 1. Start demo server
cd /Users/matthewleray/dev/demo/node-auth
npm install && npm start &

# 2. Record traffic
go run ~/dev/speedscale/go/run . -- curl \
  -s -X POST http://localhost:3000/oauth/token \
  && curl -s http://localhost:3000/public

# 3. Inspect captured traffic
ls -la ./proxymock/recorded-*.md

# 4. Export to Datadog Synthetics
proxymock export datadog-synthetics \
  --in ./proxymock \
  --out demo-test.json \
  --service localhost \
  --limit 5

# 5. View generated global variables
cat demo-test.variables.md
```

---

## Related Documentation

- [Datadog Synthetics API Docs](https://docs.datadoghq.com/synthetics/)
- [datadog-ci CLI Reference](https://docs.datadoghq.com/cli/synthetics/)