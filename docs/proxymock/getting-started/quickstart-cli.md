---
sidebar_position: 1
---

# Quickstart (CLI)

This guide provides a step by step guide to creating a mock server and tests for a simple Go application using only the **proxymock** CLI. 

## Introduction

![Architecture Overview](./quickstart/ip-lookup-demo-architecture.png)

This demo app is written in go and makes calls to IPStack and (optionally) AWS DynamoDB.

The purpose of this app is to accept two IP addresses, look up their geographic locations using [IP Stack](https://ipstack.com/) and calculate the distance between them.

## Prerequisites

You must install the **proxymock** CLI.

* [proxymock CLI](./installation.md#install-cli)

## How-to Steps {#how-to-steps}

This guide will show you how to:
1. Use a pre-packaged recording (aka snapshot) to create a mock server
1. Record the application's outbound traffic while it runs in a terminal to make your own custom mock server

You do not need to have an IP Stack API key or AWS DynamoDB instance to complete step one of this guide.

### Clone the Demo

Clone the demo repository:

```bash
git clone https://github.com/speedscale/demo
```

### Launch using Mocks {#launch-using-mocks}

To avoid having to get an IP Stack API key or access to a live AWS DynamoDB, you can use the pre-made mocks in the repository under `demo/go/snapshots/ip-lookup-demo.json`.  You can think of this JSON file as a set of mocks provided by another engineer.

1. Import the pre-made snapshot into your local [repository](../reference/repo.md).
```bash
proxymock import --file snapshots/ip-lookup-demo.json
{"request_id":"dc8b599e-b992-441c-b7b9-886eaea599f1","action":"import","result":"processing","data":{"progress":"0","rrpairsProcessed":"0"}}
{"request_id":"dc8b599e-b992-441c-b7b9-886eaea599f1","action":"import","result":"complete","data":{"filename":"/Users/<your-username>/.speedscale/data/snapshots/749e2d23-94fd-4e6d-86c2-5dd8ba18f908/raw.jsonl","progress":"100","rrpairsProcessed":"2","snapshotId":"749e2d23-94fd-4e6d-86c2-5dd8ba18f908","snapshotMetaFilename":"/Users/<your-username>/.speedscale/data/snapshots/749e2d23-94fd-4e6d-86c2-5dd8ba18f908.json"}}
```
Your snapshot is now located in your local repository at the location specified by the CLI output. In this example, it is 
`/Users/<your-username>/.speedscale/data/snapshots/749e2d23-94fd-4e6d-86c2-5dd8ba18f908.json`

2. Turn the snapshot into a mock server using this command:
```bash
proxymock analyze <snapshot-id>
```
3. Start your mock server using this command:
```bash
proxymock run --snapshot-id <snapshot-id>
```
The CLI will output a set of environment variables that you can use to route your traffic through the proxymock "smart proxy" server. Copy/paste these directly from the CLI output and paste them into step 2.

3. Open a **new** terminal and paste the environment variables from the CLI output in step 1. Also, start the demo app.
```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
go run main.go 0123456789
```
4.  Then run the following command to make a request to the demo app in another terminal:
```bash
curl "localhost:8080/get-ip-info?ip1=50.168.198.162&ip2=174.49.112.125"
```

You should see the following response to your curl from the app running in the debugger:

```json
{"distance":30.042060297133386,"request1":{"city":"Tucker","connection_type":"cable","continent_code":"NA","continent_name":"North America","country_code":"US","country_name":"United States","dma":"524","ip":"50.168.198.162","ip_routing_type":"fixed","latitude":33.856021881103516,"location":{"calling_code":"1","capital":"Washington D.C.","country_flag":"https://assets.ipstack.com/flags/us.svg","country_flag_emoji":"🇺🇸","country_flag_emoji_unicode":"U+1F1FA U+1F1F8","geoname_id":4227213,"is_eu":false,"languages":[{"code":"en","name":"English","native":"English"}]},"longitude":-84.21367645263672,"msa":"12060","radius":"46.20358","region_code":"GA","region_name":"Georgia","type":"ipv4","zip":"30084"},"request2":{"city":"Alpharetta","connection_type":"cable","continent_code":"NA","continent_name":"North America","country_code":"US","country_name":"United States","dma":"524","ip":"174.49.112.125","ip_routing_type":"fixed","latitude":34.11735916137695,"location":{"calling_code":"1","capital":"Washington D.C.","country_flag":"https://assets.ipstack.com/flags/us.svg","country_flag_emoji":"🇺🇸","country_flag_emoji_unicode":"U+1F1FA U+1F1F8","geoname_id":4179574,"is_eu":false,"languages":[{"code":"en","name":"English","native":"English"}]},"longitude":-84.29633331298828,"msa":"12060","radius":"44.94584","region_code":"GA","region_name":"Georgia","type":"ipv4","zip":"30004"}}
```

At this point, the demo app is running with the mock server. You can make requests to it as normal. Note that unknown IP addresses will require changes to the mocks.


Check the console log for information about the requests and responses. New responses are stored in the `raw.jsonl` file inside the `snapshots` directory in your local [repository](../reference/repo.md). To update the mock, you can re-run the analysis stage:

```bash
proxymock analyze <snapshot-id>
```

### Record with Live Systems {#record-with-live-systems}

Let's say you're trailblazing and there are no existing mocks. No problem, we'll just record some!

1. Start the proxymock capture system using this command:
```bash
proxymock run
```
You will see output like so:
```bash
...
export http_proxy=http://127.0.0.1:4140
export https_proxy=http://127.0.0.1:4140
...
You can find your snapshot at /Users/<your-username>/.speedscale/data/snapshots/<uid>
...
```
You'll notice that the CLI will output a set of environment variables that you can use to route your traffic through the proxymock "smart proxy" server. Copy/paste these directly from the CLI output and paste them into step 2.

2. Open a **new** terminal and export the environment variables from the CLI output in step 1.
These variables will re-route the outbound network in golang to point at the proxymock "smart proxy" server. It's ok that both HTTP and HTTPs are being routed to the same port. The other environment variables are for SSL/TLS.

3. Run the following command to make a request to the demo app:
```bash
curl "localhost:8080/get-ip-info?ip1=52.94.236.248&ip2=74.6.143.25"
```
Look for the location of your snapshot in the local [repository](../reference/repo.md). You check see your requests appear in the `raw.jsonl` file as it updates (or after completing your recording).

4. Teach your mock these new responses by re-analyzing the snapshot.

```bash
proxymock analyze <snapshot-id>
```

Your snapshot now contains the new requests and responses. You can now restart your mock server and make requests to it by following the instructions in [Launch using Mocks](#launch-using-mocks) and passing in your snapshot ID.

## Summary

Your local environment no longer requires the IP Stack API key or AWS DynamoDB. You can run the demo app simply by opening the Command Palette and run `proxymock: Start Debugging`.

The app will run normally - except that it will use the mock server you created in the previous step. If you need to update your mocks, just re-record the application's traffic. 

That's it! You command the superpower of running your app without it's dependent APIs and microservices.

## Next Steps

This guide only scratches the surface of what you can do with the free **proxymock** CLI. Please give us feedback in our [slack](https://slack.speedscale.com)

Speedscale Enterprise can also record from a production Kubernetes application to generate local mocks and tests (including Postgres and other proprietary protocols). For more information on that workflow, check out [Speedscale Enterprise](../../intro.md).
