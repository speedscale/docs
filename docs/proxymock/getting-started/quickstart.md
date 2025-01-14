---
sidebar_position: 3
---

# Quickstart

This guide provides a high-level overview of how to get a simple demo app up and running to better understand how **proxymock** works.

## Introduction

This guide will show you how to create a realistic mock that sidesteps the rate limits of IP Stack and removes the need for a real DynamoDB instance. This is a simple app that uses the [IP Stack](https://ipstack.com/) API to get the location of an IP address and [AWS DynamoDB](https://aws.amazon.com/dynamodb/) to store and retrieve data. Once complete, you will know how to record a real application's behavior and generate a mock server and tests. This guide covers the following concepts:

* How to *observe* a real application's API calls in the debugger (inbound and outbound)
* How to generate a mock server and tests
* How to run your app in a simulation environment
* (optional) How to record from a production Kuberenetes application to generate local mocks and tests

Once complete, you will know how to decouple your application from external dependencies and run your app in a debugger as if it were in a live environment. Also keep in mind that everything done in this guide can be done without VSCode using the command line `speedctl` tool. For more information on that workflow, check out [Speedscale Enterprise](../../intro.md).

## Architecture Overview

For this example, we will be using a simple application that uses the [IP Stack](https://ipstack.com/) API to get the location of two IP addresses, calculate the distance between them, and then cache the result in [AWS DynamoDB](https://aws.amazon.com/dynamodb/). The screenshots of this example are written in Go, but you can also find other language examples in the same repository.

![Architecture Overview](./quickstart/ip-lookup-demo-architecture.png)

The client (curl) calls our demo application, which then checks the cache for the location of the IP address. If the location is not in the cache, it makes two calls to the IP Stack API to retrieve the location of two IP addresses. The app then calculates the distance the two locations using the Haversine formula. A call is them made to DynamoDB to store the result. This is not a very complex demo app, but it does demonstrate how to record and mock a real application's behavior.

## Prerequisites

* [Speedscale CLI](./installation.md#install-speedctl)
* [Speedscale Proxymock Extension](./installation.md#install-proxymock-extension)
* [Speedscale API Key](./api-key.md)
* (optional) [IP Stack API Key](https://ipstack.com/) - skip to [Use Pre-Made Mocks](#use-pre-made-mocks) if you don't want to use the IP Stack API
* (optional) [AWS DynamoDB](https://aws.amazon.com/dynamodb/) - only needed for '--cache' option

Because of the awesomeness of local mocking, you can complete this guide without either API key - skip ahead to [Use Pre-Made Mocks](#running-the-demo).

## How-to Steps {#how-to-steps}

### Clone the Demo

Clone the demo repository and open VSCode in the demo directory:

```bash
git clone https://github.com/speedscale/demo
cd demo/go
code .
```

### Setup launch.json {#setup-launch-json}

**proxymock** allows you to observe the behavior of your application in the debugger. This is done by recording the application's inbound and outbound traffic. Under the covers, **proxymock** modifies environment variables and listens to the application's traffic using the debugger context. If you already have a debugger context in your `launch.json` you may want to add API keys (if you choose to run a real recording - see below). If you don't have a launch.json you can create a new one that looks like this:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Package",
            "type": "go",
            "request": "launch",
            "mode": "auto",
            "program": "${fileDirname}",
            "args": [
                "<insert your IP Stack API key here>"
            ],
            "env": {
                "AWS_ACCESS_KEY_ID": "<insert if you want to use the cache>",
                "AWS_SECRET_ACCESS_KEY": "<insert if you wnat to tuse the cahce>",
                "AWS_SESSION_TOKEN": "<insert if you want to use the cache>"
            }
        }
    ]
}
```

This is where you get to choose your own adventure:
* If you want to just get started with pre-made mocks, you can use the pre-packaged snapshot in the repository under `demo/snapshots/ip-lookup-demo.json`. Go to [Use Pre-Made Mocks](#use-pre-made-mocks) to see how to use the pre-made mocks without access to the real systems.
* If you are ok signing up for an IP Stack API key, you should insert it into the launch.json. Also, if you have access to an AWS DynamoDB instance, you can insert your credentials into the launch.json. Go to [Record with Real Systems](#record-with-live-systems) to start recording the application's traffic. One of the reasons `proxymock` exists is to make it so every developer doesn't need their own API keys or even test environments.

### Use Pre-Made Mocks {#use-pre-made-mocks}

If you don't want to go through the effort of getting an IP Stack API key or you don't have access to a live AWS DynamoDB, you can use the pre-made mocks in the repository under `demo/snapshots/ip-lookup-demo.json`.  You can think of these as pre-recorded mocks and tests provided by another engineer. This is how `proxymock` is designed to work - one engineer can create a mock and another engineer can use it. The process of updating snapshots across build pipelines and multiple developer desktops can be automated using [Speedscale Enterprise](../../intro.md).

Navigate to the `PROXYMOCK` pane and click the `Open existing recording` button. Select the `demo/snapshots/ip-lookup-demo.json` snapshot file. Your tree view should update to show the requests and responses for this use case.

At this point you should see the pre-recorded requests and responses in the `PROXYMOCK` pane.

![request and response](./quickstart/rrpairs.png)

### Record with Live Systems {#record-with-live-systems}

Let's say you're trailblazing and there are no existing mocks. No problem! Open the VSCode Command Palette (Command+Shift+P on Mac or Ctrl+Shift+P on Windows).  Run `proxymock: Start Recording`. This will run the app in the debugger and start recording the application's traffic. Your app will still be talking to live systems, but 

At this point you should see a new pane appear in the Primary Side Bar with the title `PROXYMOCK`. This is where you will see the application's traffic.

Open a new terminal and run the following command to make a request to the demo app:

```bash
curl "localhost:8080/get-ip-info?ip1=52.94.236.248&ip2=74.6.143.25"
```

You should see the request and response in the `PROXYMOCK` pane like this:

![request and response](./quickstart/rrpairs.png)

Take a look around and click on each request/response pair (RRPair) to see the details of the request and response. You should see the outbound calls in particular. These will form the basis of the service mock.

Click on the Action Button (the three dots) at the top right of the `PROXYMOCK` pane and select the `Learn` action. The `PROXYMOCK` pane typically appears on the left sidebar and shows an icon somewhere below your Debugger iconThis will add these requests to the running mock server. That's it, the mock server is now ready to use.

:::tip
Running your app in the debugger is now a powerful observability tool. You can see the application's traffic by clicking on each RRPair in the tree, including payloads.
:::
### Run a Test {#run-a-test}

Find the **Send** button by hovering over the request and response pair. Click it to instantly run a test.

![send test](./quickstart/send-test.png)

Any new information will be updated in the RRPair viewer, including new responses. A new tab will open showing the new request and response. Save the request to update the RRPair for future playback.

:::tip
Inbound requests can also be turned into high quality regression and load tests using Speedscale Enterprise. You can also export these as Postman Collections or k6 scripts.
:::

## Summary

Your local environment no longer requires the IP Stack API key or AWS DynamoDB. You can run the demo app simply by opening the Command Palette and run `proxymock: Start Playback`.

The app will run normally - except that it will use the mock server you created in the previous step. If you need to update your mocks, just re-record the application's traffic.

![debug output](./quickstart/debug-output.png)

That's it! You command the superpower of running your app without it's dependent APIs and microservices.

## Next Steps

This guide only scratches the surface of what you can do with **proxymock**. It is completely free to local desktop use.

Speedscale Enterprise can also record from a production Kubernetes application to generate local mocks and tests (including Postgres and other proprietary protocols). For more information on that workflow, check out [Speedscale Enterprise](../../intro.md).
