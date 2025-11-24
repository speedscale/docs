---
description: "Learn how to use the delete_sig transform in Speedscale to remove specific components from request signatures, improving match rates and replay flexibility by selectively excluding signature elements."
---

# delete_sig

### Purpose

**delete_sig** completely deletes a component of the signature to improve match rates. This transform removes a specified key from the signature's hashmap, allowing you to exclude certain elements that may be causing match failures during replay.

To learn more about how signatures work and when to use this transform, read the [Signature Refinement Guide](../../../guides/signature-refinement-guide.md).

### Usage

```json
"type": "delete_sig",
"config": {
    "key": "<string>"
}
```

- **key** - the key in the signature's hashmap to delete

### Example

### Before and After Example

#### Configuration

```json
{
    "type": "delete_sig",
    "config": {
        "key": "<signature key to delete>"
    }
}
```

#### Example Chains

```
empty() -> delete_sig(key="http:method")
```

This will delete the HTTP method from the request signature.

```
empty() -> delete_sig(key="http:url")
```

This will delete the endpoint component from the signature, allowing requests with different endpoints to match this signature.


#### Before (Signature with All Components)

```json
{
    "http:method": "POST",
    "http:url": "/api/v1/orders",
    "http:requestBodyJSON": "timestamp=1234567890|session=abc123",
    "content_type": "application/json",
    "body_hash": "a8f5f167f44f4964e6c998dee827110c"
}
```

#### After (Signature with http:requestBodyJSON Deleted)

```json
{
    "http:method": "POST",
    "http:url": "/api/v1/orders",
    "content_type": "application/json",
    "body_hash": "a8f5f167f44f4964e6c998dee827110c"
}
```

By removing the `http:requestBodyJSON` component, requests with different request bodies will now match the same signature, improving replay match rates.
