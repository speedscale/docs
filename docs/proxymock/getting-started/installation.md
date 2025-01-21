---
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './installation/\_cli_macos_linux.mdx'
import WindowsCLIInstall from './installation/\_cli_windows.mdx'

# Installation

This extension does some pretty heavy duty work and it requires a cli and a VSCode extension (`proxymock` is the name of both) to be installed. Using an external cli allows you to automate the creation of simulation environments from the command line and use other IDEs like IntelliJ or Goland. We'd prefer to perform this level of magic without it but so far physics has gotten in the way. You only need to install the VSCode extension and it will take care of the cli. This is similar to how VSCode handles delve and other language tools.

## Install proxymock Extension {#install-proxymock-extension}

1. Open a web browser and download the proxymock extension .vsix (during the beta period you can contact us directly but this will be posted to the extension marketplace for GA)
Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X on Windows or Command+Shift+X on MacOS/Linux)
3. Click on the three dot menu at the top of the pane and select "Install from VSIX..."
4. Select the .vsix you downloaded

The extension will install an additional command line tool called `proxymock` which is used to create and manage your mock servers. You don't need to manually install this, but you can learn more about it at [here](../../setup/install/cli.md).

:::note
The proxymock extension will re-use the existing Speedscale Enterprise installation if present.
:::
