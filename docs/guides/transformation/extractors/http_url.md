---
description: "Extract the HTTP URL from an RRPair request with the http_url function, and learn how to handle path segments effectively in Speedscale."
sidebar_position: 11
---

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
    "index": "<number>",
    "escaped": "<boolean>"
}
```

- **index** - the index of the path segment
- **escaped** - (optional) set to `"true"` to read and write the path in its encoded form. Use it for a value that contains a slash, such as an ARN in one path segment: the slash is written as `%2F` and stays inside its segment, and the path is split at its real segments. The default is `"false"`, which reads and writes the decoded path.

:::caution
If your URL starts with a `/` then that counts as the first segment. Start from index 1 if you see this.
:::

### Example

```json
"type": "http_url"
```

### Encoded paths

A replay sends each request path in the encoding it was recorded with, so an encoded slash (`%2F`) inside a path segment is preserved.

By default this extractor reads and writes the decoded path, in which that slash looks like a segment boundary. Set `escaped` to work with the path as it is sent:

```json
"type": "http_url",
"config": {
    "escaped": "true"
}
```

For a request recorded at `/files/a%2Fb/meta`, the default returns `/files/a/b/meta` and `escaped` returns `/files/a%2Fb/meta`. A value written with `escaped` must be path-encoded.
