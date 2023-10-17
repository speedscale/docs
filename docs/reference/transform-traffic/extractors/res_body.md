# res_body

### Purpose

**res_body** extracts the request body of the RRPair. For HTTP requests the response body will be returned as raw bytes. For non-HTTP protocols the body will be converted into a human readable JSON representation. The JSON itself can be modified by transforms and it will be re-inserted into the appropriate location within that protocol. For instance, if this extractor is applied to a GRPC message then a set of numbered fields in JSON format will be the output. You can then use a `json_path` transform to modify a field and the new value will be re-inserted.

### Usage

```
"type": "res_body",
```

This extractor has no user configuration.

### Example

```
"type": "res_body"
```
