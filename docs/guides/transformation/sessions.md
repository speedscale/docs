---
title: Sessions
description: "Track and manage sessions in Speedscale for API testing, including automatic detection and manual identification of session IDs during traffic replay."
sidebar_position: 5
---

# Sessions

Front end applications and APIs typically have back and forth conversations that can be grouped into sessions. Speedscale automatically tracks sessions for common patterns like OAuth2. If Speedscale detects a session it will assign a session ID to each RRPair involved in the conversation during capture for easy sorting/filtering. During replay, sessions are handled automatically.

## Automatic Detection

In many cases, sessions are automatically detected and given a unique identifier matching some aspect of the traffic. As an example, consider an OAuth2 login. Open the login RRPair from the snapshot's **Traffic** tab and its **Response** body shows an `access_token` like this:

![The Response Body tab of a POST /oauth2/v1/token RRPair, with an access_token and a token_type of Bearer](./sessions/access_token.png)

Now choose **More** > **Info** on that same RRPair. You can tell that Speedscale detected this token because it uses the token as the Session ID.

![The Info view of the same RRPair, where the Session ID row holds the access_token value](./sessions/session_id.png)

When a snapshot is created data about the sessions will be aggregated into a summary. The list of detected tokens/sessions can be viewed from the snapshot's **⋮** menu with **View Tokens**:

![The Tokens panel, with Unrecognized, Email, UUID, JWT and Datetime token groups and the location of each token](./sessions/token_summary.png)

One of the most common uses for sessions during replay is [smart_replace](./smart-replace.md). When a session is tagged by smart_replace, Speedscale will detect and re-use that token wherever it is used in subsequent calls.

## User Identified

If Speedscale does not automatically detect sessions in your traffic, you can manually identify them using a transform chain like the following:

```
req_body() <-> json_path(path="customer") <-> tag_session()
```

This will extract the request body, find the `customer` root key and then tell Speedscale to treat that as the session identifier for this RRPair. Any session IDs assigned by you will take precedence over Speedscale's automated discoveries.
