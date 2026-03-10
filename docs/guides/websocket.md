---
sidebar_position: 10
title: WebSocket Testing
description: Capture, replay, and mock WebSocket connections with Speedscale.
---

# WebSocket Testing

Speedscale supports capturing, replaying, and mocking WebSocket connections alongside standard HTTP traffic. If your services use WebSockets for real-time communication — chat, live updates, streaming data — you can include those interactions in your test workflows.

## How Speedscale Captures WebSocket Traffic

WebSocket connections start as an HTTP upgrade request. Speedscale captures:

1. **The upgrade handshake** — the initial HTTP request with `Upgrade: websocket` and the server's `101 Switching Protocols` response
2. **Message frames** — individual messages sent in both directions after the connection is established
3. **Connection close** — the close frame and status code when the connection terminates

Each WebSocket session is stored as a series of RRPairs: one for the upgrade handshake, and one for each message exchange. This means you can inspect, filter, and transform WebSocket traffic using the same tools you use for HTTP.

### Capture Methods

WebSocket capture works with both capture methods:

- **Sidecar** — the proxy intercepts the upgrade request and maintains the WebSocket connection, capturing frames as they pass through
- **eBPF** — nettap observes WebSocket frames at the kernel/TLS level without proxying

### Viewing WebSocket Traffic

WebSocket traffic appears in the [Traffic Viewer](./capture/filter.md) like any other traffic. You can identify WebSocket connections by:

- The `Upgrade: websocket` request header
- The `101` status code on the handshake response
- Subsequent message frames grouped under the same connection

## Replaying WebSocket Sessions

When you replay a snapshot that contains WebSocket traffic, Speedscale:

1. Sends the upgrade handshake to the service under test
2. Sends each captured message frame in order, respecting the original timing
3. Compares the service's responses against the captured responses
4. Reports accuracy and latency for each message exchange

### Timing and Ordering

WebSocket messages are replayed in the order they were captured. The replay engine preserves the relative timing between messages — if the original client waited 500ms between messages, the replay will do the same. This is important for services that depend on message ordering or rate-based logic.

### Assertions

Response assertions work the same as HTTP traffic. Each message frame response is compared against the expected captured response. You can configure assertions to:

- Ignore fields that change between runs (timestamps, sequence numbers)
- Compare specific JSON fields in the message payload
- Assert on message count (expect a certain number of messages per session)

## Mocking WebSocket Endpoints

When your service calls a downstream WebSocket endpoint, Speedscale's responder can mock that connection:

1. The responder accepts the upgrade handshake from your service
2. When your service sends a message, the responder matches it against captured traffic and returns the appropriate response
3. The responder can also push server-initiated messages at the correct timing intervals

This means your service's WebSocket dependencies are mocked just like HTTP dependencies — using real captured traffic patterns.

### Mocking with proxymock

For local development, proxymock can mock WebSocket endpoints:

```bash
proxymock mock start \
  --in-dir ./captured-traffic \
  --port 8080
```

Your service connects to the mock server on port 8080. When it upgrades to a WebSocket connection, proxymock responds with the captured message sequence.

## Supported Frame Types

| Frame Type | Capture | Replay | Mock |
|---|---|---|---|
| Text frames | Yes | Yes | Yes |
| Binary frames | Yes | Yes | Yes |
| Ping/Pong | Yes | Yes | Yes |
| Close | Yes | Yes | Yes |

:::caution
Compression extensions (`permessage-deflate`) are supported for capture but may affect frame-level matching during replay. If you see unexpected mismatches, check whether compression settings differ between the original and replay environments.
:::

## Known Limitations

- **Long-lived connections** — WebSocket connections that stay open for hours or days will produce very large RRPair sets. Use time-bounded captures to keep snapshot sizes manageable
- **Binary protocol payloads** — binary frames are captured and replayed faithfully, but the Traffic Viewer's diff and inspection tools work best with text/JSON payloads
- **Server-initiated messages** — the mock responder supports server pushes based on captured timing, but dynamic server-push logic (e.g., push when a database row changes) cannot be simulated from captured traffic alone
- **Connection multiplexing** — if your application multiplexes multiple logical channels over a single WebSocket connection, each message is still captured individually, but Speedscale does not interpret the multiplexing protocol
