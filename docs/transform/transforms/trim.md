# trim

### Purpose

**trim** trims the incoming string, just like your favorite programming language's TrimPrefix, TrimSuffix or TrimSpaces command.

### Usage

```json
"type": "trim",
"config": {
    "type": "<string>",
    "value": "<string>"
}
```

- **type** - either `left`, `right` or `spaces`. Left is equivalent of TrimPrefix, right=TrimSuffix and spaces=TrimSpaces (default=spaces)
- **value** - string suffix or prefix to be removed. For instance, if you want `csrf_FOO` to become `FOO` then the value would be `csrf_`

### Example

#### Configuration

```json
"type": "trim",
"config": {
    "type": "left",
    "value": "REQID_"
}
```
