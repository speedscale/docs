---
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos.mdx'
import LinuxCLIInstall from './installation/\_cli_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'

# Installation

**proxymock** does some pretty heavy duty work all from the command line.  Using the cli, you can automate the creation of simulation environments, record new traffic, modify transactions and replay. 

## Install proxymock via Command Line {#install-cli}

:::warning Note
To install non interactively (like in CI/CD) set the `SPEEDSCALE_API_KEY` environment variable. This is an [Enterprise feature](https://docs.speedscale.com/quick-start/).
:::

<Tabs>
  <TabItem value="mac" label="MacOS">
    <MacCLIInstall />
  </TabItem>
  <TabItem value="linux" label="Linux">
    <LinuxCLIInstall />
  </TabItem>
  <TabItem value="windows" label="Windows">
    <WindowsCLIInstall />
  </TabItem>
</Tabs>

## Install proxymock via VSCode (beta) {#install-vscode-extension}

1. Go to the Extensions view (Ctrl+Shift+X on Windows or Command+Shift+X on MacOS/Linux) in Visual Studio Code
1. Search for `proxymock`
1. Click install 

The extension will install an additional command line tool called `proxymock` which is used to create and manage your mock 
servers. You don't need to manually install this, but you can learn more about it by checking out the manual instructions below.

:::note
The proxymock extension will re-use the existing Speedscale Enterprise installation if present.
:::
