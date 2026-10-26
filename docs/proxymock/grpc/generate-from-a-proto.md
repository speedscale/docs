---
title: Generate tests and mocks from a .proto
description: "Turn a gRPC service's .proto file into proxymock tests and mocks, one per unary RPC, then record the service's real responses with them when no traffic has been recorded yet."
---

# Generate tests and mocks from a .proto

`proxymock generate` reads a `.proto` file and writes one recorded-style call per unary RPC: an inbound test you can replay at your service, an outbound mock you can serve in its place, or both. Use it when a service or a new RPC has never been called, so there is nothing to record yet.

Generated calls are a starting point, not a baseline. Their messages are made up from the field types. Replay the tests at your service while `proxymock record` runs, and the recording holds the service's real responses.

:::note
`.proto` support in `generate` needs a proxymock release newer than 2.5.1247.
:::

## Generate

```bash
proxymock generate --direction both --out ./proxymock/candidates-fraud ./fraud.proto
```

proxymock detects a `.proto` from the file extension; the flags are the same as for an [OpenAPI spec](../guides/openapi.md). The output lists each RPC, the files it wrote and a summary:

```
Processing 1 RPCs from protobuf specification...
Processing RPC: /fraud.v1.FraudChecker/CheckTransaction
  Generated: grpc_fraud.v1.FraudChecker_CheckTransaction_OK_inbound.md (status OK)
  Generated: grpc_fraud.v1.FraudChecker_CheckTransaction_OK.md (status OK)
```

| Flag | For a `.proto` |
| --- | --- |
| `--direction` | `inbound` writes tests for `proxymock replay`, `outbound` writes mocks for `proxymock mock` (the default), `both` writes one of each. |
| `-I`, `--proto-path` | An import root, like `protoc -I`. Repeat it for several roots. The `.proto` file's own directory is always searched, and the `google/protobuf` well-known types are built in. |
| `--include-paths`, `--exclude-paths` | Comma-separated RPC patterns: a `/package.Service/Method` glob such as `'/orders.v1.Orders/Get*'`, or `/package.Service` for every method of a service. Quote globs so the shell leaves them alone. |
| `--include-optional` | Also fill fields declared `optional`. |
| `--host`, `--port` | The host and port the calls are addressed to. Default `localhost` and 80. |
| `--tag-filter` | Not available: a `.proto` has no tags. Use `--include-paths` instead. |
| `--examples-only` | No effect: a `.proto` declares no examples, so every message is made up from its type. |

When the `.proto` imports another file, pass the directory the import path is relative to:

```bash
proxymock generate -I ./proto --out ./proxymock/candidates-orders ./proto/orders/v1/orders.proto
```

Without it, generate stops and names the flag:

```
generation failed: parse protobuf spec "./proto/orders/v1/orders.proto" (add import roots with --proto-path): orders.proto:3:8: open .../proto/orders/v1/common/v1/money.proto: no such file or directory
```

## What the generated calls contain

Each call is a gRPC `POST` to the method path over HTTP/2, the same shape proxymock records, so `proxymock mock` and `proxymock replay` use it with no extra steps. The messages follow the same rules as OpenAPI generation:

- Strings are `example_value`, bytes are `test`, numbers sit mid-range (50 for integers, 50.5 for floating point), and booleans are `true`.
- Repeated fields get two items, and maps get one entry.
- An enum gets its first non-zero value, because value 0 is usually `..._UNSPECIFIED` and real services reject it.
- A `oneof` gets its first member.
- Fields declared `optional` are left out unless you pass `--include-optional`. Every other field is set.
- A `google.protobuf.Timestamp` gets 2024-01-15T10:30:00Z. A message type that contains itself is not expanded a second time.

Streaming RPCs are not generated, because a generated call holds one request message and one response message, and proxymock does not replay streams yet (see [Known limits](./index.md#known-limits)). The summary lists them:

```
SKIPPED STREAMING RPCS (not generated; record them instead):
  - /orders.v1.Orders/WatchOrders (server streaming)
```

## Replace the placeholders

The summary ends with a `PLACEHOLDERS:` list of the tests whose request still sends `example_value`:

```
PLACEHOLDERS: 1 of 1 inbound test(s) still send generated placeholders ("example_value" or ${{param:...}}).
```

A real service usually rejects those values, so open each test and change them to values the service accepts, taken from the code, seed data or a teammate. The request body shows fields by number, so match each number to the `.proto`:

```json
{
  "1:LEN": "acct-1001",
  "2:LEN": "user-7",
  "3:I64": 4632304060471443456,
  "4:LEN": "DEPOSIT",
  "5:LEN": "5411"
}
```

Keep the keys, and change only the values. A `double` or `fixed64` field (`I64`) holds its raw 64 bits, so leave it as generated unless the value matters.

## Record the real responses

Start your service under the recorder, and replay the edited tests through the recorder's inbound port:

```bash
proxymock record --app-port 18551 --proxy-in-port 18571 --out ./proxymock/recorded-fraud -- ./fraud-service
```

```bash
proxymock replay --in ./proxymock/candidates-fraud --test-against http://localhost:18571 --out ./proxymock/results/realize-fraud
```

The replay reports a mismatch, because the expected responses in the generated tests were made up. That is expected and you can ignore it. Stop the recorder with Ctrl-C. The recording now holds each request and your service's real response, and it is what you replay, mock and [validate](./validate-and-coverage.md) from here on.

## Use it from an AI coding assistant

The proxymock MCP server's `generate` tool takes a `.proto` path in its `spec` parameter and import roots in `proto-path`. `proxymock inventory` lists the `.proto` files it finds in a repository and suggests this flow when there is no recording.
