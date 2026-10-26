---
title: gRPC
description: "Record your gRPC services and their gRPC dependencies with proxymock, mock a dependency, generate tests and mocks from a .proto file, and check recorded responses against the .proto contract."
sidebar_label: Overview
---

# gRPC

proxymock records gRPC calls the same way it records HTTP: it sits between a client and a server and writes each call, request and response, to a file you can read and edit. From one recording you can test a gRPC service with its real clients' calls, run it with no gRPC dependencies at all, and check that responses still match the `.proto` contract. Where nothing has been recorded yet, a `.proto` file is enough to start.

What that gives you:

- **See every call your service takes and makes.** Each RPC shows its method path, request and response messages, gRPC status and timing, with no change to the service code.
- **Run without the dependency.** Mock a gRPC dependency from a recording so tests and AI coding assistants run offline and get the same answers every time.
- **Start from a `.proto` when there is no traffic.** `proxymock generate` writes one test and one mock per unary RPC, so a new service or a new RPC can be driven before anyone has called it.
- **Catch contract breaks.** `proxymock validate` checks recorded responses against the `.proto` message types and flags a field whose type changed, an enum value the enum does not declare, or a field the message does not declare.
- **Know what a recording covers.** `proxymock coverage` lists every RPC in the `.proto` and which of them, which status codes and which response fields the recording reached.

The unary workflows work from the proxymock CLI and from an AI coding assistant through the [proxymock MCP server](../how-it-works/mcp-tools.md). Native server-streaming capture uses the CLI's explicit opt-in flag.

:::note
`.proto` support in `generate`, `validate` and `coverage` needs proxymock 2.5.1249 or newer. Recording, mocking and replaying gRPC do not need it.
:::

## The pages in this section

- [Record gRPC traffic](./record.md): record a gRPC service, its gRPC dependencies, or both, and read what a recorded call looks like.
- [Native server streaming](./server-streaming.md): opt into bounded capture, preserve message boundaries and outcomes, and compare every replay response.
- [Mock a gRPC dependency](./mock-a-grpc-dependency.md): answer a dependency's calls from a recording and fix calls that do not match.
- [Generate tests and mocks from a .proto](./generate-from-a-proto.md): start a recording from the `.proto` when there is no traffic yet.
- [Validate and measure coverage](./validate-and-coverage.md): check recorded responses against the `.proto` and see which RPCs, statuses and fields a recording reaches.

## How proxymock shows a gRPC call

A gRPC call is an HTTP/2 `POST` to a path that names the service and the method, so proxymock lists it like any other request:

```
/fraud.v1.FraudChecker/CheckTransaction
```

The body is a protobuf message in binary. proxymock decodes it without needing the `.proto`, and shows each field by its field number and wire type:

```json
{
  "1:LEN": "acct-1001",
  "2:LEN": "user-7",
  "3:I64": 4632304060471443456,
  "4:LEN": "DEPOSIT",
  "5:LEN": "5411"
}
```

The key is `<field number>:<wire type>`. `LEN` holds strings, bytes and nested messages, `VARINT` holds integers, booleans and enums, and `I32` and `I64` hold fixed-width values such as `float` and `double`, shown as their raw bits. Match a key to the field with the same number in the `.proto`, here `account_id = 1` and `user_id = 2`. When you have no `.proto`, the values usually make the fields plain: a field holding `SELECT * FROM orders` is the query. In existing unary Markdown, edit a value and proxymock writes the binary message back when it mocks or replays the call. Versioned native call recordings keep wire messages and read-only previews; see the [format rules](./server-streaming.md#recording-formats-and-compatibility) before editing them. The [protobuf encoding guide](https://protobuf.dev/programming-guides/encoding/) explains the wire format in full.

Check out this video for a walkthrough of gRPC observability and mocking on the local desktop:

<iframe src="https://www.youtube.com/embed/q_bGCCNPLAE?rel=0&modestbranding=1" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

## Known limits

- **Unary RPCs remain supported.** Bounded native server streaming is available with explicit `proxymock record --grpc-streaming` capture. A call with one request and a client half-close can round-trip all messages through JSON and streaming Markdown, mock with pacing and recorded status, and replay with every response compared. See [native server streaming](./server-streaming.md) for version requirements and limits.
- **Long or cancelled streams remain partial.** Capture retains a bounded prefix and termination reason. Partial or unsupported calls are excluded from strict execution with diagnostics. A mixed replay executes eligible calls only; a recording with no eligible traffic exits unsuccessfully.
- **Existing unary Markdown keeps its format.** Versioned native call recordings use streaming Markdown v3 with wire messages and read-only previews. Older readers must not be used for the new format.
- **Client streaming, bidirectional execution and grpc-web streaming are separate phases.** Capturing their messages does not qualify them for Phase 1 execution.
- **`proxymock generate`** does not write streaming RPCs. It lists them as skipped. Streaming generation and kraken qualification remain follow-up work.
