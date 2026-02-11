---
description: "Learn how to extract HTTP trailers from request traffic using Speedscale's http_req_trailer extractor for effective traffic transformation and analysis."
sidebar_position: 6
---

# http_req_trailer

### Purpose

**http_req_trailer** extracts an HTTP trailer from the request portion of the RRPair.

### Usage

```json
"type": "http_req_trailer",
"config": {
    "name": "<trailer>",
    "index": 0
}
```

- **name** - the case-sensitive name of the HTTP trailer to extract
- **index** - (optional) specifies the query parameter when multiple query parameters with the same name are present. (zero indexed, defaults to 0)

If the trailer does not exist it will be created.

### Example

```json
"type": "http_req_trailer",
"config": {
    "name": "Grpc-status"
}
```
