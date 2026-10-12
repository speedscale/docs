---
title: Install speedctl CLI
description: "Install the speedctl command-line tool for Speedscale platform setup, operator installation, and cloud resource automation. For recording, mocking, and replaying with proxymock, use the proxymock CLI install guide."
keywords: [CLI, speedctl, command line, installation]
sidebar_position: 2
---
import CLIInstall from './\_cli_install.mdx'

# Install speedctl CLI

speedctl is a command-line tool for Speedscale platform setup and cloud resource automation. Use it to install the Speedscale operator, generate manifests, and work with platform resources.

:::tip Recording, mocking, or replaying with proxymock?
Follow [Install proxymock CLI](/proxymock/getting-started/installation/). For help choosing a tool, see [Command-line tools: proxymock and speedctl](../../command-line-tools.md).
:::

<CLIInstall />

If your outbound proxy requires Kerberos for cloud access, configure [Kerberos proxy authentication](/reference/proxy_config) before running `speedctl` cloud commands.

## Verify and initialize

Run `speedctl --help` to verify that the executable is on your PATH. If proxymock is already configured for your enterprise account, [reuse the shared credentials](../../command-line-tools.md#credentials). Otherwise run `speedctl init` before using cloud commands and follow the prompts to authorize your Speedscale account. You can get your personal API key from the [Profile page](https://app.speedscale.com/profile).

## Next steps

Continue with the [platform quick start](../../quick-start.md#install-speedscale-operator-optional) to install the operator. For capture and replay from an existing speedctl workflow, see [Capture, replay, and mock with speedctl](/guides/cli/). Run `speedctl --help` or `speedctl <command> --help` for commands and flags.
