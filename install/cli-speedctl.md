---
description: >-
  The speedctl command line tool is used to interact with Speedscale from your
  own terminal.
---

# CLI speedctl

### Download installer

To install the `speedctl` command line utility onto your local machine, open your favorite terminal and run this command to download and run the installer:

```
curl -sL https://downloads.speedscale.com/speedctl/install | sh
```

You should see output that looks something like this:

```
Downloading speedctl-darwin...
...
Download complete!
* Comparing checksum...
* The checksum was the same.
speedctl was successfully installed 🎉
...
```

### Initialization <a href="#part-ii-run-speedctl-initialization" id="part-ii-run-speedctl-initialization"></a>

The `speedctl` CLI has a command that can automatically bootstrap your local environment. Run:

```
speedctl init
```

This command will prompt you for several options to complete your installation. Default values are shown in brackets, and you can choose those simply by hitting enter on any step.

You will need to get your API Key from your [Profile Page](https://app.speedscale.com/profile). Click the eyeball to see the value, copy and paste into your terminal.

![](<../.gitbook/assets/Screen Shot 2021-08-13 at 10.56.03 AM.png>)

One it completes you should see an output like so:

```
Fetching config.yaml
√ Authentication complete!
Saving file: /Users/USERNAME/.speedscale/config.yaml
√ Success! speedctl initialization complete!
```

### Verify Installation

Verify your installation by running:

```
speedctl check
```

Output will vary depending on your environment:

```
Config Filename: /Users/USERNAME/.speedscale/config.yaml
Current Context: my-context
...
√ Successfully connected to AWS Firehose
√ Successfully read scenario repository
√ Successfully downloaded config.yaml (476 bytes)

√ Basic configuration check successful
```
