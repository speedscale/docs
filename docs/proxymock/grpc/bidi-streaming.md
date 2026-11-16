---
title: Native bidirectional streaming
description: "Record native gRPC bidirectional streams, mock an interactive client message by message and replay both directions in their recorded order."
---

# Native bidirectional streaming

:::note Version compatibility
These steps require a proxymock release with native bidirectional streaming. Earlier releases exclude bidirectional calls from mock and replay.
:::

A bidirectional RPC lets the client and the server send messages on one call in any order. Chat, collaborative editing, telemetry with acknowledgements and many agent protocols work this way. `proxymock record` and `proxymock mock` capture these calls with no extra flag, under the same rules, limits and recording formats as [server streams](./server-streaming.md).

A recorded call is bidirectional when it sends several messages in each direction, or when a request was recorded after a response, as when the server speaks first. Once a method has a bidirectional recording, mock and replay treat all of that method's recordings as bidirectional.

### Mocking a bidirectional call

The mock answers a bidirectional call as its messages arrive, instead of waiting for the client to half-close. Every recording of the method starts as a candidate. Each request the client sends narrows the candidates to the recordings whose request at that position has the same decoded fields. Each recorded response is sent once the requests recorded before it have arrived, after the gap recorded before it, so a client that waits for a reply before it sends again gets that reply. A response the server sent first is sent at once. Use `proxymock mock --grpc-streaming-immediate` to skip the recorded gaps.

When the client half-closes and every recorded message has been exchanged, the mock returns the recorded status and trailers. A changed message, an extra message or a missing message that no recording follows ends the call with `NOT_FOUND` at the point where it left the recordings, and the observed call is saved as a miss.

Two recordings can match every request so far and still differ in their next response, for example when the response carries a timestamp. The mock waits briefly in case the client sends another request that tells them apart. If it does not, the mock sends the response from the recording loaded first, every time, and notes the choice on the observed call.

Request transforms, signature transforms, chaos and passthrough do not apply to bidirectional calls. The mock compares each request message by its decoded fields only.

### Replaying a bidirectional call

Replay follows the recorded order of messages in both directions. It sends each request after the responses recorded before it have arrived, then waits the gap recorded before the request. It half-closes after the last request and receives until the terminal status. Replay compares every response by ordinal and checks the terminal outcome, the same way as for server streams.

If an expected response does not arrive, replay waits up to four times the gap recorded before it, at least 250 milliseconds and at most the request timeout, then sends the rest of the conversation. The comparison then reports the missing response, and a changed or extra response is reported by its ordinal and field path.
