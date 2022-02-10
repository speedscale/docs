# constant

### Purpose

**constant** replaces the current token with a specified string

### Usage

```
"type": "constant",
"config": {
    "new": "<string>"
}
```

**new** - string to insert into token

### Example

#### Configuration

```
"type": "constant",
"config": {
    "new": "these are not the droids you're looking for"
}
```

#### Input Token

`R2D2`

#### Transformed Token

`these are not the droids you're looking for`
