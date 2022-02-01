---
sidebar_position: 2
---

# HTTP Cookie Tokenizer

If your application sets cookies and the client needs to use them, this will
help in your replay.

[Cookies](https://www.w3schools.com/js/js\_cookies.asp) are a way for a server to communicate information back to a client. For example, once you successfully login, the service may reply back to the client with a session id or token to store in a cookie. Then this session id needs to be used on subsequent calls to keep the user logged in.

### Example

```javascript
{
	"type": "http_cookie",
	"config": {
		"prefix": "set-cookie"
	}
}
```

### **Configuration**

| Key        | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| **prefix** | Defaults to `set-cookie` but is the name of the HTTP header to track. |

