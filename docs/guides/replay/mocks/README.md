---
description: "Mock backends during testing with Speedscale to reduce dependencies on external APIs and ensure reliable API interactions without real transactions."
sidebar_position: 0
---

import OverviewMocksImage from './responders/overview-mocks.jpg';

# Mocking Backends

During a replay

Mocks, backed by [responders](/reference/glossary.md#responder), can be turned on and off before a replay, or from the snapshot.  This page describes the basic interaction with mocks.

## Viewing the snapshot

Open the snapshot's **Overview** tab to inspect its **Mocks** card. In **Traffic**, select **Mocks** or one dependency to inspect the recorded calls and responses. See [View Snapshot](../../creating-a-snapshot.md#view-snapshot) for the snapshot layout.

<div className="docs-diagram-scroll" style={{'--docs-diagram-width': '755px'}} tabIndex={0} role="region" aria-label="The banking-gateway snapshot Mocks card with four recorded dependencies">

![The banking-gateway snapshot Mocks card with four recorded dependencies](./responders/overview-mocks.jpg)

</div>

<a href={OverviewMocksImage}>Open screenshot full size</a>

This banking example records calls to Redis, accounts, transactions and user services. The Mocks card shows the number of recorded requests and detected technology for each dependency. [Responders](/reference/glossary.md#responder) use that recorded traffic to answer the application during a replay. See [supported technologies](/reference/technology-support.md).

### Choose mocks for a replay

The following replay-setup example uses a different `payment` service with DynamoDB, Stripe, Hubspot, Plaid and Google Cloud dependencies. Its backend selector controls which dependencies are mocked for that replay.

![The replay setup backend selector, listing dependencies and their detected technologies](./responders/table.png)

We can also see here that Speedscale has identified the type of backends these are. For eg. Hubspot is a JSON API and Stripe is similar but we've also identified `Bearer` authorization for the API requests. At this point we could uncheck certain backends if we did not them mocked out. For eg. I may not want to mock out DynamoDB because I have a dev instance setup but I want to mock out Stripe because I don't want to make actual credit card transactions. For now, we'll leave these all checked.

## Run a replay

![Replay](./responders/replay.png)

Now we can run a replay with the **Replay** button, or choose **How to replay** from the menu beside it for the other ways shown here. Note that by default, both inbound and outbound traffic is generated and mocked respectively. If you want to run a workload with just the mocked backend for development but not run a full test replay, skip to [responder only mode](#responder-only).

![Report](./responders/report.png)

After the replay is done, we can see the corresponding report. We have a 100% passing report and more importantly, we have a 100% responder rate. This means that we were successfully able to match all the requests made by the service under test via our signature matching algorithm. We can inspect the request and response pairs seen by the responder the same way we would with our general traffic capture.

## Responder Only

If we want to mock our backends indefinitely and not run a test, we can do this using responder only mode. Depending on your method of choice you can set the mode either via the annotation `replay.speedscale.com/mode: responder-only` or if you're using the TrafficReplay CRD, by setting the field `mode: responder-only`. This is a great way to develop services with external dependencies that:

* Have a cost associated with each API call. For eg. certain information APIs can cost a few cents per request which can add up quickly during development.
* Have disruptive side effects. For eg. we do not want to ever make real credit card charges and always want to mock out Stripe's API.
* Have low rate limits. Many public APIs such as Github's has strict rate limits which can be irritating to face when doing rapid iteration.

## Disabling some mock responses

Sometimes you don't want to mock everything in the environment. There are three ways to accomplish this:

1. *Disable an entire mock* - You can accomplish this by turning off the mock by unchecking it in the replay wizard:
![ReplayMockDisabled](./responders/replay_mock_disabled.png)

2. *Allow passthrough requests* - If you want to mock known requests but allow unrecognized transactions to continue to the original destination you can use `passthrough` mode. Just check the passthrough operation in your test config under the Mocks section:
![TestConfigPassthrough](./responders/tc_passthrough.png)

3. *Disable the responder* - If you want all mocks to be disabled, regardless of snapshot configuration, set your test config for "Tests only" mode.
![TestsOnly](./responders/test_only.png)
