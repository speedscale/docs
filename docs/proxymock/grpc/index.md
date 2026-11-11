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

The key is `<field number>:<wire type>`. `LEN` holds strings, bytes and nested messages, `VARINT` holds integers, booleans and enums, and `I32` and `I64` hold fixed-width values such as `float` and `double`, shown as their raw bits. Match a key to the field with the same number in the `.proto`, here `account_id = 1` and `user_id = 2`. When you have no `.proto`, the values usually make the fields plain: a field holding `SELECT * FROM orders` is the query. In existing unary Markdown, edit a value and proxymock writes the binary message back when it mocks or replays the call. Streaming call recordings use the same JSON for each message when it re-encodes exactly; see the [format rules](./server-streaming.md#recording-formats-and-compatibility) before editing them. The [protobuf encoding guide](https://protobuf.dev/programming-guides/encoding/) explains the wire format in full.

Check out this video for a walkthrough of gRPC observability and mocking on the local desktop:

<iframe src="https://www.youtube.com/embed/q_bGCCNPLAE?rel=0&modestbranding=1" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

## Read a body as protoscope

The field-number JSON above is what proxymock stores and what you edit, but it is hard to read: the `double` 50.5 appears as `4632304060471443456`. In proxymock web, the Body tab of a gRPC or protobuf request or response opens in a Protoscope view instead. Protoscope is the readable text form of the protobuf wire format from the [protobuf project](https://github.com/protocolbuffers/protoscope). It needs no `.proto`, and it shows every byte of the message. The same call reads:

```
1: {"acct-1001"}
2: {"user-7"}
3: 50.5   # 0x4049400000000000i64
4: {"DEPOSIT"}
5: {"5411"}
```

How to read it:

- `N:` is the field number, the same number as in the JSON key and the `.proto`.
- `{"..."}` is a length-delimited field holding text. A nested message is shown as its own fields inside `{ }`, indented.
- A plain whole number is a varint: an integer, a boolean or an enum value.
- A fixed-width field is shown as the number it most likely holds, here a `double`, with its raw bits in a `#` comment. A suffix of `i32` or `i64` marks a fixed-width value whose size is not otherwise clear. Text after `#` is always a comment.
- Bytes that are not text or a message are shown as hex in backticks, so nothing in the body is hidden.

Without a `.proto` these are the most likely readings of the wire format, the same ones the JSON view uses. A field can still hold something other than what it looks like, for example a `fixed64` that reads as a `double`, so check the `.proto` when a value looks wrong.

A call that sends or returns several messages, such as a [server stream](./server-streaming.md), shows one block per message:

```
# message 1 of 2
1: {"ord-1"}
2: 1

# message 2 of 2
1: {"ord-1"}
2: 3
```

A message that was compressed on the wire is labelled `(compressed)` and shown decompressed. gRPC-Web trailers are shown as `# trailer` comments after the messages. Very large messages are cut short with a comment saying how much was left out.

Use the Protoscope / Wire JSON switch above the body to change views. Protoscope is for reading only. Switch to Wire JSON to see the stored JSON, to edit, or to start a blueprint with **Add blueprint**. The Raw tab still shows the original bytes.

The Speedscale dashboard shows the same switch in the traffic viewer's Body tab. See [understanding request bodies](../../guides/capture/bodies.md#grpc).

## Known limits

- **Unary RPCs remain supported.** Bounded native server streaming is captured automatically, and unary calls are recorded exactly as before. A call with one request and a client half-close can round-trip all messages through JSON and streaming Markdown, mock with pacing and recorded status, and replay with every response compared. See [native server streaming](./server-streaming.md) for version requirements and limits.
- **Long or cancelled streams remain partial.** Capture retains a bounded prefix and termination reason. Partial or unsupported calls are excluded from strict execution with diagnostics. A mixed replay executes eligible calls only; a recording with no eligible traffic exits unsuccessfully.
- **Existing unary Markdown keeps its format.** Streaming call recordings use Markdown v3, with editable decoded messages where they re-encode exactly and base64 wire messages otherwise. Older readers must not be used for the new format.
- **Client streaming, bidirectional execution and grpc-web streaming are separate phases.** Capturing their messages does not qualify them for Phase 1 execution.
- **`proxymock generate`** does not write streaming RPCs. It lists them as skipped. Streaming generation and kraken qualification remain follow-up work.
