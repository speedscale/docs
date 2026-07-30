---
title: Improve Mock Match Rate with AI
description: "Use the improve-mock-match-rate skill and the proxymock MCP tuning tools to find why replayed requests miss their mocks and fix them until the match rate is 100%."
sidebar_position: 8
---

# Improve Mock Match Rate with AI

A mock **miss** means your app made an outbound request that no recorded mock could answer. The usual culprits are values that change on every run — a UUID in the URL path, a timestamp or nonce in the body, a trace header — so the replayed request's signature never matches what was recorded.

proxymock ships an AI-agent workflow that fixes this automatically: the **`improve-mock-match-rate` skill** drives four MCP tools in a loop — measure the match rate, group the misses by the fix that would collapse them, accept filter-scoped fixes into the workspace's tuning blueprint, and re-measure — until the projected match rate is as high as it can get. Everything runs offline from RRPair files; no replay is needed between iterations.

This guide walks the loop end to end using [mock-lab](https://github.com/speedscale/mock-lab) as the demo app.

Prefer a script, or gating the match rate in CI? [Tune a Replay Locally](./replay-tuning.md) covers the `proxymock-replay-tuning` CLI: it measures HIT/MISS/PASSTHROUGH and fails a build below a threshold, no AI agent required.

## How it works

The mock server matches each outbound request's **signature** (method, host, URL, query params, body fields) against the recording, after applying the workspace's transform chains (the *tuning blueprint*). A fix is one transform scoped by a filter — e.g. "on `POST /v1/track/{id}`, wildcard the rotating path segment" — written into that blueprint.

Two rates matter, over the same set of outbound requests:

- **Report match rate** — the HIT/MISS verdicts recorded when the traffic actually ran. It never changes offline.
- **Projected match rate** — what the *next* run would score with the current blueprint applied. It starts at the report rate and climbs as fixes are accepted, using the same matching engine the mock server runs — so the projection is trustworthy.

The agent iterates against the projection and you re-run the replay once at the end to confirm.

## Before you begin

- `proxymock` [installed](../getting-started/quickstart/quickstart-cli.md) and initialized (`proxymock init --api-key <key>`)
- The proxymock MCP server installed for your AI agent: `proxymock mcp install`. For Claude Code this also installs the `improve-mock-match-rate` skill, so `/improve-mock-match-rate` is available as a slash command; other MCP clients get the same workflow as the `improve_mock_match_rate` prompt.
- `git` and Go, for the mock-lab example

## 1. Record traffic with a rotating value

Clone mock-lab and record the Go app with its telemetry beacon enabled. On every API request the beacon fires a few outbound calls whose ids rotate on every run — exactly what breaks mock matching in real systems:

- `POST /v1/track/{event_id}` — a fresh UUID in the path, a timestamp in the body;
- `POST /v1/track/{ulid}?ts=&sid=&oid=&u7=&xid=&ksuid=` — a ULID path segment plus a bare epoch, Snowflake, Mongo ObjectId, UUIDv7, xid, and KSUID as query params (a spread of rotating id encodings);
- `POST /graphql` — a rotating `variables.id` with a fixed `query`/`operationName`.

```shell
git clone https://github.com/speedscale/mock-lab.git
cd mock-lab/go
EMIT_TELEMETRY=1 proxymock record -- go run .
```

In a second terminal, drive some traffic through the app, then stop the recording with `Ctrl-C`:

```shell
for p in / /api/projects /api/categories /api/stats /api/projects/kubernetes; do
  curl -s -o /dev/null "http://localhost:4143$p"
done
```

The recording lands in `proxymock/recorded-<timestamp>/` — real API calls plus one beacon per request, each with a different event id.

## 2. Mock and replay: watch the misses happen

Run the app against the mock built from that recording, and replay the recorded tests at it. The beacon generates *new* UUIDs this run, so those requests cannot match. Both terminals run from `mock-lab/go`:

```shell
# terminal 1 — app with the downstream mocked (fail closed so misses are visible)
EMIT_TELEMETRY=1 proxymock mock --no-passthrough -- go run .

# terminal 2 — replay the recorded inbound tests at the app
proxymock replay --test-against http://localhost:8080
```

Stop the mock with `Ctrl-C`. The mock server wrote everything it observed — with a HIT or MISS verdict per request — to `proxymock/results/mocked-<timestamp>/`.

## 3. Let the agent tune it

In your AI agent, from the `mock-lab/go` directory:

```text
/improve-mock-match-rate
```

or in any MCP client: *"improve the mock match rate in this workspace"*. The agent runs the `mocks` tool with `action=analyze`, which finds the two runs on its own (the recording is the mock source, the mock output is the request source) and reports:

```text
Report match rate:    ~40% — recorded verdicts
Projected match rate: ~40% — with 0 active blueprint(s) applied

Recommendation groups (impact-sorted):

1. POST /v1/track/{UUID} — service responder, N request(s)
   - responder|url:/v1/track/*    fix: URL id segment -> constant
   - responder|body:ts            fix: ts -> constant
   - responder|query:ts           fix: ts · query -> constant
   - responder|query:sid          fix: sid · query -> constant
   - responder|query:oid          fix: oid · query -> constant
   - responder|query:u7           fix: u7 · query -> constant
   - responder|query:xid          fix: xid · query -> constant
   - responder|query:ksuid        fix: ksuid · query -> constant
2. POST /graphql — service responder, N request(s)
   - responder|body:variables.id  fix: variables.id -> constant
```

The analyzer groups the misses by endpoint and recommends one fix per rotating value. On `/v1/track` it wildcards the rotating path segment and masks the body timestamp plus each time-anchored query id — the epoch, Snowflake, ObjectId, UUIDv7, xid, and KSUID are recognized because each embeds a timestamp that lands inside the recording's own capture window. On `/graphql` it masks only the rotating `variables.id` and leaves the `query`/`operationName` that identify the operation untouched. The agent accepts them with `mocks` `action=accept`:

```text
Accepted all open recommendations: N filter-scoped chain(s) written into blueprint(s) responder Mocks.

Projected match rate: ~40% -> 100%.
```

Exact totals scale with how much traffic you drive; the shape — one group per endpoint, one fix per rotating value — is what matters.

For ambiguous misses the agent digs deeper with `mocks` `action=similar`, which ranks a miss against the nearest recorded signatures and classifies each drifting field's cause (datetime, epoch, uuid, uuidv7, ulid, ksuid, xid, snowflake, objectid, jwt, trace-id, pii, opaque). The skill's playbook uses those causes to choose safely — e.g. a PII-classified lookup key gets `smart_replace_recorded` instead of a blind mask, and anything auth-shaped is surfaced to you rather than auto-accepted.

## 4. Confirm with a real run

The accepted fixes live in `proxymock/blueprints/` and the mock server applies them automatically. Re-run step 2 and every request now matches:

```shell
grep -rho '"match":"[A-Z_]*"' proxymock/results/mocked-<newest>/ | sort | uniq -c
#   N "match":"HIT"   (every request a HIT, zero MISS)
```

## Tuning a cloud replay report

The same loop works on Speedscale Cloud replay reports. Give the agent a report id and the `pull_report` tool materializes both analysis sides — the report's RRPairs (with their recorded verdicts) and the source snapshot — into a local workspace:

```text
/improve-mock-match-rate report c54ae6fc-947a-4991-a9c1-4d7c32e00b9a
```

The agent pulls, analyzes, accepts fixes, and iterates exactly as above. When it's done, `snapshot` (`action=push`) syncs the tuned blueprint back to the cloud so the next in-cluster replay uses it.

## The tools

| Tool | Role |
| --- | --- |
| `pull_report` | Pull a cloud replay report and its source snapshot into a local workspace |
| `mocks` (`action=analyze`) | Report + projected match rates, recommendation groups with accept ids, drift summary |
| `mocks` (`action=accept` / `action=undo`) | Accept or undo a fix by id (or `all=true`); reports the rate movement inline |
| `mocks` (`action=similar`) | Per-miss deep dive: nearest recorded signatures and per-field drift causes |
| `snapshot` (`action=push`) | Sync the tuned blueprint back to the cloud with the traffic |

The standalone `analyze_mock_matches`, `accept_mock_recommendation`, and `similar_candidates` tools this loop shipped with have been removed — use `mocks` with the matching action.

See the [MCP Tools & Prompts Reference](../how-it-works/mcp-tools.md) for full parameter documentation, and the [Replay Tuning guide](replay-tuning.md) for the script-based variant of this workflow.

## From the command line

Every step the agent runs through the `mocks` tool is also a `proxymock match-rate` verb, over the same workspace and the same blueprints. The analysis and the ids are identical, so you can drive the loop by hand or wire it into a script when you would rather not involve an agent:

```shell
# report the match rate and list fixes (add -o json to script it)
proxymock match-rate analyze

# accept one fix by id, or accept everything the analyzer found
proxymock match-rate accept --id 'responder|url:/v1/track/*'
proxymock match-rate accept --all

# undo a fix, or deep-dive one projected miss
proxymock match-rate undo --id 'responder|url:/v1/track/*'
proxymock match-rate similar --id proxymock/report-.../responder/abc123.md
```

`accept` writes the same filter-scoped transforms into the workspace's tuning blueprint that the agent would, and `--transform` lets you override the recommended fix for one id (for example `--transform constant`). When the workspace came from a cloud report, `proxymock cloud pull report <id>` materializes both analysis sides first, exactly as `pull_report` does for the agent. The full flag list is in the [CLI reference](/reference/proxymock-cli-reference.md#match-rate).

## Good to know

- Fixes are **blueprint-only** — no RRPair files are rewritten, and every accept can be undone.
- Each fix is **scoped by a filter** (the group's endpoint), so a wildcard on one rotating route can't collapse unrelated endpoints into false matches.
- Fixes using `smart_replace_recorded` can't be credited by the offline projection (they need recorded data at replay time) — the agent notes them for the confirming run instead of churning.
- A value that a **prior response** issued — a pagination cursor, a freshly-created id, an issued token — is surfaced as a **correlate** recommendation: *bind* it (carry the value from the response into the later request), don't mask it, because masking a cursor collapses every page onto page 1. mock-lab's `GET /v1/feed` cursor flow shows this when the app runs against the lab reference server (`DOWNSTREAM_URL=http://localhost:8090` pointed at `../lab/server`); `accept all` masks the volatile values and leaves correlations for you to review.
- An endpoint the recording answered with **more than one response** for the *same* request — a poll that goes pending→done, or a growing collection — is called out under **Stateful endpoints**. A mock matches on the request signature, so it can only replay the first recorded response and the client would freeze on the stale one. This is a warning, not a fix: no masking helps, because the request itself doesn't change; the endpoint needs a *sequenced* mock. mock-lab's `GET /v1/job/status` (against the lab reference server) shows this — its `status` cycles while the request stays identical.
- A rotating id in a URL path that was **created earlier in the session** — issued by a `POST`/`PUT`/`PATCH` response (a `Location` header or a body id) and then used in a later request's path — is called out under **Created ids** (a CREATE→USE list) and is *not* offered a wildcard. Wildcarding `/orders/*` would match ids the mock never issued; at mock time the client reuses the id the mock returned, so the request matches on its own. mock-lab's `POST /v1/orders` → `GET /v1/orders/{id}` flow shows this against the lab reference server.
- Auth and session correlations — an OAuth token, a rotated session cookie, a CSRF double-submit, an `ETag`→`If-None-Match` — are collected under **Credentials & session**. These ride in headers, which are *outside* the mock signature, so they never cause a mock miss and get no fix here; but the credential-carrying ones authenticate the caller, so a *validating* replay must correlate them — the advisory flags those for review and points at credential setup. mock-lab's `POST /v1/auth/token` → `GET /v1/me` (bearer + session cookie) flow shows this against the lab reference server.
- Response fields that vary across *identical* requests but are just noise — a timestamp, a server-issued id, a rate-limit counter — are separated out as **volatile response fields** (a NOISE list) rather than making the endpoint look stateful. They're found by observation, not a format rule, so app-specific noise is caught too; a mock ignores them, but they're worth knowing for response-diff / assertion tuning. mock-lab's `GET /v1/job/status` carries a rotating `checkedAt` alongside its real `status`, and `GET /v1/time` returns only a rotating `now` — the first stays stateful with `checkedAt` flagged noise, the second isn't flagged at all.
- A projected 100% is a projection. The confirming replay in step 4 is the real result; in this demo they agree exactly.
