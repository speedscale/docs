---
title: Install proxymock CLI
description: "Install and initialize the proxymock command-line tool on macOS, Linux, or Windows to record traffic, mock dependencies, and replay tests."
keywords: [CLI, proxymock, command line, installation]
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos.mdx'
import LinuxCLIInstall from './installation/\_cli_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'
import BinaryCLIInstall from './installation/\_cli_binary.mdx'
import ProxymockLanguageLinks from '@site/src/components/ProxymockLanguageLinks';
import AgentInstall from './installation/_agent_install.mdx'

# Install proxymock CLI

Install proxymock to record traffic, mock dependencies, and replay tests. The same CLI supports local, CI/CD, Kubernetes, and cloud workflows. For a local workflow, start here and continue with the [proxymock CLI quickstart](./quickstart/quickstart-cli.md).

Looking for `speedctl install` or platform resource commands? See [Install speedctl CLI](/getting-started/installation/install/cli/) or [choose a command-line tool](/getting-started/command-line-tools/).

## Install with your coding agent (recommended) {#install-with-ai-agent}

<AgentInstall />

## Install proxymock manually {#install-cli}

Prefer to install it yourself? Pick your OS:

<Tabs>
  <TabItem value="mac" label="macOS">
    <MacCLIInstall />
  </TabItem>
  <TabItem value="linux" label="Linux">
    <LinuxCLIInstall />
  </TabItem>
  <TabItem value="windows" label="Windows">
    <WindowsCLIInstall />
  </TabItem>
  <TabItem value="binary" label="Binary">
    <BinaryCLIInstall />
  </TabItem>
</Tabs>

:::info Coding with AI Tools?
Install the **proxymock** [MCP](https://modelcontextprotocol.io/) by running `proxymock mcp install` (`--yes` skips the per-client prompts). That command also drops the [install-speedscale](https://github.com/speedscale/skills) skill into Claude Code, so `/install-speedscale` can upgrade or repair everything later.

:::

## Kerberos cloud proxy

If your outbound proxy requires Kerberos, configure [Kerberos proxy authentication](/reference/proxy_config#local-cli-setup) before running `proxymock init` or other cloud commands.

## After installing

Run `proxymock --help` to verify that the executable is on your PATH. Initialize once before your first recording. This registers a valid email to activate proxymock and is required even for fully local use; your recorded traffic stays on your machine. Browser sign-in is the default path:

- Run `proxymock init` and use the browser sign-in flow.
- Use `proxymock init --api-key <your key>` only for CI or other headless environments.

For more options (enterprise profile, CI, troubleshooting), see [Initialize API Key](/proxymock/guides/initialize.md). Then continue with the [agent tutorial](/proxymock/agent-tutorial/), the [proxymock CLI quickstart](/proxymock/getting-started/quickstart/quickstart-cli/), or a language-specific first-success path:

<ProxymockLanguageLinks className="space-y-1 mt-3" />
