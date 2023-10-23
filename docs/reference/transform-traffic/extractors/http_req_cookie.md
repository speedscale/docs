# http_req_cookie

### Purpose

**http_req_cookie** extracts an HTTP cookie from the request portion of the RRPair.

### Usage

```
"type": "http_req_cookie",
"config": {
    "name": "<cookie>"
}
```

- **name** - the case-sensitive name of the HTTP cookie to extract

### Example

```
"type": "http_req_cookie",
"config": {
    "name": "search_index"
}
```
