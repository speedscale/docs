# http_req_header

### Purpose

http_req_header extracts an HTTP header from the request portion of the RRPair.

### Usage

```
"type": "http_req_header",
"config": {
    "name": "<header>"
}
```

**name** - the case-sensitive name of the HTTP header to extract

### Example

```
"type": "http_req_header",
"config": {
    "name": "Authorization"
}
```
