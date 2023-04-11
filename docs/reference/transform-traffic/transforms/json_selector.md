# json_selector

**json_selector** extracts an element from a JSON document, much like
[json_path](./json_path.md), but using a recursive match rather than a full
static path.  This is especially useful when the JSON path may change slightly
between requests.  Use this transform to find a JSON path dynamically and a
subsequent transform to change a token in an adjacent field.

The input token must be a JSON document.

### Configuration

The config supports the following fields:

| Key              | Description |
| ---------------- | ----------- |
| match (required) | A full or partial JSON path, optionally containing a value to match. If the path contains an equal sign with a value the path will only match if the value matches the JSON document. If no value is given the path will match if it exists. |
| recursive        | If true, allows the match path to be partial instead of requiring a full path from the document root. |
| levelsUp         | The number of levels to move up from the matched JSON path. |

:::note
Only one JSON path may be matched.  Make a feature request if you need more.
:::

### Example - Key Existence

#### Configuration

```
"type": "json_path",
"config": {
    "match": "nick_name",
    "recursive": "true",
    "levelsUp": "1"
}
```

- `match` means look for the existence of a value at path `nick_name`
- `recursive` means look anywhere in the document
- `levelsUp` means extract the token from 1 level above the match


#### Input Token

```
{
    "people": {
        "2ba4Cd4": {
            "first_name": "john",
            "last_name": "smith",
            "nick_name": "johnny"
        }
        "a59dFc1": {
            "id": 7592,
            "first_name": "steve",
            "last_name": "mould"
        }
    }
}
```

#### Transformed Token

```
{
    "id": 7592,
    "first_name": "steve",
    "last_name": "mould"
}
```

### Example - Key Value Match

#### Configuration

```
"type": "json_path",
"config": {
    "match": "address.zip=30303",
    "recursive": "true",
    "levelsUp": "2"
}
```

- `match` means look for the path `address.zip` where the value is `30303`
- `recursive` means look anywhere in the document
- `levelsUp` means extract the token from 2 levels above the match

#### Input Token

```
{
    "people": {
        "2ba4Cd4": {
            "first_name": "john",
            "last_name": "smith",
            "address": {
                "street": "123 Placid St.",
                "state": "CA",
                "zip": 90210
            }
        }
        "a59dFc1": {
            "id": 7592,
            "first_name": "steve",
            "last_name": "mould",
            "address": {
                "street": "701 Loop Circle",
                "state": "GA",
                "zip": 30303
            }
        }
    }
}
```

#### Transformed Token

```
{
    "id": 7592,
    "first_name": "steve",
    "last_name": "mould",
    "address": {
        "street": "701 Loop Circle",
        "state": "GA",
        "zip": 30303
    }
}
```
