---
sidebar_position: 19
---

# variable

### Purpose

**variable** extracts or stores a value in the variable cache. The generator and responder maintain a variable cache, like a hashmap, for each request/response. The **variable** extractor is an easy way to interact with that cache.

This transform is usually used to populate variables during startup of the generator or responder (see runtime variables configuration) to be used by other transforms.

### Usage

```json
"type": "variable",
"config": {
    "variable": "<key>"
}
```

- **variable** - name of the variable to store or extract

### Example

```json
"type": "variable",
"config": {
    "variable": "bearer_value"
}
```

:::info
Remember, the current token value of the variable is loaded into&#x20;
:::
