---
sidebar_position: 1
---

# HTTP Response Body

Compare the runtime value to the expected value for HTTP response body.

This assertion checks the body of an HTTP response and identifies differences. It automatically checks for known content types like JSON and gRPC to compare key by key, if possible.

If no content type is identified, the default comparison is a simple hash compare.

:::note
By default the response body assertion will allow new fields which did not exist in captured traffic.  See `allowNew` for details.
:::

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

| Key             | Description |
| --------------- | ------------|
| **allowNew**    | True by default, this setting allows new fields in replay traffic which did not exist in captured traffic. Field will still be marked as different, shown as red lines, but will be ignored.  Arrays may add, but not change or remove values.|
| **ignore**      | Comma-separated list of [JSON paths](https://jsonpath.com/) that will be ignored during comparison.  A key will match if it contains one of the ignored strings anywhere in the path. For example, an ignore string of `errorCode` will prevent the comparison of `foo.bar.errorCode`,`errorCode`, and `foo.errorCode.bar`from being compared.  |
| **includeOnly** | Comma-separated [JSON paths](https://jsonpath.com/) that will be included during comparison.  All other keys will be ignored. Given strings work the same as for **ignore**.|
| **matchAll**    | Fields that do not match will still be marked as different, shown as red lines, but all lines will be ignored.|
| **matchType**   | Keys will be compared and value types will be compared.  For example, a in the expected payload and a string in the actual payload will pass but an int will fail.

### Notes <a href="#notes" id="notes"></a>

* gRPC payloads are first decoded into JSON using a pseudo-human readable key format.
