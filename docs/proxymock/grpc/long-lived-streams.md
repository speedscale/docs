---
title: Long-lived streams
description: "Record gRPC streams that outlive the per-call limits as an ordered sequence of parts, and mock a live stream from those parts."
---

# Long-lived streams

:::note Version compatibility
These steps require a proxymock release with long-lived stream capture. Earlier releases write a stream that crosses a limit as one partial call, which mock and replay exclude.
:::

Some gRPC streams stay open for hours. A Pub/Sub StreamingPull subscriber sends one request with its subscription and then keepalives and acknowledgements while the server pushes messages. Telemetry uploads and chat streams behave the same way. `proxymock record` and `proxymock mock` capture these streams as an ordered sequence of parts, with no extra flag.

### How a stream becomes parts

A stream is recorded as one call until it reaches a per-call budget. When it reaches the message budget, the body budget or the duration window, capture closes the current part and continues the same live stream in a new part. Each part has the same budgets as a call, so memory use per stream does not grow with its length.

| Rolls over to a new part | Default |
| --- | --- |
| Messages across both directions | 1,024 per part |
| Combined request and response wire bodies | 512 KiB per part |
| Combined decoded message payloads | 512 KiB per part |
| Duration window | 5 minutes per part |

A part holds only whole messages. A message that is still arriving when a part closes moves to the next part, so no message is cut or repeated. A duration window that saw no message does not create an empty part.

The stream ends in its final part. The idle limit, 60 seconds without a message, closes the final part. So do the real end of the stream, a reset, a cancelled capture and a closed connection, each recorded as the final part's termination. When the server ended the stream with a status, the final part is a complete call with that status and its trailers.

Other limits still end the stream as a partial call: a single message over 256 KiB, metadata over 64 KiB, an unsupported encoding, a framing error, or connection and process capture budgets under pressure. A stream that ends with a status before it reaches any budget is recorded as one call, exactly as before.

### Streams that the client cancels

Subscribers such as Pub/Sub StreamingPull never half-close. They end their stream by cancelling it, which the client sends as an HTTP/2 `RST_STREAM` with the `CANCEL` or `NO_ERROR` code. Once a call has streamed, a client cancel closes its final part as a stream that the client ended, with the reset as its termination, and mock and replay use it. A stream that fits in one part is recorded as a single final part. A message cut short by the cancel is dropped, and every whole message before it is kept. In a stream that fits in one part, a reset with any other code or a reset from the server still leaves a partial call.

### How parts appear in a recording

Each part is its own record. It repeats the request and response headers of the stream, and holds the messages seen in its own window. The first part holds the opening requests. Message offsets count from the part's own timestamp. A client half-close in an earlier part shows as a half-close at the start of each later part.

Every part carries a `streamPart` object inside `grpcCall`:

```json
"streamPart": {
  "streamId": "base64 UUID of the first part",
  "index": 2,
  "final": true
}
```

`streamId` is the same for every part of one stream, and is the UUID of its first part. `index` counts from 0. `final` is set only on the part where the stream ended. A part that is not final is marked as a partial call that ended at a limit, so a release without long-lived stream capture keeps treating it as partial and excludes it, as it did before.

### Mocking a long-lived stream

A method with a long-lived stream recording is mocked message by message, like a [bidirectional call](./bidi-streaming.md). The mock stitches the parts of each stream back together in index order and serves the whole stream on one live call.

The client is matched on the opening requests of the first part: the requests recorded before its first response, or its first request when the first part has no response. A different opening request rules the stream out, and the call ends with `NOT_FOUND` when no other recording follows it.

After the opening requests, the mock sends every recorded response of every part in order. Each response goes out after the gap recorded since the previous response. Requests the client sends in between, such as keepalives and acknowledgements, are accepted and saved on the observed call without being matched, because they differ from run to run. Use `proxymock mock --grpc-streaming-immediate` to skip the recorded gaps.

When the final part ended with a status, the mock returns that status and its trailers once the client half-closes, or at once when the server ended the stream first. When the recording ended without a status, for example at the idle limit or when capture stopped, the mock keeps the stream open after the last response. A client half-close then ends the call with `OK`, and a client that cancels its stream, as a subscriber does when it shuts down, ends it without a miss.

A part that is missing from the recording ends the stitched stream at the part before it, which is then served as a stream that ended without a status. Later parts without the first part of their stream are never served.

A live stream can run as long as the recorded stream plus five minutes. The observed call that the mock saves keeps the first 1,024 messages and 512 KiB of the live stream, and is marked partial when the stream ran past that.

### Replaying a long-lived stream

Replay starts the stream from its first part. It sends the first part's requests in their recorded order, waits for the responses that part recorded, and then leaves the stream. It compares every response of the first part by ordinal. When the first part was still open, the terminal check passes if the replayed stream was also still open at that point, and fails if the server ended it with a status. Responses that arrive after the first part's last response belong to later parts and are not compared.

Later parts are not replayed as calls of their own. Replay skips them with one log line per stream, and they are not counted as failed or excluded calls.

### Known limits

- Replay follows the first part only. It does not continue the stream through later parts.
- A call that sent at most one message in each direction before the client cancelled it is not recorded, as before.
- The mock keeps up to 1,024 recordings per method for message-by-message matching, and each part counts as one recording. A stream with more parts than that is served up to the last part kept.
- After the opening requests, the mock does not match request content. A stream whose responses depend on later requests is served in its recorded order whatever the client sends.
- Cloud capture writes stream parts only when stream capture is turned on, like every native stream: the `ebpf.configuration.grpcStreaming` Helm value for eBPF capture, or the `sidecar.speedscale.com/grpc-streaming` annotation for the legacy sidecar. The local proxymock binary always captures them.
