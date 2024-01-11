---
sidebar_position: 39
title: Identify a Session
---

## Sessions

Speedscale utilizes the concept of *sessions* to identify individual users or client connections. A *session* represents a stream of requests run in sequence. You can think of it like a conversation between a single client and the service. Typically, sessions are automatically discovered by Speedscale for common patterns like JWT Bearer tokens. However, this guide covers what to do when you need to do some off roading and identify a unique identifier in an usual location.

## Identify a Unique ID

Let's use an example HTTP request where the client's email address is embedded as a query parameter. Let's not make any judgments about whether this is best practice - it definitely happens in the real world.

```
GET /foo-platform/pdt/foo/management&email=foo@bar.com HTTP/1.1
User-Agent: Apache-HttpClient/4.5.6 (Java/1.8.0_392)
Accept-Encoding: gzip,deflate
```

This is not a common pattern so we need to tell the Speedscale transform system to tag this data as a session. From now on, every time this particular query parameter is seen it should be treated as a unique ID.

## Tag the Session ID

For this exercise we want to tag the session ID using the `tag_session` transform. If you're unfamiliar with transforms you can read more about them on the [reference page](../concepts/transforms.md). For this example we'll implement tagging as the data is ingested. It is also possible to use this same transform on a snapshot after it has been recorded. The advantage of adding the transform to the ingest pipeline is that the data is tagged early enough that you can filter it in the traffic viewer. It's pretty simple to do either but we'll focus on tagging in the forwarder (Speedscale's ingest system) here.

1. We start by creating a new DLP Rule. For this example you can call it `email_session`. DLP Rules are interpreted at the forwarder before data leaves the cluster. This is an excellent place to identify the session so that all RRPairs will have their correct session ID tagged early.
2. Identify the `email` HTTP Query Paramter and use it as the source for the transformation chain.
3. Add a `tag_session` transform to train the Speedscale model on this data.

In the end, you will have a DLP rule that looks like this:
![dlp rule](./identify-session/dlp_rule_complete.png)

This transform cahin will isolate the `email` HTTP Query Parameter and use it as the session identifier.

## Apply to Forwarder

Now that you have a rule that identifies the email query parameter, we need to tell the Speedscale forwarder to use it. You can do this by re-installing the speedscale operator using the helm chart flag `--set dlp.config=email_session`. Alternatively if you're managing the containers directly you can change the operator environment variables directly:

```
SPEEDSCALE_DLP_CONFIG=email_session
```

## View and Filter in Traffic Viewer

1. Open your service in traffic viewer.
2. Select an RRPair and look at it's Info Tab. You'll notice that the Session ID entry is populated with the email address.
3. Create a filter for only that Session ID. All requests from that client are indentified in sequence.
