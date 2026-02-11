---
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
Generative AI features can be turned off globally for your tenant upon request. This is provided for highly sensitive and secure environments as an extra layer of security.
:::

## Use in Transforms

Userdata is usually referenced using a special keyword inside the transform chain. For example, let's say there was a CSV file stored in userdata named `new_names.csv`. A transform chain for this might be:

```
http_header(name="name") <-> csv("${{s3://new_names.csv}})
```

The `${{s3://<userdata>}}` syntax permits us to pull the user data (in its entirely) into the CSV transform. For a more complete example please see the [guide](../transformation/smart-replace.md).