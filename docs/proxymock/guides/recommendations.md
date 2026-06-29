---
description: "Fix replay failures with proxymock recommendations. proxymock detects values that change between runs — expired bearer tokens, dynamic cart/order/item IDs — and generates smart_replace blueprints that correlate the new value forward on every dependent request."
sidebar_position: 7
---

# Fix Replay Failures with Recommendations

Replays break when something the recording captured is no longer valid: a bearer token expired, a cart ID was minted fresh on this run, an order ID does not match the recorded one. The response body and headers rarely tell you why, which makes these the most frustrating replay failures to diagnose.

proxymock's **Recommendations** solve this without hand-writing transforms. After a replay, proxymock analyzes the run, spots the values that flow from one response into later requests, and offers a one-click fix: capture the value *this run* produced and substitute it into every downstream request. This is the same correlation the Speedscale cloud performs, run locally.

The worked example below uses the open-source [java-auth demo](https://github.com/speedscale/demo/tree/master/java-auth) for an expired-token case. A [second example](#another-example-dynamic-resource-ids) covers dynamic resource IDs (cart, item, order) with the same mechanism.

Walk through the auth example on video:

<iframe src="https://www.youtube.com/embed/v4KqY16dC9A?rel=0&modestbranding=1" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

A recording captures the exact bearer token your app received at record time. Replay that traffic an hour later and the protected calls fail: the token expired, so every request after the login returns `401`/`403`. The [java-auth demo](https://github.com/speedscale/demo/tree/master/java-auth) is a Spring Boot service that issues JWT bearer tokens, but the workflow applies to any token-based auth.

## Before you begin

- proxymock [installed](../getting-started/quickstart/quickstart-cli.md)
- The target application running on a local port you can replay against (the demo listens on `8081`)

## 1. Record traffic against your app

Start your app under proxymock so every inbound request/response is captured. The `--app-port` flag tells proxymock which local port your app listens on; point your client at proxymock's port (`4143`) instead:

```shell
proxymock record --app-port 8081 -- docker compose up
```

Exercise a flow that logs in and then makes authenticated calls. The demo's test script logs in once and reuses the token for three protected `GET /api/auth/user` requests:

```shell
./scripts/test.sh localhost:4143
```

Stop recording with `Ctrl-C`. proxymock writes the run to `proxymock/recorded-<timestamp>/`, one Markdown RRPair file per request. AI coding tools read these directly, or you can read them as a human through the web UI.

## 2. Replay the recording, and watch it fail

Replay the recorded traffic back against your running app:

```shell
proxymock replay --in ./proxymock --test-against localhost:8081
```

The login succeeds, but the protected calls fail. The report shows a status-code mismatch: the recorded `200`s came back as `403`s. Nothing in the response explains why.

The cause: the recording's `Authorization: Bearer <token>` header carries the token minted at record time. That token has since expired, and the replay dutifully resends it. Every request after the login is authenticating with a stale credential.

## 3. Open the Recommendations panel

Launch the web UI from the parent of `proxymock/`:

```shell
proxymock web
```

Open the **Recommendations** panel for the replay. proxymock has already analyzed the run and detected the handshake. It flags the login response as the source of an access token and highlights where that token flows into later requests.

<!-- screenshot: recommendations panel with the JWT/OAuth recommendation highlighted -->

You may see more than one recommendation. The token-rotation recommendation is the one that fixes the `403`s. Others are informational. For example, proxymock may flag an email address it found in the traffic. Leave those unaccepted if the value should pass through unchanged.

## 4. Accept the recommendation

Accept the token-rotation recommendation. proxymock writes (or updates) a blueprint at `proxymock/blueprints/<uuid>.json` that auto-applies on every subsequent replay. For the java-auth demo the blueprint extracts the token from the login response and substitutes it downstream:

```
(networkaddr CONTAINS "localhost"
  AND location IS "/api/auth/session/login"
  AND command IS "POST")
| res_body()
| json_path(path=accessToken)
| smart_replace_recorded(overwrite=true)
```

In plain terms: on the `POST /api/auth/session/login` response, pull `accessToken` out of the JSON body, then `smart_replace` that value everywhere the old recorded token appears. Because `smart_replace` matches on the *value*, it rewrites the `Authorization` header on every protected request without you naming each one.

## 5. Replay again

Run the same replay:

```shell
proxymock replay --in ./proxymock --test-against localhost:8081
```

The console confirms the blueprint merged:

```
Applied 1 active blueprint(s) to replay.
```

This time the token the app issues on the first call is the token used on all the rest, and you get a 100% match rate. You now have repeatable test automation around an authenticated flow, with no manual token juggling, and it re-runs identically tomorrow or in CI.

## Inspecting and editing the blueprint

Everything the recommendation did is visible and editable in the **Blueprints** tab. The transform chain is plain configuration: a filter that targets the login endpoint, an extractor (`res_body`), and the `json_path` + `smart_replace_recorded` transforms. proxymock ships a full library of [transforms](/guides/transformation/transforms) if you need to go further, whether that is re-signing a JWT, swapping a refresh token, or correlating a session id. But for getting a token-based flow green, accepting the recommendation is the quick path.

You are not limited to accepting recommendations — you can author the same kind of rule by hand. In a request's detail, click the transform icon on a header or query field (or right-click a body field) to add a transform straight onto that field; proxymock saves it as a blueprint just like a recommendation does. See [Modifying Tests/Mocks](./modify-rrpairs.md#applying-transforms-in-proxymock-web) for that field-level workflow, and switch the Requests grid to the **Preview blueprints** lens to walk a before/after of every change the active blueprints make before you replay.

## How this relates to the credentials swap

| Your recording carries… | Use… |
|---|---|
| `Authorization: Bearer <token>` (OAuth / JWT) | This recommendation workflow |
| `Authorization: Basic <base64>` (HTTP Basic) | [Basic auth credentials swap](./credentials-swap.md) |

Basic auth needs different credentials per environment, so it swaps from a CSV you edit. Bearer auth needs the *live* token from this run correlated forward, which is exactly what the recommendation automates.

## Another example: dynamic resource IDs

The same Recommendations workflow handles dynamic resource identifiers — cart IDs, item IDs, order IDs, anything the server mints fresh on each run. The pattern is identical: capture the value from the response that creates it, `smart_replace` it onto every later request that uses it.

<iframe src="https://www.youtube.com/embed/_fZEq7tlsQI?rel=0&modestbranding=1" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

Imagine a checkout flow that creates a cart, adds an item, then submits an order. The recording captured a specific cart ID. On replay, the cart endpoint mints a *new* cart ID, but the recorded `POST /cart/{id}/items` and `POST /orders` still target the old one. Both fail.

Open the Recommendations panel and proxymock has already detected the chain: the cart endpoint's response body contains a cart ID, and that same ID appears in the path of subsequent requests. Accept it, and proxymock writes a blueprint like:

```
(networkaddr CONTAINS "localhost"
  AND location IS "/cart"
  AND command IS "POST")
| res_body()
| json_path(path=cartId)
| smart_replace_recorded(overwrite=true)
```

Repeat for item ID and order ID if those appear too — each is its own one-click recommendation. Replay again and the whole checkout flow runs green, because every downstream request now uses the IDs *this run* produced.

This is what makes the workflow viable in CI: the same blueprint runs tomorrow against a different cart ID without manual edits. Wire `proxymock replay` into a pipeline step and you catch breakage from new code (the kind of breakage that vibe-coded changes love to introduce) without flake from naturally-rotating identifiers.

## Troubleshooting

**The protected calls still return `403` after accepting.**
Confirm the replay log says `Applied N active blueprint(s)…`. If it doesn't, the blueprint isn't tied to the workspace's current snapshot id. Re-open the Recommendations panel and accept again to regenerate it.

**The recommendation didn't appear.**
proxymock detects the handshake from the replay analysis. Make sure the recording actually contains the login call *and* at least one request that reuses its token, and that you replayed before opening the panel.

**My login path groups together with other endpoints.**
proxymock groups requests by URL shape. If your login route is shallow (for example `/login`), deepen it or add a filter so the token extractor targets only the login response, not its siblings.

For the narrative version of this guide, see the blog post [Fixing 403 auth errors when you replay traffic](https://speedscale.com/blog/fix-403-auth-errors-traffic-replay-proxymock/). If you have questions, reach out at [proxymock.io](https://proxymock.io).
