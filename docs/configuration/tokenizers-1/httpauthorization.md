---
sidebar_position: 4
---

# HTTP JWT Tokenizer

Tokens may need to be re-issued or re-signed, this tokenizer handles that for
you.

This tokenizer re-signs JWT authorization tokens with updated expiration times. The existing JWT is decoded and used as a template. Once modifications are complete, the JWT is re-signed using the secret provided. By default, all new signed tokens are valid for 48 hours.

### Example <a href="#example" id="example"></a>

```javascript
{
  "type": "http_auth", 
  "config": {
    "claims": "{\"sub\":\"speedscaleServiceUser\"}", 
    "prefix": "Bearer ", 
    "secret": "/home/speedscale/jwt/jwt" 
    "requestHeader": "Authorization", 
    "responseHeader": "" 
  }
}
```

### Configuration <a href="#configuration" id="configuration"></a>

| Key                | Description                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **claims**         | A list of key/value pairs that will be placed into the claims section of the newly signed token                                                                                                       |
| **prefix**         | A required prefix for the `Authorization` header value. For example, if prefix is "JWTBearer " then only HTTP rrpairs with header value Authorization "JWTBearer headers.claims.sig" will be modified |
| **secret**         | The filename of the secret to be used for the JWT re-encoding (**generator** must have these files available)                                                                                         |
| **requestHeader**  | Defaults to `Authorization`, but can be set to another HTTP header                                                                                                                                    |
| **responseHeader** | Defaults to `Authorization`, but can be set to another HTTP header                                                                                                                                    |
| **headerFilter**   | A key/value map in the same format as **claims** that filters any JWTs that do not have the necessary headers                                                                                         |
| **claimsFilter**   | A key/value map in the same format as **claims** that filters any JWTs that do not have the necessary claims                                                                                          |

### Notes <a href="#notes" id="notes"></a>

* Many http_auth tokens with different prefixes can be present in the same tokenizer configuration. Only the rrpairs matching the specific tokenizer will be utilized. Tokenizers are executed in the order they are presented in the configuration file.
* Most errors are caused by the generator not having the secrets available in the filename provided OR the key being in the wrong format. For example, if **alg=RS512** then the secret file must contain a valid RSA private key.
