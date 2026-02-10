# tag_session

### Purpose

**tag_session** tells the Speedscale AI model to use the current data token as a session identifier. Session identifiers are used to group request together. For example, there might be a specific client that first authenticates, then requests a list of transactions and then deletes one. That's three separate requests that are part of the same sequence and probably use the same session ID. Once the session ID is tagged it can be used for grouping and filtering in the traffic viewer.

## Example

Depending on your app, session identification and mutation can be complex topic but Speedscale does much of the work for you. See this [walkthrough](../../identify-session.md) for the most common patterns.

### Usage

```json
"type": "tag_session"
```

### Configuration

```json
{
   "type": "tag_session"
}
```

### Example Chains

```
req_body() -> json_path(path="sessionId") -> tag_session()
```

This will extract the sessionId field from the request body and tag it as a session identifier for grouping requests.

```
http_req_header(header="Authorization") -> regex(pattern="Bearer (.+)", captureGroup=1) -> tag_session()
```

This will extract the Bearer token from the Authorization header and use it as a session identifier.

```
res_body() -> json_path(path="user.id") -> tag_session()
```

This will extract the user ID from the response body and tag it as a session identifier to group all requests for that user.

:::note
After tagging, these values become session identifiers in Speedscale's AI model. All requests containing the same session identifier will be grouped together for analysis, filtering, and replay scenarios.
:::
