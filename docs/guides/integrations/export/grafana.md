---
description: "Export Speedscale snapshots or local proxymock recordings as Grafana k6 JavaScript tests."
sidebar_position: 2
---

# Export to Grafana k6

Speedscale can export captured HTTP requests as a [Grafana k6](https://github.com/grafana/k6) JavaScript test. The generated script preserves request methods, URLs, headers, query parameters, and bodies.

Only raw traffic is exported. Transform definitions and other Speedscale replay logic are not embedded in the script.

## Export a cloud snapshot

```bash
speedctl export snapshot --type k6 --output script.js {SNAPSHOT_ID}
```

## Export a local proxymock recording

Export RRPair files created by `proxymock record`, a cloud snapshot pull, or a BYOC bucket import:

```bash
proxymock export k6 --in ./proxymock --out script.js
```

Filter the local recording when needed:

```bash
proxymock export k6 --in ./proxymock --service api.example.com \
  --limit 50 --out api-test.js
```

Use `--inbound-only=false` to include outbound dependency calls. Use `--scheme http` or `--scheme https` to override recorded URL schemes.

## Run the test

Install k6, then run:

```bash
k6 run script.js
```

:::tip
If you want to capture transformed traffic, enable [eBPF capture](/reference/ebpf-traffic-collection#enabling-via-annotation) on your app while the Speedscale generator is running. This records the transformed traffic as a new snapshot that can be exported to k6. The export contains the resulting requests, not the transform logic.
:::

Check the current flags with:

```bash
speedctl export snapshot --help
proxymock export k6 --help
```
