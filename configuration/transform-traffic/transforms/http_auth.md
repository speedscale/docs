# http\_auth

**http\_auth** parses the HTTP Authorization header and moves its parts into variables. `Bearer` and `Basic`  HTTP authentication schemes are currently supported. This transform will populate a specified username and password variable so they can be used downstream.

### Usage

```
"type": "http_auth",
"config": {
    "user": "[variable to store username in]",
    "password": "[variable to store password in]"
}
```

* **user** - name of the variable to store the extracted username in (defaults to `user`)
* **password** - name of the variable to store the extracted password in (defaults to `password`)

### Example

#### Configuration

```
"type": "http_auth"
```

#### Input Token

```
Basic Z2FuZGFsZjo1NGZlMjE1YWFkMTdkNGViNzEyZTNlM2U3MWNmZmEwNDlkOTRiYzMzNmI5NDliMDFmNDZlMGIyMmZiM2U5ZTM3
```

#### Transformed Token

```
Basic Z2FuZGFsZjo1NGZlMjE1YWFkMTdkNGViNzEyZTNlM2U3MWNmZmEwNDlkOTRiYzMzNmI5NDliMDFmNDZlMGIyMmZiM2U5ZTM3
```

New Variables:

* user=`gandalf`
* password=`54fe215aad17d4eb712e3e3e71cffa049d94bc336b949b01f46e0b22fb3e9e37`

{% hint style="info" %}
Note that the value of the token does not change. The only change are the variables added to the cache.
{% endhint %}
