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

| Key         | Description |                                                                                                                                                                                          |
| ----------- | ------------|
| **old**     | Old value to be replaced.
| **new**     | New value to insert in place of old.
| **count**   | (optional) Maximum number of replacements to make. Defaults to no limit.

### Example

#### Configuration

```json
"type": "replace",
"config": {
    "old": "foo",
    "new": "bar"
}
```
