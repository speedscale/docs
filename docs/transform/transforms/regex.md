---
description: "Discover how to effectively use regular expressions with Speedscale transforms to filter and modify traffic data in your applications. This documentation provides a comprehensive guide to utilizing regex patterns for enhanced traffic transformation capabilities."
---

# regex

### Purpose

**regex** extracts the first instance of a regular expression pattern.

Validate regex patterns at https://regex101.com using the Golang flavor.

### Usage

```json
"type": "regex",
"config": {
    "pattern": "<regular expression>"
    "captureGroup": "<int>"
}
```

| Key              | Description |
| ---------------- | ------------|
| **pattern**      | Regular expression pattern to match against.
| **captureGroup** | (optional) Capture group to use when capture groups are defined.  Capture groups start at 1.  By default capture groups may be used but no one group will be selected.

### Example 1

#### Configuration

```json
"type": "regex",
"config": {
    "pattern": "\d{4}(-\d{2}){0,2}$"
}
```

:::note
Notice how capture groups are used in the regex pattern but no specific capture group is selected since `captureGroup` is omitted.
:::

#### Input Token

```
filter=(contains(subject, 'order') and ReceivedDateTime ge 2021-04-19
```

#### Transformed Token

`2021-04-19`

### Example 2

#### Configuration

```json
"type": "regex",
"config": {
    "pattern": "location/(.*)/info"
    "captureGroup": 1
}
```

#### Input Token

```
/location/Miami/info
```

#### Transformed Token

`Miami`
