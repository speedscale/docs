---
title: Native server streaming
description: "Record bounded native gRPC server streams, mock their paced responses and replay every message with explicit partial-call diagnostics."
---

# Native server streaming

:::note Version compatibility
These steps require a proxymock release with native server streaming, together with readers that support gRPC call format 1. Older releases support unary replay only.
:::

`proxymock record` and `proxymock mock` capture native gRPC streams as calls with no extra flag. A call stays unary-shaped until either direction sends a second message, and a unary-shaped call is recorded exactly as before, with no streaming limits applied. The limits below start at the second message and also apply to the messages already captured.

A finite native gRPC call with one request followed by a client half-close can be recorded, mocked and replayed as one call. The recording preserves each response message, its observed offset, initial metadata, terminal status and trailers, including errors after messages and zero-response errors. Supported per-message encodings are identity and gzip.

Only methods with streaming or imported call recordings use bounded streaming request preparation; legacy unary methods keep their existing request path. The mock matches the host, full method and request payload through the normal matcher, then sends only the selected call's responses. It flushes each message at its recorded offset and returns the recorded terminal status. Use `proxymock mock --grpc-streaming-immediate --in /absolute/recording --out /absolute/observed` to skip recorded waits. Imported records without timing play immediately.

Replay sends the request once, half-closes and receives the complete response sequence. It compares every message by ordinal, applies configured protobuf field ignores within each message and checks the terminal outcome. Differences identify the message ordinal and field path, such as `$.messages[1]`. Normal local replay exits unsuccessfully when a streaming comparison fails. Explicit semantic, baseline, fix and ignore-body scoring modes retain their own verdict policy.

### Bounded and partial recordings

Once a call has streamed, a stream that reaches the message budget, a body budget or the duration limit continues in a new part instead of stopping; see [long-lived streams](./long-lived-streams.md). A stream that the client cancels is kept as a [stream that the client ended](./long-lived-streams.md#streams-that-the-client-cancels). Otherwise a stream that never reached one of those limits keeps a bounded prefix when it resets, is cancelled, reaches another quota or exceeds its idle limit. A unary-shaped call that resets or never finishes is not recorded, as before. These records carry an explicit incomplete outcome and remain available for inspection. They are excluded from strict mock and replay expectations with a diagnostic; a missing status never becomes an implicit OK. A mixed replay runs its eligible calls without counting excluded calls as passing. If no eligible traffic remains, replay exits unsuccessfully.

| Limit | Default |
| --- | --- |
| Combined request and response wire bodies | 512 KiB |
| Combined decoded message payloads | 512 KiB |
| Individual framed or decoded message | 256 KiB |
| Messages across both directions | 1,024 |
| Metadata per call | 64 KiB |
| Idle time | 60 seconds |
| Call duration, or one part of a long-lived stream | 5 minutes |
| Serialized recording | Less than 1,000,000 bytes |

Connection and process capture budgets can stop a call earlier under pressure. Local request preparation also requires a half-close within one minute, and mock playback has a five-minute deadline. An unlimited watch is recorded as a sequence of [long-lived stream parts](./long-lived-streams.md).

### Recording formats and compatibility

JSON stores framed bodies and a versioned call index. Streaming Markdown uses a v3 format that lists each message in order. A message is written as editable decoded protobuf JSON, in the same field-number form as unary Markdown, when re-encoding that JSON reproduces its wire bytes exactly. Otherwise it keeps its base64 wire envelope in `frameBase64`. Unchanged files round-trip byte for byte, including compressed frames and large integers. Edit a message's values and proxymock re-encodes it and rebuilds the index, keeping message order and timing; adding or removing messages is not supported.

Use a version that understands call format 1 throughout the recording workflow. Updated readers enforce the recording directory's format requirement. Older JSON readers can ignore unknown fields, so the directory manifest does not make old binaries safe. Older Markdown readers reject streaming v3. Existing unary recordings keep their previous format and execution behavior.

Per-message stream recordings from older releases are not supported for mock or replay. They lack the request, half-close and terminal evidence a call needs, so mock and replay skip them with one warning per stream and keep loading the rest of the recording. Recapture those streams to mock or replay them.

Whole-call recordings from releases before native streaming capture already hold every message in one record. When such a record has one request and a recorded gRPC status, mock and replay import it as a complete call with unknown timing, so its messages play immediately. Any other shape keeps its previous unary behavior, and the recording files are never rewritten.

Content redaction visits every decoded message. If requested content redaction cannot safely handle an opaque or partial call, the payload is withheld and an explicit failure is recorded; local recording refuses to save that call.

### Known limits

[Client streams](./client-streaming.md) and [bidirectional calls](./bidi-streaming.md) are mocked and replayed as well. Streaming scenario generation, grpc-web streaming and kraken qualification are separate follow-up phases.

Cloud capture writers remain disabled by default until storage, cache, analyzer, responder and generator readers have been deployed together. Reader-first rollout is required before enabling `GRPC_STREAMING_ENABLED`. The local proxymock binary ships the compatible readers and writer together, so it always captures streams as calls. Bootstrap-generated recordings can include every kind of finite stream.
