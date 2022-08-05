---
sidebar_position: 5
---

# HTTP OAuth2 Tokenizer

Use this to track OAuth2 logins and replay them on subsequent calls.

This tokenizer allows you to parameterize inbound requests that leverage OAuth2 access tokens given to clients of your service. For example, suppose you have a service that exposes two endpoints:

* `/token`: accepts GET requests with HTTP Basic authentication and returns an OAuth2 access token
* `/validate`: accepts GET requests with HTTP Bearer token authentication that contains a valid token from a previous `/token` call.

Without the support of this tokenizer, if you were to replay a traffic scenario, you may observe request failures when your system consults with your OAuth2 provider for token validation.

### Example

```javascript
{
	"type": "http_oauth2",
	"config": {
	  "header": "Authorization",
		"prefix": "Bearer",
		"pattern": "access_token"
	}
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| **Key**     | Description                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **header**  | The name of the header in subsequent HTTP requests where observed OAuth2 tokens will be injected. Defaults to `Authorization` |
| **prefix**  | A string that will be prepended to any OAuth2 token before injecting into request headers. Defaults to `Bearer`               |
| **pattern** | A JSON path pattern used to identify the location of OAuth2 access tokens in HTTP responses. Defaults to `access_token`       |
