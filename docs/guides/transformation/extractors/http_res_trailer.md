---
description: "Learn how to extract HTTP trailers from response traffic using Speedscale's http_res_trailer extractor for effective traffic transformation and analysis."
---

# http_res_trailer

### Purpose

**http_res_trailer** extracts an HTTP trailer from the response portion of the RRPair.

### Usage

```json
"type": "http_res_trailer",
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
"type": "http_res_trailer",
"config": {
    "name": "Grpc-status"
}
```
