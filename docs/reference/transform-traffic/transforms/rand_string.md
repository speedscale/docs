# rand_string

### Purpose

**rand_string** creates a random string that would match a particular regular expression. Most regular expression patterns are supported but for edge cases check out the [goregen](https://pkg.go.dev/github.com/zach-klippenstein/goregen) documentation. A new string is generated with every call.

### Usage

```
"type": "rand_string",
"config": {
    "pattern": "<regular expression>"
}
```

### Example

#### Configuration

```
"type": "rand_string",
"config": {
    "pattern": "user_[a-z0-9]{10,20}"
}
```

#### Input Token

```
test string
```

#### Transformed Token

`user_2mkfazc946jz5o`
