---
sidebar_position: 2
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacOSLinuxInstall from './_cli_macos_linux.mdx'
import WindowsCLIInstall from './_cli_windows.mdx'

# CLI

The speedctl command line tool is used to interact with Speedscale from your own terminal. `speedctl` is the Speedscale
programmable API and the primary way to perform setup actions like installing the Speedscale Operator, generating manifests, etc.

### Install

<Tabs>

<TabItem value="cli" label="MacOS/Linux">

<MacOSLinuxInstall />

</TabItem>

<TabItem value="windows" label="Windows">

<WindowsCLIInstall />

</TabItem>

</Tabs>

### Initialization <a href="#part-ii-run-speedctl-initialization" id="part-ii-run-speedctl-initialization"></a>

If this is your first time downloading `speedctl` initialization may happen automatically.  Otherwise bootstrap your local environment:

```
speedctl init
```

You will need to get your API key from your [Profile Page](https://app.speedscale.com/profile). Copy the API key and paste when prompted.

![](./api-key.png)

### Verify Installation

Verify your installation:

```
speedctl check
```

## Demo

After installing the Speedscale Operator, the quickest way to experience what Speedscale has to offer is via the `demo` command.
```
speedctl demo
```

This command will deploy a demo workload, create a snapshot and run replays so that you can get a head start without having to instrument your own apps.
