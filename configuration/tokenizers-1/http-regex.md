---
description: Using a regular expression to convert data.
---

# HTTP Regex

The regular expression tokenizer can be used to capture data from and HTTP request. There are 2 ways it can be used:

* It can capture a runtime value so that it can be used later. For example, if the service provides a token of some kind that needs to be used in subsequent calls.
* It can replace a runtime value with a static string of `*` so the responder signature matching can be improved. This is needed if a UUID is sent to the responder and you get a no match.

### Example

```javascript
{
	"type": "http_regex",
	"config": {
		"applyURL": "true",
		"applyQueryParams": "false",
		"applyReqBody": "false",
		"applyResBody": "false",
		"pattern": "/carts/([0-9A-Za-z-_]{32,})/items",
		"prefix": "*"
	}
}
```

### **Configuration**

| Key                  | Description                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **applyURL**         | Set value `true` for the regex to work on the URL.                                                             |
| **applyQueryParams** | Set value `true` for the regex to work on query parameters.                                                    |
| **applyReqBody**     | Set value `true` for the regex to work on the request body.                                                    |
| **applyResBody**     | Set value `true` for the regex to work on the response body.                                                   |
| **pattern**          | Regular expression pattern to be used.                                                                         |
| **prefix**           | Put the name of the token where you would like to store this value, or `*` to replace the expression with `*`. |

