---
sidebar_position: 3
---
# API Key

Using **proxymock** requires generating an API key. Enterprise customers can skip this step.

Run this command:
```bash
proxymock init --email <your-email>
```

That's all you need to do. You can view or modify your API key by editing the `~/.speedscale/config.yaml` file.

Speedscale does not share or sell your email address, although we might send you updates or announcements if we can ever figure out this marketing thing. Engineering is more our wheelhouse.

:::warning
* Don't put your API key in source control. Use a secret manager.
* Don't share your API Key.
* Non-interactive mode (like as part of a CI pipeline) requires Speedscale Enterprise. 
* If your API key is compromised, you can rotate it using the proxymock `rotate` command (run `proxymock rotate -h` for instructions)
:::

:::tip
proxymock does not send your recorded data to any third party. All data is stored on your local desktop unless you connect to Speedscale Enterprise. Don't worry, that won't happen unless you explicitly start a trial or buy a license.
:::
