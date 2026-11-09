---
title: REST API for CI and scripts
description: "Drive proxymock from CI jobs and scripts over a stable, versioned REST API: pull snapshots, run the mock server, replay traffic and fail the build on the result."
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# REST API for CI and scripts

`proxymock mcp run --http` serves a REST API under `/v1` beside the MCP endpoint at `/mcp`. Use it when a pipeline or script needs to drive **proxymock** with plain HTTP and JSON: pull a snapshot, start the mock server, replay traffic against the application under test, and fail the job on the result.

The API runs on the machine that runs the job, such as a CI runner or a laptop. It listens on `127.0.0.1` by default. Every operation and result is listed in the [REST API reference](../how-it-works/rest-api-reference.md), and the contract is the [OpenAPI document](pathname:///proxymock/openapi-v1.json).

## Start the server

```bash
rm -f proxymock-ready.json
proxymock mcp run --http --port 0 --ready-file proxymock-ready.json &
until [ -f proxymock-ready.json ]; do sleep 0.2; done
PROXYMOCK_API=$(jq -r .restUrl proxymock-ready.json)
```

`--port 0` picks a free port, so jobs that share a runner do not collide. The server writes the ready file only once it accepts connections, so a step can wait for the file and then call the API. Remove any old ready file first, or a rerun reads the previous server's URL. The file holds the URLs, the port and, when the server has one, the access token. It is written with mode `0600`.

| Field | Value |
|---|---|
| `url` | The server, for example `http://127.0.0.1:52011`. |
| `restUrl` | The REST API, `<url>/v1`. |
| `mcpUrl` | The MCP endpoint, `<url>/mcp`. |
| `openapiUrl` | The OpenAPI document, `<url>/v1/openapi.json`. |
| `port` | The port the server listens on. |
| `token` | The access token, present when the server has one: always beyond loopback, and on loopback when `--token` or `PROXYMOCK_MCP_TOKEN` sets one. |
| `docsUrl` | The interactive docs page, `<url>/v1/docs`. |

To check a script against the API or generate a client without starting a server, run `proxymock mcp openapi`.

## Explore it in a browser

Open `/v1/docs` on a running server, the `docsUrl` in the ready file, to browse every operation, its fields and its result, and to send requests from the browser. Long-running operations show buttons to wait for or cancel the job. The page is built into **proxymock** and loads nothing from the internet. It opens without the access token. To call operations on a server that has one, paste the token into the page; it stays in that browser tab.

## Authenticate

The API takes two headers, both optional on loopback.

| Header | What it carries |
|---|---|
| `X-Proxymock-Token` | The server's access token. Required when the server listens beyond loopback with `--host`. Set it with `--token` or `PROXYMOCK_MCP_TOKEN`; otherwise the server generates one and writes it to the ready file. |
| `Authorization: Bearer <API key>` | A Speedscale API key. Cloud operations, such as listing or pulling snapshots, run as that key's user. Without it, the server uses the login of the machine it runs on, from `proxymock init`. |

The server checks the `Host` and `Origin` headers of every request and sends no CORS headers, so a web page cannot call it. See [network transport](../how-it-works/mcp.md) for how the guard works.

## Call an operation

Every operation is a `POST` with a JSON object body. Field names are camelCase, and an unknown field is rejected with `400`, so a typo fails loudly.

```bash
curl -s -X POST "$PROXYMOCK_API/snapshots/list" \
  -H "Authorization: Bearer $SPEEDSCALE_API_KEY" \
  -d '{"search": "checkout", "limit": 5}'
```

```json
{
  "destination": "cloud",
  "snapshots": [
    {"id": "a9f299c0-3934-42b6-9211-b4986a26fcee", "name": "checkout", "services": ["checkout"], "status": "COMPLETE", "created": "2026-11-08T14:37:03Z"}
  ]
}
```

## Jobs

Operations that can run for minutes, such as `replays/run`, `snapshots/push` and `snapshots/pull`, run as jobs. The call answers `202` with the job and a `Location` header. Poll `GET /v1/jobs/{id}` until `status` is `succeeded`, `failed` or `canceled`, and read the operation's result from the job's `result` field.

Add `?wait=<seconds>` to the call or to the poll to block until the job finishes, for at most 600 seconds per request. A call that finishes within the wait answers `200` with the finished job. One that does not answers `202` with the job still running, so a script keeps polling until `status` changes.

```bash
curl -s -X POST "$PROXYMOCK_API/replays/run?wait=600" \
  -d '{"inDirectories": ["proxymock/recorded"], "testAgainst": ["http://localhost:8080"], "outDirectory": "proxymock/replayed"}'
```

```json
{
  "id": "a42deea8-4888-4626-8a0c-8c2fd35acd1d",
  "operation": "replays.run",
  "status": "succeeded",
  "result": {
    "exitCode": 0,
    "passed": true,
    "outDirectory": "proxymock/replayed",
    "score": {"accuracy": {"pairs": 4, "matched": 4, "mismatches": 0, "rate": 100}},
    "logs": {"stdout": "/tmp/proxymock-1234.out", "stderr": "/tmp/proxymock-1234.err"}
  }
}
```

A job's `status` says whether the operation ran. Whether the replay passed is in the result: `passed` is false when `proxymock replay` exits nonzero, which happens when a [test config](./test-configs.md) goal is missed, a `failIf` condition triggers, or a [replay verdict](./replay-verdicts.md) check such as `failOnNewMismatch` fails. Cancel a running job with `POST /v1/jobs/{id}/cancel`, which stops the replay's process.

Jobs live in the server process and end with it. One mock server and one replay run at a time; starting a second answers `409`.

## Errors

Every error has a JSON body with an `error` message and a `code`. The access guard's `401` and `403` carry only the message.

| Status | Code | Meaning |
|---|---|---|
| 400 | `invalid_request` | The body or a query parameter is not valid for the operation. |
| 401 | | The access token is missing or wrong. |
| 403 | | The `Host` or `Origin` header names another site. |
| 404 | `not_found` | No such operation or job. |
| 409 | `conflict` | A mock server or a replay is already running. |
| 422 | `tool_error` | The request was valid, but the operation failed. The message says why. |
| 500 | `internal` | An unexpected server error. |

## Run it in CI

The pipeline below starts the server, pulls a snapshot, starts the mock server, runs the application against it, replays the snapshot, and fails the job when the replay does not pass. It needs `curl` and `jq` on the runner and `SPEEDSCALE_API_KEY` set as a secret.

```bash title="proxymock-ci.sh"
#!/usr/bin/env bash
set -euo pipefail

SNAPSHOT_ID="${SNAPSHOT_ID:?set SNAPSHOT_ID}"
APP_COMMAND="./myapp"
APP_URL="http://localhost:8080"

sh -c "$(curl -Lfs https://downloads.speedscale.com/proxymock/install-proxymock)"
export PATH="$PATH:$HOME/.speedscale"
proxymock init --api-key "$SPEEDSCALE_API_KEY"

# A fresh ready file for each run, so a rerun never reads an old server's URL.
READY_FILE="$(mktemp -d)/proxymock-ready.json"
proxymock mcp run --http --port 0 --ready-file "$READY_FILE" > proxymock-server.log 2>&1 &
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT
until [ -f "$READY_FILE" ]; do sleep 0.2; done
API=$(jq -r .restUrl "$READY_FILE")

call() { curl -sS -X POST "$API/$1" -H 'Content-Type: application/json' -d "$2"; }

# A wait can end before a long job does, so poll until the job has finished.
finish_job() {
  local job="$1"
  while [ "$(jq -r .status <<<"$job")" = running ]; do
    job=$(curl -sS "$API/jobs/$(jq -r .id <<<"$job")?wait=600")
  done
  printf '%s' "$job"
}

# 1. Pull the snapshot into the workspace.
pulled=$(finish_job "$(call "snapshots/pull?wait=600" "{\"snapshotId\": \"$SNAPSHOT_ID\"}")")
[ "$(jq -r .status <<<"$pulled")" = succeeded ] || { echo "$pulled"; exit 1; }
dir=$(jq -r .result.directory <<<"$pulled")

# 2. Start the mock server and run the application against it. The proxy
# variables go to the application only: this script's own calls stay direct.
mocks=$(call mocks/start "{\"inDirectories\": [\"$dir\"]}")
[ "$(jq -r .running <<<"$mocks")" = true ] || { echo "$mocks"; exit 1; }
env $(jq -r '.env | to_entries[] | "\(.key)=\(.value)"' <<<"$mocks") $APP_COMMAND > app.log 2>&1 &
until curl -s -o /dev/null "$APP_URL"; do sleep 0.5; done

# 3. Replay the snapshot and fail the job unless it passed.
run=$(finish_job "$(call "replays/run?wait=600" "{\"inDirectories\": [\"$dir\"], \"testAgainst\": [\"$APP_URL\"], \"outDirectory\": \"proxymock/replayed\"}")")
jq '{status, error, passed: .result.passed, accuracy: .result.score.accuracy}' <<<"$run"
[ "$(jq -r .result.passed <<<"$run")" = true ]
```

<Tabs>

<TabItem value="github" label="GitHub Actions">

```yaml
name: proxymock replay
on: [pull_request]

jobs:
  replay:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: go build -o myapp .
      - name: Replay with proxymock
        env:
          SPEEDSCALE_API_KEY: ${{ secrets.SPEEDSCALE_API_KEY }}
          SNAPSHOT_ID: ${{ vars.PROXYMOCK_SNAPSHOT_ID }}
        run: ./proxymock-ci.sh
      - name: Keep the replay output
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: proxymock
          path: |
            proxymock/replayed
            proxymock-server.log
            app.log
```

</TabItem>

<TabItem value="gitlab" label="GitLab CI">

```yaml
replay:
  image: golang:1.25
  variables:
    SNAPSHOT_ID: $PROXYMOCK_SNAPSHOT_ID
  before_script:
    - apt-get update -qq && apt-get install -y -qq jq
  script:
    - go build -o myapp .
    - ./proxymock-ci.sh
  artifacts:
    when: always
    paths:
      - proxymock/replayed
      - proxymock-server.log
      - app.log
```

Set `SPEEDSCALE_API_KEY` as a masked CI/CD variable.

</TabItem>

</Tabs>

To gate on response bodies as well as the exit code, check the score: `jq -e '.result.score.accuracy.rate == 100'`. A `failIf` metric such as `requests.failed` counts failed requests, and a body that differs from the recording is not a failed request.

## Versioning

Everything under `/v1` except `/v1/experimental` is stable. A minor version adds optional fields and new operations, so ignore fields you do not know. Removing or renaming a field, or changing what it means, needs `/v2`. Every response from an operation carries the version that answered it in the `Proxymock-Api-Version` header.

## Experimental tools

Every MCP tool is also reachable at `POST /v1/experimental/tools/{name}`, with the tool's own arguments as the body. `GET /v1/experimental/tools` lists them with their input schemas. They answer with the tool's text and, when it has one, its structured result. Their names, arguments and results can change in any release, so use them to explore, and ask for a stable operation before a pipeline depends on one.
