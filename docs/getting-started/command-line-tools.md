---
title: "Command-line tools (CLI): proxymock and speedctl"
sidebar_label: Command-line tools
sidebar_position: 1.5
description: "Choose between the proxymock and speedctl CLIs. Find installation, quickstarts, command references, and local, Kubernetes, CI/CD, BYOC, and cloud workflows."
keywords: [CLI, command line, command-line tools, proxymock, speedctl, installation]
---

# Command-line tools (CLI): proxymock and speedctl

Speedscale has two command-line tools: **proxymock** and **speedctl**. Start with **proxymock** for new workflows that record traffic, mock dependencies, and replay tests. Use **speedctl** for platform setup, managing Speedscale Cloud resources, and existing scripts that call `speedctl` commands.

Both tools can run replays, so choose the guide that matches your workflow. proxymock supports local development, CI/CD, Kubernetes, and Speedscale Cloud. A cluster or cloud workflow can use proxymock too.

## Choose a CLI for your task

| What you want to do | Tool and next step |
| --- | --- |
| Record, mock, and replay an app on your machine | Install [proxymock CLI](../proxymock/getting-started/installation.md), then follow the [proxymock CLI quickstart](../proxymock/getting-started/quickstart/quickstart-cli.md). |
| Run recorded tests in CI/CD | Use [proxymock in CI/CD](../proxymock/guides/cicd.md). Review its account requirements before configuring a pipeline. |
| Capture traffic or run a replay in Kubernetes | Use [proxymock cluster commands](../proxymock/guides/cluster.md) and [choose where the replay runs](../proxymock/guides/replay-paths.md). The cluster needs the Speedscale components described in those guides. |
| Use recordings stored in your own cloud account | Follow [Use BYOC traffic with proxymock](../byoc/use-traffic.md). |
| Start a replay through Speedscale Cloud | Use [proxymock cloud replay](../proxymock/guides/replay-paths.md#via-speedscale-cloud). Existing `speedctl infra replay` scripts can follow [Replay with speedctl](../guides/replay/via-speedctl.md). |
| Install the Speedscale operator or generate Kubernetes manifests | Follow the [platform quick start](./quick-start.md). It covers Helm, GitOps, and the [speedctl CLI](./installation/install/cli.md). |
| Manage cloud snapshots, test configs, or other platform resources from an existing script | Install [speedctl CLI](./installation/install/cli.md) and use `speedctl --help` for its commands. |

## Start with proxymock

For a local record/mock/replay workflow, install proxymock alone. Initialize it once with `proxymock init`, then work through the quickstart with your application. Local recording requires one-time activation, and recorded traffic stays on your machine by default. See [data and privacy](../proxymock/how-it-works/data_and_privacy.md) for details.

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

Install the tool for the task you are doing. Local proxymock recording, mocking, and replaying use proxymock. If your deployment or automation also calls speedctl, install both. The [platform agent install](./quick-start.md#install-with-ai-agent) installs both tools; the [local proxymock agent install](../proxymock/getting-started/installation.md#install-with-ai-agent) installs proxymock and its MCP server.

Installing a CLI on your machine is separate from installing the operator in a cluster. For cluster setup, continue with the [platform quick start](./quick-start.md) or [BYOC Kubernetes setup](../byoc/configure-kubernetes.md).
