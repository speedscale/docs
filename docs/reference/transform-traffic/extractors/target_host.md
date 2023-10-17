# target_host

### Purpose

**target_host** extracts the target host, or hostname, from the RRPair.  Extracting the target host can be used to change the URL of a request during replay.  Note, this is distinct from the host header which may be different than the target host and can be extracted through the [http_req_header extractor](./http_req_header.md).


### Usage

```
"type": "target_host"
```

### Example

```
"type": "target_host",
```
