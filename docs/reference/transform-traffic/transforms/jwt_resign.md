# jwt_resign

### Purpose

**jwt_resign** re-signs an existing JWT token. The original algorithm is honored. This transform works with both request tokens (generator created) and response tokens (responder created).

* If the `nbf` claim is defined in the token, then it is set to 10/10/2015
* The `exp` set to now+2 days
* The `iat` claim set to now (current time)

### Usage

```
"type": "jwt_resign"
```

### Example

#### Configuration

```
"type": "jwt_resign",
"config": {
    "iss": "new value",
    "aud": "new value",
    "sub": new value",
    "secretPath": "local path of secret mounted to generator",
    "claims": "key1=val1",
    "prefixes": "Bearer ,myBearer "
}
```

| Key                | Description                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **secretPath**     | The local path of secret mounted to generator (this is done automatically by the operator. See [howto](/guides/replay/mocks/resign-jwt-mocks.md)). If working in Kubernetes, you can specify a secret using this format: `${{secret:secret_name/key_inside_the_secret}}`
| **iss**            | (optional) A replacement for iss value
| **aud**            | (optional) A replacement for aud value
| **sub**            | (optional) A replacement for sub value
| **claims**         | (optional) key/val pairs to be overwritten into claims map (key1=val1,key2=val2)
| **prefixes**       | (optional) prefixes to accept before JWT (defaults to "Bearer "). Don't forget the space at the end if it is present.
