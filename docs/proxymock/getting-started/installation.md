---
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'

# Installation

This extension does some pretty heavy duty work and it requires the Speedscale CLI (`speedctl`) to be installed. Additionally, using an external process like `speedctl` allows you to automate the creation of simulation environments if you upgrade to Speedscale Enterprise. We'd prefer to perform this level of magic without it but so far physics has gotten in the way. Make sure you complete both steps or you will be sad when you try and run the extension.

## Install proxymock Extension {#install-proxymock-extension}

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X on Windows or Command+Shift+X on MacOS/Linux)
3. Search for "Speedscale Proxymock"
4. Click Install

The extension will install an additional command line tool called `speedctl` which is used to create and manage your mock servers. You don't need to manually install this, but you can learn more about it at [here](../../setup/install/cli.md).

:::note
The proxymock extension will re-use the existing Speedscale Enterprise installation if present.
:::
