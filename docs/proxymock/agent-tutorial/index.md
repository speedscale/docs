---
title: "Agent tutorial: start here"
description: "A hands-on tutorial where your coding agent records a demo service with proxymock, tunes its mocks and tests, and runs a regression test and a performance test, one pasted prompt per chapter."
sidebar_position: 1
sidebar_label: "Start here"
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

- In Claude Code, adds the `speedscale/skills` plugin marketplace and installs the `speedscale@speedscale-skills` plugin. The agent cannot type `/plugin` itself, so it runs the same steps with the `claude plugin` command. It installs for your user account, which makes the skills available in every project, or at project scope, which records the plugin in `.claude/settings.json` in the current directory.
- In other agents, runs `npx skills add speedscale/skills`. Cursor installs the skills into `.agents/skills/` in the current directory.
- Lists the installed skills and what each is for.

## What you should see

The 15 skills and what each is for. Each agent words and groups the list in its own way, as a table or a list by task. Trimmed:

```text
I installed the Speedscale plugin. Your session can't run /plugin commands directly, so I used the claude plugin command line instead:

- claude plugin marketplace add speedscale/skills added the speedscale-skills marketplace.
- claude plugin install speedscale@speedscale-skills installed version 0.1.0 for your user account.

The skills won't appear in this session yet. Run /reload-plugins or start a new session to load them.

The 15 installed skills
- install-speedscale: Sets up proxymock on this machine, including its connection to your coding agent ...
- quality-loop: The starting point. It points you to the right skill for what you want to do ...
- record-traffic: Records a service's real traffic, both inbound requests and its calls to HTTP APIs and databases ...
- improve-mock-match-rate: Tunes the mocks so more of the app's outbound calls are answered from recorded traffic ...
- tune-snapshot-replay: Repeatedly re-runs a replay, changing one thing at a time, until it's accurate ...
- proxymock-regression-test: Replays a recording against your app with its dependencies mocked ...
...
```

This chapter installs the skills but does not run one, so it has no `### Result` block. From chapter 1 on, every chapter runs a skill, and its answer ends with one.

The [agent skills](../how-it-works/agent-skills.md) page describes every skill.

## If it goes wrong

- **The skills are not available yet.** Claude Code loads a newly installed plugin after a reload. Run `/reload-plugins`, or exit and start the agent again in the same directory (`claude --continue` keeps the conversation).
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
