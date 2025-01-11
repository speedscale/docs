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
* (optional) [IP Stack API Key](https://ipstack.com/) - skip to [Running the Demo](#running-the-demo) if you don't want to use the IP Stack API
* (optional) [AWS DynamoDB](https://aws.amazon.com/dynamodb/) - only needed for '--cache' option

Because of the awesomeness of local mocking, you can complete this guide without either API key - skip ahead to [Running the Demo](#running-the-demo).

## How-to Steps {#how-to-steps}

### Clone the Demo

Clone the demo repository and open VSCode in the demo directory:

```bash
git clone https://github.com/speedscale/demo
cd demo/go
code .
```

## Observe the Demo App {#observe-the-demo-app}

**proxymock** allows you to observe the behavior of your application in the debugger. This is done by recording the application's inbound and outbound traffic. Under the covers, **proxymock** modifies environment variables and listens to the application's traffic using the debugger context. If you already have a debugger context in your `launch.json` simply add your IP Stack API key as the first argument. If you don't have a launch.json you can create a new one that looks like this:

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

Open the VSCode Command Palette (Command+Shift+P on Mac or Ctrl+Shift+P on Windows).  Run `proxymock: Start Recording`. This will run the app in the debugger and start recording the application's traffic.

At this point you should see a new pane appear in the Primary Side Bar with the title `PROXYMOCK`. This is where you will see the application's traffic.

Open a new terminal and run the following command to make a request to the demo app:

```bash
curl "localhost:8080/get-ip-info?ip1=52.94.236.248&ip2=74.6.143.25"
```

You should see the request and response in the `PROXYMOCK` pane like this:

![request and response](./quickstart/rrpairs.png)

Take a look around and click on each request/response pair (RRPair) to see the details of the request and response. You should see the outbound calls in particular. These will form the basis of the service mock.

Stop the current debugger session by clicking the normal debug stop button.

## Create a Test {#create-a-test}

Find the **Send** button by hovering over the request and response pair. Click it to instantly run a test.

![send test](./quickstart/send-test.png)

Any new information will be updated in the RRPair viewer, including new responses. A new tab will open showing the new request and response. Save the request to update the RRPair for future playback.

:::tip
Inbound requests can also be turned into high quality regression and load tests using Speedscale Enterprise. You can also export these as Postman Collectinos or k6 scripts.
:::

## Create a Mock Server

Click on the Action Button (the three dots) at the top right of the `PROXYMOCK` pane and select the `Learn` action. This will add these requests to the running mock server. That's it, the mock server is now ready to use.

## Running the Demo {#running-the-demo}

Your local environment no longer requires the IP Stack API key or AWS DynamoDB. You can run the demo app simply by opening the Command Palette and run `proxymock: Start Playback`.

The app will run normally - except that it will use the mock server you created in the previous step.

![debug output](./quickstart/debug-output.png)

That's it! You command the superpower of running your app without it's dependent APIs and microservices.

Speedscale Enterprise can also record from a production Kubernetes application to generate local mocks and tests (including Postgres and other proprietary protocols). For more information on that workflow, check out [Speedscale Enterprise](../../intro.md).
