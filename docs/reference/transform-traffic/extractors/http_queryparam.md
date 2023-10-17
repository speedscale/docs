# http_queryparam

### Purpose

**http_queryparam** extracts a query parameter by name.

### Usage

```
"type": "http_queryparam",
"config": {
    "name": "<parameter>",
    "index": 0
}
```

**name** - the name of the query parameter to extract
**index** - (optional) array location within sequential query parameter values (defaults to 0)

### Example

```
"type": "http_queryparam",
"config": {
    "name": "filter"
}
```
