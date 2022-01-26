---
description: Compare the runtime value to the expected value for HTTP response body.
---

# HTTP Response Body

This assertion checks the body of an HTTP response and identifies differences. It automatically checks for known content types like JSON and gRPC to compare key by key, if possible.

If no content type is identified, the default comparison is a simple hash compare.

### Example with Ignore <a href="#example" id="example"></a>

```javascript
{
  "type": "httpResponseBody",
  "config": {
    "ignore": "Authorization,errorCode,user.metaData.sessionId"
  }
}
```

### Example with Include Only <a href="#configuration" id="configuration"></a>

```javascript
{
  "type": "httpResponseBody",
  "config": {
    "includeOnly": "firstName,lastName,DOB.day,DOB.month"
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key             | Description                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ignore**      | Comma-separated list of JSON Paths that will be ignored during comparison.  A key will match if it contains one of the ignored strings anywhere in the path. For example, an ignore string of `errorCode` will prevent the comparison of `foo.bar.errorCode`,`errorCode`, and `foo.errorCode.bar`from being compared.  |
| **includeOnly** | Comma-separated JSON Paths that will be included during comparison.  All other keys will be ignored. Given strings work the same as for **ignore**.                                                                                                                                                                    |

### Notes <a href="#notes" id="notes"></a>

* gRPC payloads are first decoded into JSON using a pseudo-human readable key format.
