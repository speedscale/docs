---
sidebar_position: 1
---

# Snapshot Lifecycle

A [snapshot](/reference/glossary.md#snapshot) is a collection of [request and response pairs](/reference/glossary.md#rrpair) stored in a file. Snapshots are created by recording a live environment or by importing data from another source like a Postman collection or a Wiremock configuration. Snapshots can be imported, which expands the collection into individual files, much like unzipping a `.zip` archive. Work with the files locally and then export them to a snapshot again when you need to share them with a friend.

## Mock Server Lifecycle

Speedscale's [mock server](/reference/glossary.md#mock-server) uses the outbound (egress) traffic of your application to create a mock server. This process is called "analysis" and it only needs to take place when you're ready to use the [mocks](/reference/glossary.md#mock). The analysis process takes the tests and mock files in a directory and creates artifacts from them, stored in a Speedscale-specific directory at `~/.speedscale/data/snapshots/`, but you shouldn't need to worry about those details. Only the test and mock files in your local directories are meant to be edited by humans.

Each request received by the mock server is translated into a [signature](/proxymock/reference/signature/) to make it quickly identifiable. This is visible in mock files if you search for "signature". The signature is a map of identifiers which can be matched against incoming requests. When a request matches the associated response is sent back to your app.

## Updating the Mock Server

To update the mock server you will need to run `proxymock analyze` to build mocks into a form that can be used the next time `proxymock run` is run. See `proxymock inspect` to understand which mocks need analysis.

The mock format is not explicitly documented (yet) but it's fairly easy to pick our fields you might want to change. Just make sure to change each occurrence of the field if it appears more than once in the data.

For example, if you want to change the URL of a single mock, you can simply edit the `location`, `http.req.url` and `http.req.uri` fields on a single line in the `raw.jsonl` file. Future versions of proxymock will likely have a UI for editing the mock. Speedscale Enterprise provides a data modification engine called [transforms](../../transform/overview.md) that can be used to modify the mock data using automation. Nothing stops you from manually modifying the raw.jsonl in **proxymock**.

## Sharing Mocks

Snapshots are just files and if you copy/paste the entire directory and metadata to another machine it will work. **proxymock** does support being embedded into a CI/CD pipeline but requires a commercial license. You can learn more about `proxymock push` and `proxymock pull` in the [Speedscale Enterprise](../../intro.md) documentation.
