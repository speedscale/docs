
# Filters

Select a subset of traffic using filters.

Speedscale provides the ability to filter traffic matching a pattern. Filters are used extensively by Speedscale during:

* **Traffic collection** - to eliminate repetitive or sensitive information like heartbeats, monitoring requests or PII
* **Snapshot creation** - to isolate a particular 3rd party service to mock or a test pattern
* **Assertions** - to tailor which tests are run for specific traffic patterns

:::info
The simplest way to build a forwarder filter is to assemble it in Traffic Viewer. Editing the JSON is a lot more work so check out the [instructions](./from-traffic-viewer) here
:::

### Storage

Filters are stored in Speedscale cloud so they can be reused. Manipulate them directly using `speedctl` commands like `get`, `put` and `delete`. To configure the Forwarder to use a filter rule insert the filter's ID in the Operator or Forwarder's `SPEEDSCALE_FILTER_RULE` environment variable.

