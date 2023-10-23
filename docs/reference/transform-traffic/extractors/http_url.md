# http_url

### Purpose

**http_url** extracts the HTTP URL from the request portion of the RRPair. If an index is specified then the path will be split into an array and the zero-indexed  path segment will be returned. If no index is specified than then entire path is returned.

### Usage

```
"type": "http_url"
"config": {
    "index": "<number>"
}
```

**index** - the index of the path segment

### Example

```
"type": "http_url"
```
