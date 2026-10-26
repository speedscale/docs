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

Every step works from the proxymock CLI and from an AI coding assistant through the [proxymock MCP server](../how-it-works/mcp-tools.md).

:::note
`.proto` support in `generate`, `validate` and `coverage` needs a proxymock release newer than 2.5.1247. Recording, mocking and replaying gRPC do not need it.
:::

## The pages in this section

- [Record gRPC traffic](./record.md): record a gRPC service, its gRPC dependencies, or both, and read what a recorded call looks like.
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

The key is `<field number>:<wire type>`. `LEN` holds strings, bytes and nested messages, `VARINT` holds integers, booleans and enums, and `I32` and `I64` hold fixed-width values such as `float` and `double`, shown as their raw bits. Match a key to the field with the same number in the `.proto`, here `account_id = 1` and `user_id = 2`. When you have no `.proto`, the values usually make the fields plain: a field holding `SELECT * FROM orders` is the query. Edit a value and proxymock writes the binary message back when it mocks or replays the call. The [protobuf encoding guide](https://protobuf.dev/programming-guides/encoding/) explains the wire format in full.

Check out this video for a walkthrough of gRPC observability and mocking on the local desktop:

<iframe src="https://www.youtube.com/embed/q_bGCCNPLAE?rel=0&modestbranding=1" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

## Known limits

- **Unary RPCs are fully supported. Streaming RPCs are not yet.** A streaming call is recorded as one call, once both sides close the stream, with all of its messages joined and their timing lost. A stream the client cancels, as a watch or subscribe call usually is, is not recorded at all.
- **Markdown keeps one message per direction.** The markdown files proxymock writes by default keep only the first message of a streaming call's request and response. RRPair JSON files, written with `--out-format json`, keep every message.
- **Mocking a stream** sends every recorded response message at once, and needs the client to finish sending first, so a bidirectional client that waits for a reply hangs.
- **Replaying a stream** does not work: replay sends each call as a unary call, so a server that answers with more than one message, or expects more than one, fails the call.
- **`proxymock generate`** does not write streaming RPCs. It lists them as skipped.
