---
description: Select a subset of traffic using filters.
---

# Filters

Speedscale provides the ability to filter traffic matching a pattern. Filters are used extensively by Speedscale during:

* **Traffic collection** - to eliminate repetitive or sensitive information like heartbeats, monitoring requests or PII
* **Snapshot creation** - to isolate a particular 3rd party service to mock or a test pattern
* **Assertions** - to tailor which tests are run for specific traffic patterns

{% hint style="info" %}
The simplest way to build a forwarder filter is to assemble it in Traffic Viewer and then click the `Copy as JSON` button on the top right. Using this UI and checking the resultant JSON is also the easiest way to learn how filters are constructed. The rest of this section is reference material for refining existing filters.
{% endhint %}

![Click "Copy to clipboard" in the Traffic Viewer to export a Forwarder filter](<../../.gitbook/assets/image (9).png>)

### Storage

Filters are stored in Speedscale cloud so they can be reused. Manipulate them directly using `speedctl` commands like `get`, `put` and `delete`. To configure the Forwarder to use a filter rule insert the filter's ID in the Operator or Forwarder's `SPEEDSCALE_FILTER_RULE` environment variable.

