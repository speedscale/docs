# Datadog Synthetics

Convert recorded proxymock traffic into a Datadog Synthetics test suite — one multistep API test per snapshot, with all auth headers redacted into global variables and automatic variable chaining between steps.

---

## Quick Start

```bash
# Export and publish directly to Datadog
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --publish

# Output:
#   Variables: datadog/snapshot-<id>.vars.md
#   View:      https://app.datadoghq.com/synthetics/details/<public-id>
#   Run:       datadog-ci synthetics run-tests --public-id <public-id>
```

Set your Datadog keys once via environment variables and they are picked up automatically:

```bash
export DATADOG_API_KEY=...
export DATADOG_APP_KEY=...
```

---

## How It Works

Each export run targets one snapshot directory and writes three files into `datadog/` alongside it:

| File | Purpose |
|---|---|
| `datadog/snapshot-<id>.json` | Datadog Synthetics bundle (the test definition) |
| `datadog/snapshot-<id>.vars.md` | Global variables to create before running |

The bundle defaults to **multistep mode**: one Synthetics API test with one step per recorded request, ordered by capture time. Sensitive headers (`Authorization`, `Cookie`, etc.) are automatically replaced with `{{ AUTHORIZATION_1 }}` placeholders; the sidecar lists the values.

### Output path

The output path is derived from `--in` automatically:

```
--in ./proxymock/snapshot-e77c31c9-fc5a-48c8-ad22-2000c9ce4574
→   datadog/snapshot-e77c31c9.json
    datadog/snapshot-e77c31c9.vars.md
```

Each snapshot gets its own files, so re-exporting a different snapshot never overwrites previous work. Override with `--out` if needed.

---

## Publish to Datadog

Add `--publish` to create or update the tests directly in your Datadog account:

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-e77c31c9-fc5a-48c8-ad22-2000c9ce4574 \
  --publish
```

On success the command prints the exact Datadog UI link and CLI run command:

```
multistep test with 8 step(s) written to datadog/snapshot-e77c31c9.json

  Variables: datadog/snapshot-e77c31c9.vars.md
  View:      https://app.datadoghq.com/synthetics/details/abc-def-ghi
  Run:       datadog-ci synthetics run-tests --public-id abc-def-ghi
```

### Keys

Pass keys via environment variables (recommended) or flags:

```bash
# via env (recommended)
export DATADOG_API_KEY=...
export DATADOG_APP_KEY=...

# or via flags
proxymock export datadog-synthetics --datadog-api-key ... --datadog-app-key ...
```

### Global variables

By default `--publish` also creates or updates Datadog Synthetics global variables for any redacted headers. Disable with `--publish-variables=false` if you manage variables separately.

### Re-publishing

Use `--force` to overwrite the local bundle file on subsequent runs:

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-e77c31c9-fc5a-48c8-ad22-2000c9ce4574 \
  --publish --force
```

---

## Bundle Layouts

### Multistep (default)

One Synthetics API test, one step per recorded request. Steps are ordered by capture time. The exporter wires automatic variable extraction between steps (see [Automatic variable chaining](#automatic-variable-chaining)).

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --bundle multistep
```

**Limit:** Datadog caps multistep API tests at 10 steps. If the snapshot has more eligible requests, the first 10 are used and a warning is printed. Narrow the input with `--limit` or `--service`.

### Single

One independent Synthetics API test per recorded request. No step cap.

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --bundle single
```

When published, the output shows a `--search` command that finds all tests from the export by tag:

```
  View: https://app.datadoghq.com/synthetics/tests?search=tag:proxymock_export_id:20260501t120000z
  Run:  datadog-ci synthetics run-tests --public-id id1 --public-id id2 ...
```

---

## Global Variables

Sensitive headers are replaced with placeholders like `{{ AUTHORIZATION_1 }}`. The sidecar `.vars.md` lists the variable names, source headers, hosts, and sample values:

```markdown
| Variable        | Source header | Hosts                       | Sample value             |
|---|---|---|---|
| `AUTHORIZATION_1` | `Authorization` | api.example.com          | `Bearer eyJhbGci...`     |
| `COOKIE_1`        | `Cookie`        | api.example.com          | `session=abc123...`      |
```

**Default redacted headers:** `Authorization`, `Cookie`, `X-Api-Key`, `X-Auth-Token`, `Proxy-Authorization`

Add more with `--auth-header`:

```bash
proxymock export datadog-synthetics --auth-header "X-My-Token"
```

If `--publish` is used, global variables are created automatically in Datadog. Otherwise, create them manually:

1. Go to **Synthetics → Settings → Global Variables → New Global Variable**
2. Name: `AUTHORIZATION_1`, mark **Secure**
3. Value: the actual value from the sidecar

---

## Automatic Variable Chaining

In multistep mode, the exporter scans each step's JSON response for string values that appear verbatim in a later step's request. Those values are automatically extracted and reused:

- Step 1: `POST /login` → response contains `"token": "abc123"`
- Step 2: `GET /profile` with `Authorization: Bearer abc123`
- Result: Step 1 gets a `$.token` extractor named `EXTRACTED_1`; Step 2's header becomes `Bearer {{ EXTRACTED_1 }}`

---

## Isolate a Single User Session

Use `--filter` to narrow the export to one session before building the test:

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --bundle multistep \
  --filter '(header[X-Session-ID] IS "alice-abc123")' \
  --publish
```

Common filter predicates:

| Source | Filter |
|---|---|
| Session header | `(header[X-Session-ID] IS "abc123")` |
| Sticky cookie | `(header[Cookie] CONTAINS "sessionid=abc123")` |
| JWT subject | `(header[Authorization] CONTAINS "sub=abc123")` |
| Query param | `(query_param[session] IS "abc123")` |
| HTTP method | `(command IS "POST")` |
| URL path | `(url CONTAINS "/checkout")` |

Combine with `AND` / `OR`:

```bash
--filter '(header[X-Session-ID] IS "abc123") AND (url CONTAINS "/checkout")'
```

After export, the `Skipped during export` section in the `.vars.md` sidecar shows how many RRPairs were filtered. If all were skipped, the predicate matched nothing.

---

## Flag Reference

| Flag | Default | Description |
|---|---|---|
| `--in` | `.` | Snapshot directory containing RRPair files |
| `--out` | `datadog/<snapshot-id>.json` | Output bundle path |
| `--format` | `json` | `json` or `yaml` |
| `--bundle` | `multistep` | `multistep` (one test, N steps) or `single` (one test per request) |
| `--limit` | `10` | Max requests to include (`-1` for unlimited) |
| `--inbound-only` | `true` | Skip outbound (proxied) requests |
| `--service` | | Filter by HTTP Host header (case-insensitive) |
| `--filter` | | Speedscale traffic filter expression |
| `--scheme` | | Force `http` or `https` on all URLs |
| `--name-prefix` | basename of `--in` | Prefix added to every test name |
| `--tag` | | Extra Datadog tags (repeatable) |
| `--location` | `aws:us-east-1` | Datadog test location(s) (repeatable) |
| `--tick-every` | `0` (manual) | Scheduled run interval (e.g. `60s`, `1h`) |
| `--redact-headers` | `true` | Replace sensitive headers with placeholders |
| `--auth-header` | | Extra headers to redact (repeatable) |
| `--allow-insecure` | `false` | Allow self-signed certificates |
| `--assert-response-time` | `false` | Add a soft 2000 ms response-time assertion |
| `--publish` | `false` | Create/update tests directly in Datadog |
| `--publish-variables` | `true` | Create/update global variables when publishing |
| `--datadog-site` | `datadoghq.com` | Datadog site (e.g. `datadoghq.eu`, `us3.datadoghq.com`) |
| `--datadog-api-key` | `$DATADOG_API_KEY` | Datadog API key |
| `--datadog-app-key` | `$DATADOG_APP_KEY` | Datadog application key |
| `--force` | `false` | Overwrite existing output file |

---

## Common Patterns

### Export a specific snapshot and publish

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-e77c31c9-fc5a-48c8-ad22-2000c9ce4574 \
  --publish --force
```

### Export one service's traffic only

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --service api.example.com \
  --publish
```

### Capture a customer-reported bug as a runnable test

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --bundle multistep \
  --filter '(header[X-Session-ID] IS "alice-abc123")' \
  --publish
```

### Schedule the test to run hourly

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --tick-every 1h \
  --publish
```

### CI/CD pipeline

```bash
proxymock export datadog-synthetics \
  --in ./proxymock/snapshot-<id> \
  --name-prefix "$SERVICE_NAME-" \
  --tag "env:$ENVIRONMENT" \
  --tag "build:$CI_BUILD_NUMBER" \
  --publish --force
```

---

## Limitations

| Constraint | Value | Notes |
|---|---|---|
| Steps per multistep test | 10 | Datadog API limit; use `--limit` or `--service` to stay under |
| Request body size | 50 KB | Larger bodies are omitted with tag `body-omitted:too-large` |
| Supported body types | JSON, XML, form-urlencoded, GraphQL | Binary bodies are omitted |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `no eligible RRPairs to export` | All traffic was filtered | Check `--service`; try `--inbound-only=false`; inspect sidecar skip counts |
| `warning: multistep test capped at 10 steps` | Snapshot has >10 eligible requests | Use `--limit` or `--service` |
| Test fails with 401/403 | Missing global variables | Create variables from `.vars.md` in Datadog |
| `connection refused` | Wrong URL scheme | Use `--scheme https` or `--scheme http` |
| `400 Bad Request` on publish | Stale/partial bundle | Re-export with `--force` |

---

## Related

- [Datadog Synthetics documentation](https://docs.datadoghq.com/synthetics/)
- [datadog-ci CLI reference](https://docs.datadoghq.com/continuous_testing/cicd_integrations/configuration/)
