---
title: GraphQL
description: "Record your app's GraphQL traffic with proxymock, then read each request as an operation, mock a GraphQL API, replay recorded operations as tests, generate tests and mocks from a schema, and measure a recording's coverage of the schema and its conformance to it."
sidebar_label: Overview
---

# GraphQL

proxymock records the GraphQL requests your app serves or sends while you use it, by sitting between the app and its clients or its GraphQL dependencies. From one recording you can read every request as the operation it runs, test your server with the operations its clients really sent, run your app against a mock of a GraphQL API, and check what the recording covers in the schema. When there is no recording yet, the schema alone is enough to start.

What that gives you:

- **See the operations, not one URL.** Every GraphQL operation is a `POST` to the same `/graphql` endpoint. proxymock reads the document and shows each request by its operation, with its variables, the argument literals written into the query, and which arguments a variable supplies.
- **Test your server with real operations.** Replay recorded operations at a new build of your server and compare the responses, including errors a server reports inside an HTTP 200.
- **Run without the GraphQL API you depend on.** Mock it from a recording, so tests and coding agents run offline and get the same answers every time.
- **Start from the schema.** Generate one named operation per root query and mutation field, as tests for your server or mocks of the API, from SDL, an introspection result, or a running endpoint.
- **Know what the recording covers.** Report which queries, mutations and response fields a recording reaches, and check every recorded response against the schema's types.

Every step works from the proxymock CLI, from proxymock web, and from an AI coding assistant through the [proxymock MCP server](../how-it-works/mcp-tools.md).

:::note
Generating from a schema, schema coverage and validation, and transforms that proxymock web scopes to a GraphQL endpoint need a proxymock release with GraphQL schema support. If `proxymock generate --help` mentions GraphQL, you have it.
:::

## How proxymock recognizes GraphQL

A request is GraphQL when its URL path ends in `/graphql`. That is the endpoint the GraphQL project recommends, and it is the only thing proxymock goes by, because GraphQL has no content type of its own. proxymock then reads the operation from the request's JSON body. A GraphQL API served from another path is still recorded, mocked and replayed, as ordinary JSON over HTTP, but it is not read as operations.

## Record your GraphQL traffic

To record your GraphQL server, start it under the recorder and send requests to proxymock's inbound port instead of the app's:

```bash
proxymock record --app-port 8080 -- ./your-server
curl -s http://localhost:4143/graphql -H 'Content-Type: application/json' \
  -d '{"query":"query Plans { plans { name price } }","operationName":"Plans"}'
```

To record the GraphQL API your app calls, route the app's outbound traffic through proxymock. [Record GraphQL traffic](./record.md) covers both, what each recorded call holds, persisted queries, and reading the recording in proxymock web.

## Mock a GraphQL API

`proxymock mock` answers your app's GraphQL requests from the recording, so the app runs with no API behind it. A mock matches on the operation's document and its variables. When a variable changes on every run, such as a token or a fresh email address, the Mocks view recommends masking exactly that variable. See [Mock a GraphQL API](./mock-graphql.md).

## Replay operations as tests

`proxymock replay` sends recorded operations to your server and compares what comes back. Results are grouped by operation, and a GraphQL error inside an HTTP 200 shows as a body mismatch. Values that expire, such as a signed token in `variables`, are fixed with a transform that addresses them by meaning: `variables.token`. See [Replay GraphQL operations](./replay.md).

## Generate from a schema

`proxymock generate` turns a schema into one named operation per root query and mutation field, with variables for its required arguments and a response matching its selection:

```bash
proxymock generate --direction both --out proxymock/generated schema.graphql
```

The schema can be SDL, an introspection result saved as JSON, or the URL of a running endpoint. See [Generate tests and mocks from a schema](./generate.md).

## Check coverage and conformance

`proxymock coverage` reports which operations, statuses and response fields a recording reaches, and `proxymock validate` checks each recorded response against the schema, with the exact JSON path of every violation:

```bash
proxymock coverage --spec schema.graphql --in proxymock/recorded-<timestamp>
proxymock validate --spec schema.graphql --in proxymock/recorded-<timestamp>
```

See [Schema coverage and contract checks](./coverage-and-validate.md).

## In the Speedscale cloud

Traffic captured in Kubernetes is read the same way, and the dashboard edits GraphQL requests with the same semantic paths. See [GraphQL](../../guides/graphql/index.md) for snapshots, the semantic path grammar, and transform recipes.
