---
sidebar_position: 3
---

# Filters and Subsets

Speedscale can filter recorded traffic to prevent it from leaving your cluster. This is called a Filter and it works on the principle of exclusion.
Speedscale can also create a subset of traffic for analysis and visualization. This is called a Subset and it works on the principle of inclusion.

Both Filters and Subsets have the same semantics and JSON structure. The only difference is that for subsets, the `include` parameter is set to true and for filters it is set to `false`.

## Creating a Subset of traffic

Traffic is selected using the Subset selector at the top of the [traffic viewer](https://app.speedscale.com/analyze). As you add criteria, the subset of traffic will be narrowed down. When you have the traffic you want, you can save it as a Snapshot.

## Filtering before capture

When viewing traffic in the Traffic Viewer, you can also [create a filter](../guides/creating-filters.md) that can be [applied](/guides/creating-filters/#apply-the-filter) to the forwarder to prevent data matching that criteria from being sent to Speedscale. Common uses of this feature are filtering out montoring heartbeats, PINGs and other noise.

:::info
If you need to redact certain fields such as authorization headers or PII, you can do this using the [Data Loss Prevention](../guides/dlp.md). This is useful for when you still want to capture the traffic and replay it but not let API keys or other sensitive information leave your cluster.
:::
