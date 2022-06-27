---
sidebar_position: 3
---

# HTTP Query Param

For extracting a value from a query parameter.

Use this tokenizer to extract interesting information from HTTP URL query parameters and store into tokens for use later.

### Example

```javascript
{
	"type": "http_queryparam",
	"config": {
		"prefix": "sessionId",
		"keys": "sessionId"
	}
}
```

### **Configuration**

| Key        | Description                                          |
| ---------- | ---------------------------------------------------- |
| **prefix** | Name of the variable to store the results into.      |
| **keys**   | Comma-separated list of query parameters to extract. |
