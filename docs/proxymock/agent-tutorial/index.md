---
title: "Agent tutorial: start here"
description: "A hands-on tutorial where your coding agent records a demo service with proxymock, tunes its mocks and tests, and runs a regression test and a performance test, one pasted prompt per chapter."
sidebar_position: 1
unlisted: true
---

# Agent tutorial: start here

In this tutorial your coding agent does every step. You paste one prompt per chapter, the agent runs it with the Speedscale [agent skills](../how-it-works/agent-skills.md) and proxymock, and you read what it found.

Time: about 25 minutes of agent work for all nine chapters. This chapter takes under a minute.

## What you build

The demo app is the tutorial orders service in [speedscale/mock-lab](https://github.com/speedscale/mock-lab/tree/main/tutorial). It is a small CNCF swag shop: an HTTP API that prices orders by looking up CNCF projects on a hosted API and stores them in Postgres. It is written in Go, Java, Python and Node.js, and all four behave the same, so pick the language you know.

By the end you have:

- A recording of the app's inbound requests, its calls to the CNCF API and its Postgres queries.
- Mocks that answer every outbound call, including SQL reads that get the rows that belong to them.
- A test config that ignores the fields that change on every run.
- A regression test that catches a changed response type, and a performance test that finds an N+1 query.
- The same loop run on a second service, standing in for your own.

The app has these problems planted on purpose. Each chapter's skill finds one.

| Chapter | What the agent finds |
| --- | --- |
| [4. Tune the mocks](./tune-the-mocks.md) | A `ts` query parameter that changes on every CNCF API call, and SQL reads that only get their own row while requests arrive in recorded order |
| [5. Tune the tests](./tune-the-tests.md) | `generated_at` in every response and the new order `id`, which change on every run |
| [6. Run a regression test](./regression-test.md) | `APP_VERSION=v2` returns `total_cents` as a string instead of a number |
| [7. Run a performance test](./performance-test.md) | `APP_SLOW=1` makes `GET /orders` run one query per order |

## Prerequisites

- **Docker** with Compose, for the app's Postgres. On macOS and Windows, start Docker Desktop.
- **Your language's toolchain**: Go 1.25 or newer, JDK 21 or newer, Python 3.11 or newer, or Node.js 22.21 or newer.
- **A coding agent** that can run shell commands, such as Claude Code or Cursor.
- **A free Speedscale account**, for the API key that proxymock needs. Sign up at [app.speedscale.com/proxymock/signup](https://app.speedscale.com/proxymock/signup).
- **Windows**: use WSL2 and run your agent inside it.

Start your agent in an empty directory and paste the prompts in order, in one conversation. The agent clones mock-lab into that directory and writes everything under it.

## Prompt: install the skills

```text
Install the Speedscale agent skills from https://github.com/speedscale/skills. If you are Claude Code, run `/plugin marketplace add speedscale/skills` and then `/plugin install speedscale@speedscale-skills`. Otherwise run `npx skills add speedscale/skills`. If neither works, download every folder under skills/ in that repo into your skills directory. Then list the skills you installed and what each is for.
```

## What the agent does

- In Claude Code, adds the `speedscale/skills` plugin marketplace and installs the `speedscale@speedscale-skills` plugin. When the agent cannot type `/plugin` itself, it runs the same steps with the `claude plugin` command, and can install at project scope, which records the plugin in `.claude/settings.json` in the current directory.
- In other agents, runs `npx skills add speedscale/skills`. Cursor installs the skills into `.agents/skills/` in the current directory.
- Lists the installed skills and what each is for.

## What you should see

A table of the skills. Trimmed:

```text
Installed skills (plugin `speedscale` v0.1.0, 15 skills):

| Skill                       | What it's for                                                        |
|-----------------------------|----------------------------------------------------------------------|
| quality-loop                | The starting point for testing a service with recorded traffic. ... |
| install-speedscale          | Installs proxymock locally, including its MCP server and the skills. |
| tune-snapshot-replay        | A repeating loop that makes the replayed tests accurate ...          |
| improve-mock-match-rate     | Fixes NO_MATCH, passthrough and low match rates in mocks ...        |
| proxymock-regression-test   | Replays a recording against the app with its dependencies mocked ... |
| proxymock-load-test         | A quick load test: replays recorded traffic with parallel virtual users ... |
...
```

The [agent skills](../how-it-works/agent-skills.md) page describes every skill.

## If it goes wrong

- **The skills are not available yet.** Claude Code loads a newly installed plugin in the next session. Exit and start the agent again in the same directory (`claude --continue` keeps the conversation).
- **The list includes `proxymock-replay-tuning`.** That skill was folded into `improve-mock-match-rate`, and your skills are an older copy. Install them again to pick up the current set.

<details>
<summary>Manual equivalent</summary>

In Claude Code:

```text
/plugin marketplace add speedscale/skills
/plugin install speedscale@speedscale-skills
```

From a shell, for Claude Code:

```bash
claude plugin marketplace add speedscale/skills --scope project
claude plugin install speedscale@speedscale-skills --scope project
```

For other agents:

```bash
npx skills add speedscale/skills
```

</details>

## Next

[Chapter 1: Install proxymock](./install-proxymock.md)
