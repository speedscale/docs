---
description: "Explore the CLI Documentation for ProxyMock to learn how to record, mock, and replay API traffic efficiently in local and CI/CD environments with Speedscale integration"
sidebar_position: 1
---

# CLI Documentation

## Overview

`proxymock` enables you to record, visualize, mock, and replay traffic on your local system.

For complete getting started instructions, see [Quickstart CLI](../getting-started/quickstart/quickstart-cli.md). To learn how it works, see [Architecture](/proxymock/how-it-works/architecture/). For the full command list, flags, subcommands, and examples, see [proxymock CLI reference](../../reference/proxymock-cli-reference.md).

`proxymock` can record, mock, and replay locally for free, and it also works with Speedscale Enterprise to record from remote systems such as Kubernetes clusters and integrate into CI/CD workflows.

## Recommended workflow

Most users will want to:

1. Use `proxymock record` to start recording.
2. Start the app with the appropriate proxy environment variables set, or let `proxymock` wrap the app directly.
3. Exercise the app so it calls remote systems.
4. Inspect the traffic you recorded with `proxymock inspect`.
5. Run `proxymock mock` to serve mock responses.
6. Exercise the app again against the mock server, or replay captured traffic with `proxymock replay`.

## Core commands

- `proxymock record` captures inbound and outbound traffic as RRPair files.
- `proxymock mock` serves mock responses for outbound traffic.
- `proxymock replay` sends recorded test traffic back to your app.
- `proxymock inspect` opens the TUI for exploring recorded traffic.

## How it works

`proxymock` records and mocks traffic by running smart proxies that store and forward requests and responses.

- `record` creates an inbound proxy in front of your app and an outbound proxy behind it.
- `mock` creates the outbound proxy used to match requests and return mock responses.
- `replay` acts as the client and sends captured requests back to your app.

## Proxy behavior and caveats

When a proxy connection arrives, the requested destination or host is checked against the mocked endpoints contained in the loaded mock data. If the destination is known, the request is routed to the appropriate responder. If it is not known, the request bypasses the responder and goes directly to the intended endpoint.

You will see this behavior in proxymock output as:

- `MATCH` - the request matched a known mock endpoint
- `PASSTHROUGH` - the request bypassed the responder and went to the real endpoint

Choosing between HTTP and SOCKS proxying is application-specific. For mocks that contain only HTTP or HTTPS traffic, use the HTTP proxy:

```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
export grpc_proxy=http://$(hostname):4140
```

To capture database traffic, use the SOCKS proxy:

```bash
export all_proxy=socks5h://localhost:4140
```

If proxy environment variables are not enough for your client, use `--map` and point your app at the mapped local port instead.

See [Language Reference](/proxymock/getting-started/language-reference/) for language-specific examples.

## Testing mock responses with curl

When testing mock responses with `curl`, use `-k` / `--insecure` to trust the responder certificate and `-x` / `--proxy` to send the request to the responder without changing the request hostname.

```bash
curl -k -x http://localhost:4140 https://example.com/path/to/resource
```

You can also send `curl` requests directly to the provider endpoints that `proxymock mock` starts and skip the proxy flag entirely. Use the ports printed when `proxymock mock` starts to find those endpoints.

## Full CLI reference

For the full command reference, see [proxymock CLI reference](../../reference/proxymock-cli-reference.md).
