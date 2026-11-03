---
title: Export traffic to Bruno
description: Turn recorded HTTP traffic into a native Bruno OpenCollection with local files and explicit credential placeholders.
---

# Export traffic to Bruno

`proxymock export bruno` turns local HTTP/S RRPairs into a native OpenCollection 1.0 YAML directory. The collection loader and runner are verified with Bruno CLI 4.3.0. Use a Bruno release that supports OpenCollection 1.0; classic `.bru` files are not produced.

## Record and review

Run proxymock from your application's repository and record a workflow in dev. Inspect the Markdown RRPairs, filter noise, and mask sensitive data before exporting. The exporter preserves the source recording and does not require a Speedscale account or cloud connection, including when a Speedscale config already exists.

Authorization, Cookie, Proxy-Authorization and Set-Cookie values become empty environment placeholders. Add credential headers with `--secret-header`. Body, query and other response data are not automatically masked. Review the collection before sharing or committing it.

## Export and open

```sh
proxymock export bruno \
  --in ./proxymock/recorded-example \
  --out ./bruno \
  --base-url http://localhost:8080 \
  --secret-header X-API-Key
```

Open the output directory in Bruno and select its `local` environment. Set the empty credential variables to values for the target dev service. Without `--base-url`, each recorded origin gets a distinct environment variable. The export includes metadata ports when the captured Host field does not contain the port.

The command defaults to inbound traffic. Use `--inbound-only=false` to include outbound HTTP/S calls. `--service`, `--scheme` and `--limit` restrict the collection; `--limit -1` exports all eligible unique request/response examples. Limits select from stable content order rather than capture time.

The result reports exported requests, skipped records and omitted response examples by reason. Each host gets its own group; stable content hashes distinguish request/response variants. Exact duplicates after credential replacement are counted and omitted. Filenames and content stay stable when input traversal order changes.

## Fidelity and limits

HTTP/S methods, paths, raw query ordering/escaping, repeated query parameters, empty bodies and UTF-8 JSON/text bodies are supported. Recorded response status and supported text bodies are retained as examples. URL re-encoding and redirect following are disabled in the exported request settings.

Supported HTTP content encodings are decoded before export. Content-Encoding, Content-Length and Transfer-Encoding are removed from the decoded request and response example so their headers match the exported body. An undecodable request is skipped; an undecodable saved response is reported as omitted while preserving the usable request. Source files remain unchanged.

Bruno's runner merges headers by name. Repeated list-valued request headers are combined with commas for Accept, Accept-Encoding, Accept-Language, Cache-Control, If-Match, If-None-Match, Pragma, Prefer, Trailer, Via and Warning. Repeated credential headers become one replacement placeholder. Other repeated request headers cause the request to be skipped rather than losing a value silently. Host, Content-Length, Transfer-Encoding and Connection request headers are omitted so the client can generate transport headers for the target service.

Non-HTTP protocols and binary or multipart request bodies are skipped. An unsupported or incomplete saved response is reported as omitted while retaining the usable request. The original RRPairs keep data that Bruno cannot represent. This workflow does not translate Postman scripts or tests.

An existing output directory causes an error. `--overwrite` explicitly replaces a prior proxymock-exported collection, including local edits, and requires its `proxymock-export.json` manifest. Input/output directory overlap is rejected. Publication stages the new collection before replacing the old one; a failed restoration reports the retained original collection's recovery path.

## Agent use

The `export_traffic` MCP tool accepts `format: bruno`, `in-directory` and `out`. Bruno options include `base-url`, comma-separated `secret-headers`, `service`, `scheme`, `inbound-only`, `limit` and explicit `overwrite`. The tool invokes the same CLI exporter.

