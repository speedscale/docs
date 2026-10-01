---
title: "Agent tutorial 4: tune the mocks"
description: "Your coding agent uses the improve-mock-match-rate skill to replay the baseline recording with the app's dependencies mocked, mask a cache-busting query parameter, and key SQL reads so each one gets its own row."
sidebar_position: 5
unlisted: true
---

# Chapter 4: Tune the mocks

Your agent replays the recording against the app with the CNCF API and Postgres mocked, then fixes the mocks until every outbound call is answered and every SQL read gets the row that belongs to it.

Time: about 4 minutes.

## Prompt

```text
Use the improve-mock-match-rate skill to replay the baseline recording against the tutorial app with its dependencies mocked, working locally. Get every call the app makes matched by a mock, and make sure SQL reads are served the rows that belong to them.
```

## What the agent does

The `improve-mock-match-rate` skill works in rounds: measure, accept fixes, re-run, measure again.

- Starts the app behind `proxymock mock --in proxymock/recorded-baseline --map 15432=postgres://localhost:5432`, so the CNCF API and Postgres are both answered from the recording, then replays the recorded inbound traffic at the app with `proxymock replay`.
- Runs `proxymock match-rate analyze`, which finds two problems.
- The app adds a `ts=<epoch ms>` query parameter to every CNCF API call. The value is part of the mock signature, so no recorded call matches and all 70 calls pass through to the real API instead of the mock. The fix replaces `ts` with a constant on every recorded CNCF path.
- Postgres matches a statement on its text, not its parameter values, and answers repeats of a statement from its recordings in turn. In this replay the requests arrive in recorded order, so each read happens to get its own row. Replayed out of order or with several users, the reads for order A would get order B's row. The analysis reports 122 such reads and recommends keying the three order-id reads on their `$1` value, which comes from the inbound request.
- Accepts all four recommendations (`proxymock match-rate accept --all`). They are written to a blueprint next to the recording.
- Leaves the `X-Request-Id` header alone. It changes on every call, but headers are not part of the HTTP mock signature, so it never causes a miss.
- Leaves the inserts alone. They carry a new order id and timestamp on every run, which the analysis counts separately as expected.
- Re-runs once in order and once with 4 virtual users (`--vus 4`) to confirm that every read still gets its own row when requests overlap.

## What you should see

The first analysis. Trimmed:

```text
Mock match analysis (mock source: recorded-baseline, request source: proxymock/results/mocked-1)

  Report match rate:    93% (993/1063) — recorded mock verdicts; 70 passthrough call(s) count as misses
  SQL correctness:      232 SQL response(s): 127 exact, 0 bind drift, 0 fallback, 122 of the exact only in recorded order
  105 write(s) carried values not in the recording (expected: new ids, timestamps)
  Order-dependent reads got their own row only because the replay sent calls in recorded order. Replayed out of order or with several users, they get another row. Key them before a load test or concurrent replay.
  - 41 exact, only in recorded order: SELECT id, customer, status, total_cents, created_at FROM orders WHERE id = $1 :: uuid
      fix: accept my-app|sql:e0753b06 ($1 recorded values appear in inbound requests)
  - 41 exact, only in recorded order: SELECT status FROM orders WHERE id = $1 :: uuid
      fix: accept my-app|sql:9cc2f18d ($1 recorded values appear in inbound requests)
  - 40 exact, only in recorded order: SELECT project_id, name, quantity, unit_price_cents FROM order_items WHERE order_id = $1 :: uuid ORDER BY id
      fix: accept my-app|sql:06c0e997 ($1 recorded values appear in inbound requests)

Recommendation groups (impact-sorted):

1. GET 16 endpoints (/v1/project/argo, /v1/project/backstage, /v1/project/chaos-mesh, +13 more) — service responder, 70 request(s)
   - id: responder|query:ts
     fix: http.req.queryParams.ts -> constant
...
```

Accepting them:

```text
✔ Accepted all open recommendations: 4 filter-scoped chain(s) written into blueprint(s) responder Mocks, my-app Mocks.

Projected match rate: 93% (993/1063) -> 100% (1063/1063)
```

Each run:

| Run | Mock match rate | Passthrough | Reads exact only in recorded order |
| --- | --- | --- | --- |
| Before any fix | 93% (993/1063) | 70 | 122 |
| Fixes accepted, 1 user | 100% (1063/1063) | 0 | 0 |
| Fixes accepted, 4 users | 100% (4252/4252) | 0 | 0 |

With the mocks fixed, replay accuracy, the share of replayed responses that match the recording, is 100% (135/135).

The skill's `### Result` block. Trimmed:

```text
### Result
- **Outcome:** pass. Matched calls went from 93% to 100% measured, with 0 calls forwarded to the real services and every SQL read served its own row
- **Numbers:** matched before the fixes 93% (993/1,063, 70 forwarded); predicted after the fixes 100%; measured 100% (1,063/1,063) and 100% at 4 users (4,252/4,252); SQL reads relying on recorded order 122 → 0; accuracy 100%
- **Artifacts:** mock-lab/tutorial/go/proxymock/recorded-baseline/blueprints/ (2 blueprints, 4 fixes); checkpoints proxymock/tuning/checkpoints/0/ and 1/; ...
```

Your blueprint file names differ.

## If it goes wrong

- **Calls to some CNCF paths still pass through after the `ts` fix.** proxymock before 2.5.1117 scoped the fix to the paths that missed in the analyzed run. Upgrade proxymock (chapter 1), or re-run the replay and accept the recommendation again.
- **The SQL correctness line has no "only in recorded order" count, and no SQL fix is recommended.** proxymock before the release that adds it only recommends SQL keys after it sees a read get another order's row. Replay with `--vus 4` and run the analysis again: the reads then show as bind drift with the same three recommendations.
- **The mock does not answer Postgres.** Start `proxymock mock` with the same `--map` the recording used. Without it, Postgres is not mocked.

See [Improve mock match rate with AI](../guides/mock-match-rate.md) for how the analysis and recommendations work, and [Create and verify blueprints](../guides/blueprints.md) for where the fixes are stored.

<details>
<summary>Manual equivalent</summary>

Commands from the Go app. For another language, use its start command from [chapter 2](./run-the-demo-app.md) after `--`.

```bash
cd mock-lab/tutorial/go

# Terminal 1: the app with the CNCF API and Postgres mocked
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock mock --in proxymock/recorded-baseline \
  --map 15432=postgres://localhost:5432 --app-health-endpoint /healthz -- go run .

# Terminal 2: replay the recorded inbound traffic at the app
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080

# Find and fix the misses and order-dependent reads
proxymock match-rate analyze
proxymock match-rate accept --all

# Restart the mock, then replay in order and with 4 users
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080
proxymock replay --in proxymock/recorded-baseline --test-against http://localhost:8080 --vus 4

# Score a run: replay accuracy and measured match rate
proxymock replay score proxymock/results/<replayed-run>
```

</details>

## Next

[Chapter 5: Tune the tests](./tune-the-tests.md)
