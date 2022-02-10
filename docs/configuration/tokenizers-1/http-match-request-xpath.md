
# HTTP Match Request XPath

You may need this tokenizer if your service calls a backend with an XML
payload.

There are still lots of services that rely on XML (even AWS!). If you want the responder to work with this you can try the [Match Request Body](http-match-request-body.md) or this tokenizer. This will extract these fields from the request for improved matching by the responder.

### Example

```javascript
{
	"type": "http_match_request_body_xpath",
	"config": {
		"xpath0": "//s:Envelope/s:Body/m:MyOperation",
		"xpath1": "//s:Envelope/s:Body/m:AnotherOperation"
	}
}
```

### **Configuration**

| Key          | Description                                           |
| ------------ | ----------------------------------------------------- |
| **xpath{#}** | Increment `{#}` for each XPath query you want to use. |
