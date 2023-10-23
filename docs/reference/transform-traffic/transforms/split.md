# split

### Purpose

**split** chops a string into pieces based on a list of substring separators. This transform is most commonly used to split comma or pipe delimited strings.

### Usage

```
"type": "split",
"config": {
    "index": "zero indexed integer",
    "separator": "comma separated list"
}
```

| Key                | Description                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **index**          | zero indexed string segment to be extracted
| **separator**      | (optional) a comma delimited list of substrings to use as separators. Leave empty to split by comma.

### Example

#### Configuration

```
"type": "split",
"config": {
    "index": "1",
    "separator": "|,."
}
```

This config will split a string into segments whenever it encouters a pipe or period and extract the second string segment.

#### Input Token

```
string.splitting|is|fun
```

#### Transformed Token

`splitting`

