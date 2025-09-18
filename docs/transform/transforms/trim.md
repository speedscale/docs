# trim

### Purpose

**trim** trims the incoming string, just like your favorite programming language's TrimPrefix, TrimSuffix or TrimSpaces command.

### Usage

```json
"type": "trim",
"config": {
    "type": "<string>",
    "value": "<string>"
}
```

- **type** - either `left`, `right` or `spaces`. Left is equivalent of TrimPrefix, right=TrimSuffix and spaces=TrimSpaces (default=spaces)
- **value** - string suffix or prefix to be removed. For instance, if you want `csrf_FOO` to become `FOO` then the value would be `csrf_`

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "trim",
   "config": {
       "type": "left",
       "value": "REQID_"
   }
}
```

#### Example Chains

```
req_body() -> json_path(path="requestId") -> trim(type="left", value="REQID_")
```

This will extract the requestId field from the request body and remove the "REQID_" prefix.

```
http_req_header(header="X-Custom-Token") -> trim(type="right", value="_TOKEN")
```

This will extract the X-Custom-Token header value and remove the "_TOKEN" suffix.

```
res_body() -> json_path(path="message") -> trim(type="spaces")
```

This will extract the message field from the response body and remove leading and trailing whitespace.

#### Before (Original Values)

- **Request ID**: `REQID_abc123xyz789`
- **Custom Token**: `user_session_12345_TOKEN`
- **Message**: `______Welcome to our API service   `
- **CSRF Token**: `csrf_9f8e7d6c5b4a3`

#### After (Trim Transformed)

- **Request ID**: `abc123xyz789`
- **Custom Token**: `user_session_12345`
- **Message**: `Welcome to our API service`
- **CSRF Token**: `9f8e7d6c5b4a3` (with left trim of "csrf_")
