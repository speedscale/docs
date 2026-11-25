---
title: Using Transforms for better Mocks
description: Learn how to edit signature mocks in Speedscale to enhance your API testing and streamline your development process. This guide provides clear instructions and best practices for effectively managing mocks within your applications.
sidebar_position: 4
---

# Using Transforms for better Mocks

## Prerequisites
1. You have [created a snapshot](../../creating-a-snapshot.md)
2. You know how to [run a replay](../../)


## Replay without Transforms

For this guide, we use a snapshot of a `banking-notification` service. Its tests are calls to `/notifications` and `/health`, and its mocks answer the JSON APIs it calls to send messages: SendGrid, Slack and Twilio.

![The snapshot Overview, with tests for banking-notification and mocks for hooks.slack.com, api.sendgrid.com, api.twilio.com and Kafka](./edit-sig/snapshot.png)

We run a replay with this snapshot and no special settings. Every assertion passes, but the **Mocks** card shows that only 35 of 45 outbound calls matched a mock. The rest reached the real dependency or got no match.

![The report Overview, with 50 of 50 assertions passed and 35 of 45 mocks matched](./edit-sig/failed-report.png)

On the **Mocked Responses** tab, **Mock accuracy by host** shows that none of the three calls to `api.twilio.com` matched. Selecting one shows `No Match` for `POST /2010-04-01/Accounts/AC.../Messages.json`.

![The Mocked Responses tab, with 0 of 3 calls matched for api.twilio.com and a Twilio call with the No Match status](./edit-sig/responder-miss.png)

Open the call's **Signature** tab and select **Suggestions...** to compare it with the closest recorded requests. The method, host and JSON body match. Only `http:url` differs: the Twilio account ID in the path was `ACdummy...` when the traffic was recorded, and the test environment uses a different account.

![Suggested Signatures, with http:url selected and the account ID in the URL path differing between the incoming request and the recording](./edit-sig/suggested-url.png)

We could transform the account ID in both the recording and the replay to the same constant. But the account ID tells the mock nothing about which response to return, since the message body already identifies the request. It is simpler and safer to leave the URL out of the signature for these calls.

## Transform

Open the snapshot's **Prepare** tab, select **Mocks** and then **New**. Set **Runs on** to `Host is api.twilio.com:443` so the change only applies to the Twilio calls. Pull from **Request Body**, then select **Add step** and pick **Delete from signature** with the key `http:url`. The preview shows `Signature http:url = removed` for all three matching requests.

![A mocks transform chain that runs on api.twilio.com, pulls from the request body and deletes http:url from the signature, with 3 matching requests](./edit-sig/delete-sig-url.png)

Select **Save and reanalyze**. The responder applies the same chain to each incoming request before it looks for a match, so both sides of the comparison now ignore the URL.

On the **Traffic** tab, open one of the Twilio mocks, select **Signature** and choose **Compare**. `http:url` is now marked **Removed**.

![The Signature tab of a Twilio mock in Compare view, with http:url struck through and marked Removed](./edit-sig/post-delete.png)

## Replay with Transforms

Now we run another replay with the transformed snapshot, with the same cluster, namespace and test config.

![The Mocked Responses tab of the new replay, where api.twilio.com now has 3 of 3 calls matched](./edit-sig/success.png)

All three Twilio calls now match a mock, and Mock Accuracy rises from 35 of 45 to 37 of 44. The remaining misses are Kafka consumer-group calls, which are a separate fix. The Twilio calls behave as they did when we recorded them, and we didn't have to call the real Twilio API or share an account between environments.

Transforms are extremely powerful for parameterizing and modifying dynamic data. Lots of data that we use in our apps is static but there are always things like timestamps, session ids, environment tags, etc. that we need to control for in tests and Transforms help us do exactly that on the inbound and outbound side.
