---
title: Bootstrap a Regression Test With No Recording
description: Build the first recording and regression gate for a service or a new endpoint that has never been recorded, starting from a traffic driver, a spec, a cloud capture or the code.
sidebar_position: 1.6
---

# Bootstrap a Regression Test With No Recording

Use this guide when a service, or a new endpoint on it, has never been recorded and you want a regression test for it anyway. Your coding agent builds the first recording for you, tunes it, and leaves a gate you run before every change.

You will do it twice on the mock-lab tutorial orders service: once for a service with no recording at all, and once for a new endpoint added to a service that already has one.

## How it works

proxymock needs a recording of the service before it can mock its dependencies or replay its traffic. When there is no recording yet, something has to send the first requests. `proxymock inventory` lists what your repository already offers for that and ranks it by how little you have to supply and how real the values are:

| Rank | Starting point | Where the requests come from |
| --- | --- | --- |
| 0 | An existing proxymock recording | Re-run what produced it, plus requests for the new behavior |
| 1a | A Speedscale cloud capture of the service | Production traffic pulled with `proxymock cloud pull` |
| 1b | A Kubernetes cluster with the Speedscale operator | A fresh capture of the deployed workload |
| 2 | Postman, HAR, GoReplay, k6, Gatling, an e2e suite or a traffic driver | Imported, or run against the recording proxy |
| 3a | An OpenAPI spec | `proxymock generate`, with placeholders replaced by real values |
| 3b | Protobuf for gRPC | `proxymock generate` on the `.proto`, with placeholders replaced by real values |
| 3c | A GraphQL schema | `proxymock generate` on the schema, with placeholders replaced by real values |
| 4 | The code | Requests written from the routes and handlers |

The highest available rank is the base. Rank 4 is always added on top, because the new behavior is never in any other source.

Every starting point is only a driver. Its requests are sent through `proxymock record` while the service runs, so the recording holds the service's real responses and every dependency call it made. The tests and the mocks end up in one directory, and the rest of the workflow is the same whatever you started from.

## Before you start

* proxymock with the `inventory` command. Check with `proxymock inventory --help`.
* A coding agent with the proxymock MCP server and skills installed, as in [chapter 1 of the agent tutorial](../agent-tutorial/install-proxymock.md).
* A clone of [speedscale/mock-lab](https://github.com/speedscale/mock-lab) and Go 1.25 or newer.
* The tutorial database running from `mock-lab/tutorial` in its own terminal, as described in the [tutorial README](https://github.com/speedscale/mock-lab/tree/main/tutorial#start-the-database):

```bash
cd mock-lab/tutorial
go -C db run .
```

## Part 1: a service with no recording

The Go orders service in `mock-lab/tutorial/go` has never been recorded. It calls the hosted CNCF projects API and stores orders in Postgres.

### Prompt

```text
mock-lab/tutorial/go has never been recorded. Use the quality-loop skill to bootstrap a regression test for it. Postgres is on port 54329. Tune the mocks and the tests, and leave me a gate script I can run before every change.
```

### What the agent does

* Runs `proxymock inventory` in the service directory and takes the base it recommends.
* Records the service with `proxymock record`, mapping Postgres through the proxy, while the base sends its requests through the inbound port 4143.
* Reviews the recording: every inbound status is one a request meant to produce, and the CNCF API and Postgres are both in it.
* Replays it behind `proxymock mock` and hands misses to the `improve-mock-match-rate` skill and response differences to the `tune-snapshot-replay` skill.
* Writes a baseline replay and a gate script with the `proxymock-regression-test` skill, and proves the gate fails on a planted change.

### What you should see

The inventory finds the service's traffic driver and picks it as the base. Trimmed:

```text
     0   local-recording  unavailable  no proxymock recording in the repository
     1a  cloud-recording  not-checked  the repository declares no distinctive service name; ask which cloud service this is, if it was captured
BASE 2   repo-traffic     available    found 1 traffic driver
                                       cmd/traffic
                                       next: run the driver against the record port
     3a  openapi          unavailable  no openapi spec found
FILL 4   code             available    the routes and handlers in the code; always the source for the new behavior

recommended: base 2, filler 4
note: no spec under this directory; specs often live beside the service, so also try --root mock-lab/tutorial (repository root: mock-lab)
```

The agent may also run it from `mock-lab/tutorial`, where it finds `contract/openapi.yaml`. The traffic driver still ranks first because its requests are the ones the service's authors chose.

The recording has three hosts:

| Directory | Files | What it is |
| --- | --- | --- |
| `localhost` | 135 | Inbound requests to the service: the tests |
| `demo-api.trafficreplay.com` | 70 | Calls to the CNCF projects API: mocks |
| `localhost-54329` | 1075 | Postgres messages: mocks |

The mock analysis finds four fixes: a timestamp query parameter on the CNCF API calls, and three SQL reads keyed on the order ID. After they are accepted and the test config ignores the generated `id` and `generated_at` fields, the gate on unchanged code passes:

```text
 PASS passAssertPct >= 100 - observed 100
 PASS assertion group 1 (httpStatusCode, httpHeaders, httpResponseCookies, httpResponseBody, httpResponseContentType): 405 passed, 0 failed
Goal verdict: PASS
```

<details>
<summary>Manual equivalent</summary>

```bash
cd mock-lab/tutorial/go
proxymock inventory

# Terminal 1: record the service
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-orders \
  --map 15432=postgres://localhost:54329 \
  --app-port 8080 --app-health-endpoint /healthz -- go run .
# Terminal 2: the base, sent through the inbound proxy; then ctrl-c terminal 1
go run ./cmd/traffic http://localhost:4143

# Terminal 1: the service behind the mocks
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-orders \
  --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
# Terminal 2: replay once, then fix the misses; restart terminal 1 afterwards
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080
proxymock match-rate analyze
proxymock match-rate accept --all

# A strict test config that ignores the generated fields
proxymock test-config new orders --from standard
jq '(.assertionGroups[].configs[] | select(.type == "httpResponseBody")) |= (.config = {ignore: "generated_at,id"})' \
  proxymock/testconfigs/orders.json > orders.json.new && mv orders.json.new proxymock/testconfigs/orders.json

# The baseline once on known-good code, then the gate on every change
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080 \
  --test-config orders --out proxymock/results/regress-base
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080 \
  --test-config orders --baseline proxymock/results/regress-base --fail-on-new-mismatch
```

</details>

## Part 2: a new endpoint

Now add an endpoint the recording has never seen. Save this as `mock-lab/tutorial/go/receipt.go`:

```go
package main

import (
	"errors"
	"net/http"
)

type receiptResponse struct {
	OrderID    string `json:"order_id"`
	Customer   string `json:"customer"`
	Items      int    `json:"items"`
	TotalCents int    `json:"total_cents"`
}

// getReceipt answers GET /orders/{id}/receipt: the order's customer, the
// number of items across its lines, and its total.
func (a *App) getReceipt(w http.ResponseWriter, r *http.Request) {
	id, ok := parseOrderID(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusNotFound, "order not found")
		return
	}
	row, err := a.Store.GetOrder(r.Context(), id)
	if errors.Is(err, errOrderNotFound) {
		writeError(w, http.StatusNotFound, "order not found")
		return
	}
	if err != nil {
		a.internalError(w, "get receipt", err)
		return
	}
	lines, err := a.Store.GetLines(r.Context(), id)
	if err != nil {
		a.internalError(w, "get receipt lines", err)
		return
	}
	items := 0
	for _, l := range lines {
		items += l.Quantity
	}
	writeJSON(w, http.StatusOK, receiptResponse{OrderID: row.ID, Customer: row.Customer, Items: items, TotalCents: row.TotalCents})
}
```

Then register it in `Routes()` in `handlers.go`, after the status route:

```go
	mux.HandleFunc("GET /orders/{id}/receipt", a.getReceipt)
```

The gate from part 1 still passes, and it would keep passing if the receipt were wrong: no recorded request reaches it.

### Prompt

```text
I added GET /orders/{id}/receipt to mock-lab/tutorial/go. Use the quality-loop bootstrap workflow to add it to the regression test: write requests for it, re-record, rebuild the baseline, and prove the gate catches a planted change to the receipt.
```

### What the agent does

* Runs `proxymock inventory`, which now picks the existing recording as the base.
* Writes requests for the receipt: one order created and its receipt read, an unknown order, and a malformed ID.
* Re-records into the same `proxymock/recorded-orders` directory with the traffic driver and the new requests, so the recording stays consistent. The blueprints and test config from part 1 stay.
* Checks the new pairs are the statuses it meant, rebuilds the baseline, plants a change in the receipt, and confirms the gate fails, then restores the code.

### What you should see

The inventory now reads:

```text
BASE 0   local-recording  available    1 recording directory holding 1280 RRPairs
FILL 4   code             available    the routes and handlers in the code; always the source for the new behavior

recommended: base 0, filler 4
note: a recording already exists: add the filler for the new behavior and re-record, rather than starting over
```

The new requests, sent through the inbound proxy while recording:

```text
receipt         200
unknown order   404
malformed id    404
```

The recording grows to 139 inbound requests. The part 1 blueprints already cover the receipt's two SQL reads, so the replay needs no new tuning:

```text
  Accuracy:    100.0% (139/139 pairs matched; 0 status, 0 body mismatch(es))
  Match rate:  100.0% (1091/1091 matched; 0 no-match 0.0%, 0 passthrough 0.0%)
```

With the receipt changed to count lines instead of items, the gate fails with exit code 3 and names the field:

```text
NEW MISMATCH: GET /orders/6008e18a-2c7e-4aab-a086-a93f896800be/receipt status 200, body items 3 -> 2
 FAIL assertion group 1 (httpStatusCode, httpHeaders, httpResponseCookies, httpResponseBody, httpResponseContentType): 416 passed, 1 failed
Goal verdict: FAIL
```

Restored, it passes again with exit code 0.

<details>
<summary>Manual equivalent</summary>

The requests for the new endpoint, as `scripts/receipt-traffic.sh`:

```bash
#!/bin/sh
# Requests for GET /orders/{id}/receipt, sent to the base URL in $1.
set -eu
base="${1:-http://localhost:4143}"
id=$(curl -sf -X POST "$base/orders" -H 'Content-Type: application/json' \
  -d '{"customer":"grace@example.com","items":[{"project_id":"kubernetes","quantity":2},{"project_id":"prometheus","quantity":1}]}' |
  sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
curl -s -o /dev/null -w 'receipt         %{http_code}\n' "$base/orders/$id/receipt"
curl -s -o /dev/null -w 'unknown order   %{http_code}\n' "$base/orders/00000000-0000-0000-0000-000000000000/receipt"
curl -s -o /dev/null -w 'malformed id    %{http_code}\n' "$base/orders/not-an-id/receipt"
```

```bash
cd mock-lab/tutorial/go
rm -rf proxymock/recorded-orders

# Terminal 1: record again
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-orders \
  --map 15432=postgres://localhost:54329 \
  --app-port 8080 --app-health-endpoint /healthz -- go run .
# Terminal 2: the base and the new requests; then ctrl-c terminal 1
go run ./cmd/traffic http://localhost:4143
sh scripts/receipt-traffic.sh http://localhost:4143

# Terminal 1: the service behind the mocks
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-orders \
  --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
# Terminal 2: a new baseline, then the gate
rm -rf proxymock/results/regress-base
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080 \
  --test-config orders --out proxymock/results/regress-base
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080 \
  --test-config orders --baseline proxymock/results/regress-base --fail-on-new-mismatch
```

</details>

## Other starting points

### An OpenAPI spec

When the spec is the best source, the agent generates inbound tests from it as drivers:

```bash
proxymock generate --direction inbound --out proxymock/candidates-orders ../contract/openapi.yaml
```

proxymock lists the tests whose request still sends a placeholder, because a real service answers those with an error:

```text
PLACEHOLDERS: 4 of 12 inbound test(s) still send generated placeholders ("example_value" or ${{param:...}}).
Generated inbound tests are drivers, not a baseline: replace the placeholders with real values
before replaying them at a real implementation or recording them through proxymock record.
  - proxymock/candidates-orders/localhost/get_orders_id_200_inbound.md
  - proxymock/candidates-orders/localhost/get_orders_id_404_inbound.md
  - proxymock/candidates-orders/localhost/get_orders_id_status_404_inbound.md
  - proxymock/candidates-orders/localhost/get_orders_id_status_200_inbound.md
```

The agent replaces or removes those, then replays the rest through the recording proxy with `proxymock replay --in proxymock/candidates-orders --test-against http://localhost:4143` while `proxymock record` wraps the service. Requests a spec generates for an error status are often valid requests: on this service the generated 400 and 422 order requests both returned 201. The agent writes the error cases by hand. `proxymock validate` and `proxymock coverage` then check the recording against the spec. See [Generate mocks from OpenAPI](./openapi.md).

### A Speedscale cloud capture

When the service already runs where Speedscale captures it, production traffic is the best base. The agent pulls it, keeps the pulled copy unchanged as evidence, and replays it together with the new endpoint's requests through one recording. Before blessing the new baseline, it compares the old routes' new responses with the pulled ones. A difference is either a field the test config should ignore or a regression your branch already introduced.

### gRPC and GraphQL

`proxymock generate` also reads a `.proto` file and a GraphQL schema, and the agent treats the output the same way: replace the placeholders, then replay the tests through the recording proxy. For gRPC, `generate` writes one test per unary RPC and lists streaming RPCs as skipped. For GraphQL it writes one operation per query and mutation from SDL, an introspection JSON file or a running endpoint, and lists subscriptions as skipped. See [Generate tests and mocks from a .proto](../grpc/generate-from-a-proto.md).

## Commit the result

Commit the recording and everything the gate needs, so CI runs it without an agent:

| Path | Commit |
| --- | --- |
| `proxymock/recorded-orders/` | Yes |
| `proxymock/blueprints/`, `proxymock/testconfigs/` | Yes |
| `proxymock/results/regress-base/` | Yes. A CI job that rebuilds its own baseline from the same code can never fail. |
| The gate script | Yes |
| Other `proxymock/results/` runs, `proxymock/candidates-*/`, `.replay/`, `proxymock.log` | No |

mock-lab itself ignores `tutorial/*/proxymock/` so that tutorial readers start clean. In your own repository, or to keep the tutorial result, add exceptions for the paths above:

```text
!/tutorial/go/proxymock/
/tutorial/go/proxymock/results/*
!/tutorial/go/proxymock/results/regress-base/
.replay/
```

Check the recording for credentials and personal data before you commit it. Then run the gate script as one CI step. See [Gate CI on replay results](./replay-verdicts.md) and [CI/CD](./cicd.md).

## If it goes wrong

* **The inventory finds nothing but the code.** The agent writes the requests itself from the routes. Point it at the service's README or tests if it misses a route.
* **A recorded request returned an error you did not intend.** Fix the request or the code and record again. A baseline that expects an accidental 500 hides the bug.
* **A health check shows up as an inbound test.** It was sent through port 4143. Wait for the service on its own port, or use `--app-health-endpoint`.
* **Replayed GETs by ID return 404 after re-recording from an old recording.** The service made new IDs. Re-run what produced the recording, as in part 2, instead of replaying the old recording at the service.
* **The gate passes on a change to the new endpoint.** The recording has no request that reaches it. Run `proxymock inventory` and add filler for it.
