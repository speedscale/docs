# Authorization

If you look through your recorded data, you're likely to see one of the following authorization patterns:

1. *OAuth2* - Client "logs in" to the server by sending a username/password and receives an authorization token from the server itself. This is usually a request to a `/login` endpoint that returns a JSON payload containing an `access_token` key. This situation should work out of the box with no special configuration. During replay, Speedscale will automatically receive the new token and replace it where necessary. You can stop reading here if you encounter this situation. However, if you've made it this far you're probably seeing `4xx` errors and so this hasn't happened automatically.
2. Client "logs in" to a separate authorization API and then uses the authorization token in subsequent requests to the server. If Speedscale is not monitoring the authorization API then you will not see the original login transaction and will need to insert the new token manually. At this point you must peform a manual replacement. Don't worry, it's not as hard as it sounds.

## Request JWT Re-signing

This section pertains to inbound RRPairs (direction=in). If you are seeing 401 or 403 errors during replay, that is a strong indicator you need to re-sign your JWTs. The Speedscale load generator is able to re-sign these requests in two ways:

1. **replace** - provide a new JWT to insert into the place of the old one (like you would do in Postman)
2. **resign** - pull a secret from the local Kubernetes cluster (or file system) and resign the JWT just like a normal client would.
3. **dial an outside system** - send a request to a system not being observed by Speedscale to initiate OAuth2

### Replace

If you have a full JWT already encoded, you can simply replace it using a constant transform and [smart_replace](../transforms/smart_replace.md). This would look like a set of base64 encoded characters in a abc.xyz.123 format. That chain to replace that key would look something like this:

`http_header(header="Authorization")<->split(delimiter=" ", index=1)<->smart_replace()<->constant(new="<new JWT>")`

This will extract the Authorization header, split it in half from the space in the middle, replace index=1 with our new JWT and ensure that all future occurrences of this JWT are replaced. The `smart_replace` transform is not strictly necessary but if you don't include it then you will need to manually replace every occurrence of this JWT instead of letting Speedscale do it. This would convert:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

into:

```
Bearer <new JWT>
```

:::warning
This type of JWT replacement tends to break over time. Generally, JWTs have a 7 day or less lifespan. If you want to run replays in your CI system you either need to create long lived JWTs in your authorization or use another method.
:::

### Re-sign

Re-signing JWTs involves regenerating a valid JWT from a secret in your Kubernetes cluster, just like the server does. This solution does require slightly more work but will work for a lot longer. For that reason this is the recommended configuration for CI systems.

#### Before you begin

* Find the location of the secret or certificate used to sign the JWTs in your Kubernetes cluster. The Speedscale Generator and your application must both use this secret for re-signing to work.

Once you have your secret identified, you will need to add a transform chain similar to the following:

`http_header(header="Authorization")<->jwt_resign(secret="${{secret:secret_name/key_inside_the_secret", prefixes="Bearer"}})`

This tells Speedscale to extract the Authorization header, strip off the Bearer prefix and then resign the key using a key in the same Kubernetes namespace as your load generator. [jwt_resign](../transforms/jwt_resign.md) has a variety of options to change claims and other parameters. The `${{secret:...}}` syntax is a format used for secrets, variables and more.

### Dial a Friend

If you cannot access a JWT from the recording, and no secret is present locally, that typically means the app uses an external auth service. In the traffic it would seem like a JWT simply appears out of nowhere without an OAuth2 handshake. The handshake may have happened far in the past but it is not in the recorded traffic. In that situation we merge the original call to the authorization system into our traffic snapshot. This is a somewhat manual process that must be tailored to your app. Typically, it involves:

1. Finding a postman or curl of the correct authorization call that will return the JWT
2. Importing that call into snapshot using Postman import or even desktop recording of running the curl (see `speedctl capture` command)
3. Prepending the authorization "snapshot" to the beginning of your recorded traffic

## Mock JWT Re-signing

This section applies to outbound RRPairs (direction=out). Since the system under test generally initiates the OAuth2 handshake, service mocks (virtualized services) usually only require a few straightforward steps to resign JWTs. Find the request that initiates the OAuth2 handshake. It will include two key components: an `Authorization` HTTP header containing one of the normal auth schemes and a JSON response body with a new JWT in `access_token`. Predictably, it also may simply have an endpoint like `/login` or `/auth`. To handle this token, add a transform chain like the following:

`res_body()<->json_path("access_token")<->smart_replace_recorded()`

This will extract the response body, apply a json_path search for the root `access_token` key and then replace the current value with the new value returned by the server. This will apply to all future requests automatically. Yes, you can put down your scripting tool now and enjoy the find and replace happiness.