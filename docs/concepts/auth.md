---
sidebar_position: 11
---

# JWT Authorization

Most real world apps require valid authorization tokens during testing. This can take the form of standard [OAuth2](https://datatracker.ietf.org/doc/html/rfc6749) or any number of custom patterns. Speedscale supports many of these patterns out of the box and is customizable to support virtually any custom configuration using the [transform system](/guides/transformation/overview). The core problem during traffic replay is that the JWT (and other) tokens expire and need to be *re-signed* so that they are valid during replay. You know this is happening because during replay your app returns HTTP `4xx` status codes.

# Common Authorization Patterns

If you look through your recorded data, you're likely to see one of the following authorization patterns:

1. Client "logs in" to the server by sending a username/password and receives an authorization token from the server itself. This is usually a request to a `/login` endpoint that returns a JSON payload containing an `access_token` key. This situation should work out of the box with no special configuration. During replay, Speedscale will automatically receive the new token and replace it where necessary. You can stop reading here if you encounter this situation. However, if you've made it this far you're probably seeing `4xx` errors and so this hasn't happened automatically.
2. Client "logs in" to a separate authorization API and then uses the authorization token in subsequent requests to the server. If Speedscale is not monitoring the authorization API then you will not see the original login transaction and will need to insert the new token manually. At this point you must peform a manual replacement. Don't worry, it's not as hard as it sounds.

## Manual Replacement

How you replace these tokens depends on what you're trying to accomplish:

- **One Time Use** - This is the fastest way to get your replay working, but it will stop working when your token expires. In this scenario you provide a new token and Speedscale inserts it everywhere it is used. This works well if you have an auth endpoint you can curl to receive a new auth token manually. You curl the authorization service manually and receive a new token. Once you have the new token, insert it using a [constant](/guides/transformation/transforms/constant) transform.
- **Automated CI Pipeline** - Speedscale will use the same secret your app uses to re-sign the JWT token. This is a little bit more work but is more durable over time. You can find detailed instructions [here](../guides/replay/resign-jwt.md)

As always, please reach out to Speedscale on our slack if we can help. This is a very common request and we've many different types of applications.
