---
description: "Export traffic captured by Speedscale as WireMock stub mappings so you can run recorded API responses on any WireMock-compatible mock server."
sidebar_position: 5
---

# Export to WireMock

Speedscale can export traffic as [WireMock](https://wiremock.org/) stub mappings. This is the inverse of [importing WireMock mappings](../import/wiremock.md): take traffic that Speedscale recorded and turn it into a `mappings.json` file that any WireMock server can serve.

Because the output is the standard WireMock stub-mapping format (`{"mappings": [...]}`), the same file loads into WireMock's own `__admin/mappings/import` endpoint and into other WireMock-compatible mock servers.

## How it Works

The exporter converts each recorded HTTP/HTTPS request/response pair into one WireMock stub mapping:

- **request** — the `method` and `urlPath`, plus `queryParameters` matchers (`equalTo`) for any recorded query string.
- **response** — the `status`, response `headers`, and the recorded `body`, byte for byte.

Request headers are not turned into matchers. Stubs match on method and path so they are not over-constrained by per-request headers like auth tokens or user agents, which is the right default when you want recorded responses served back reliably. Each mapping also carries a stable `id` (the request UUID) and `persistent: true` so runners that persist stubs keep them across restarts.

## Export

There are two ways to export, depending on where your traffic lives.

### From a Speedscale snapshot

To export a snapshot stored in Speedscale:

```
speedctl export snapshot --type wiremock --output mappings.json {SNAPSHOT_ID}
```

#### Options

Like other export formats, you can control what gets exported:

```
# Export only inbound traffic (default behavior)
speedctl export snapshot --type wiremock --output mappings.json {SNAPSHOT_ID}

# Include outbound traffic so you can mock a backend dependency
speedctl export snapshot --type wiremock --inbound-only=false --service my-backend --output mappings.json {SNAPSHOT_ID}

# Limit the number of requests
speedctl export snapshot --type wiremock --limit 50 --output mappings.json {SNAPSHOT_ID}
```

### From local proxymock recordings

If you recorded traffic locally with [proxymock](/proxymock/), export directly from the recorded RRPair files:

```
proxymock export wiremock --in ./proxymock --out mappings.json
```

The same `--service`, `--inbound-only`, and `--limit` filters apply.

## Running the Mock

### Prerequisites

- A WireMock server. The quickest option is the official Docker image.

### Steps

1. Export your traffic:
   ```
   proxymock export wiremock --in ./proxymock --out mappings.json
   ```

2. Start WireMock:
   ```
   docker run -d --name wiremock -p 8080:8080 wiremock/wiremock
   ```

3. Load the mappings:
   ```
   curl -X POST http://localhost:8080/__admin/mappings/import --data @mappings.json
   ```

4. Call a recorded endpoint and WireMock serves the recorded response:
   ```
   curl http://localhost:8080/api/accounts
   ```

WireMock adds a `Matched-Stub-Id` response header showing which exported stub it matched, which is handy for confirming a request routed through the mappings you loaded.

## Generated Format

The exported file uses the WireMock stub-mapping schema:

```json
{
  "mappings": [
    {
      "id": "cdeac83d-7dd1-4f4e-a63e-b7a31fd95d57",
      "persistent": true,
      "request": {
        "method": "GET",
        "urlPath": "/api/accounts"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": "[{\"accountNumber\":\"235116033191\",\"accountType\":\"CHECKING\"}]"
      }
    }
  ]
}
```

You can hand-edit the result to add WireMock features like response templating, fault injection, or stateful scenarios.

## Questions?

Check the latest export options by running:

```
speedctl export snapshot --help
proxymock export wiremock --help
```

Feel free to ask questions on the [Community](https://slack.speedscale.com).
