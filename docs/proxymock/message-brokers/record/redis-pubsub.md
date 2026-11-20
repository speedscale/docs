---
title: Record Redis Pub/Sub traffic
sidebar_label: Redis Pub/Sub
description: "Record an app that uses Redis or Valkey Pub/Sub as a message bus with proxymock: subscriptions to channels, patterns and shard channels, and every message each subscription received."
---

# Record Redis Pub/Sub traffic

Apps that use Redis or Valkey as a lightweight message bus are recorded with their subscriptions, in RESP2 and RESP3. This covers `SUBSCRIBE`, `PSUBSCRIBE` and `SSUBSCRIBE` and their unsubscribe forms, and `PUBLISH` and `SPUBLISH`. Redis is recorded like a database, so [Redis Mocking and Replay](../../databases/record/redis.md) has the full setup; this page covers what matters for Pub/Sub.

## Record locally

Redis clients use a raw TCP protocol and ignore HTTP proxy variables, so map a local port to the server and point your app at it:

```bash
proxymock record --map 56379=redis://127.0.0.1:6379
REDIS_ADDR=127.0.0.1:56379 ./your-app
```

Start recording before your app subscribes, so the recording holds each subscription and the messages that arrive on it.

## What gets recorded

- **Each subscribe or unsubscribe command** is kept with every confirmation the server sent, one per channel or pattern.
- **Each message the server delivered** to a subscription is its own entry, named `message`, `pmessage` or `smessage`, with the channel as its location. The messages of one subscription are kept together in the order they arrived, with the time each one arrived.
- **`PUBLISH` and `SPUBLISH`** from your app are kept like any other command, with the number of subscribers the server said received the message.

In RESP3 the server can push a message between any two replies, and the recording keeps every command paired with its own reply. Other RESP3 pushes, such as client-side caching invalidations, are not recorded. When capture joins a connection that subscribed before it started, as the eBPF collector can, the messages it then sees are recorded as that subscription's.

To list what a subscriber received, filter on `(tech IS Redis) AND (command IS "message")`, or `pmessage` and `smessage` for pattern and shard subscriptions.

## In a cluster

The [eBPF collector](/reference/ebpf-traffic-collection/) and the sidecar record Redis traffic from selected workloads with no `--map` setting. See [Kubernetes capture and replay](../../databases/record/redis.md#kubernetes-capture-and-replay).

## Next

- [Mock a broker](../mock-a-broker.md#redis-pubsub)
- [Test a consumer](../test-a-consumer.md#redis-pubsub)
- [Connect to the broker](../connect-to-the-broker.md#redis)
