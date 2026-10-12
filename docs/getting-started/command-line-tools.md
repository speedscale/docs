---
title: "Command-line tools (CLI): proxymock and speedctl"
sidebar_label: Command-line tools
sidebar_position: 1.5
description: "Choose between the proxymock and speedctl CLIs. Find installation, quickstarts, command references, and local, Kubernetes, CI/CD, BYOC, and cloud workflows."
keywords: [CLI, command line, command-line tools, proxymock, speedctl, installation]
---

# Command-line tools (CLI): proxymock and speedctl

Speedscale has two command-line tools: **proxymock** and **speedctl**. Start with **proxymock** for new workflows that record traffic, mock dependencies, and replay tests. Use **speedctl** for platform setup, managing Speedscale Cloud resources, and existing scripts that call `speedctl` commands.

First choose where your traffic is now and where you want to test it. Traffic recorded on your machine, snapshots in Speedscale Cloud, and recordings in a BYOC bucket can all feed proxymock workflows. Installing the operator is a separate prerequisite when capture or replay will run in Kubernetes.

## Choose a CLI for your task

| Traffic and destination | Steps |
| --- | --- |
| Your app to local recordings | 1. [Install proxymock CLI](../proxymock/getting-started/installation.md). 2. Follow the [proxymock CLI quickstart](../proxymock/getting-started/quickstart/quickstart-cli.md). |
| Speedscale Cloud snapshot to your laptop | 1. [Install proxymock](../proxymock/getting-started/installation.md) and [reuse your cloud credentials](#credentials). 2. [Pull the snapshot and replay it locally](../proxymock/guides/cloud-snapshot-local.md). |
| Kubernetes workload to capture or replay in your cluster | 1. [Install and verify the operator](./quick-start.md#install-speedscale-operator-optional), or [verify your existing BYOC deployment](../byoc/verify.md). 2. [Install proxymock](../proxymock/getting-started/installation.md) and follow [cluster commands](../proxymock/guides/cluster.md). 3. [Choose the in-cluster replay path](../proxymock/guides/replay-paths.md#in-your-cluster). |
| BYOC bucket to your machine or cluster | 1. [Install proxymock CLI](../proxymock/getting-started/installation.md). 2. [Pull BYOC traffic](../byoc/use-traffic.md). 3. [Choose where the replay runs](../proxymock/guides/replay-paths.md). |
| Recorded traffic to CI/CD | 1. [Record locally](../proxymock/getting-started/quickstart/quickstart-cli.md) or [pull a cloud snapshot](../proxymock/guides/cloud-snapshot-local.md#pull). 2. Follow [proxymock CI/CD setup](../proxymock/guides/cicd.md), including its account requirements. |
| Recordings to a cloud-managed cluster replay | 1. [Install the operator](./quick-start.md#install-speedscale-operator-optional) if needed. 2. Use [proxymock cloud replay](../proxymock/guides/replay-paths.md#via-speedscale-cloud). Existing `speedctl infra replay` scripts can follow [Replay with speedctl](../guides/replay/via-speedctl.md). |
| Platform setup in Kubernetes | Follow the [platform quick start](./quick-start.md). Choose Helm, GitOps, or the [speedctl CLI](./installation/install/cli.md) install method. |
| Existing script to Speedscale Cloud resources | Install [speedctl CLI](./installation/install/cli.md), [reuse your tenant credentials](#credentials), and use `speedctl --help` for its commands. |

## Start with proxymock

For a local record/mock/replay workflow, install proxymock alone. Initialize it once with `proxymock init`, or [reuse your existing speedctl credentials](#credentials), then work through the quickstart with your application. Local recording requires one-time activation, and recorded traffic stays on your machine by default. See [data and privacy](../proxymock/how-it-works/data_and_privacy.md) for details.

- [Install proxymock CLI](../proxymock/getting-started/installation.md): installation and initialization for macOS, Linux, and Windows.
- [proxymock CLI quickstart](../proxymock/getting-started/quickstart/quickstart-cli.md): a complete record, mock, and replay loop with a demo app.
- [proxymock CLI overview](../proxymock/how-it-works/cli.md): the core commands and how traffic moves through the proxies.
- [proxymock CLI reference](../reference/proxymock-cli-reference.md): command syntax, flags, and examples. Run `proxymock --help` or `proxymock <command> --help` for the help shipped with your installed version.

Prefer to work with an agent or a UI? The [agent tutorials](../proxymock/index.md#agent-tutorial), [MCP server](../proxymock/how-it-works/mcp.md), and `proxymock web` use the same proxymock workflows.

## Use speedctl for platform workflows

speedctl installs and configures platform components, works with cloud resources, and supports capture and replay workflows used by existing integrations. Keep using the commands a speedctl guide or script specifies; proxymock has its own command names and flags.

- [Install speedctl CLI](./installation/install/cli.md): installation for macOS, Linux, and Windows.
- [Capture, replay, and mock with speedctl](../guides/cli.md): the walkthrough for existing speedctl workflows.
- [Replay with speedctl](../guides/replay/via-speedctl.md): cloud-managed cluster replays and replay options.
- [Manage DLP rules with speedctl](../guides/dlp/cli-reference.md): pull and push platform DLP rules.

Run `speedctl --help` to list commands and `speedctl <command> --help` to see the flags available in your installed version.

## Do I need both CLIs?

For a manual install, install the tool your chosen workflow calls for. Local proxymock recording, mocking, and replaying use proxymock. If your deployment or automation also calls speedctl, install both.

For an agent-assisted install, choose the scope of the prompt:

- **proxymock only:** the [local proxymock agent install](../proxymock/getting-started/installation.md#install-with-ai-agent) installs proxymock and its MCP server, with no operator.
- **Platform setup:** the [platform agent install](./quick-start.md#install-with-ai-agent) deliberately installs both CLIs, Kubernetes prerequisites, and the operator when requested. It prepares the full platform toolset; the install-one guidance above applies to manual installation.

Installing a CLI on your machine is separate from installing the operator in a cluster. For cluster setup, continue with the [platform quick start](./quick-start.md) or [BYOC Kubernetes setup](../byoc/configure-kubernetes.md).

## Credentials: do I initialize both? {#credentials}

Both CLIs use the same Speedscale configuration in `~/.speedscale` by default. For the same account and tenant, initialize once with either `proxymock init` or `speedctl init`. If speedctl is already configured for your enterprise tenant, proxymock can reuse that configuration. Installing the second binary does not require registering another email or running `init` again.

The account in that configuration determines your access. Free proxymock activation enables local workflows; accessing a tenant's cloud snapshots requires credentials for that tenant. Existing customers should sign in with their enterprise account or use its personal API key from the [Profile page](https://app.speedscale.com/profile). See [proxymock initialization](../proxymock/guides/initialize.md) for the sign-in and headless options. Changing the shared credentials affects both CLIs.

To check which config each installed client uses without printing credentials, run:

```bash
proxymock version --client
speedctl version --client
```

Compare the `ConfigFile` paths. Older clients use `config.yaml`; newer clients prefer `config.json` and fall back to YAML. If the paths differ, align the clients' versions and configure both to use the same file. Both accept `--config <path>` and `--context <name>` for an explicit file and account context. A custom home or config path can make their settings separate.
