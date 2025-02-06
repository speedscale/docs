---
sidebar_position: 2
---
# API Key

Using **proxymock** will require an API Key. 

The first time you run the extension, you will be asked to provide an email address. Speedscale does not share or sell your email address. You can view or modify your API key by editing the `~/.speedscale/config.yaml` file.

:::warning
* Don't put your API key in source control. Use a secret manager.
* Don't share your API Key.
* Non-interactive mode (like as part of a CI pipeline) requires Speedscale Enterprise. 
* If your API key is compromised, you can rotate it using the proxymock `rotate` command (run `proxymock rotate -h` for instructions)
:::

:::tip
This extension does not send your recorded data to any third party. All data is stored on your local desktop unless you connect to Speedscale Enterprise. Don't worry, that won't happen unless you explicitly start a trial or buy a license.
:::
