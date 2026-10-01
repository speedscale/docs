---
title: "Agent tutorial 1: install proxymock"
description: "Your coding agent installs proxymock with the install-speedscale skill, connects the proxymock MCP server, and proves that record and mock work."
sidebar_position: 2
unlisted: true
---

# Chapter 1: Install proxymock

Your agent installs proxymock, connects its MCP server to the agent, and proves that a recording can be played back from a mock.

Time: about 2 minutes, plus a browser sign-in if proxymock is new on this machine.

## Prompt

```text
Use the install-speedscale skill to install proxymock on this machine and connect it to you. I only want the local setup for now, not Kubernetes.
```

## What the agent does

The `install-speedscale` skill takes the local path and skips any step that is already done:

- Runs the skill's preflight script, a read-only report of the OS, package managers and what is already installed.
- Installs proxymock with Homebrew (`brew install speedscale/tap/proxymock`) or the install script, and adds `~/.speedscale` to your `PATH` if the script was used.
- Asks you to run `proxymock init` in your own terminal. It opens a browser sign-in and writes `~/.speedscale/config.json`. The agent never asks for the API key in chat and never prints it.
- Runs `proxymock mcp install --yes`, which adds the proxymock MCP server to every coding agent it detects on the machine, not only the one you are using. For Claude Code it also copies the skills into `~/.claude/skills`. In Cursor the server is added to `~/.cursor/mcp.json`.
- Proves it works: records `curl http://example.com` with `proxymock record`, plays it back with `proxymock mock`, and checks that the call is tagged `match=HIT`, meaning the answer came from the recording, not the network.

## What you should see

The skill ends with a `### Result` block. This one is trimmed and comes from a machine where proxymock was already installed and initialized:

```text
### Result
- **Ran:** local only, macOS (Darwin 27.0.0) arm64, proxymock context ...; no Kubernetes
- **Outcome:** pass
- **Numbers:** proxymock v2.5.1109...; 5/5 checks passed (binary on PATH, config present, MCP connected, record 200, mock match=HIT); 15 Speedscale skills via the plugin (`proxymock mcp skills list` reports 0/15 in ~/.claude/skills because mcp install was skipped)
- **Artifacts:** ~/.speedscale/proxymock, ~/.speedscale/config.json (pre-existing, not modified); proof run in ./proxymock-proof/ (...); no PATH edit
- **Next:** prompt "record my app with proxymock and replay it" (record-traffic → proxymock-regression-test)
```

On a new machine the Artifacts line also names the install and any `PATH` edit. The proof run lines look like this (trimmed):

```text
record:200
recorded-2026-10-01_18-05-58.604996Z
mock:200
tags: decoded=true, match=HIT, msgNum=1, ...
```

## If it goes wrong

- **The agent cannot see the proxymock tools yet.** An agent loads a new MCP server when it starts. Restart the agent in the same directory (in Claude Code, `claude --continue` keeps the conversation). In Cursor, reload the window or start a new chat.
- **You have an older proxymock.** The skill upgrades it with the same method it was installed with. If you build proxymock yourself, its version ends in `-g` and a commit hash, and the skill leaves it alone.
- **Homebrew installs a version older than the latest release.** Homebrew refreshes its copy of the tap at most once a day, so a release from the last few hours can be missing. Run `brew update`, then `brew upgrade speedscale/tap/proxymock`.
- **`proxymock mcp skills list` reports skills as not installed or outdated.** That command checks `~/.claude/skills`. If you installed the skills as a plugin in the previous chapter, the agent uses those and the count does not matter.
- **`proxymock version` shows no config file.** `proxymock init` did not finish. Run it again in your terminal.
- **You already have proxymock from Homebrew.** Do not also run the install script. The skill keeps the install you have.

See [Installation](../getting-started/installation.md) for the install options per operating system.

<details>
<summary>Manual equivalent</summary>

```bash
# Install (pick one)
brew update && brew install speedscale/tap/proxymock
sh -c "$(curl -Lfs https://downloads.speedscale.com/proxymock/install-proxymock)"

# Sign in and write ~/.speedscale/config.json
proxymock init

# Connect the MCP server to your coding agents
proxymock mcp install --yes

# Prove it: record a call, then answer it from the mock
mkdir proxymock-proof && cd proxymock-proof
proxymock record -- curl -s -o /dev/null -w '%{http_code}\n' http://example.com   # ctrl-c after it prints 200
proxymock mock --in proxymock/recorded-* -- curl -s -o /dev/null -w '%{http_code}\n' http://example.com   # ctrl-c
grep -rh 'match=' proxymock/results | head -1   # expect match=HIT
```

</details>

## Next

[Chapter 2: Run the demo app](./run-the-demo-app.md)
