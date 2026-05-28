---
description: "Manage user data in Speedscale for external data storage, upload/download commands, and generative AI test data generation for your transform system"
sidebar_position: 4
---

# User Data

Speedscale cloud stores files called user data that provide any external data used by the transform system. There are no practical limits on userdata and they work just like the files on your local filesystem.

## Upload/Download

Most users interact with user data via `speedctl`. Use these commands for upload and download
```bash
speedctl pull user-data my-data1
speedctl push user-data my-data2
```

User data is stored on your local filesystem along with the rest of your cli data. Usually that directory is `~/.speedscale/data/userdata`. If you have `$EDITOR` properly configured in your shell you can also use the `speedctl edit` command.

## Generative AI

Speedscale supports generative AI test data generation. Click on the User Data -> Generate data with AI to go through this workflow. AI generated data will be stored as userdata in CSV format.

:::tip
All AI processing runs on AWS Bedrock in a SOC 2 compliant environment. Customer data never leaves your hosted environment and is not sent to external providers like OpenAI or Anthropic. Generative AI features can be turned off globally for your tenant upon request.
:::

## Use in Transforms

Userdata is usually referenced using a special keyword inside the transform chain (see [Embedded Syntax](./embedded-syntax.md) for the full set of keywords). For example, let's say there was a CSV file stored in userdata named `new_names.csv`. A transform chain for this might be:

```
http_header(name="name") <-> csv("${{s3://new_names.csv}})
```

The `${{s3://<userdata>}}` syntax permits us to pull the user data (in its entirety) into the CSV transform. For a more complete example please see the [guide](../transformation/smart-replace.md).

### Portable references with `dataframe:`

When the same transform needs to work both in the Speedscale cloud and during a local proxymock replay, prefer the `dataframe:` scheme over `s3://`. proxymock resolves it to a file under the local workspace (`proxymock/dataframes/<id>/<file>`), and the cloud resolves the same key to user data. See the [file extractor](./extractors/file.md) for the full description of all three filename forms.

```
http_header(name="name") <-> csv("${{dataframe:new_names.csv}}")
```

For files inside a subdirectory under `proxymock/dataframes/`, encode the path separator as `__` — e.g. `dataframe:credentials__basic.csv` resolves to `proxymock/dataframes/credentials/basic.csv` locally. This is the form `proxymock cloud push snapshot` writes when it migrates a local recording's absolute filenames to the portable form, and what `proxymock automation` workflows emit out of the box.