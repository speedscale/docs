---
title: Agent skills
description: "The agent skills Speedscale publishes for AI coding agents, what each one is for, and a prompt that installs them all."
sidebar_position: 6.5
---

# Agent skills

Speedscale publishes agent skills that teach an AI coding agent (Claude Code, Cursor, Codex, Gemini CLI, OpenCode, Kiro, or any agent that can read a URL) how to install, run, tune, and test with Speedscale and proxymock.

The skills live in the [speedscale/skills](https://github.com/speedscale/skills) repository. This page lists what each one is for. Follow a skill's link for its full instructions.

The local skills need [proxymock](../getting-started/installation.md) installed. Cloud replays also need a Speedscale account.

## Install the skills

Paste this prompt into your coding agent:

```text
Install the Speedscale agent skills from https://github.com/speedscale/skills. If you are Claude Code, run `/plugin marketplace add speedscale/skills` and then `/plugin install speedscale@speedscale-skills`. Otherwise run `npx skills add speedscale/skills`. If neither works, download every folder under skills/ in that repo into your skills directory. Then list the skills you installed and what each is for.
```

If you already have proxymock, `proxymock mcp install --yes` installs `install-speedscale` and `improve-mock-match-rate` for Claude Code.

If you use the ChatGPT desktop app with Codex, follow the [ChatGPT section of the skills README](https://github.com/speedscale/skills#chatgpt-desktop-app).

## Set up

| Skill | Use it to |
| --- | --- |
| [install-speedscale](https://github.com/speedscale/skills/tree/main/skills/install-speedscale) | Install the `speedctl` and `proxymock` CLIs and the Speedscale Operator, set up your API key, verify the install, and connect the proxymock MCP server to your agent. It also handles upgrades, repairs, and uninstalls. |

## Run and tune replays

These skills work with Speedscale cloud snapshots and with local proxymock recordings.

| Skill | Use it to |
| --- | --- |
| [run-snapshot-replay](https://github.com/speedscale/skills/tree/main/skills/run-snapshot-replay) | Run a snapshot or recording as a replay where it was recorded, in a cluster or on your machine, and follow it to a result. |
| [tune-snapshot-replay](https://github.com/speedscale/skills/tree/main/skills/tune-snapshot-replay) | Loop on a replay until it is accurate: re-run, measure, change one thing, then keep or revert the change. |
| [analyze-replay-report](https://github.com/speedscale/skills/tree/main/skills/analyze-replay-report) | Explain a cloud report or a local replay run: why it passed or failed, the first failing response, and what to do next. |
| [improve-mock-match-rate](https://github.com/speedscale/skills/tree/main/skills/improve-mock-match-rate) | Tune the mocks for any technology (HTTP, SQL, Redis, Kafka, gRPC, and so on). It applies match-rate fixes offline, can re-run the snapshot against the same workload, compares recorded with mocked traffic, and fixes each discrepancy by its kind. |

## Test with recorded traffic

These skills form the proxymock quality loop. They run locally and need no Speedscale Cloud account. Start with `quality-loop` if you are not sure which one applies.

| Skill | Use it to |
| --- | --- |
| [quality-loop](https://github.com/speedscale/skills/tree/main/skills/quality-loop) | Pick the right skill or proxymock command for a task, set up a repo with its first recording, and check that your environment is ready. |
| [proxymock-regression-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-regression-test) | Replay a recording at your service and fail on status or body changes against a known-good baseline. |
| [proxymock-verify-fix](https://github.com/speedscale/skills/tree/main/skills/proxymock-verify-fix) | Prove a bug fix by replaying the incident traffic at the fixed build. |
| [proxymock-contract-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-contract-test) | Check traffic against an OpenAPI spec, or mock a dependency from its spec before you have a recording. |
| [proxymock-chaos-mock](https://github.com/speedscale/skills/tree/main/skills/proxymock-chaos-mock) | Make a mocked dependency return errors, slow responses, corrupt bodies, or connection faults to test retries and timeouts. |
| [proxymock-load-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-load-test) | Replay recorded traffic with parallel virtual users and report latency percentiles, throughput, and match rate. |
| [proxymock-perf-container](https://github.com/speedscale/skills/tree/main/skills/proxymock-perf-container) | Load-test one service with its dependencies mocked, and tell an app limit from a test harness limit. |
| [proxymock-compare-results](https://github.com/speedscale/skills/tree/main/skills/proxymock-compare-results) | Compare two replays or recordings and show what regressed, improved, or stayed the same. |
| [proxymock-summarize-recording](https://github.com/speedscale/skills/tree/main/skills/proxymock-summarize-recording) | Summarize a recording: hosts, endpoints, methods, status codes, and volume. |
| [proxymock-replay-tuning](https://github.com/speedscale/skills/tree/main/skills/proxymock-replay-tuning) | Replay outbound requests against a local mock, report hits and misses, and find the mock signatures to adjust. |

## Related

`install-speedscale` connects the proxymock MCP server to your agent. See [Model Context Protocol (MCP)](./mcp.md) for how that server works.
