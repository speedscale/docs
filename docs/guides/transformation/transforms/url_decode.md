---
sidebar_position: 30
---

# url_decode

### Purpose

**url_decode** transforms a URL encoded string into plain text. This transform unescapes a URL encoded string by converting each 3-byte encoded substring of the form "%AB" into the hex-decoded byte 0xAB. It returns an error if any % is not followed by two hexadecimal digits. Transforms downstream of this one will work with URL decoded strings. Unlike other transforms, this modification is one-way meaning that once the data is transformed, it will not be "re-encoded" when the data is re-inserted into the RRPair. It is typical to create a chain that decodes URL data using this transform and then re-encodes it using [url_encode](./url_encode.md). URL encoding and decoding are split into two transforms so that you can decide when the re-encoding should take place.

### Usage

```json
"type": "url_decode",
```

### Example

#### Example Chains

```
req_body() -> json_path(path="user.encodedData") -> url_decode()
```

This will extract encoded data from the user object in the request body and URL decode it. Unless more transforms are added, the data re-inserted into the RRPair will be url decoded.

```
req_body() -> json_path(path="user.encodedData") -> url_decode() -> constant(new="foo") -> url_encode()
```

This will extract encoded data from the user object in the request body, URL decode it, replace it with the text "foo" and then re-encode it.

```
req_header(name="X-Encoded-Info") -> url_decode() -> json_path(path="email")
```

This will URL decode a header value and then extract the email field from the resulting JSON.

### Before and After Example

#### Configuration

```json
{
   "type": "url_decode"
}
```

#### Before (URL Encoded Values)

- **Encoded Search Term**: `hello%20world%20%26%20special%20chars`
- **Encoded Email Data**: `user%40example.com%3Fparam%3Dvalue`
- **Encoded Product Name**: `product%20name%20with%20spaces`

#### After (URL Decoded)

- **Search Term**: `hello world & special chars`
- **Email Data**: `user@example.com?param=value`
- **Product Name**: `product name with spaces`
