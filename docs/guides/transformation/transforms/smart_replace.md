---
description: "Learn how to utilize Speedscale's Smart Replace feature to efficiently modify API responses during testing. This documentation provides clear instructions and examples for implementing traffic transforms to enhance your application's performance."
---

# smart_replace

### Purpose

**smart_replace** identifies values for smart replacement wherever they are encountered. For example, let's say we need to replace a set of unique user IDs spread throughout a large set of traffic. It would take a long time to meticulously define and replace each instance of the user ID. Instead, use `smart_replace` to match each user ID with a new value whenever it is encountered. Insert `smart_replace` at the beginning of a transform chain and the value being extracted will be matched with the new value at the end of the chain in the future.

### Usage

```json
"type": "smart_replace",
"config": {
    "overwrite": "<boolean>",
}
```

- **overwrite** - If false, the key=value mapping will be made permanently. If true, the key=value mapping will be rewritten each time `smart_replace` is called. This is helpful if you want to rotate values through a CSV continuously. For most use cases, overwrite=false (the default) is desired.

### Example

The `smart_replace` transform forms the heart of session or request ID replacement [workflow](../../identify-session.md).

### Before and After Example

#### Configuration

```json
{
   "type": "smart_replace",
   "config": {
       "overwrite": false
   }
}
```

#### Example Chains

```
smart_replace() -> req_body() -> json_path(path="userId") -> rand_string(pattern="user_[0-9]{6}")
```

This will learn to replace the userId value with a random generated string throughout all future requests.

```
smart_replace(overwrite=true) -> res_body() -> json_path(path="sessionId") -> constant(value="test_session_123")
```

This will replace the sessionId with a constant value, overwriting the mapping each time.

```
smart_replace() -> http_req_header(header="X-Request-ID") -> regex(pattern="req_([0-9]+)", captureGroup=1) -> rand_string(pattern="[0-9]{8}")
```

This will extract the numeric part of request IDs and replace them with random 8-digit numbers consistently.

#### Before (Original Values - First Pass)

- **User ID in Request**: `user_12345`
- **Session ID in Response**: `sess_abc789xyz`
- **Request ID Header**: `req_98765`
- **User ID in Later Request**: `user_12345` (same user)

#### After (Smart Replace Transformed - First Pass)

- **User ID in Request**: `user_847293` (generated replacement)
- **Session ID in Response**: `test_session_123` (constant replacement)
- **Request ID Header**: `45821736` (random 8-digit replacement)
- **User ID in Later Request**: `user_847293` (same replacement used consistently)

#### Before (Original Values - Second Pass)

- **New User ID**: `user_67890`
- **Same Session ID**: `sess_abc789xyz` (encountered again)
- **New Request ID**: `req_11223`
- **Original User ID**: `user_12345` (encountered again)

#### After (Smart Replace Transformed - Second Pass)

- **New User ID**: `user_156482` (new replacement generated)
- **Same Session ID**: `test_session_123` (same replacement used if overwrite=false, or new value if overwrite=true)
- **New Request ID**: `87654321` (new replacement generated)
- **Original User ID**: `user_847293` (previously learned replacement reused)
