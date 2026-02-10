---
description: "Discover how to utilize Base64 transformations in Speedscale to efficiently encode and decode data in your traffic flows. This documentation provides detailed guidance on implementing Base64 encoding for your applications to enhance performance and compatibility."
---

# base64

### Purpose

**base64** transforms a base64 encoded string into a raw byte slice and back again.

### Usage

```json
"type": "base64"
```

### Example

### Before and After Example

#### Configuration

```json
{
    "type": "base64"
}
```

#### Example Chains

```
req_body() -> json_path(path="encodedData") -> base64()
```

This will extract the encodedData field from the request body and decode it from base64.

```
res_body() -> json_path(path="payload") -> base64()
```

This will extract the payload field from the response body and decode it from base64.


#### Before (Base64 Encoded Values)

- **User Credentials**: `QURNSU5JU1RSQVRPUjpQQVNTV09SRDI=`
- **Session Token**: `ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJaVNrZFVWQ0o5`
- **Configuration**: `ewogICJkYXRhYmFzZSI6ICJwcm9kdWN0aW9uIiwKICAiZW5hYmxlZCI6IHRydWUKfQ==`
- **Message**: `U3BlZWRzY2FsZSBjYW4ndCB3YWl0IHRvIGhlbHAgbWUgc2F2ZSB0aW1lIGFuZCBzdG9wIHF1YWxpdHkgaXNzdWVz`

#### After (Base64 Decoded Values)

- **User Credentials**: `ADMINISTRATOR:PASSWORD2`
- **Session Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- **Configuration**: `{
  "database": "production",
  "enabled": true
}`
- **Message**: `Speedscale can't wait to help me save time and stop quality issues`
