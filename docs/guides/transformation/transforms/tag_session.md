---
description: "Associate an RRPair with a logical session identifier using the tag_session transform in Speedscale, enabling cross-request grouping for analysis, filtering, and replay."
sidebar_position: 28
---

# tag_session

The `tag_session` transform attaches the chain's current token to the RRPair as its **session identifier**. Once tagged, every RRPair carrying the same identifier is treated as part of the same logical session by Speedscale's traffic viewer, analyzer, and replay tooling.

It does **not** transform the token or modify the field the extractor pulled from. It writes the token into the RRPair's session slot and passes the original bytes through unchanged.

- **Transform type name (config/API):** `tag_session`
- **Shorthand format:** `tag_session()`

## Quick Start

Tag the RRPair using a token extracted from the request body:

```json
"type": "tag_session"
```

Pair with an extractor that produces the session identifier you want to track:

```
req_body() → json_path(path="sessionId") → tag_session()
```

There is no configuration — the chain ahead of `tag_session` is responsible for producing the value to tag.

## How It Works

`tag_session` performs its work in the first phase and is a no-op on the second.

1. **First phase** — receive the chain's current token, write it to the RRPair's session slot, and return the token unchanged so the rest of the chain still sees the original bytes.
2. **Second phase** — pass the token through. The RRPair's extracted field is rewritten to its original value, so the source field is untouched.

The session identifier is stored on the RRPair itself (not on the variable cache). It travels with the RRPair into downstream tools — the traffic viewer, the analyzer, and signature matching all read it from the same field.

### Overwriting Existing Tags

A second `tag_session` call on the same RRPair overwrites whatever the first call set. If multiple chains in the same chain collection tag a session, only the last one wins. Use chain filters to control which chain fires per RRPair.

### Where the Token Comes From

The session identifier is whatever the extractor chain produces. Common sources:

- A JSON field in the request or response body (`json_path`).
- A header value (`http_req_header` / `http_res_header`).
- A cookie value, extracted via `http_req_header(header="Cookie")` and a follow-up `regex`.
- The bearer token piece of an `Authorization` header.

A token of any byte content is accepted; the transform copies the bytes to insulate the RRPair from later in-chain mutations.

## Configuration

```json
{
    "type": "tag_session"
}
```

`tag_session` takes no configuration parameters. The chain that produces the token determines what gets tagged.

## Examples

### Example 1 — Tag from a request body field

```
req_body() → json_path(path="sessionId") → tag_session()
```

Extracts `sessionId` from the JSON request body and associates the RRPair with that session.

### Example 2 — Tag from a Bearer token

```
http_req_header(header="Authorization") → regex(pattern="Bearer (.+)", captureGroup=1) → tag_session()
```

Pulls the JWT out of `Authorization: Bearer ...` and uses it as the session identifier. Every RRPair carrying the same token is grouped together.

### Example 3 — Tag from a response body

```
res_body() → json_path(path="user.id") → tag_session()
```

Uses the responding service's `user.id` field as the session identifier — useful when the request itself does not carry the user but the response does.

### Example 4 — Store the value as a variable and tag in the same chain

```
res_body() → json_path(path="session") → var_store(name=session_id) → tag_session()
```

`var_store` passes the token through, so `tag_session` still sees it. The session value is now both tagged on the RRPair and available to later RRPairs via `var_load`.

## Common Misconceptions

1. **"`tag_session` modifies the field its chain targets."**
   No. The original bytes pass through. The session slot on the RRPair picks up the new value; the targeted field stays the same.

2. **"It tags the entire transformation session."**
   No. It tags the **single RRPair** the chain ran on. Other RRPairs in the same replay are tagged only if their own chains call `tag_session` with a matching value.

3. **"Two RRPairs are linked because they ran through the same chain."**
   They are linked because `tag_session` produced the same identifier bytes for both. The grouping is value-based, not chain-based.

4. **"The session tag is automatically derived from cookies / auth headers."**
   No. It is derived from whatever the chain extracts and feeds into `tag_session`. The transform itself is unaware of HTTP semantics.

5. **"Tagging changes which mock response the responder returns."**
   The session tag affects grouping and analysis, not the signature used to match a mock response to a request. To influence matching, use [`smart_replace`](./smart_replace.md) or [`store_sig`](./store_sig.md).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Traffic viewer doesn't show sessions grouped | The chain produced different bytes for each RRPair (e.g. the session value had a trailing space) | Add [`trim`](./trim.md) to normalize, or check the extractor target |
| Session tag is empty | The upstream extractor returned an empty value | Verify the extractor target is correct; check Preview Mode for the produced bytes |
| Only some RRPairs are tagged | Chain filters excluded the others, or the source field is missing on those RRPairs | Add a fallback chain that targets a different field, or remove the filter |
| Session tag overwritten with the wrong value | A second `tag_session` chain ran on the same RRPair | Use filters so only one chain tags per RRPair |
| Quoted JSON value used as session tag | Extractor returned a JSON-quoted string | Strip quotes with `trim` or `regex` before `tag_session` |

## Related Transforms

- [`var_store`](./variable_store.md) — also a "capture and pass through" pattern, but writes to the session-wide variable cache instead of the per-RRPair session slot.
- [`smart_replace`](./smart_replace.md) — for value substitution that propagates a session identifier across the RRPair contents.
- [`store_sig`](./store_sig.md) — for influencing how the responder matches incoming requests; complements but doesn't replace `tag_session`.

For the most common identification patterns (cookies, JWT bearer, custom headers), see the [Identify session walkthrough](../../identify-session.md).

## Advanced Notes

- The session tag is stored in the RRPair's session field, which the analyzer and traffic viewer both consult. It is distinct from the variable cache.
- The token bytes are copied before being attached to the RRPair, so subsequent in-chain mutations do not disturb the tag.
- If the surrounding context has no session-storage callback wired up (e.g. unit tests or one-off invocations), the transform silently does nothing — it does not error. In normal replay and capture, the callback is always present.
- `tag_session` does not require the recorded response to be present in the action file.
- The Speedscale AI model uses tagged sessions when grouping RRPairs into sequences during analysis. Tagging the same value across the request and the response of a login flow, for instance, lets the model treat those RRPairs as a single conversation.
