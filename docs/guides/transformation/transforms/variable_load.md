---
description: "Use var_load to replace tokens with values from persistent variables in Speedscale, enhancing your API testing and traffic replay capabilities."
sidebar_position: 32
---

# var_load

### Purpose

**var_load** replaces the current token with the value stored in the variable. The variable store is persistent across requests.

### Usage

```json
"type": "var_load",
"config": {
    "name": "<string>"
}
```

- **name** - name of variable to pull value from

### Example

#### Configuration

```json
"type": "var_load",
"config": {
    "name": "my_variable"
}
```