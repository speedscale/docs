---
sidebar_position: 0
---


# Filters

Select a subset of traffic using [filters](../../reference/glossary.md#filter).

Speedscale provides the ability to filter traffic matching a pattern. Filters are used extensively by Speedscale during:

* **Traffic collection** - to eliminate repetitive or sensitive information like heartbeats, monitoring requests or PII
* **Snapshot creation** - to isolate a particular 3rd party service to mock or a test pattern
* **Assertions** - to tailor which tests are run for specific traffic patterns

:::info
The simplest way to build a forwarder filter is to assemble it in Traffic Viewer. Editing the JSON is a lot more work but you can check out the [instructions](../../guides/creating-a-snapshot.md#filtering-) here
:::

## Storage

Filters are stored in Speedscale cloud so they can be reused. Manipulate them
directly using `speedctl` commands like `pull`, `edit`, `push` and `delete`. To configure
the Forwarder to use a filter rule insert the filter's ID in the Operator or
Forwarder's `SPEEDSCALE_FILTER_RULE` environment variable.

## Debugging

Use the `speedctl analyze filter` command to test your filters against a
[snapshot](../../reference/glossary.md#snapshot) to see which RRPairs will be
filtered out. This command also works with a single RRPair downloaded from the
UI.

## Advanced

Filters can be [created in the Speedscale
app](https://app.speedscale.com/filterRules/) but the UI does not provide
access to the full expressiveness of the filters.  If you're looking to do
something advanced it's best to use the advanced filter query strings [for eg](https://app.speedscale.com/filterRules/standard#filter-rule-tab-advanced).

### Filter all

If you'd like to filter all traffic by default you can use the advanced filter query strings and create a filter that looks something like this:

```
(location CONTAINS "")
```

This will filter all traffic. You can then progressively add endpoints that you do want to capture for eg.

```
(location NOT CONTAINS "/login")
```

to only capture the login endpoint. When we add another endpoint, we use the `AND` operator.

```
(location NOT CONTAINS "/login" AND location NOT CONTAINS "/signup")
```
