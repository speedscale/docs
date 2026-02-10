# scrub

**scrub** replaces the incoming string with a new value. This works similar to [scrub_date](./scrub_date.md) in that it does a find/replace on the current RRPair. This is typically used to "blank out" rotating values like request IDs in a responder signature match. Using this transform will increase your match rate.

If you want the responder to learn the new value as a replacement for the old value before blanking it out you should insert *smart_replace_recorded* before using this transform. The combination of those transforms will cause the responder to learn that the new incoming value should replace the old value in subsequent RRPairs while also blanking it out in the current request to improve the match rate.

### Usage

```json
"type": "scrub",
"config": {
    "ignorePaths": "<comma separated list of keys>",
    "new": "<optional, defaults to *>"
}
```

:::tip
ignorePaths only requires a string match - it is not a full JSONPath. That means if you want to ignore nested key called "foo" you don't need to enter the full JSONPath (ex: some.nested.key.foo), you only need to enter foo.
:::

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "scrub",
   "config": {
       "ignorePaths": "userId,version",
       "new": "REDACTED"
   }
}
```

#### Example Chains

```
req_body() -> json_path(path="requestId") -> scrub()
```

This will extract the requestId field from the request body and replace it with "*".

```
res_body() -> scrub(ignorePaths="metadata,audit", new="HIDDEN")
```

This will scrub all values in the response body JSON except those in fields containing "metadata" or "audit", replacing them with "HIDDEN".

```
http_req_header(header="Authorization") -> scrub(new="[TOKEN]")
```

This will extract the Authorization header value and replace it with "[TOKEN]".

#### Before (Original Values)

- **Request ID**: `req_abc123xyz789`
- **Response Body**: `{"data": {"sessionId": "sess_456def", "token": "jwt_789ghi", "metadata": {"version": "1.0", "build": "123"}}, "audit": {"timestamp": "2021-04-19"}}`
- **Authorization Header**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Mixed Content**: `Request ID: req_abc123xyz789, User: user_789, Version: v1.2.3`

#### After (Scrub Transformed)

- **Request ID**: `*`
- **Response Body**: `{"data": {"sessionId": "HIDDEN", "token": "HIDDEN", "metadata": {"version": "1.0", "build": "123"}}, "audit": {"timestamp": "2021-04-19"}}` (metadata and audit ignored)
- **Authorization Header**: `[TOKEN]`
- **Mixed Content**: `REDACTED` (entire content replaced)
