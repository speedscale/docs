---
title: Native client streaming
description: "Record native gRPC client streams, mock them by their whole ordered request sequence and replay every request with its recorded spacing."
---

# Native client streaming

:::note Version compatibility
These steps require a proxymock release with native client streaming. Releases with only [native server streaming](./server-streaming.md) exclude client-streaming calls from mock and replay.
:::

A client-streaming RPC sends any number of request messages, half-closes, and gets one response or an error. Uploads, batched writes and telemetry senders usually work this way. `proxymock record` and `proxymock mock` capture these calls with no extra flag, under the same rules, limits and recording formats as [server streams](./server-streaming.md).

A recorded call with any number of requests and at most one response is a client stream. A call that sends several messages in each direction is [bidirectional](./bidi-streaming.md).

### Mocking a client stream

The mock reads the client's whole request stream up to its half-close before it matches. It matches the host, the full method and every request message in order, so the recording is chosen by the complete sequence and never by the first message alone. A prefix of the recorded sequence, a reordered sequence, a changed message or an extra message is a different call: it misses the recording, as any unmatched request does. A client stream that sends no messages matches a recording that also has none.

On a match, the mock returns the recorded response, metadata, terminal status and trailers. An error the server returned without a response is returned the same way.

The request stream must half-close within one minute and stay within the streaming limits.

### Replaying a client stream

Replay sends every recorded request in order and keeps the gaps between them as recorded, because a service can answer by when messages arrive. Requests recorded without timing are sent at once. Replay then half-closes and receives the response and terminal status, and compares them the same way as a server stream's. If the service ends the call before every request is sent, for example by rejecting a message, replay stops sending and records the status the service returned.

A changed request sequence shows up in the comparison when the service answers it differently. For example, dropping a request from a recorded upload changes the count the service returns, and the replay fails on that response.
