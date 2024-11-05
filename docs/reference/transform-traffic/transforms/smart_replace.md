---
description: "Learn how to utilize Speedscale's Smart Replace feature to efficiently modify API responses during testing. This documentation provides clear instructions and examples for implementing traffic transforms to enhance your application's performance."
---

# smart_replace 

### Purpose

**smart_replace** identifies values for smart replacement wherever they are encountered. For example, let's say we need to replace a set of unique user IDs spread throughout a large set of traffic. It would take a long time to meticulously define and replace each instance of the user ID. Instead, use `smart_replace` to match each user ID with a new value whenever it is encountered. Insert `smart_replace` at the beginning of a transform chain and the value being extracted will be matched with the new value at the end of the chain in the future.

### Usage

```json
"type": "smart_replace",
"config": {
    "overwrite": "<boolean>",
}
```

- **overwrite** - If false, the key=value mapping will be made permanently. If true, the key=value mapping will be rewritten each time `smart_replace` is called. This is helpful if you want to rotate values through a CSV continuously. For most use cases, overwrite=false (the default) is desired.

### Example

The `smart_replace` transform forms the heart of session or request ID replacement [workflow](../../../guides/identify-session.md).

#### Configuration

```json
"type": "smart_replace",
"config": {
    "overwrite": "true",
}
```
