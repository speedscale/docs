---
sidebar_position: 10
title: WebSocket Testing
description: Capture, replay, and mock WebSocket connections with Speedscale.
---

# WebSocket Testing

Speedscale supports capturing, replaying, and mocking WebSocket connections alongside standard HTTP traffic. If your services use WebSockets for real-time communication, such as chat, live updates, or streaming data, you can include those interactions in your test workflows.

## How Speedscale captures WebSocket traffic

WebSocket connections start as an HTTP upgrade request. Speedscale captures:

1. **The upgrade handshake:** the initial HTTP request with `Upgrade: websocket` and the server's `101 Switching Protocols` response
2. **Message frames:** individual messages sent in both directions after the connection is established
3. **Connection close:** the close frame and status code when the connection terminates

Each WebSocket session is stored as a series of RRPairs: one for the upgrade handshake, and one for each message exchange. This means you can inspect, filter, and transform WebSocket traffic using the same tools you use for HTTP.

### Capture methods

WebSocket capture works with both capture methods:

- **Sidecar:** the proxy intercepts the upgrade request and maintains the WebSocket connection, capturing frames as they pass through
- **eBPF:** nettap observes WebSocket frames at the kernel/TLS level without proxying

### Viewing WebSocket traffic

WebSocket traffic appears in the [Traffic Viewer](./capture/filter.md) like any other traffic. You can identify WebSocket connections by:

- The `Upgrade: websocket` request header
- The `101` status code on the handshake response
- Subsequent message frames grouped under the same connection

## Replaying WebSocket sessions

When you replay a snapshot that contains WebSocket traffic, each virtual user opens its own WebSocket sessions with the service under test:

1. The upgrade handshake is sent with the recorded path, query string, headers and subprotocols. The client sets a fresh `Sec-WebSocket-Key`, version and extensions. When the test config honors `Set-Cookie`, the handshake sends the cookies the service set earlier in the replay in place of the recorded ones, as HTTP requests do.
2. Each recorded client message is sent with its recorded type (text, binary or close).
3. For each recorded server message, the replay reads the next message the service sends and keeps it as that message's response, so the report compares what the service sent now with what it sent when it was recorded.
4. When the recording closes the session, the replay sends the close and waits for the service's closing reply.

A server message of the wrong type, a close the recording did not have, or no message within the request timeout fails that message. Pings and pongs are not replayed, because the WebSocket client answers them itself.

Server messages are matched to recorded ones in order. A service that sends a message the recording did not have, such as an unprompted status update, shifts every later comparison in that session.

### Replay with proxymock

Record your service's inbound WebSocket traffic, then replay it against the service:

```bash
proxymock record --app-port 8080
proxymock replay --in proxymock/recorded-<timestamp> --test-against http://localhost:8080
```

Use `--test-against https://...` for a service that accepts `wss://` connections.

### Load testing

Each virtual user replays the recorded sessions on its own connections, so `--vus` runs that many sessions at once:

```bash
proxymock replay --in proxymock/recorded-<timestamp> --test-against http://localhost:8080 --vus 50 --for 5m
```

Connection count and message fan-out are where real-time services usually fail under load, so watch the handshake latency and the failure column as the virtual users ramp up.

### Timing and ordering

WebSocket messages are replayed in the order they were captured. The replay engine preserves the relative timing between messages. If the original client waited 500ms between messages, the replay will do the same. This is important for services that depend on message ordering or rate-based logic.

### Assertions

Response assertions work the same as HTTP traffic. Each server message is compared against the captured one. Every message in a session shares the session's path, so a field that varies from message to message in the recording, such as an echoed value or a counter, is treated as volatile when comparing, while a change to a field that is the same in every message fails the comparison. You can configure assertions to:

- Ignore fields that change between runs (timestamps, sequence numbers)
- Compare specific JSON fields in the message payload
- Assert on message count (expect a certain number of messages per session)

## Mocking WebSocket endpoints

When your service calls a downstream WebSocket endpoint, Speedscale's responder can mock that connection:

1. The responder accepts the upgrade handshake from your service
2. When your service sends a message, the responder matches it against captured traffic and returns the appropriate response
3. The responder can also push server-initiated messages at the correct timing intervals

This means your service's WebSocket dependencies are mocked just like HTTP dependencies, using real captured traffic patterns.

### Mocking with proxymock

For local development, record a WebSocket session through proxymock:

```bash
proxymock record --out ./ws-recording --out-format json
```

Configure the client to send its HTTP and WebSocket traffic through proxymock, then exercise the connection. Include a server message sent immediately after connection, a text message, and a binary message if your app uses both. Stop the recording after the WebSocket connection closes.

Replay the session with passthrough disabled:

```bash
proxymock mock --in ./ws-recording --out ./ws-results --no-passthrough
```

Point the client at the mock proxy and repeat the same interaction. Disabling passthrough makes the test fail if a request is not served from the recording.

Each replayed WebSocket connection performs a fresh upgrade handshake. proxymock calculates `Sec-WebSocket-Accept` from the `Sec-WebSocket-Key` sent by the current client, so a new client can connect without reusing the handshake value from the recording. Verify that the client receives a `101 Switching Protocols` response, then receives the captured server message and responses to its text or binary messages.

## Supported frame types

| Frame Type | Capture | Replay | Mock |
|---|---|---|---|
| Text frames | Yes | Yes | Yes |
| Binary frames | Yes | Yes | Yes |
| Ping/Pong | Yes | Answered by the client | Yes |
| Close | Yes | Yes | Yes |

:::caution
Compression extensions (`permessage-deflate`) are supported for capture but may affect frame-level matching during replay. If you see unexpected mismatches, check whether compression settings differ between the original and replay environments.
:::

## Known limitations

- **Long-lived connections:** WebSocket connections that stay open for hours or days will produce very large RRPair sets. Use time-bounded captures to keep snapshot sizes manageable
- **Binary protocol payloads:** binary frames are captured and replayed faithfully, but the Traffic Viewer's diff and inspection tools work best with text/JSON payloads
- **Server-initiated messages:** the mock responder supports server pushes based on captured timing, but dynamic server-push logic (e.g., push when a database row changes) cannot be simulated from captured traffic alone
- **Connection multiplexing:** if your application multiplexes multiple logical channels over a single WebSocket connection, each message is still captured individually, but Speedscale does not interpret the multiplexing protocol
- **Variable frame boundaries or order:** replay matches the captured WebSocket frames. If a client batches, splits, or reorders messages differently between runs, the frames may not match even when the combined application payload is equivalent. proxymock does not parse application protocols such as GraphQL over WebSocket to reconstruct stateless request/response exchanges. Replay is most predictable when the client sends the same messages with the same frame boundaries and order.
