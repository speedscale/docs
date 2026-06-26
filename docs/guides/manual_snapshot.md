---
title: Create a snapshot using APIs
description: "Create a snapshot using the Speedscale API by following this guide, which details the manual process for programmatically managing traffic snapshots."
sidebar_position: 38
---

In this guide we will show you how to manually create a snapshot using the Speedscale API. There are much easier ways to create traffic snapshots, such as direct [recording](https://github.com/speedscale/mock-lab) or by [importing a Postman collection](./integrations/import/import-postman.md). This guide is useful if you want to create an RRPair programmatically.

The speedctl CLI tool has a local repository of snapshots that can be synchronized with Speedscale cloud. The process is similar to the `git` source control tool in that you modify snapshots locally and then push/pull them to the central repo. Editing snapshots is like working with text files full of JSON.

### Overview of Speedscale Snapshot Files

Collections of traffic are called snapshots and we will need to create one as a holding area. Speedscale stores local snapshots on your machine in the `<user directory>/snapshots/` directory and then mirrors them to the cloud on demand. Each snapshot has a metadata file in the root of that directory that has the same name as it’s ID. For example, `d30becb8-3e10-48f1-85e9-5b14be01909c.json`. All content is stored in a subdirectory with the same ID. For example, `<user directory>/snapshots/d30becb8-3e10-48f1-85e9-5b14be01909c`.

This directory contains a number of internal Speedscale files but the one that we will be editing in this guide is `raw.jsonl`. That file contains the raw traffic capture with each line in the file representing a request/response pair (RRPair). The other files in the directory are automatically generated and will be overwritten after a `push` to the cloud. For more information about Speedscale's data model, look [here](../reference/replay_data_model.md).

It is also possible to edit the snapshot metadata file stored at `<user directory>/snapshots/<snapshot id>.json`. But that won't be necessary for this example.

## Prerequisites

- The [mock-lab](https://github.com/speedscale/mock-lab) demo app is installed (clone with `git clone https://github.com/speedscale/mock-lab`, then `cd mock-lab/go` and `go run .` to run it on `localhost:8080`)
- [speedctl](../getting-started/installation/install/cli.md) is installed

## Create a Sample Raw File

The raw file contains one RRPair record per line. RRPairs can be ether inbound or outbound. Inbound RRPairs become tests when processed. Outbound RRPairs become mocks. This process happens automatically when the snapshot is analyzed.

We'll be creating an inbound RRPair in this guide. To learn how to edit outbound RRPairs, check out this [guide](./replay/mocks/from-scratch.md).

On your local machine create a file called `raw.jsonl`. The location of the file isn't important but we'll use the `~/Downloads` directory for simplicity. Insert the following line into your `~/Downloads/raw.jsonl` file.

```json
{
  "msgType": "rrpair",
  "resource": "mock-lab",
  "ts": "2026-06-25T18:56:37.974594462Z",
  "l7protocol": "http",
  "duration": 5,
  "tags": {
    "k8sClusterName": "mock-lab",
    "sequence": "530",
    "targetPort": "4143",
    "clientType": "goproxy",
    "proxyCID": "532",
    "proxyId": "mock-lab",
    "proxyProtocol": "tcp:http",
    "k8sAppLabel": "mock-lab",
    "k8sAppPodNamespace": "mock-lab",
    "proxyReqAddr": "192.168.240.1:50516",
    "reverseProxyHost": "host.docker.internal",
    "targetHost": "localhost",
    "captureMode": "proxy",
    "k8sAppPodName": "mock-lab",
    "proxyLocation": "in",
    "proxyRespAddr": "192.168.65.254:8080",
    "proxyType": "dual",
    "proxyVersion": "v1.3.209",
    "reverseProxyPort": "8080"
  },
  "wireformatSize": 1334,
  "jsonLength": 1693,
  "uuid": "6U/+hd4oRH6am3zHkaPq+Q==",
  "direction": "IN",
  "cluster": "mock-lab",
  "namespace": "mock-lab",
  "service": "mock-lab",
  "tech": "JSON",
  "network_address": "localhost:4143",
  "command": "GET",
  "location": "/api/orders/order-1a2b3c4d",
  "status": "200",
  "detectedTech": ["HTTP", "JSON", "HTTP Auth", "Bearer", "JWT"],
  "http": {
    "req": {
      "url": "/api/orders/order-1a2b3c4d",
      "uri": "/api/orders/order-1a2b3c4d",
      "version": "1.1",
      "method": "GET",
      "host": "localhost:4143",
      "headers": {
        "Accept": ["*/*"],
        "Authorization": [
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTY4OTg4OTIwNCwiaWF0IjoxNjg5ODAyODA0fQ.-6Azf69e6sFCGW3b7m6dabdOE1czdWxdXm9zKf__BBw"
        ],
        "User-Agent": ["curl/7.88.1"]
      }
    },
    "res": {
      "contentType": "application/json",
      "statusCode": 200,
      "statusMessage": "200 ",
      "headers": {
        "Content-Type": ["application/json"],
        "Date": ["Thu, 25 Jun 2026 18:56:37 GMT"]
      },
      "bodyBase64": "eyJvcmRlcl9pZCI6Im9yZGVyLTFhMmIzYzRkIiwicHJvamVjdCI6Imt1YmVybmV0ZXMiLCJzdGF0dXMiOiJjcmVhdGVkIiwiY3JlYXRlZCI6IjIwMjYtMDYtMjVUMTg6NTY6MzdaIn0="
    }
  },
  "tokens": {
    "JWT:eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTY4OTg4OTIwNCwiaWF0IjoxNjg5ODAyODA0fQ.-6Azf69e6sFCGW3b7m6dabdOE1czdWxdXm9zKf__BBw": {
      "location": "http.req.headers.Authorization.0",
      "regex": "^(?i)Bearer (.*)(?-i)",
      "pattern": "DATA_PATTERN_JWT",
      "replacementValue": "ZXlKaGJHY2lPaUpJVXpJMU5pSjkuZXlKemRXSWlPaUpoWkcxcGJpSXNJbVY0Y0NJNk1UWTRPVGc0T1RJd05Dd2lhV0YwSWpveE5qZzVPREF5T0RBMGZRLi02QXpmNjllNnNGQ0dXM2I3bTZkYWJkT0UxY3pkV3hkWG05ektmX19CQnc="
    }
  }
}
```

This example uses the service name `mock-lab`. If you use a different name, just find/replace each reference. The example shows a bearer-authenticated `GET /api/orders/{order_id}` call against the mock-lab app — the `Authorization` header carries a bearer token (here a JWT, which Speedscale detects and tokenizes automatically). The format of the RRPair is fairly self explanatory and in the real world you'll want to modify it to match the request you desire. You can add as many RRPairs, either inbound or outbound, as you like with each request occupying one line. Remember not to pretty print the JSON.

## Create a Snapshot

Use the speedctl create command to create a snapshot both locally and in the cloud.

```bash
speedctl create snapshot --name testing --service mock-lab --raw ~/Downloads/raw.jsonl
```

A full snapshot metadata JSON will be printed. Look for the `id` key as this is the unique ID we'll use to identify this snapshot. If you look on your local machine at `~/.speedscale/data/snapshots`, you'll see a new subdirectory with the same snapshot ID as is printed by this command. Your raw file should be present in that directory. You should also see the snapshot appear in your snapshot list in Speedscale cloud.

## Push to the Cloud

The create command will automatically synchronize with Speedscale cloud. However, you may want to iteratively make changes and upload them. Use the following command to synchronize when you're ready.

```bash
speedctl push snapshot <snapshot_id>
```

This will cause an analysis job to be run in Speedscale cloud and you should see the UI update with your new traffic.

## Run a Replay

Run a replay in the same way you normally would outlined in our [tutorial](../getting-started/tutorial.md#replay). Select your new snapshot by name (in this example we called it `testing`).

## Wrap up

In this guide we learned how to create a new Snapshot using the Speedscale API/CLI, populate it with an RRPair and run it against a demo app. For more help make sure to join the Speedscale [community](https://slack.speedscale.com).
