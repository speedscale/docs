# http_url

### Purpose

**http_url** extracts the HTTP URL from the request portion of the RRPair. If an index is specified then the path will be split into an array and the zero-indexed path segment will be returned. If no index is specified than then entire path is returned.

:::note
When setting the URL the value should be URL encoded just as it appears in the URL bar of your browser.
:::

### Usage

```json
"type": "http_url"
"config": {
    "index": "<number>"
}
```

- **index** - the index of the path segment

:::caution
If your URL starts with a `/` then that counts as the first segment. Start from index 1 if you see this.
:::

### Example

```json
"type": "http_url"
```
