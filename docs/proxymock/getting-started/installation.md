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

## Install speedctl {#install-speedctl}

`speedctl` used to create and manage simulation environments and will interact with the VSCode extension. Choose your platform to install the CLI.

<Tabs
  defaultValue="windows"
  values={[
    {label: 'Windows', value: 'windows'},
    {label: 'Mac', value: 'mac'},
    {label: 'Linux', value: 'linux'},
    {label: 'Docker', value: 'docker'},
  ]}>

<TabItem value="windows">

<WindowsCLIInstall />

</TabItem>

<TabItem value="mac">

<MacCLIInstall />

</TabItem>

<TabItem value="linux">

<MacCLIInstall />

</TabItem>

<TabItem value="docker">

### Docker

1. Pull the Speedscale CLI Docker image using `docker pull speedscale/speedscale-cli`.
2. Run the Docker container using `docker run -it speedscale/speedscale-cli`.
3. Verify the installation by running `speedscale --version` inside the Docker container.

</TabItem>

</Tabs>

