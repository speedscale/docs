---
sidebar_position: 2
---

# Quickstart

This guide provides a step by step guide to creating a [mock server](reference/glossary.md#mock-server) and tests for a simple Go application using only the **proxymock** CLI.

## Introduction

![Architecture Overview](./quickstart/ip-lookup-demo-architecture.png)

This demo app is written in go and makes calls to IPstack and (optionally) AWS DynamoDB.

The purpose of this app is to accept two IP addresses, look up their geographic locations using [IP Stack](https://ipstack.com/) and calculate the distance between them.

## Prerequisites

- Optionally, have a valid [API Key](./initialize.md) if you plan to make calls to the real IPstack

:::note
This demo does not require an IPstack API key. Instructions for using the pre-made mocks are presented first so you can see a real example of running mocks from a previous recording. Once you have seen this working you can record your own calls to other APIs.
:::

## How-to Steps {#how-to-steps}

This guide will show you how to:

1. Use a pre-packaged recording (aka [snapshot](reference/glossary.md#snapshot)) to create a [mock server](reference/glossary.md#mock-server)
1. Record the application's outbound [traffic](reference/glossary.md#traffic) while it runs in a terminal to make your own custom [mock server](reference/glossary.md#mock-server)

You do not need to have an IP Stack API key or AWS DynamoDB instance to complete step one of this guide.

This demo will use 3 terminal windows in total for different contexts:

- one terminal to run **proxymock**
- one terminal to run the demo application
- one terminal to run cURL as an HTTP client

### Setup the Environment

The easiest way to create a working environment is to use Github Codespaces. Simply navigate to he demo [repository](https://github.com/speedscale/demo) and create a new Codespace:

![Codespaces](./quickstart/codespaces.png)

Alternatively you can clone the repo locally and setup the environment locally

```bash
git clone https://github.com/speedscale/demo
cd demo/go
go mod download
```

### Launch using Mocks {#launch-using-mocks}

You can use the pre-made mocks in the repository under `demo/go/snapshots/api.ipstack.com`.

1. Open the **1st terminal** and start the mock server, pointing to the existing mock files:

```bash
proxymock mock --in ./snapshots/api.ipstack.com
```

:::note
Here we are explicitly specifying the `--in` directory to source test and mock
files from, but **proxymock** will look in the `./proxymock` directory by
default and directory searches are recursive, meaning this flag is optional.
:::

The CLI will output a set of environment variables that you can use to route your traffic through the proxymock "smart proxy" server. You can use these environment variables from the CLI output and paste them into step 2.

2. Open a **2nd terminal** window (`cmd + \`), paste the environment variables from the CLI output and this fake API key. Then start the demo app:

```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
export IPSTACK_API_KEY=1234567890
go run main.go "$IPSTACK_API_KEY"
```

The output should look something like this:

```bash
2025/02/28 17:18:39 Listening on port 8080
```

Note that the mock has been pre-configured to accept the super-secret 1234567890 IPstack API key. This lets you see how the mock works even if you've never used IP Stack before.

5.  Then open a **3rd terminal** and make a request to the demo app using `curl`:

```bash
curl "localhost:8080/get-ip-info?ip1=50.168.198.162&ip2=174.49.112.125"
```

You should see the following response:

```json
{
  "distance": 1056.4301458905202,
  "request1": {
    "city": "Mount Laurel",
    "connection_type": "cable",
    "continent_code": "NA",
    "continent_name": "North America",
    "country_code": "US",
    "country_name": "United States",
    "dma": "504",
    "ip": "50.168.198.162",
    "ip_routing_type": "fixed",
    "latitude": 39.957000732421875,
    "location": {
      "calling_code": "1",
      "capital": "Washington D.C.",
      "country_flag": "https://assets.ipstack.com/flags/us.svg",
      "country_flag_emoji": "🇺🇸",
      "country_flag_emoji_unicode": "U+1F1FA U+1F1F8",
      "geoname_id": 4503136,
      "is_eu": false,
      "languages": [
        {
          "code": "en",
          "name": "English",
          "native": "English"
        }
      ]
    },
    "longitude": -74.91622924804688,
    "msa": "37980",
    "radius": "54.05969",
    "region_code": "NJ",
    "region_name": "New Jersey",
    "type": "ipv4",
    "zip": "08054"
  },
  "request2": {
    "city": "Alpharetta",
    "connection_type": "cable",
    "continent_code": "NA",
    "continent_name": "North America",
    "country_code": "US",
    "country_name": "United States",
    "dma": "524",
    "ip": "174.49.112.125",
    "ip_routing_type": "fixed",
    "latitude": 34.08958053588867,
    "location": {
      "calling_code": "1",
      "capital": "Washington D.C.",
      "country_flag": "https://assets.ipstack.com/flags/us.svg",
      "country_flag_emoji": "🇺🇸",
      "country_flag_emoji_unicode": "U+1F1FA U+1F1F8",
      "geoname_id": 4179574,
      "is_eu": false,
      "languages": [
        {
          "code": "en",
          "name": "English",
          "native": "English"
        }
      ]
    },
    "longitude": -84.29045867919922,
    "msa": "12060",
    "radius": "44.94584",
    "region_code": "GA",
    "region_name": "Georgia",
    "type": "ipv4",
    "zip": "30004"
  }
}
```

You've done it! At this point the demo app is running with the mock server. The API key `1234567890` is not valid so a real request to IPstack will fail, but the mock server is replying with the recorded response from the mocks. Note that unknown IP addresses will require changes to the mocks.

### Record with Live Systems {#record-with-live-systems}

Let's say you're trailblazing and there are no existing mocks. No problem, we'll just record some!

:::note
Now is the time to sign up for an IP Stack API key and make sure you have an AWS DynamoDB instance. Alternatively, use your own app and follow these instructions.
:::

1. Start recording requests and responses:

```bash
proxymock record
```

You will see output like so:

```bash
...
export http_proxy=http://127.0.0.1:4140
export https_proxy=http://127.0.0.1:4140
...
recorded tests / mocks are being written to proxymock/recorded-2025-04-15_15-56-02.200913Z
...
```

You'll notice that the CLI will output a set of environment variables that you can use to route your traffic through the proxymock "smart proxy". Copy paste these directly from the CLI output and paste them into step 2.

2. Open a **new terminal** and export the environment variables from the CLI output in step 1. These variables will re-route the outbound network in Golang to point at the proxymock "smart proxy". This will require a real IPstack API key.

:::note
Don't want to go get an IPstack key?  Just record from your own app and skip the rest of this section!
:::

```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
go run main.go "$REAL_IPSTACK_API_KEY"
```

3. Run the following command to make a request to the demo app:

```bash
curl "localhost:8080/get-ip-info?ip1=52.94.236.248&ip2=74.6.143.25"
```

Tests and mocks will be written to the `./proxymock` directory as they are recorded and organized by hostname. When you are done press Ctrl+C in the proxymock terminal to stop capturing.

4. Take a look at your traffic using the `inspect` command.

```bash
proxymock inspect --in ./proxymock
```

This will open a state of the art (for 1997) terminal user interface (TUI) that allows you to navigate and inspect your traffic using arrow keys and tab.

![Inspect](./quickstart/snapshot-inspect.png)

Press Enter to view details about each request. Keep in mind that your list of requests will be different than the screenshot but it will be similar. If you have the `--cache` option enabled in the demo app (and have AWS credentials), you will notice that proxymock has automatically exposed the DynamoDB command. Other protocols like gRPC and Postgres will also be converted into human readable JSON payloads with SQL statements exposed (and more).

5. Teach your mock these new responses by re-analyzing the snapshot with the `a` key in the inspect TUI.

Your snapshot now contains the new requests and responses. You can now restart your mock server and make requests to it by following the instructions in [Launch using Mocks](#launch-using-mocks) and passing in your snapshot ID.

### Capturing Inbound Traffic

Up to this point we have only seen outbound requests, the requests from the demo app to external resources, but we can capture inbound requests as well.

1. Start proxymock like before, but with the additional `--app-port` flag. We'll use `8080` because that's the port the demo app listens on:

```bash
proxymock record --app-port 8080
```

2. If the demo app is not running already open a **new** terminal and start it like before:

```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
IPSTACK_API_KEY=1234567890
go run main.go "$IPSTACK_API_KEY"
```

3. Then run the following command to make a request to the demo app in another terminal:

```bash
curl "localhost:4143/get-ip-info?ip1=50.168.198.162&ip2=174.49.112.125"
```

You will notice cURL is calling port `4143` instead of `8080` where the demo app is listening. Since we specified `--app-port 8080` requests to proxymock on port `4143` will be captured and redirected to the demo app on port `8080`. See [architecture](../how-it-works/architecture.md) for more details on the communication between components.

4. Like before you can see your traffic with the `inspect` command:

```bash
proxymock inspect --in ./proxymock
```

This will open the inspect UI. You can navigate to the request you want to change and press `Enter` to open the request in the editor.

Inbound traffic in the inspect UI will show the DIRECTION as "in".

### Modifying Mocks

Let's imagine you want to make your IP Stack mock return a different location for one of the requests. No problem, open `inspect` on the `./proxymock` directory and navigate to the request you want to change.

```bash
proxymock inspect --in ./proxymock
```

![ipstack-response](./quickstart/ipstack-response1.png)

1. Naviagate to the [RRPair](/reference/glossary.md#rrpair) you want to modify.
1. Press the `e` key to open the request in your favorite text editor.
1. Insert `10.12345678` into the `latitude` field in the response body.
1. Save the file.
1. Restart the mock server with `proxymock mock` and make a request to the demo app. You will notice the modified response.

## Summary

Your local environment no longer requires the IP Stack API key or AWS DynamoDB. You can run the demo app simply by running `proxymock mock`.

The app will run normally - except that it will use the mock server you created in the previous step. If you need to update your mocks, just re-record the application's traffic.

That's it! You command the superpower of running your app without it's dependent APIs and microservices.

## Next Steps

This guide only scratches the surface of what you can do with the free **proxymock** CLI. Please give us feedback in our [slack](https://slack.speedscale.com)

Speedscale Enterprise can also record from a production Kubernetes application to generate local mocks and tests (including Postgres and other proprietary protocols). For more information on that workflow, check out [Speedscale Enterprise](../../intro.md).
