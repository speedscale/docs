---
description: "Analyze replay accuracy with Speedscale's errors dashboard, tracking response rates, accuracy comparisons, and assertion results for effective API testing."
sidebar_position: 3
---

# Accuracy

Drill into the reasons for why this replay did not match the expected results.

The errors dashboard gives you a view into all the calls that were replayed against the service, and how they compared to the traffic snapshot. There are 3 high level KPIs that are tracked:

* **Response Rate** this helps confirm that the generator is able to send traffic to the service. If you have errors here it could be because the service was not ready or you have a misconfiguration in your cluster.
* **Accuracy** how did the responses compare with the traffic snapshot? These comparisons are made automatically based upon your configuration.
* **Responder Matches** this is present if the responder was used during your traffic replay and is an indication if it was able to match the incoming calls.

![](./screen-shot-2021-08-13-at-11.52.26-am.png)

Below that you can find a summary of failures by URL. Alternatively it may be interesting to understand what failure types happened in the environment regardless of URL.

![Errors by URL](./screen-shot-2021-08-13-at-11.52.46-am.png)

And finally there is a list of every single assertion that was performed automatically. You can click on any one of these to see the actual and expected results, with lines that did not match in red.  The margin is also red for the parts of the body which do not match.

![assertions diff](./assertions-response-diff.png)

The `Actual` text for this assertion says "4/5 Lines Match" because the expected (captured) and actual (replayed) values differ.  Each line of the response body, including delimiters like curly braces, are compared. Assertions can be configured, in the [test config](/reference/glossary.md#test-config), to ignore fields that you don't want to affect body comparison.

![assertions ignore](./assertions-response-ignore.png)

Ignored fields will still have red lines in the margin to indicate they are different, but the line itself is grey with the crossed eye icon to indicate that it was ignored.  See the [assertions reference](../../reference/configuration/assertions/README.md) for more information.

If a replay has an unexpectedly low success rate, inspect the failed assertions and request differences before changing the configuration. For expected differences such as credentials or dates, open the snapshot's **Prepare** tab to review and edit transform chains. Use the chain editor to preview changes against a recorded request, save the configuration, and replay again to check the result. See [Traffic Transformation](/guides/transformation/overview.md) for the workflow. For help with your configuration, ask in the [Speedscale Slack community](https://slack.speedscale.com) or [email support](mailto:support@speedscale.com).
