---
sidebar_position: 2
---
# API Key

Using **proxymock** does not require anything more than an email address. Speedscale is a technology startup and we're not in the business of selling your information but we do need a unique identifier to enable some functionality and understand what features are most useful.

The first time you run the extension, you will be asked to provide an email address. In other words, you don't have to do anything more than type in a valid email address when prompted. You can view or modify your API key by editing the `~/.speedscale/config.yaml` file.

:::warning
* Don't put your API key in source control. Use a secret manager.
* Don't share your API Key.
* Non-interactive mode (like as part of a CI pipeline) requires Speedscale Enterprise. We know it's a pain, but we gotta eat too.
* If your API key is compromised, you can rotate it [here](https://app.speedscale.com/settings/api-keys).
:::

:::tip
This extension does not send your recorded data to any third party. All data is stored on your local desktop unless you connect to Speedscale Enterprise. Don't worry, that won't happen unless you explicitly start a trial or buy a license.
:::
