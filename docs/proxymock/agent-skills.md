---
title: Agent skills
description: "The agent skills Speedscale publishes for AI coding agents, what each one is for, and a prompt that installs them all."
sidebar_position: 6.5
---

# Agent skills

Speedscale publishes agent skills that teach an AI coding agent (Claude Code, Cursor, Codex, Gemini CLI, OpenCode, Kiro, or any agent that can read a URL) how to install, run, tune, and test with Speedscale and proxymock.

Every skill ships inside proxymock and is mirrored to the [speedscale/skills](https://github.com/speedscale/skills) repository on each proxymock release, so both always match. This page lists what each one is for. Follow a skill's link for its full instructions.

The local skills need [proxymock](./getting-started/installation.md) installed. Cloud replays also need a Speedscale account.

## Install the skills

Paste this prompt into your coding agent:

```text
Install the Speedscale agent skills from https://github.com/speedscale/skills. If you are Claude Code, run `/plugin marketplace add speedscale/skills` and then `/plugin install speedscale@speedscale-skills`. Otherwise run `npx skills add speedscale/skills`. If neither works, download every folder under skills/ in that repo into your skills directory. Then list the skills you installed and what each is for.
```

If you already have proxymock, `proxymock mcp install --yes` installs every skill for Claude Code, and `proxymock mcp skills export --dir <your agent's skills directory>` installs them for any other agent. `proxymock mcp skills list` shows which are installed and whether they are current.

If you use the ChatGPT desktop app with Codex, follow the [ChatGPT section of the skills README](https://github.com/speedscale/skills#chatgpt-desktop-app).

## Set up

| Skill | Use it to |
| --- | --- |
| [install-speedscale](https://github.com/speedscale/skills/tree/main/skills/install-speedscale) | Install the `speedctl` and `proxymock` CLIs and the Speedscale Operator, set up your API key, verify the install, and connect the proxymock MCP server to your agent. It also handles upgrades, repairs, and uninstalls. |

## Run and tune replays

These skills work with Speedscale cloud snapshots and with local proxymock recordings.

| Skill | Use it to |
| --- | --- |
| [run-snapshot-replay](https://github.com/speedscale/skills/tree/main/skills/run-snapshot-replay) | Run a snapshot or recording as a replay where it was recorded, on your machine, in a cluster through your kubeconfig, or through Speedscale cloud, and follow it to a result. In a cluster it runs as a regression check or a load test with a test config's goals. |
| [tune-snapshot-replay](https://github.com/speedscale/skills/tree/main/skills/tune-snapshot-replay) | Tune the tests: loop on a replay until its responses are accurate, changing one thing per run (test config assertions, volatile fields, ids created during the session) and keeping or reverting it. Mock problems go to `improve-mock-match-rate`. |
| [analyze-replay-report](https://github.com/speedscale/skills/tree/main/skills/analyze-replay-report) | Explain a cloud report or a local replay run: why it passed or failed, the first failing response, and what to do next. |
| [improve-mock-match-rate](https://github.com/speedscale/skills/tree/main/skills/improve-mock-match-rate) | Tune the mocks for any technology (HTTP, SQL, Redis, Kafka, gRPC, and so on). It applies match-rate fixes offline, can re-run the snapshot against the same workload, compares recorded with mocked traffic, and fixes each discrepancy by its kind. |

## Test with recorded traffic

These skills form the proxymock quality loop. They run locally and need no Speedscale Cloud account. Start with `quality-loop` if you are not sure which one applies.

| Skill | Use it to |
| --- | --- |
| [quality-loop](https://github.com/speedscale/skills/tree/main/skills/quality-loop) | Pick the right skill or proxymock command for a task, take a service from no recording to a first regression gate, and check that your environment is ready. |
| [record-traffic](https://github.com/speedscale/skills/tree/main/skills/record-traffic) | Record a service's inbound and outbound traffic, including its databases, by wrapping it with `proxymock record`, or record a Kubernetes workload with eBPF capture and pull the traffic into the workspace, then confirm every dependency was captured. |
| [proxymock-regression-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-regression-test) | Replay a recording at your service and fail on status or body changes against a known-good baseline. A cluster workload goes to `run-snapshot-replay` in its regression mode. |
| [proxymock-verify-fix](https://github.com/speedscale/skills/tree/main/skills/proxymock-verify-fix) | Prove a bug fix by replaying the incident traffic at the fixed build. |
| [proxymock-contract-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-contract-test) | Check traffic against an OpenAPI spec, or mock a dependency from its spec before you have a recording. |
| [proxymock-chaos-mock](https://github.com/speedscale/skills/tree/main/skills/proxymock-chaos-mock) | Make a mocked dependency return errors, slow responses, corrupt bodies, or connection faults to test retries and timeouts. |
| [proxymock-load-test](https://github.com/speedscale/skills/tree/main/skills/proxymock-load-test) | Replay recorded traffic with parallel virtual users and report latency percentiles, throughput, and match rate. A cluster workload goes to `run-snapshot-replay` in its load mode. |
| [proxymock-perf-container](https://github.com/speedscale/skills/tree/main/skills/proxymock-perf-container) | Load-test one service with its dependencies mocked, and tell an app limit from a test harness limit. |
| [proxymock-compare-results](https://github.com/speedscale/skills/tree/main/skills/proxymock-compare-results) | Compare two replays or recordings and show what regressed, improved, or stayed the same. |
| [proxymock-summarize-recording](https://github.com/speedscale/skills/tree/main/skills/proxymock-summarize-recording) | Summarize a recording: hosts, endpoints, methods, status codes, and volume. |

## Removed skills

- `proxymock-replay-tuning` was folded into `improve-mock-match-rate`. If your agent still lists it, install the skills again to pick up the current set.

## Related

`install-speedscale` connects the proxymock MCP server to your agent. See [Model Context Protocol (MCP)](./how-it-works/mcp.md) for how that server works.
