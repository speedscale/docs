---
title: "Agent tutorial in your cluster 7: run a performance test"
description: "Your coding agent load tests the tutorial-orders workload in the cluster with APP_SLOW=0 and APP_SLOW=1, with the CNCF API mocked and the real database, and finds the N+1 query that makes GET /orders slower."
sidebar_position: 8
sidebar_label: "7. Run a performance test"
---

# Chapter 7: Run a performance test

Your agent load tests the workload in the cluster with a fast and a slow build and finds which endpoint got slower and why.

Time: about 10 minutes.

## Prompt

```text
Use the proxymock-load-test skill to load test the tutorial-orders workload in the cluster with APP_SLOW=0 and with APP_SLOW=1, with the CNCF API mocked and the real database. Tell me which endpoint got slower and why.
```

## What the agent does

The `proxymock-load-test` skill hands a cluster workload to `run-snapshot-replay` in its load mode:

- Makes a load test config from a built-in one and sizes it for comparing two builds: `proxymock test-config new tutorial-load-light --from performance_100replicas`, with 2 virtual users for 30 seconds. The built-in config runs 100 users for 5 minutes, which measures contention on a small cluster rather than the app.
- Mocks only the CNCF API, so every query reaches the real Postgres (`--mock` with the CNCF API's key from `proxymock cluster replay prepare`). A mocked database could not show the slow build's extra queries, because the recording never had them.
- Empties the `orders` and `order_items` tables before each run, because each run's `POST /orders` requests add thousands of rows the next run would read.
- Runs the load test once with `APP_SLOW=0` and once with `APP_SLOW=1`, checking that the pod under test runs the build it meant to test:

  ```bash
  proxymock cluster replay start --in proxymock/recorded-baseline \
    -n tutorial --workload tutorial-orders --snapshot-source local \
    --test-config tutorial-load-light \
    --mock tutorial-orders:demo-api.trafficreplay.com:443 --wait
  ```

- Compares the endpoints in the two results, then explains the slowdown by counting database transactions per `GET /orders` request on fixed data.

## What you should see

Each run's result lists the goals and every endpoint. The `APP_SLOW=1` run:

```text
result: Passed (success rate 100.0%)
goals (0 of 4 missed):
  PASS avgLatency: expected <= 500, actual 1.28
  PASS p95Latency: expected <= 1,500, actual 2.46
  PASS p99Latency: expected <= 5,000, actual 6.67
  PASS transactionsPerSecond: expected >= 50, actual 2,209.78
endpoints (busiest first):
  POST /orders: 14523 requests, avg 1.3 ms, p95 2.1 ms, p99 6.6 ms
  GET /orders/(.*): 13532 requests, avg 0.2 ms, p95 0.3 ms, p99 0.6 ms
  GET /orders/(.*)/status: 13532 requests, avg 0.2 ms, p95 0.3 ms, p99 0.6 ms
  GET /orders: 1650 requests, avg 6.6 ms, p95 11.0 ms, p99 22.5 ms
  GET /catalog: 996 requests, avg 20.7 ms, p95 1.0 ms, p99 1.7 ms, 2 failed
```

Both runs pass every goal, because `GET /orders` is 5 of the 134 recorded requests and barely moves the totals. The endpoints show the change. The agent's comparison:

| `GET /orders` in the cluster | `APP_SLOW=0` | `APP_SLOW=1` |
| --- | --- | --- |
| Average | 0.4 ms | 6.6 ms |
| p95 | 0.5 ms | 11.0 ms |
| p99 | 0.8 ms | 22.5 ms |
| Database transactions per request | 2 | 98 |

The other endpoints did not change. With `APP_SLOW=1`, `GET /orders` runs one query for the 50 newest orders and then one query per order for its items, an N+1, instead of one query that counts the items for the 50 orders it returns. Each extra query is a round trip to Postgres, and about 50 of them per request make up the added latency.

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** `proxymock/recorded-baseline` in the cluster at `speedscale-tutorial`/`tutorial`/`tutorial-orders`, only the CNCF API mocked, real Postgres truncated before each run, config `tutorial-load-light` (2 VUs, 30s)
- **Outcome:** pass. Both runs met all 4 goals, and `GET /orders` is the endpoint that got slower with `APP_SLOW=1` (N+1).
- **Numbers:**
  - aggregate (slow0 → slow1): p95 1.57 → 2.46 ms, p99 2.27 → 6.67 ms, 3,094 → 2,210 TPS
  - `GET /orders` in the cluster: p95 0.5 → 11.0 ms, p99 0.8 → 22.5 ms
  - fixed data: 2 → 98 DB transactions per request
- **Next:** use `proxymock-perf-container` to judge whether `GET /orders`' p99 of 22.5 ms under `APP_SLOW=1` matters at production load.
```

## If it goes wrong

- **Both builds look the same.** Check that the pod under test ran the build you meant: a change to the Deployment made while an earlier replay is still cleaning up can be undone by that cleanup. Wait for the earlier replay to finish, then check the env on the running pod.
- **Every endpoint got slower in both runs.** The load is too heavy for the cluster, so the test measures contention. Use fewer virtual users or a shorter run.
- **`GET /orders` slows down from one run to the next.** The tables were not reset, and each run read the rows the last one wrote. Empty `orders` and `order_items` before each run.
- **The slow build is not slower.** The database was mocked. Mock only the CNCF API, so the extra queries reach Postgres.

<details>
<summary>Manual equivalent</summary>

```bash
proxymock test-config new tutorial-load-light --from performance_100replicas
# set generator.stages[0].virtualUsers.virtualUsers to "2" and duration to "30s"
proxymock cluster replay prepare --in proxymock/recorded-baseline   # lists the mock keys
kubectl -n tutorial exec deploy/postgres -- psql -U tutorial -d tutorial -c 'TRUNCATE order_items, orders'
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local \
  --test-config tutorial-load-light --mock tutorial-orders:demo-api.trafficreplay.com:443 --wait
kubectl -n tutorial set env deployment/tutorial-orders APP_SLOW=1
kubectl -n tutorial rollout status deploy/tutorial-orders
kubectl -n tutorial exec deploy/postgres -- psql -U tutorial -d tutorial -c 'TRUNCATE order_items, orders'
proxymock cluster replay start --in proxymock/recorded-baseline \
  -n tutorial --workload tutorial-orders --snapshot-source local \
  --test-config tutorial-load-light --mock tutorial-orders:demo-api.trafficreplay.com:443 --wait
kubectl -n tutorial set env deployment/tutorial-orders APP_SLOW-
```

</details>

## Next

[Chapter 8: Do it to your own workload](./your-own-workload.md)
