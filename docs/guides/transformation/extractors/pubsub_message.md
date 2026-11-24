---
description: "Extract or rewrite the data, attributes or ordering key of one Google Pub/Sub message with the pubsub_message extractor, so a replay can publish unique business keys from every vUser."
sidebar_position: 24
---

# pubsub_message

### Purpose

**pubsub_message** extracts the data, the attributes or the ordering key of one message in a Google Pub/Sub `Publish` call. A message's data is usually JSON inside protobuf bytes, so this extractor is how a transform reaches a field such as an order ID.

It works on the `Publish` calls your app recorded, and on the publishes a replay sends when it [republishes a subscriber's deliveries](../../message-brokers/google-pubsub.md#drive-a-subscriber-by-republishing).

### Usage

```json
"extractor": {
  "type": "pubsub_message",
  "config": {
    "field": "data"
  }
}
```

| Parameter | Required | Description |
|---|---|---|
| `field` | No | `data`, `attributes` or `orderingKey`. Defaults to `data`, or to `attributes` when only `name` is set. |
| `name` | No | With `attributes`, the key of one attribute to extract instead of all of them. |
| `index` | No | The message of a publish that batches several, counting from 0. Defaults to 0. A republished delivery always holds one message. |

`data` extracts the message's bytes as they are. Chain [json_path](../transforms/json_path.md) after it to reach one field of JSON data.

`attributes` without `name` extracts every attribute as a JSON object of strings, such as `{"eventType":"created","tenant":"t1"}`. Writing back an object replaces the attributes with it.

It applies to requests only. A call that is not a native gRPC `Publish` is skipped. Only the fields you change are re-encoded; the rest of the request keeps its recorded bytes.

### Examples

Give every republished message its own order ID, so a subscriber that deduplicates on it processes each one:

```
pubsub_message(field=data) -> json_path(path="orderId") -> rand_string(pattern="ord-[a-z0-9]{12}")
```

Change one attribute:

```
pubsub_message(name=tenant) -> constant(new="load-test")
```

Read the second message of a batched publish:

```
pubsub_message(field=data,index=1) -> json_path(path="customer.id")
```

## Related

- [Google Pub/Sub](../../message-brokers/google-pubsub.md) covers capture, the subscriber mock and republish.
- [httpOutput](../../../reference/configuration/assertions/httpoutput.md#google-pubsub-publishes) compares published messages field by field.
