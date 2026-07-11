---
title: Improve Mock Match Rate with AI
description: "Use the improve-mock-match-rate skill and the proxymock MCP tuning tools to find why replayed requests miss their mocks and fix them until the match rate is 100%."
sidebar_position: 8
---

# Improve Mock Match Rate with AI

A mock **miss** means your app made an outbound request that no recorded mock could answer. The usual culprits are values that change on every run — a UUID in the URL path, a timestamp or nonce in the body, a trace header — so the replayed request's signature never matches what was recorded.

proxymock ships an AI-agent workflow that fixes this automatically: the **`improve-mock-match-rate` skill** drives four MCP tools in a loop — measure the match rate, group the misses by the fix that would collapse them, accept filter-scoped fixes into the workspace's tuning blueprint, and re-measure — until the projected match rate is as high as it can get. Everything runs offline from RRPair files; no replay is needed between iterations.

This guide walks the loop end to end using [mock-lab](https://github.com/speedscale/mock-lab) as the demo app.

## How it works

The mock server matches each outbound request's **signature** (method, host, URL, query params, body fields) against the recording, after applying the workspace's transform chains (the *tuning blueprint*). A fix is one transform scoped by a filter — e.g. "on `POST /v1/track/{id}`, wildcard the rotating path segment" — written into that blueprint.

Two rates matter, over the same set of outbound requests:

- **Report match rate** — the HIT/MISS verdicts recorded when the traffic actually ran. Ground truth; it never changes offline.
- **Projected match rate** — what the *next* run would score with the current blueprint applied. It starts at the report rate and climbs as fixes are accepted, using the same matching engine the mock server runs — so the projection is trustworthy.

The agent iterates against the projection and you re-run the replay once at the end to confirm.

## Before you begin

- `proxymock` [installed](../getting-started/quickstart/quickstart-cli.md) and initialized (`proxymock init --api-key <key>`)
- The proxymock MCP server installed for your AI agent: `proxymock mcp install`. For Claude Code this also installs the `improve-mock-match-rate` skill, so `/improve-mock-match-rate` is available as a slash command; other MCP clients get the same workflow as the `improve_mock_match_rate` prompt.
- `git` and Go, for the mock-lab example

## 1. Record traffic with a rotating value

Clone mock-lab and record the Go app with its telemetry beacon enabled. The beacon fires `POST /v1/track/{event_id}` downstream on every API request, with a fresh UUID in the path and a timestamp in the body — values that rotate on every run, which is exactly what breaks mock matching in real systems:

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

Run the app against the mock built from that recording, and replay the recorded tests at it. The beacon generates *new* UUIDs this run, so those requests cannot match:

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

or in any MCP client: *"improve the mock match rate in this workspace"*. The agent runs `analyze_mock_matches`, which finds the two runs on its own (the recording is the mock source, the mock output is the request source) and reports:

```text
Report match rate:    50% (5/10) — recorded verdicts
Projected match rate: 50% (5/10) — with 0 active blueprint(s) applied

Recommendation groups (impact-sorted):

1. POST /v1/track/{UUID} — service responder, 5 request(s)
   - id: responder|url:/v1/track/*
     fix: URL id segment -> constant
   - id: responder|body:ts
     fix: ts -> constant
```

The analyzer discovered the rotating-UUID family, grouped all five misses under one endpoint-scoped filter, and recommends two fixes: wildcard the rotating path segment, and mask the `ts` timestamp field. The agent accepts them with `accept_mock_recommendation`, and the response reports the movement immediately:

```text
Accepted all open recommendations: 2 filter-scoped chain(s) written into blueprint(s) responder Mocks.

Projected match rate: 50% (5/10) -> 100% (10/10).
```

For ambiguous misses the agent digs deeper with `similar_candidates`, which ranks a miss against the nearest recorded signatures and classifies each drifting field's cause (datetime, uuid, jwt, trace-id, pii, opaque). The skill's playbook uses those causes to choose safely — e.g. a PII-classified lookup key gets `smart_replace_recorded` instead of a blind mask, and anything auth-shaped is surfaced to you rather than auto-accepted.

## 4. Confirm with a real run

The accepted fixes live in `proxymock/blueprints/` and the mock server applies them automatically. Re-run step 2 and every request now matches:

```shell
grep -rho '"match":"[A-Z_]*"' proxymock/results/mocked-<newest>/ | sort | uniq -c
#   10 "match":"HIT"
```

## Tuning a cloud replay report

The same loop works on Speedscale Cloud replay reports. Give the agent a report id and the `pull_report` tool materializes both analysis sides — the report's RRPairs (with their recorded verdicts) and the source snapshot — into a local workspace:

```text
/improve-mock-match-rate report c54ae6fc-947a-4991-a9c1-4d7c32e00b9a
```

The agent pulls, analyzes, accepts fixes, and iterates exactly as above. When it's done, `push_snapshot` syncs the tuned blueprint back to the cloud so the next in-cluster replay uses it.

## The tools

| Tool | Role |
| --- | --- |
| `pull_report` | Pull a cloud replay report and its source snapshot into a local workspace |
| `analyze_mock_matches` | Report + projected match rates, recommendation groups with accept ids, drift summary |
| `accept_mock_recommendation` | Accept or undo a fix by id (or `all=true`); reports the rate movement inline |
| `similar_candidates` | Per-miss deep dive: nearest recorded signatures and per-field drift causes |

See the [MCP Tools & Prompts Reference](../how-it-works/mcp-tools.md) for full parameter documentation, and the [Replay Tuning guide](replay-tuning.md) for the script-based variant of this workflow.

## Good to know

- Fixes are **blueprint-only** — no RRPair files are rewritten, and every accept can be undone.
- Each fix is **scoped by a filter** (the group's endpoint), so a wildcard on one rotating route can't collapse unrelated endpoints into false matches.
- Fixes using `smart_replace_recorded` can't be credited by the offline projection (they need recorded data at replay time) — the agent notes them for the confirming run instead of churning.
- A projected 100% is a projection. The confirming replay in step 4 is the ground truth — in this demo they agree exactly.
