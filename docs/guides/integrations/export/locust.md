---
description: "Export recorded Speedscale HTTP traffic to Locust and run load tests against an application with recorded dependency mocks."
sidebar_position: 4
---

# Export to Locust

Export captured HTTP requests as a Python `locustfile.py`, then use Locust to load-test a deployment. Speedscale mocks can answer the application's dependency calls from the same recording.

## Export local traffic

Use a proxymock release that includes the `locust` export subcommand:

```sh
proxymock export locust --in ./traffic --out locustfile.py
```

The input directory can contain files from `proxymock record`, a downloaded Speedscale snapshot, or a [BYOC bucket import](/proxymock/guides/byoc-bucket). Inbound HTTP/HTTPS requests are exported by default.

| Flag | Default | Behavior |
| --- | --- | --- |
| `--in` | Current directory | Read RRPair files recursively. |
| `--out` | `locustfile.py` | Write the generated Python file. |
| `--service` | All hosts | Select the recorded HTTP request host, excluding its port. |
| `--inbound-only` | `true` | Exclude outbound dependency calls from the load test. |
| `--scheme` | Recorded scheme | Override recorded URL schemes with `http` or `https`. |
| `--limit` | `-1` | Limit matching HTTP requests; positive values set the cap. |

For example:

```sh
proxymock export locust --in ./traffic --service checkout \
  --limit 100 --out checkout.py
```

## Export a cloud snapshot

The same generator is available through snapshot export:

```sh
speedctl export snapshot SNAPSHOT_ID --type locust --output locustfile.py
```

Snapshot export accepts `--service`, `--inbound-only`, `--scheme`, and `--limit`. The proxymock MCP `export_traffic` tool also accepts `format: "locust"`.

## Run the generated file

Install [Locust](https://docs.locust.io/en/stable/installation.html) in a Python virtual environment, then run:

```sh
locust -f locustfile.py --host http://localhost:8080 \
  --headless --users 5 --spawn-rate 1 --run-time 30s --exit-code-on-error 1
```

The generated `RecordedUser` uses Locust's HTTP client and runs every exported request in each task iteration. It waits one second after the iteration. Change `wait_time`, user count, and spawn rate to control the load.

`--host` replaces the origin of every exported request, including requests captured under different hosts. Without it, requests use their recorded origins. Filter to one application before targeting a single test deployment. Locust's [host setting](https://docs.locust.io/en/stable/writing-a-locustfile.html#host-attribute) also supports a target chosen in the web UI.

Requests retain methods, encoded paths, query values, headers, and bodies. Binary request bodies are base64-encoded in the file and decoded before sending. Host and transport-managed headers are omitted so the HTTP client can address the new deployment and calculate framing. Repeated request headers are joined; the export is not a byte-for-byte HTTP wire replay.

Redirect following is disabled. Each response is checked against its captured status code when available, including intentionally captured error responses. Body comparisons, token refresh, transforms, and variable correlation are not generated. Review captured credentials and data before running or sharing the script.

## Kubernetes with BYOC traffic and mocks

The [runnable Kubernetes example](https://github.com/speedscale/demo/tree/master/scenarios/locust-byoc) includes an application, a real HTTP dependency, capture manifests, and a Locust Job.

1. Capture requests with Speedscale and send both inbound and outbound RRPairs through the BYOC collector to your bucket.
2. Download the capture with `proxymock import s3`, keeping both directions.
3. Export inbound requests with `proxymock export locust`.
4. Start `proxymock mock --in ./traffic --no-passthrough` and configure the test application's outbound proxy.
5. Run Locust against the application. The example scales the real dependency to zero before testing.

```sh
proxymock import s3 --bucket my-traffic-bucket --prefix byoc/ \
  --from now-15m --namespace my-app --out ./traffic
proxymock export locust --in ./traffic --service checkout --out locustfile.py
proxymock mock --in ./traffic --no-passthrough
```

Run the application with its proxy settings pointed at the mock server. Locust targets the application, while the mock server serves the application's dependency requests. The example includes the exact Kubernetes wiring, image build, verification, and cleanup commands.

The generated sequence preserves the exporter input order. It does not reconstruct sessions, infer think times, or reproduce the original concurrency. Adjust the Locust script when those properties matter to your test.
