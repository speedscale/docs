---
sidebar_position: 1
---

# Snapshot Lifecycle

A snapshot is a collection of request and response pairs stored. Snapshots are created by recording a live environment or by importing data from another source like a Postman collection or a Wiremock configuration. On your local machine, you can find your snapshots in the `~/.speedscale/data/snapshots` directory. The recorded rrpairs are stored in the `raw.jsonl` file within the unique snapshot directory. Each line in the file is a flattened JSON object representing a single request and response pair. By editing the `raw.jsonl`, you are editing the data that is used to generate the mocks.

Your currently active snapshot is shown in the `PROXYMOCK` pane. Each rrpair is shows as an entry in the tree underneath the hostname or service it belongs to.

:::tip
If you understand how the `git` tool works by pushing and pulling files locally to/from the cloud then this system will be familiar.
:::

## Mock Server Lifecycle

Speedscale's mock server uses the outbound (egress) traffic of your application to create a mock server. This process is called "re-analysis" and it only needs to take place when you're ready to use the mocks. The analysis process takes the rrpairs in your `raw.jsonl` file and creates a file titled `reaction.jsonl` that configures the mock server. If you modify the reaction file manually it will work until re-analysis and then be overwritten. Only the `raw.jsonl` and metadata files are meant to be edited by humans.

## Updating the Mock Server

When you edit the rrpairs in the tree pane and save a particular rrpair, the `raw.jsonl` is automatically updated. You must now trigger the re-analysis process to update the `reaction.jsonl` file. This is done by clicking the `Learn` button in the `PROXYMOCK` pane. The mock server will automatically restart.

The rrpair format is not explicitly documented (yet) but it's fairly easy to pick our fields you might want to change. Just make sure to change each occurrence of the field if it appears more than once  in the data.

For example, if you want to change the URL of a single rrpair, you can simply edit the `location`, `http.req.url` and `http.req.uri` fields on a single line in the `raw.jsonl` file. Future versions of proxymock will likely have a UI for editing the rrpair.

:::tip
The `Learn` button is only available when you have an active snapshot.
:::

## Changing the Active Snapshot

You can change the active snapshot by clicking the `Switch Active Snapshot` button in the `PROXYMOCK` Editor Command pane. This will open a dialog where you can select a different snapshot. The mock server will automatically restart.

## Merging Snapshots

Combining snapshots is useful if you want to create a mock server that combines data from multiple environments or recordings. On your local desktop you can simply copy/paste two raw.jsonl files together using the text editor. The mock server will automatically re-order the rrpairs based on time stamp when you click the `Learn` button.

[Speedscale Enterprise](https://speedscale.com/enterprise/) allows you to merge snapshots from different environments using automated commands and is able to re-order intelligently.