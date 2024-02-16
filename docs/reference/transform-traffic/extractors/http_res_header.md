# http_res_header

### Purpose

**http_res_header** extracts an HTTP header from the response portion of the RRPair.

### Usage

```
"type": "http_res_header",
"config": {
    "name": "<header>",
    "index": 0
}
```

- **name** - the case-sensitive name of the HTTP header to extract
- **index** - (optional) specifies the query parameter when multiple query parameters with the same name are present. (zero indexed, defaults to 0)

If the header does not exist it will be created.

### Example

```
"type": "http_res_header",
"config": {
    "name": "Content-Type"
}
```
