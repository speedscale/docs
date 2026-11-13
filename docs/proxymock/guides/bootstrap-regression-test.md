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
| 1a | A Speedscale cloud capture of the service | Production traffic pulled with `proxymock cloud pull snapshot` |
| 1b | A Kubernetes cluster with the Speedscale operator | A fresh capture of the deployed workload |
| 2 | Postman, HAR, GoReplay, k6, Gatling, an e2e suite or a traffic driver | Imported, or run against the recording proxy |
| 3a | An OpenAPI spec | `proxymock generate`, with placeholders replaced by real values |
| 3b | Protobuf for gRPC | `proxymock generate` on the `.proto`, with placeholders replaced by real values |
| 3c | A GraphQL schema | `proxymock generate` on the schema, with placeholders replaced by real values |
| 4 | The code | Requests written from the routes and handlers |

The highest available rank is the base. Use rank 4 to fill any gaps in the base, including new behavior.

Every starting point is only a driver. Its requests are sent through `proxymock record` while the service runs, so the recording holds the service's real responses and every dependency call it made. The tests and the mocks end up in one directory, and the rest of the workflow is the same whatever you started from.

## Before you start

Use a coding agent that can read this guide, edit files, and run local commands. Give it the whole-workflow prompt below, or use the prompts for each step in the same session. The manual commands use a POSIX shell and require Git, Go 1.26.6 or newer, `curl`, and `jq`. An older Go installation can download the required toolchain if `GOTOOLCHAIN` is set to `auto`.

<details className="llm-prompt">
<summary>Whole-workflow LLM prompt</summary>

```text
Read this guide at https://docs.speedscale.com/proxymock/guides/bootstrap-regression-test/ and inspect my project instructions. Set up proxymock, its MCP server and skills, and a clean local mock-lab Go tutorial checkout with its own Postgres. Run both parts in order. Record and tune the original service, write and run a repeatable regression gate, then implement the receipt endpoint as specified here. Prove the old recording misses the receipt, capture the new behavior, and show that the updated gate passes, catches the planted receipt regression, and passes after you restore the code. Review the artifacts for secrets or personal data, prepare the files for CI, and stop the processes you started. Use the tutorial's local traffic driver. Report the commands, exit codes, measured mock match rate, and any blocked checks. Keep the original recording and baseline as evidence.
```

</details>

<details className="llm-prompt">
<summary>LLM prompt for setup</summary>

```text
Follow chapter 1 at https://docs.speedscale.com/proxymock/agent-tutorial/install-proxymock/ to check proxymock, its MCP connection, and the installed skills. Verify proxymock inventory --help. If setup opens a sign-in, tell me where to complete it and continue once it's ready. Clone https://github.com/speedscale/mock-lab into a fresh directory, check the Go version against tutorial/go/go.mod, and build the Go service and traffic driver. Start go -C db run . from the clone's tutorial directory, wait for Postgres on port 54329, and verify the database has no orders. Check that ports 8080, 4140, 4143, 15432, and 18081 are free. Leave the tutorial database running for Part 1 and tell me the checkout path.
```

</details>

For manual setup, [install and initialize proxymock](../agent-tutorial/install-proxymock.md), check `proxymock inventory --help`, and start the tutorial database in a fresh clone. Its first start downloads Postgres, and recording the service requires access to `https://demo-api.trafficreplay.com`.

```bash
git clone https://github.com/speedscale/mock-lab
cd mock-lab/tutorial
go -C db run .
```

Leave this terminal running until both parts are complete. The [tutorial README](https://github.com/speedscale/mock-lab/tree/main/tutorial#start-the-database) describes the database and how to select another port. If you change it, update the right side of every `--map` below.

## Part 1: a service with no recording

The Go orders service in `mock-lab/tutorial/go` has never been recorded. It calls the hosted CNCF projects API and stores orders in Postgres.

<details className="llm-prompt">
<summary>LLM prompt for the first regression gate</summary>

```text
From the clean mock-lab checkout, use quality-loop in tutorial/go to bootstrap the first regression test. Postgres is on 54329. Run inventory --offline and use cmd/traffic against the recording proxy. Check that the driver reports zero unexpected responses and that inbound HTTP, the CNCF API, and Postgres all appear in the recording. Replay, review the match-rate recommendations, and tune only the dynamic keys and fields described in the guide. Save the known-good baseline and write scripts/regression-gate.sh so it starts the app with recorded dependency mocks and returns the replay exit code. Verify the gate passes with passthrough disabled, fails with APP_VERSION=v2, and passes again on the original code. Save the verdict files and measured mock match rate.
```

</details>

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
     1a  cloud-recording  not-checked  skipped (--offline)
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
# Run this in both the app and traffic terminals from the clone's parent directory.
cd mock-lab/tutorial/go
proxymock inventory --offline

# Terminal 1: record the service
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-orders \
  --map 15432=postgres://localhost:54329 \
  --app-port 8080 --app-health-endpoint /healthz -- go run .
# Terminal 2: after the app is ready, send traffic; then stop the recorder with Ctrl+C
go run ./cmd/traffic http://localhost:4143

# Terminal 1: the service behind the mocks
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-orders \
  --out proxymock/results/mocked-tuning \
  --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
# Terminal 2: replay once, then review the mock run's recommendations
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080
proxymock match-rate analyze --mock-source recorded-orders --request-source results/mocked-tuning
# Accept the tutorial fixes after reviewing the analysis.
proxymock match-rate accept --all --mock-source recorded-orders --request-source results/mocked-tuning

# A strict test config that ignores the generated fields
proxymock test-config new orders --from standard
jq '(.assertionGroups[].configs[] | select(.type == "httpResponseBody") | .config.ignore) = "generated_at,id"' \
  proxymock/testconfigs/orders.json > orders.json.new && mv orders.json.new proxymock/testconfigs/orders.json
proxymock test-config compile orders

# Stop the tuning mock with Ctrl+C. In terminal 1, restart with the saved fixes and passthrough disabled.
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-orders --no-passthrough \
  --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
# Terminal 2: save the baseline once on known-good code, then run the gate
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080 \
  --test-config orders --out proxymock/results/regress-base
```

Stop the baseline mock in terminal 1. Save the script from [Prepare the CI gate](#prepare-the-ci-gate) as `scripts/regression-gate.sh`, then run the following from `mock-lab/tutorial/go`. The script starts and stops its own mock and app each time.

```bash
sh scripts/regression-gate.sh                 # expect exit 0
APP_VERSION=v2 sh scripts/regression-gate.sh  # expect exit 3: total_cents changes type
sh scripts/regression-gate.sh                 # expect exit 0
```

</details>

## Part 2: a new endpoint

<details className="llm-prompt">
<summary>LLM prompt for adding and testing the receipt endpoint</summary>

```text
Continue in the same mock-lab checkout. Implement and register GET /orders/{id}/receipt in tutorial/go using the guide's Go example. Return order_id, customer, items as the sum of quantities, and total_cents. Check that the original gate still passes without any receipt coverage. Keep the first recording and baseline, clear only the disposable tutorial database, and re-record the original traffic driver plus a receipt for a newly created order with three items across two lines, an unknown order, and a malformed ID. Assert the receipt returns items=3 and the three GET statuses are 200, 404, and 404. Rebuild the baseline on the correct implementation, run the gate with passthrough disabled, then change items to the line count and verify exit 3 identifies that field. Restore the sum, rerun for exit 0, and keep all three verdicts. Keep the test config and the active mock blueprints.
```

</details>

For manual setup, save this as `mock-lab/tutorial/go/receipt.go`:

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

Run `sh scripts/regression-gate.sh` from `mock-lab/tutorial/go`. The gate from part 1 still passes because no recorded request reaches the receipt endpoint. Before adding coverage, search `proxymock/recorded-orders/localhost/` for `/receipt` to confirm the gap.

### What the agent does

* Runs `proxymock inventory --offline` before moving the first recording. The inventory now picks the existing recording as the base.
* Writes requests for the receipt: one order created and its receipt read, an unknown order, and a malformed ID.
* Archives the original recording and records into a fresh `proxymock/recorded-orders` directory using the traffic driver and the new requests. The workspace blueprints and test config from part 1 stay in place.
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
create order     201
receipt          200
unknown order    404
malformed id     404
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

From `mock-lab/tutorial/go`, create `scripts/` if needed and save the following as `scripts/receipt-traffic.sh`:

```bash
#!/bin/sh
# Requests for GET /orders/{id}/receipt, sent to the base URL in $1.
set -eu
base="${1:-http://localhost:4143}"
response=$(mktemp)
trap 'rm -f "$response"' 0

check_status() {
  label=$1 expected=$2
  shift 2
  status=$(curl -sS --max-time 10 -o "$response" -w '%{http_code}' "$@")
  printf '%-16s %s\n' "$label" "$status"
  [ "$status" = "$expected" ]
}

check_status 'create order' 201 -X POST "$base/orders" -H 'Content-Type: application/json' \
  -d '{"customer":"grace@example.com","items":[{"project_id":"kubernetes","quantity":2},{"project_id":"prometheus","quantity":1}]}'
id=$(jq -er '.id | select(type == "string" and length > 0)' "$response")
check_status 'receipt' 200 "$base/orders/$id/receipt"
jq -e --arg id "$id" '.order_id == $id and .customer == "grace@example.com" and .items == 3 and (.total_cents | type) == "number"' "$response" >/dev/null
check_status 'unknown order' 404 "$base/orders/00000000-0000-0000-0000-000000000000/receipt"
check_status 'malformed id' 404 "$base/orders/not-an-id/receipt"
```

The traffic driver reads recent orders, so empty the disposable tutorial database before the second recording. Keep the first recording and its baseline together outside the checkout. Run this once from `mock-lab/tutorial/go`, with the tutorial database running and the part 1 mock stopped:

```bash
go -C ../db run . -exec 'TRUNCATE order_items, orders'
archive=$(mktemp -d)
mv proxymock/recorded-orders proxymock/results/regress-base "$archive/"
printf 'Part 1 recording and baseline: %s\n' "$archive"
```

Run these commands from `mock-lab/tutorial/go` in both terminals:

```bash
# Terminal 1: record again
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-orders \
  --map 15432=postgres://localhost:54329 \
  --app-port 8080 --app-health-endpoint /healthz -- go run .
# Terminal 2: once the app is ready, send the original and new traffic
go run ./cmd/traffic http://localhost:4143
sh scripts/receipt-traffic.sh http://localhost:4143

# Terminal 1: stop the recorder with Ctrl+C, then start the app behind the mocks
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-orders --no-passthrough \
  --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run .
# Terminal 2: save the new known-good baseline
proxymock replay --in proxymock/recorded-orders --test-against http://localhost:8080 \
  --test-config orders --out proxymock/results/regress-base
```

Stop the baseline mock in terminal 1. Run `sh scripts/regression-gate.sh` in terminal 2 and expect exit `0`. In `receipt.go`, temporarily replace the loop that sums the quantities with `items := len(lines)`. Run the same gate and expect exit `3` with a new mismatch on `items`. Restore the loop and run the gate again for exit `0`. Stop the tutorial database with Ctrl+C when finished.

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

<details className="llm-prompt">
<summary>LLM prompt for bootstrapping from repository traffic, a spec, or code</summary>

```text
Inventory my service and use the best available local source. Import a supported traffic artifact or run the repository's existing driver if available. Use OpenAPI, Protobuf, or GraphQL to generate inbound request candidates when a schema is the best source. Read the handlers to write any missing requests. Resolve placeholders with real values, create prerequisite records before using their IDs, and check expected statuses for success and error cases. Record the requests through proxymock against the running service, then validate and measure the resulting recording against the schema if there is one. Continue with the mock tuning and regression gate from Part 1. Report coverage gaps and unsupported operations.
```

</details>

### A Speedscale cloud capture

When the service already runs where Speedscale captures it, production traffic is the best base. The agent pulls it, keeps the pulled copy unchanged as evidence, and replays it together with the new endpoint's requests through one recording. Before blessing the new baseline, it compares the old routes' new responses with the pulled ones. A difference is either a field the test config should ignore or a regression your branch already introduced.

<details className="llm-prompt">
<summary>LLM prompt for bootstrapping from a capture</summary>

```text
Use the Speedscale snapshot I identify as the base. Pull it with proxymock cloud pull snapshot and preserve the original. If I select a fresh Kubernetes capture instead, use the context, namespace, and workload I provide to capture traffic and restore the prior capture state when finished. Review the traffic for sensitive data before reuse. Replay eligible inbound requests at the test service through the recorder, add requests for new behavior, and compare the new responses for existing routes with the source capture before writing a baseline. Report unexpected differences, then tune and verify the gate as in Part 1.
```

</details>

### gRPC and GraphQL

`proxymock generate` also reads a `.proto` file and a GraphQL schema, and the agent treats the output the same way: replace the placeholders, then replay the tests through the recording proxy. For gRPC, `generate` writes one test per unary RPC and lists streaming RPCs as skipped. For GraphQL it writes one operation per query and mutation from SDL, an introspection JSON file or a running endpoint, and lists subscriptions as skipped. See [Generate tests and mocks from a .proto](../grpc/generate-from-a-proto.md).

## Prepare the CI gate

<details className="llm-prompt">
<summary>LLM prompt for preparing the gate and artifacts for CI</summary>

```text
Prepare the tutorial regression gate for CI. Make the script runnable from a clean checkout with proxymock initialized and Go available. It should start the app behind recorded mocks with passthrough disabled, wait for readiness, replay against the saved baseline, preserve the replay exit code and verdict, and clean up its processes. Review the recording, baseline, and blueprints for credentials and personal data. Verify that the recording, active blueprints, test config, known-good baseline, receipt source and traffic script, and gate script can be tracked, and that scratch runs are ignored. Give me the CI command and the exact files to review. Stop the tutorial processes you started.
```

</details>

For a manual gate, create `scripts/` in `mock-lab/tutorial/go` and save this as `scripts/regression-gate.sh`. Run it on a runner with Go and an initialized proxymock, with ports 8080, 4140, 15432, and 18081 free. The mock serves both dependencies from the recording.

```bash
#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

recording=proxymock/recorded-orders
baseline=proxymock/results/regress-base
if [ ! -d "$recording/localhost" ] || [ ! -f "$baseline/replay-verdict.json" ]; then
  printf '%s\n' 'The orders recording and known-good baseline are required.' >&2
  exit 1
fi

DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in "$recording" --no-passthrough --health-port 18081 \
  --map 15432=postgres://localhost:54329 --app-health-endpoint /healthz -- go run . &
mock_pid=$!
cleanup() {
  kill -TERM "$mock_pid" 2>/dev/null || true
  wait "$mock_pid" 2>/dev/null || true
}
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM

attempts=0
until curl -fsS --noproxy '*' --max-time 1 http://localhost:18081/ >/dev/null 2>&1 &&
      curl -fsS --noproxy '*' --max-time 1 http://localhost:8080/healthz >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if ! kill -0 "$mock_pid" 2>/dev/null || [ "$attempts" -ge 120 ]; then
    printf '%s\n' 'The mock or orders service failed to start.' >&2
    exit 1
  fi
  sleep 1
done

proxymock replay --in "$recording" --test-against http://localhost:8080 \
  --test-config orders --baseline "$baseline" --fail-on-new-mismatch
```

Commit the recording and everything the gate needs, so CI runs it without an agent:

| Path | Commit |
| --- | --- |
| `proxymock/recorded-orders/` | Yes |
| `proxymock/blueprints/`, `proxymock/testconfigs/` | Yes |
| `proxymock/results/regress-base/` | Yes. Keep the known-good baseline for comparisons. |
| `receipt.go`, `handlers.go`, `scripts/receipt-traffic.sh`, `scripts/regression-gate.sh` | Yes |
| Other `proxymock/results/` runs, `proxymock/candidates-*/`, `.replay/`, `proxymock.log` | No |

mock-lab itself ignores `tutorial/*/proxymock/` so that tutorial readers start clean. In your own repository, or to keep the tutorial result, add exceptions for the paths above:

```text
!/tutorial/go/proxymock/
/tutorial/go/proxymock/*
!/tutorial/go/proxymock/recorded-orders/
!/tutorial/go/proxymock/blueprints/
!/tutorial/go/proxymock/testconfigs/
!/tutorial/go/proxymock/results/
/tutorial/go/proxymock/results/*
!/tutorial/go/proxymock/results/regress-base/
.replay/
```

Check the recording, blueprints, and baseline for credentials and personal data before you commit them. Run `sh tutorial/go/scripts/regression-gate.sh` as a CI step from the mock-lab root and retain `tutorial/go/proxymock/results/` as a job artifact. See [Gate CI on replay results](./replay-verdicts.md) and [CI/CD](./cicd.md).

## If it goes wrong

* **The inventory finds nothing but the code.** The agent writes the requests itself from the routes. Point it at the service's README or tests if it misses a route.
* **A recorded request returned an error you did not intend.** Fix the request or the code and record again. A baseline that expects an accidental 500 hides the bug.
* **Extra health checks show up as inbound tests.** The traffic driver sends one intentionally. Send readiness probes directly to the service on port 8080, or use `--app-health-endpoint`.
* **Replayed GETs by ID return 404 after re-recording from an old recording.** The service made new IDs. Re-run what produced the recording, as in part 2, instead of replaying the old recording at the service.
* **The gate passes on a change to the new endpoint.** The recording has no request that reaches it. Run `proxymock inventory` and add filler for it.
