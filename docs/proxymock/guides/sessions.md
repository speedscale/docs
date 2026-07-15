---
title: Explore and Replay Sessions Locally
description: "Group recorded traffic by actor in proxymock web, walk each user's journey, export one session as a standalone snapshot, and replay it back against your app — with the mock-lab demo, entirely on your desktop."
sidebar_position: 12
---

# Explore and Replay Sessions Locally

A recording is a flat pile of requests. But the traffic was made by *actors* — a
user logging in and placing an order, a service authenticating and calling three
downstreams. The **Sessions** tab in proxymock web reassembles that flat pile
into per-actor journeys so you can see who did what, in what order, and how long
it took — then export any one actor's traffic as a standalone, replayable
snapshot.

This guide runs the whole loop locally with the open-source
[mock-lab](https://github.com/speedscale/mock-lab) demo:

1. **Record** the demo so there is traffic to group.
2. **Explore** the Sessions tab — Actors, per-actor journeys, and Flows.
3. **Check replay readiness** — can each session replay as a distinct identity?
4. **Create a snapshot** of one actor from the drill-in drawer.
5. **Replay** that snapshot back against the app.
6. **Verify** the replay preserved distinct identities.

## Prerequisites

- proxymock installed and an API key configured — see
  [Installation](/proxymock/getting-started/installation.md) and
  [Initialize API Key](/proxymock/guides/initialize.md).
- Git and Go (to run the demo).
- Two terminals: one for the app, one for the test driver.

## Step 1: Record the demo {#record}

Clone mock-lab and start recording its Go demo app. `proxymock record` runs the
app as a child process, listens on port `4143` for inbound traffic, and records
the app's outbound calls on `4140`.

```shell title="Terminal 1 — record"
git clone https://github.com/speedscale/mock-lab && cd mock-lab/go
proxymock record -- go run .
```

The demo's OAuth flow mints a **fresh bearer token and a rotated `SESSIONID`
cookie on every run**, then reuses them on the order endpoints — so each pass of
the test driver is a self-contained login-and-use session. Drive it a few times
so you have **several distinct actors** to explore, not just one:

```shell title="Terminal 2 — drive traffic (run it 3×)"
# from the mock-lab repo root
./lab/tests/run_tests.sh --recording
./lab/tests/run_tests.sh --recording
./lab/tests/run_tests.sh --recording
```

Press `Ctrl-C` in Terminal 1 to stop recording. You now have a `recorded-*`
directory under `mock-lab/go/proxymock/`.

:::tip Skip the recording
mock-lab ships a committed recording at `lab/proxymock/recording` if you would
rather jump straight to exploring. Point proxymock web at that directory instead.
:::

## Step 2: Open the Sessions tab {#sessions-tab}

Start proxymock web and open the printed URL:

```shell
proxymock web
```

In the **Run** selector at the top, choose the `recorded-*` run you just
captured. Then click **⊚ Sessions** in the left nav.

The Sessions tab opens on the **Actors** view. Two KPIs sit at the top:

- **Session SLO · zero-error journeys** — the share of sessions that completed
  with no errors.
- **Actors** — how many distinct sessions were found in this run.

Below them, each row is one actor: its session id, request volume, distinct
endpoints, latency percentiles, error rate, and its share of total traffic.

:::note "— unattributed —" rows
Traffic proxymock could not tie to an actor lands in an **unattributed** row.
That is expected for pure read traffic with no credential. The login-and-order
flow you recorded *is* attributable, so you should see it grouped as its own
actor(s). If everything is unattributed, use **Replay readiness → Tag** (Step 4)
to key sessions on the credential.
:::

### Walk one actor's journey

Click an actor row. The bottom drawer opens a **request waterfall** for that
session — every request in journey order, each bar placed by its start offset
and sized by latency, with think-time gaps between steps. This is the
login → create order → read order sequence laid out in time.

- **Copy as Mermaid** turns the journey into a sequence diagram you can paste
  into a doc or PR.
- Click any step to open its full request/response detail, the same as the
  Requests grid.

## Step 3: See cross-session flows {#flows}

Switch the toggle to **Flows**. Where Actors shows one journey at a time, Flows
mines *all* sessions together: the common paths through your API, a funnel with
drop-off at each step, and a Sankey of how traffic moves from endpoint to
endpoint. Use it to answer "what does a typical session actually do?" across the
whole run.

## Step 4: Check replay readiness {#readiness}

Switch the toggle to **Replay readiness**. Replaying a recording naively reuses
one recorded identity for everyone. To replay sessions as *distinct* actors,
proxymock first has to re-establish each session's credential at replay time.
This view classifies that for you:

- **Recorded sessions** / **Ready to uniquify** / **Flagged · needs action** /
  **Planned replay slots** across the top.
- A table mapping each recorded session to its **credential class** and the
  **replay identity** (`session-0`, `session-1`, …) it will be assigned from the
  baked cast list.

The credential class determines how the identity is re-minted on replay:

| Class | What it means | Action |
| --- | --- | --- |
| **Re-signable JWT** | A JWT bearer whose claims can be re-signed per identity. | **Accept → blueprint** wires a `jwt_resign` chain automatically. |
| **Credential set** | HTTP Basic — swap one set of credentials for another. | See [Swap Credentials](/proxymock/guides/credentials-swap.md). |
| **Login preflight** | An opaque bearer or cookie with no derivable identity — it must be re-fetched by logging in. | Flagged for a login preflight. |

The mock-lab demo issues an **opaque bearer plus a rotating `SESSIONID`
cookie** — there is no signed claim to rewrite — so it classifies as a
**login preflight** and is flagged for manual action. That is the honest,
correct call for this app; the [Recommendations](/proxymock/guides/recommendations.md)
guide shows how to correlate the freshly-minted token forward on replay.

:::tip When your app uses JWTs
If your own recordings carry JWT bearers, the **inspect** button next to a
session decodes its claims, and **Tag by this** re-groups every session on the
claim you pick (for example `sub`) — so actors line up on real user identity
instead of on a rotating token. Accepting the re-signable-JWT recommendation
then mints a distinct signed identity per replay slot with one click.
:::

## Step 5: Create a session snapshot {#snapshot}

Now export a single actor's traffic as its own replayable recording.

Go back to the **Actors** view and click an actor row to open its drawer. In the
drawer header, click **Create snapshot**.

proxymock writes a new run directory named **`session-<id>`** into your
workspace, containing **only** the RRPairs tagged with that session, grouped by
host exactly like a normal recording. The button reports how many pairs it wrote
(`Saved 8 → session-…`).

Because it is a normal run directory, it shows up in the **Run** selector like
any other recording — select it and the whole Sessions tab now scopes to that
one actor.

```shell title="On disk, next to your recordings"
mock-lab/go/proxymock/
├── recorded-2026-07-15_…Z/     # the full recording
└── session-<id>/               # just this actor, ready to replay
    └── localhost/
        └── <uuid>.json
```

:::note Re-exporting replaces
Creating a snapshot for the same session again fully replaces the directory, so
it always reflects that actor's *current* members (handy after you tag or
regroup sessions).
:::

## Step 6: Replay the snapshot {#replay}

Replay the one actor you just exported back against the running app. Start the
app on its normal port, then point `proxymock replay` at the snapshot directory
with `--in`:

```shell title="Terminal 1 — run the app"
cd mock-lab/go && go run .
```

```shell title="Terminal 2 — replay just this session"
proxymock replay --in ./proxymock/session-<id> --test-against http://localhost:8080
```

proxymock re-issues that session's recorded requests in order and prints a
latency/throughput summary. Because the snapshot is a single actor, this is a
focused reproduction of exactly one user's path — useful for debugging one
customer's flow or building a minimal regression.

To replay *many* distinct actors in parallel instead — the unique-session replay
the readiness view plans — point replay at the full recording and add virtual
users; each VU takes its own identity slot from the baked cast list:

```shell title="Replay every session as its own actor"
proxymock replay --test-against http://localhost:8080 --vus 10
```

## Step 7: Verify distinct identities {#verify}

After a session-mode replay, open proxymock web, select the **replay run** in the
Run selector, go to **Sessions → Verification**.

The headline asserts the thing that matters for multi-actor replay: **distinct
identities / verified sessions** — did the app under test observe as many unique
actors as there were sessions? A green check means uniquification took; a red ✕
means identities collided. The KPI cards below (Sessions replayed, Requests
passed/failed, Flagged) double as filters over the per-session result table.

## How it works {#how-it-works}

- **Grouping is field-only.** proxymock groups by each RRPair's session field. On
  load it fills that field the same way every other part of the stack does, and a
  session-tagging blueprint (from **Tag** or an accepted recommendation) always
  wins — so what you see locally is what the forwarder would tag in-cluster.
- **A snapshot is just a run.** `session-<id>` is an ordinary directory of RRPair
  files, so every tool that reads a recording — replay, export, the Requests grid
  — works on it unchanged.
- **Session ids are made filesystem-safe.** Emails and client ids pass through
  as-is; long or unusual ids (like a raw JWT) get a stable hash suffix so distinct
  sessions never collide onto the same directory.

## Next steps

- [Fix Replay Failures with Recommendations](/proxymock/guides/recommendations.md)
  — correlate the demo's rotating token forward so its session replays cleanly.
- [Swap Credentials](/proxymock/guides/credentials-swap.md) — the credential-set
  path for HTTP Basic auth.
- [Trace a request without traces](/proxymock/guides/trace-without-traces.md) —
  follow one identifier across every service, no OpenTelemetry required.
- [Tune a Replay Locally](/proxymock/guides/replay-tuning.md) — measure and close
  replay misses with the same mock-lab demo.
