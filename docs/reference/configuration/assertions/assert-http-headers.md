---
description: "Learn how to configure HTTP header assertions in Speedscale to validate the presence of specific headers in your API responses. This documentation provides detailed guidelines and examples to effectively implement and utilize these assertions for improved API performance and reliability."
sidebar_position: 4
---

# HTTP Headers

Compare the runtime value to the expected value for HTTP cookies.

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
