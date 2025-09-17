---
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos.mdx'
import LinuxCLIInstall from './installation/\_cli_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'
import BinaryCLIInstall from './installation/\_cli_binary.mdx'

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

