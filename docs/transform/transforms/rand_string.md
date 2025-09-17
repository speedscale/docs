---
description: "Learn how to use Speedscale's Rand String transform to generate random string values within your traffic transformations, enhancing the flexibility and realism of your testing scenarios. This documentation provides detailed instructions and examples to help you implement this powerful feature effectively."
---

# rand_string

### Purpose

**rand_string** creates a random string that would match a particular regular expression. Most regular expression patterns are supported but for edge cases check out the [goregen](https://pkg.go.dev/github.com/zach-klippenstein/goregen) documentation. A new string is generated with every call.

### Usage

```json
"type": "rand_string",
"config": {
    "pattern": "<regular expression>"
}
```

### Example

### Before and After Example

#### Configuration

```json
{
   "type": "rand_string",
   "config": {
       "pattern": "user_[a-z0-9]{10,20}"
   }
}
```

#### Example Chains

```
req_body() -> json_path(path="userId") -> rand_string(pattern="user_[a-z0-9]{10,20}")
```

This will extract the userId field from the request body and replace it with a random string matching the pattern.

```
res_body() -> json_path(path="sessionId") -> rand_string(pattern="[A-Z0-9]{32}")
```

This will extract the sessionId field from the response body and replace it with a random 32-character alphanumeric string.

```
http_req_header(header="X-Request-ID") -> rand_string(pattern="req_[0-9]{16}")
```

This will extract the X-Request-ID header value and replace it with a random request ID pattern.

#### Before (Original Values)

- **User ID**: `user_john_doe_123`
- **Session ID**: `ABC123XYZ789DEF456GHI789JKL012MN`
- **Request ID**: `req_1234567890123456`
- **Email**: `john.doe@example.com`

#### After (Random String Generated)

- **User ID**: `user_2mkfazc946jz5o`
- **Session ID**: `K8J3H7F9D2S1A6Q4Z9X8C7V5B3N1M0P2`
- **Request ID**: `req_8765432109876543`
- **Email**: `user847@testdomain92.co`
