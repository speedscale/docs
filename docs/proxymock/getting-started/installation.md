---
description: "Install ProxyMock via the command line to automate simulation environments, record traffic, and replay transactions efficiently for your API testing needs"
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos.mdx'
import LinuxCLIInstall from './installation/\_cli_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'
import BinaryCLIInstall from './installation/\_cli_binary.mdx'
import ProxymockLanguageLinks from '@site/src/components/ProxymockLanguageLinks';

# Installation

**proxymock** does some pretty heavy duty work all from the command line.  Using the cli, you can automate the creation of simulation environments, record new traffic, modify transactions and replay.

## Install proxymock via Command Line {#install-cli}

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
Install the **proxymock** [MCP](https://modelcontextprotocol.io/) by running `proxymock mcp install`.
:::

## After installing

Initialize once before your first recording. Browser sign-in is the default path:

- Run `proxymock init` and use the browser sign-in flow.
- Use `proxymock init --api-key <your key>` only for CI or other headless environments.

For more options (enterprise profile, CI, troubleshooting), see [Initialize API Key](/proxymock/guides/initialize.md). Then continue with the [Quickstart](/proxymock/getting-started/quickstart) or use a language-specific first-success path:

<ProxymockLanguageLinks className="space-y-1 mt-3" />
