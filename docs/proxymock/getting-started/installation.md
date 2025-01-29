---
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'

# Installation

This extension does some pretty heavy duty work and it requires a cli.Using an external cli allows you to automate the creation of simulation environments from the command line and use other IDEs like IntelliJ or Goland. We'd prefer to perform this level of magic without it but so far physics has gotten in the way. If you plan to install the VSCode extension then you only need to install the VSCode extension from the Marketplace and it will take care of the cli. This is similar to how VSCode handles delve and other language tools.

## Install proxymock via VSCode {#install-vscode-extension}

1. Go to the Extensions view (Ctrl+Shift+X on Windows or Command+Shift+X on MacOS/Linux) in Visual Studio Code
1. Search for `proxymock`
1. Click install 

The extension will install an additional command line tool called `proxymock` which is used to create and manage your mock servers. You don't need to manually install this, but you can learn more about it by checking out the manual instructions below.

:::note
The proxymock extension will re-use the existing Speedscale Enterprise installation if present.
:::

## Install proxymock via Command Line {#install-cli}

:::warning
The proxymock extension is currently only available for MacOS and Linux. Instructions for Windows are included below in case you want to do some offroading.
:::

<Tabs>
<TabItem value="MacOS/Linux">
<MacCLIInstall />
</TabItem>
<TabItem value="Windows"> 
The *proxymock* cli is available for Windows, but does not support native traffic capture. These instructions are included in case you know what you are doing and want to install the cli manually.
<WindowsCLIInstall />
</TabItem>
</Tabs>
