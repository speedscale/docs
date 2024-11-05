---
description: "Learn how to implement constant transformations with Speedscale to modify traffic patterns and enhance testing environments. This documentation provides a comprehensive guide to configuring and utilizing constant transformations effectively."
---

# constant

### Purpose

**constant** replaces the current token with a specified string

### Usage

```json
"type": "constant",
"config": {
    "new": "<string>"
}
```

- **new** - string to insert into token

### Example

#### Configuration

```json
"type": "constant",
"config": {
    "new": "these are not the droids you're looking for"
}
```

#### Input Token

`R2D2`

#### Transformed Token

`these are not the droids you're looking for`
