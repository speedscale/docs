---
sidebar_position: 10
---

# http_status_code

### Purpose

**http_status_code** extracts the status code from the response of the RRPair. Make sure any downstream transforms produce a valid status code. If a non-numerical result is passed to this extractor it will produce an error at runtime.

### Usage

```json
"type": "http_status_code",
```

This extractor has no user configuration.

### Example

```json
"type": "http_status_code"
```
