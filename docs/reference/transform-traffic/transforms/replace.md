# replace

### Purpose

**replace** finds and replaces a substring. The incoming string will be passed through a "replace all" where the number of replacements can be limited (default is no limit).

### Usage

```json
"type": "replace",
"config": {
    "old": "<string>",
    "new": "<string>",
    "count": "<int>"
}
```

- **old** - old value to be replaced
- **new** - new value to insert in place of old
- **count** - maximum number of replacements to make (default: -1 aka no limit)

### Example

#### Configuration

```json
"type": "replace",
"config": {
    "old": "foo",
    "new": "bar"
}
```
