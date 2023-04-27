---
title: Replace Unique IDs in Mocks
sidebar_position: 13
---

# Replace Unique Transaction (or Session) IDs

Many applications use unique transaction (or session) IDs that must be replaced accurately with new test values. This is a trivial problem for transaction IDs that are used only once since you can create a transform chain to replace that individual data with a random string. The problem becomes much more complicated when the same transaction ID is used across multiple transactions. In this tutorial we'll walk through the steps for replacing unique transaction IDs without them getting mixed up or out of order.

As an example, let's imagine an application that is adding and deleting items in a database. The request pattern might look like the following:
```
POST URL=4
POST 5
POST 6
DELETE 4
POST 7
DELETE 5
POST 8
DELETE 7
```

You can see that new items (HTTP POSTs) are being created and deleted (HTTP DELETEs) out of order in a semi-random fashion. The transaction IDs in this trivial example are stored in the URL. At replay time they need to replaced with correct new random IDs that are stored persistently.

## Prerequisites

* Create a snapshot with the transaction IDs you'd like to replace
* Identify locations where the transaction ID is used in the requests and responses (ask about our beta Automatic Token Discovery feature in [Slack](https://slack.speedscale.com) if you're having trouble)

## Modify and store new IDs

To solve this problem we make use of the [map_store](../../reference/transform-traffic/transforms/map_store/) and [map_load](../../reference/transform-traffic/transforms/map_load/) transforms. The `map_store` transform creates a mapping between the original recorded transaction ID and the modified transaction ID that you define in your transforms. Using the example above, we would make a transform chain like the following:

```
filter: operation=POST
http_url()
map_store()
random_string(random_[0-9])
```

This transform chain will extract the URL, store the original value in the internal hashmap and then replace that value with a random string of the format `random_<ID>`. The `map_store` transform captures both the original (incoming) value and the new (outgoing) value after it is turned into a random string.

:::note
Transforms are always run in order from top to bottom.
:::

## Lookup and re-use values

Now that the `<original ID>=<new ID>` mapping has been established, the random value can be used in subsequent transactions.  Using our example, we want to re-use the same transaction ID (random string) in the subsequent delete. Here is what that transform chain would look like:

```
filter: operation=DELETE
http_url()
map_load()
```

This transform chain will extract the URL, look up the transaction ID used in the original traffic and then replace it with the new value stored by `map_store`. There is no limit on how many times a value can be re-used. Optionally, data can be segmented using the "hashKey" parameter in `map_load` and `map_store`. Stored values are not currently shared between generator threads (vUsers).

## Need Help?

Reach out on the [community Slack](https://slack.speedscale.com) if you need help!
