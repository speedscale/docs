---
sidebar_position: 7
title: Resend RRPair
description: Resend captured requests directly from the traffic viewer with optional modifications.
---

# Resend RRPair

Speedscale allows you to resend any captured request directly from the traffic viewer. You can modify headers and body before sending, then compare the new response with the original. This is useful for reproducing bugs, testing edge cases, and verifying fixes without leaving the Speedscale UI.

## Finding a Request

1. Open the [Traffic Viewer](./capture/filter.md) and use filters to locate the request you want to resend
2. Click on the request row to open the RRPair detail view

## Opening the Resend Panel

From the RRPair detail view, click the **Resend** button. This opens a panel where you can review and optionally modify the request before sending it.

## Editing Before Resending

The resend panel displays the full request — URL, method, headers, and body. You can modify any of these fields before sending:

- **URL** — change the target endpoint or query parameters
- **Headers** — add, remove, or modify request headers (for example, swap in a fresh auth token)
- **Body** — edit the request payload directly

:::tip
The editor supports syntax highlighting for JSON and other common content types, making it easy to spot and fix issues in the request body.
:::

## Sending and Viewing the Response

Click **Send** to execute the request. The response appears alongside the original captured response, allowing you to compare:

- **Status code** — did the response code change?
- **Headers** — are there new or different response headers?
- **Body** — how does the response body differ from the original?

This side-by-side view makes it straightforward to identify behavioral differences.

## Saving a Modified Request

If you've made changes to the request that you want to preserve, you can save the modified request as a new RRPair. This is useful for building up a collection of edge-case requests for future testing.

## Use Cases

- **Reproducing bugs** — resend a request that triggered an error to confirm it's still failing
- **Testing edge cases** — modify a valid request to test boundary conditions (empty body, missing headers, invalid values)
- **Verifying fixes** — after deploying a fix, resend the original failing request to confirm it now succeeds
- **Auth troubleshooting** — swap in different auth tokens or credentials to isolate authentication issues
- **Exploring APIs** — use a captured request as a starting point and modify it to explore different API behaviors
