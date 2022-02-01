
# HTTP Match Request Body

Use this tokenizer to include the request body in a responder signature.

If your service uses POST when it calls a backend system, you may need to configure this tokenizer to make sure the request body is included in the responder signature.&#x20;

### Example

```javascript
{
	"type": "http_match_request_body",
	"config": {
		"ignores": "timestamp,uniqueid"
	}
}
```

### **Configuration**

| Key         | Description                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **ignores** | Comma-separated list of fields to ignore in the request body. Ignore dynamic fields like timestamps and unique ids. |

