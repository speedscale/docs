---
description: "Extract HTTP headers from requests using the http_req_header function in Speedscale to enhance your API testing and traffic replay capabilities"
sidebar_position: 5
---

# http_req_header

### Purpose

**http_req_header** extracts an HTTP header from the request portion of the RRPair.

### Usage

```json
"type": "http_req_header",
"config": {
    "name": "<header>",
    "index": 0
}
```

- **name** - the case-sensitive name of the HTTP header to extract
- **index** - (optional) specifies the query parameter when multiple query parameters with the same name are present. (zero indexed, defaults to 0)

If the header does not exist it will be created.

### Example

```json
"type": "http_req_header",
"config": {
    "name": "Authorization"
}
```
