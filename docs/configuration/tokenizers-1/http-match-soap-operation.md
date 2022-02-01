
# HTTP Match SOAP Operation

If you rely upon an external service that talks SOAP,  this will grab the
operation name.

sed on subsequent calls to keep the user logged in.

### Example

```javascript
{
	"type": "http_match_request_body_soap_operation",
	"config": {
		"xpath0": "//s:Envelope/s:Body/*"
	}
}
```

### **Configuration**

| Key          | Description                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **xpath{#}** | Replace `{#}` with the index number, this XPath will be used to locate the operation name in case your name is not captured by the default `//s:Envelope/s:Body/*` |

