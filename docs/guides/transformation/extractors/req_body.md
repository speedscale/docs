---
description: "Discover how to utilize extractors in Speedscale to effectively manage request bodies by extracting essential data for your traffic transformations. This documentation provides detailed guidance on implementing request body extractors to enhance your application's observability and performance."
sidebar_position: 14
---

# req_body

### Purpose

**req_body** extracts the request body of the RRPair. For HTTP requests the body will be returned as raw bytes. For non-HTTP protocols the body will be converted into a human readable JSON representation. The JSON itself can be modified by transforms and it will be re-inserted into the appropriate location within that protocol. For instance, if this extractor is applied to a GRPC message then a set of numbered fields in JSON format will be the output. You can then use a `json_path` transform to modify a field and the new value will be re-inserted.

### Usage

```json
"type": "req_body",
```

This extractor has no user configuration.

### Example

```json
"type": "req_body"
```
