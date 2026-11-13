---
description: "Explore the Report Summary in Speedscale to understand replay results, configurations, and performance metrics for effective API testing and traffic replay."
sidebar_position: 9
---

# Report Summary

At the top of the report are several key pieces of information.

## Replay Summary <a href="#replay-summary" id="replay-summary"></a>

At a glance you should be able to see:

* What was the result of the replay? (Passed, Missed Goals, Running, Error)
* Which service did the traffic replay against?
* What replay configuration was used?
* What was the tag or commit hash from source control?
* When did the replay complete?
* How long did the replay take?
* If goals did were not met, what were they?

![Summary](./screen-shot-2021-08-13-at-11.38.53-am.png)

If a replay has low accuracy or unexpected behavior, inspect the failing requests in the report, then open the snapshot's **Prepare** tab to review credentials and transform chains. Authentication and time shifting may require [traffic transformation](/guides/transformation/overview.md). Preview changes in the chain editor, save the configuration, and replay again to check the result. For help with your configuration, ask in the [Speedscale Slack community](https://slack.speedscale.com) or [email support](mailto:support@speedscale.com).
