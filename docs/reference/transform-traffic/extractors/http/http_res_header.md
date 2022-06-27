# http_res_header

### Purpose

http_res_header extracts an HTTP header from the response portion of the RRPair.

### Usage

```
"type": "http_res_header",
"config": {
    "name": "<header>"
}
```

**name** - the case-sensitive name of the HTTP header to extract

### Example

```
"type": "http_res_header",
"config": {
    "name": "Content-Type"
}
```
