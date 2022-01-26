---
description: Compare the runtime value to the expected value for HTTP cookies.
---

# HTTP Headers

This assertion checks the headers of an HTTP response and checks whether they match the expected value.

### Example <a href="#example" id="example"></a>

```javascript
{ 
  "type": "httpHeaders",
  "config": {
    "headers": "content-encoding,content-type"
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key         | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| **headers** | Comma-separated headers that will be compared at replay time. |
