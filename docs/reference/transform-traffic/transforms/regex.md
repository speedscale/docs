# regex

### Purpose

**regex** extracts the first instance of a regular expression pattern. Most regular expression patterns are supported but for edge cases check out Go's [regexp](https://pkg.go.dev/regexp) documentation.

### Usage

```json
"type": "regex",
"config": {
    "pattern": "<regular expression>"
}
```

### Example

#### Configuration

```json
"type": "regex",
"config": {
    "pattern": "\d{4}(-\d{2}){0,2}$"
}
```

#### Input Token

```
filter=(contains(subject, 'order') and ReceivedDateTime ge 2021-04-19
```

#### Transformed Token

`2021-04-19`
