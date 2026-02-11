---
sidebar_position: 10
---

# dlp_field

### Purpose

**dlp_field** redacts the current token with a string in format `REDACTED-<sha256> (pattern)`. Pattern will only be present if data pattern discovery is enabled. No DLP configuration is necessary as this transform will always redact the input field.

### Usage

```json
"type": "dlp_field"
```

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "dlp_field"
}
```

#### Example Chains

```
req_body() -> json_path(path="customerId") -> dlp_field()
```

This will extract the customerId field from the request body and redact it regardless of the DLP configuration.

```
res_body() -> json_path(path="apiKey") -> dlp_field()
```

This will extract the apiKey field from the response body and always redact it.

```
http_req_header(header="Authorization") -> dlp_field()
```

This will extract the Authorization header value from the HTTP request and redact it unconditionally.


#### Before (Original Values)

- **Social Security Number**: `123-45-6789`
- **Phone Number**: `+1-555-123-4567`
- **Email Address**: `JOHN.DOE@EXAMPLE.COM`
- **User UUID**: `4E216B8D-E6CE-4FC6-B566-D44ACB6642F4`

#### After (DLP Field Transformed)

- **Social Security Number**: `REDACTED-SSN-A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3`
- **Phone Number**: `REDACTED-PHONE_NUMBER-D0941E68D8C82D3C87D0C8E73C7D0E8A`
- **Email Address**: `REDACTED-EMAIL-8F14E45FCEEA167A5A36DEDD4BEA2543`
- **User UUID**: `REDACTED-UUID-B2291A2A7EED78CDB627354103A6EBA35D2E448C20C831ECFC7F3C3B18432F31`
