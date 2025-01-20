---
sidebar_position: 4
---

# FAQ

## What protocols are supported?

`proxymock` can record a variety of protocols including HTTP, gRPC, and Postgres. Most AWS and GCP services will work out of the box because they utilize HTTP/2. You can see a complete list of recorded protocols [here](../../reference/technology-support.md). Keep in mind that the "automatic" aspect may not be as automatic depending on how unusual the protocol is. Usually this can be resolved with environment variables or by using proxymock as a CLI. Join the [Speedscale Slack](https://slack.speedscale.com) for help.

## Does this work for Windows?

Only if you run inside a container. Windows gets grumpy with it comes to networking but we're working on it.

## Are IDEs other than VSCode supported?

Yes, but you'll have to use `proxymock` as a CLI to create and manage your mock servers and set environment variables yourself. We are open to supporting more platforms like Goland and IntelliJ but need more requests to do so.  Join the [Speedscale Slack](https://slack.speedscale.com) to cast your vote.

## What is the difference between proxymock and Speedscale Enterprise?

`proxymock` is a local tool that allows you to create a mock server from a recording of your application's traffic. It is a great way to get started with traffic replay. `proxymock` is free and the UI is open source. It DOES NOT require a subscription to Speedscale Enterprise. The backend for `proxymock` is actually a local Speedscale Enterprise mock server and so it is already enterprise-grade even though it's free.

Speedscale Enterprise is a cloud platform that allows you to create, manage, and scale mock servers. It allows you to record from a real production environment and bring that environment back to your desktop. That is a paid product that requires a subscription (and helps fund `proxymock` development).

## Can Proxymock be used as a shared mock server to replace part of a dev environment?

Most definitely, but for that you need to consider an Enterprise subscription. Beyond licensing, you will need the more sophisticated tools provided by Speedscale Enterprise to manage that use case.

## What happens if the mock server doesn't have a response for a request?

`proxymock` defaults to **passthrough** mode which means it will reach out to the real system and return the response. The request and response will then be added to the rrpair editor. You can modify the response if you like using the rrpair editor and then save. Press the `Learn` button and the mock will be updated with the new response. You thought we were going to tell you to write a script, right? We like you too much for that. To learn more about signature matching, see the [signatures](../reference/signature.md) section.

## What language support is there?

`proxymock` the cli supports a variety of languages including Go, Python, Node, and Java. You can see a complete list of recorded languages [here](../../reference/technology-support.md).

Right now, the full automated VSCode workflow only works for golang but new languages are in development. We are currently considering Java and nodejs. Even without the fully automated VSCode debugger experience you can still record and view traffic with the cli.
