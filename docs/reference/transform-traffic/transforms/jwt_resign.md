# jwt_resign

### Purpose

**jwt_resign** re-signs an existing JWT token. The original algorithm is honored.

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
    "sub": new value"
}
```

* **iss** - optional replacement for iss value
* **aud** - optional replacement for aud value
* **sub** - optional replacement for sub value
