---
sidebar_position: 2
---

# HTTP Response Schema

Compare the runtime schema to the expected schema for HTTP response body.

This assertion checks the body of an HTTP response and identifies differences. It automatically checks for known content types like JSON and gRPC to compare key by key, if possible.  Arrays with the same key may add or remove values without failing.

If no content type is identified, the default comparison is a simple hash compare.

### Example with Ignore <a href="#example" id="example"></a>

```javascript
{
  "type": "httpResponseSchema",
  "config": {
    "ignore": "Authorization,errorCode,user.metaData.sessionId",
    "matchType": "true",
    "allowNew": "true"
  }
}
```

### Example with Include Only <a href="#configuration" id="configuration"></a>

```javascript
{
  "type": "httpResponseSchema",
  "config": {
    "includeOnly": "firstName,lastName,DOB.day,DOB.month",
    "matchType": "true",
    "allowNew": "true"
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key             | Description |
| --------------- | ------------|
| **allowNew**    | True by default, this setting allows new fields in replay traffic which did not exist in captured traffic. Field will still be marked as different, shown as red lines, but will be ignored.|
| **ignore**      | Comma-separated list of [JSON paths](https://jsonpath.com/) that will be ignored during comparison.  A key will match if it contains one of the ignored strings anywhere in the path. For example, an ignore string of `errorCode` will prevent the comparison of `foo.bar.errorCode`,`errorCode`, and `foo.errorCode.bar`from being compared.  |
| **includeOnly** | Comma-separated [JSON paths](https://jsonpath.com/) that will be included during comparison.  All other keys will be ignored. Given strings work the same as for **ignore**.|

### Notes <a href="#notes" id="notes"></a>

* gRPC payloads are first decoded into JSON using a pseudo-human readable key format.
