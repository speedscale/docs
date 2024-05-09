# http_url

### Purpose

**http_url** extracts the HTTP URL from the request portion of the RRPair. If an index is specified then the path will be split into an array and the zero-indexed path segment will be returned. If no index is specified than then entire path is returned.

:::caution
If your URL starts with a `/` then that counts as the first segment. Remember to start from index 1 if you see this.
:::

### Usage

```json
"type": "http_url"
"config": {
    "index": "<number>"
}
```

- **index** - the index of the path segment

### Example

```json
"type": "http_url"
```
