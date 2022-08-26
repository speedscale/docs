---
sidebar_position: 3
---

# Filtering Traffic

Speedscale can filter traffic at either at capture time or after capturing traffic. Both methods use the same filter semantics.

## Filtering after capture

When viewing traffic in the Traffic Viewer, you can [create a filter](../guides/creating-filters/index.md). You can use these filters for exploring, for eg. only looking at outbound traffic to a certain host. You can also use them for filtering out traffic when [creating a snapshot](../guides/creating-a-snapshot.md), for eg. ignoring inbound requests of a certain type, let's say ignoring all HTTP POSTs.

## Filtering before capture

The Operator can be configured to not capture certain traffic using similar criteria. This requires configuration detailed [here](../reference/filters/README.md). This is useful in cases where you have meaningless traffic that will never be useful to view or replay. This can include things like health checks, monitoring agent checks, security scanners, etc.

:::info
If you need to redact certain fields such as authorization headers or PII, you can do this using the [Data Loss Prevention](../reference/dlp.md). This is useful for when you still want to capture the traffic and replay it but not let API keys or other sensitive information leave your cluster.
:::
