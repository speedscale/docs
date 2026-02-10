# url_encode

### Purpose

**url_encode** transforms a plain text string into a URL encoded string. Transforms downstream of this one will work with URL encoded data. Unlike other transforms, this modification is one-way meaning that once the data is transformed, it will not be "de-encoded" when the data is re-inserted into the RRPair. It is typical to create a chain that decodes URL data using [url_decode](./url_decode.md) and then re-encodes it using this transform. URL encoding and decoding are split into two transforms so that you can decide when the re-encoding should take place.

### Usage

```json
"type": "url_encode"
```

### Example

#### Example Chains

```
req_body() -> json_path(path="user.searchTerm") -> url_encode()
```

This will extract the search term from the user object in the request body and URL encode it. Unless further transforms are added, the data re-inserted into the RRPair will remain URL encoded.

```
req_header(name="X-Custom-Data") -> url_encode()
```

This will URL encode the value from a custom header.

```
req_body() -> json_path(path="user.encodedData") -> url_decode() -> constant(new="foo") -> url_encode()
```

This will extract encoded data from the user object in the request body, URL decode it, replace it with the text "foo" and then re-encode it.

### Before and After Example

#### Configuration

```json
{
   "type": "url_encode"
}
```

#### Before (Original Values)

- **Search Term**: `hello world & special chars`
- **Custom Header Data**: `user@example.com?param=value`
- **Query Parameter**: `product name with spaces`

#### After (URL Encoded)

- **Search Term**: `hello%20world%20%26%20special%20chars`
- **Custom Header Data**: `user%40example.com%3Fparam%3Dvalue`
- **Query Parameter**: `product%20name%20with%20spaces`
