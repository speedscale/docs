---
title: "Agent tutorial 7: run a performance test"
description: "Your coding agent uses the proxymock-load-test skill to load-test the tutorial app with APP_SLOW=0 and APP_SLOW=1, with the CNCF API mocked and the real database, and finds the endpoint that got slower and why."
sidebar_position: 8
sidebar_label: "7. Performance test"
---

# Chapter 7: Run a performance test

Your agent load-tests two versions of the app with the same recorded traffic and finds the endpoint that got slower and the query pattern that caused it.

Time: about 6 minutes.

## Prompt

```text
Use the proxymock-load-test skill to compare the tutorial app with APP_SLOW=0 and APP_SLOW=1, with the CNCF API mocked and the real database. Tell me which endpoint got slower and why.
```

## What the agent does

The `proxymock-load-test` skill:

- Starts the app behind `proxymock mock` with the whole baseline recording, so the CNCF API is answered by the mocks and the `ts` fix from chapter 4 applies. The app's `DATABASE_URL` points straight at Postgres on port 5432, so every query hits the real database. A mocked database could not show the slow version's extra queries, because the recording never had them.
- Replays the recorded inbound traffic with 4 virtual users in high-throughput mode (`proxymock replay --load-test`), which skips response scoring and reports latency percentiles and throughput per endpoint.
- Empties the `orders` and `order_items` tables before each run and replays a fixed number of passes (`--times 30`), so both versions run against the same amount of data.
- Runs once with `APP_SLOW=0` and once with `APP_SLOW=1`, and compares the endpoints.
- Records one traffic-driver pass of each version with `proxymock record` and counts the SQL statements, to show why the slow endpoint is slow.

## What you should see

`GET /orders` is the endpoint that got slower. With `APP_SLOW=1` it runs one query for the list and then one `order_items` query per order, an N+1 query, instead of one joined `COUNT` query.

The load test: 4 virtual users, 30 passes, 16,320 requests per run, CNCF API mocked, real Postgres, 0 failures. Latency in milliseconds:

| Endpoint | `APP_SLOW=0` average / p95 / p99 | `APP_SLOW=1` average / p95 / p99 |
| --- | --- | --- |
| `GET /orders` | 1 / 2 / 2 | 16 / 17 / 19 |
| `POST /orders` | 1 / 2 / 3 | 1 / 2 / 3 |
| `GET /orders/{id}`, `/status`, `/catalog`, `/healthz` | 1 / 1 / 1 | 1 / 1 / 1 |
| Throughput, all endpoints | 4,166 requests/s | 2,672 requests/s |

The statement counts from one traffic-driver pass, which sends `GET /orders` 5 times:

| | `APP_SLOW=0` | `APP_SLOW=1` |
| --- | --- | --- |
| List query | 5 joined `COUNT` queries | 5 plain `SELECT ... LIMIT 50` queries |
| `order_items WHERE order_id = $1` | 40 (from `GET /orders/{id}` only) | 240 (40 more per list call) |
| Postgres messages | 1,075 | 1,875 |

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** proxymock/recorded-baseline replayed at http://localhost:8080 (`proxymock mock --in proxymock/recorded-baseline --map 15432=... --no-out`, app on the real Postgres :54329, CNCF API mocked with blueprints, 0 mock misses), --vus 4 --times 30 --performance, tables truncated before each run; APP_SLOW=0 vs APP_SLOW=1
- **Outcome:** pass (no --fail-if set); GET /orders regressed 1 ms → 16 ms avg under APP_SLOW=1 — N+1: 1 + one order_items query per listed order (up to 51) instead of one joined COUNT query
- **Numbers:** GET /orders p95 2 → 17 ms, p99 2 → 19 ms; overall p99 3 → 16 ms; rps 4166 → 2672; failed 0 / 0; matchPct null (--performance)
- **Artifacts:** .../proxymock/results/load-slow0-fixed/{summary.json,result.json}, .../load-slow1-fixed/{summary.json,result.json}; statement evidence .../stmt-slow0/, .../stmt-slow1/ ...
- **Next:** proxymock-perf-container — "judge what the tutorial app sustains on GET /orders with APP_SLOW=1 vs 0 and whether the ceiling is the app or the harness"
```

`matchPct` is null because high-throughput mode skips response scoring. Use the regression test from [chapter 6](./regression-test.md) for correctness.

## If it goes wrong

- **The CNCF API calls are not mocked.** Point `proxymock mock --in` at the whole recording directory, not the CNCF API's subdirectory. The `ts` fix lives in the workspace's blueprints, and with only the subdirectory every call missed the mock and went to the real API. The proxymock log shows `NO MATCH` entries with the `ts` value as the only difference.
- **The fast version looks as slow as the slow one, or slower.** The app writes a new order on every `POST /orders`, so a timed run (`--for 30s`) grows the tables by about 1,000 orders per second. The joined `COUNT` query behind `GET /orders` scans every order from the last hour, so table size swamps the difference between the versions: a repeat `APP_SLOW=0` run on the bigger table took 37 ms on `GET /orders`. Empty the tables before each run and use a fixed number of passes (`--times`) instead of a duration.

See [proxymock-load-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-load-test) for the skill's options.

<details>
<summary>Manual equivalent</summary>

Commands from the Go app. For another language, use its start command from [chapter 2](./run-the-demo-app.md) after `--`. Run this once with `APP_SLOW=0` and once with `APP_SLOW=1`, and stop the mock with ctrl-c between runs.

```bash
cd mock-lab/tutorial/go

# Start from empty tables (without Go: ../tutorial-db -exec "...")
go -C ../db run . -exec "TRUNCATE order_items, orders"

# Terminal 1: CNCF API mocked, app on the real Postgres
DATABASE_URL='postgres://tutorial:tutorial@localhost:54329/tutorial?sslmode=disable' APP_SLOW=0 \
  proxymock mock --in proxymock/recorded-baseline --map 15432=postgres://localhost:54329 \
  --no-out --app-health-endpoint /healthz -- go run .

# Terminal 2: 4 virtual users, 30 passes, latency per endpoint as JSON
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 \
  --vus 4 --times 30 --load-test --output json --no-out > load-slow0.json
```

To count the statements behind the slowdown, record one traffic-driver pass of each version and count the `Execute Prepared Statement` entries per statement in `localhost-54329/`:

```bash
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' APP_SLOW=1 \
  proxymock record --out proxymock/results/stmt-slow1 --map 15432=postgres://localhost:54329 \
  --app-port 8080 --app-health-endpoint /healthz -- go run .
go run ./cmd/traffic http://localhost:4143    # second terminal
```

</details>

## Next

[Chapter 8: Do it to your own service](./your-own-service.md)
