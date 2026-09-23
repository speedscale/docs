---
description: "Export Speedscale snapshots or local proxymock recordings as Postman v2.1 collections."
sidebar_position: 4
---

# Export to Postman

Speedscale can export and import traffic in the Postman [collection format](https://github.com/postmanlabs/postman-collection). The exporter creates a Postman v2.1 collection from captured HTTP requests.

## Export a cloud snapshot

To export your snapshot into a postman collection, simply run:

```bash
speedctl export snapshot --type postman --output collection.json {SNAPSHOT_ID}
```

## Export a local proxymock recording

Export RRPair files created by `proxymock record`, a cloud snapshot pull, or a BYOC bucket import:

```bash
proxymock export postman --in ./proxymock --out collection.json
```

Filter the local recording when needed:

```bash
proxymock export postman --in ./proxymock \
  --service api.example.com --limit 50 --out api-collection.json
```

Use `--inbound-only=false` to include outbound dependency calls. Use `--scheme http` or `--scheme https` to override recorded URL schemes.

## Import a collection

If you have an existing Postman collection and want to import into Speedscale, simply run:

```bash
speedctl import postman --name {SNAPSHOT_NAME} --service-name {SERVICE_NAME} --from {COLLECTION_FILE}
```

To keep the collection local as RRPair files instead, use proxymock:

```bash
proxymock import postman collection.json --out ./postman-rrpairs
proxymock replay --in ./postman-rrpairs --test-against http://localhost:8080
```

Requests with saved example responses can also be served as dependency mocks:

```bash
proxymock mock --in ./postman-rrpairs
```

### Questions?

Note: because new features and flags are regularly added, you can check the latest capabilities by running:

```bash
speedctl export snapshot --help
speedctl import postman --help
proxymock export postman --help
proxymock import postman --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
