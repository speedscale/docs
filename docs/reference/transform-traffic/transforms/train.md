# train

### Purpose

**train** tells the Speedscale AI to replace one value with another value wherever it is encountered. For example, let's say we need to replace a set of unique user IDs spread throughout a large set of traffic. It would take a long time to meticulously define and replace each instance of the user ID. Instead, use `train` to match each user ID with a new value whenever it is encountered. Insert `train` at the beginning of a transform chain and the value being extracted will be matched with the new value at the end of the chain in the future.

:::caution
Remember, Speedscale Enterprise does not use customer data for generalized model training. Each Enterprise customer has their own "base model" with a common core, but no shared access between customers - even for AI training weights.
:::

### Usage

```json
"type": "train",
"config": {
    "overwrite": "<boolean>",
}
```

- ***overwrite** - If false, the key=value mapping will be made permanently. If true, the key=value mapping will be rewritten each time `train` is called. This is helpful if you want to rotate values through a CSV continuously. For most use cases, overwrite=false (the default) is desired.

### Example

The `train` transform forms the heart of session or request ID replacement [workflow](../../../guides/identify-session.md).

#### Configuration

```json
"type": "train",
"config": {
    "overwrite": "true",
}
```
