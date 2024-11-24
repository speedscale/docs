---
title: Create a snapshot using APIs
sidebar_position: 38
---

In this guide we will show you how to manually create a snapshot using the Speedscale API. There are much easier ways to create traffic snapshots, such as direct [recording](https://github.com/speedscale/demo) or by [importing a Postman collection](../integration/import/import-postman.md). This guide is useful if you want to create an RRPair programmatically.

The speedctl CLI tool has a local repository of snapshots that can be synchronized with Speedscale cloud. The process is similar to the `git` source control tool in that you modify snapshots locally and then push/pull them to the central repo. Editing snapshots is like working with text files full of JSON.

### Overview of Speedscale Snapshot Files

Collections of traffic are called snapshots and we will need to create one as a holding area. Speedscale stores local snapshots on your machine in the `<user directory>/snapshots/` directory and then mirrors them to the cloud on demand. Each snapshot has a metadata file in the root of that directory that has the same name as it’s ID. For example, `d30becb8-3e10-48f1-85e9-5b14be01909c.json`. All content is stored in a subdirectory with the same ID. For example, `<user directory>/snapshots/d30becb8-3e10-48f1-85e9-5b14be01909c`.

This directory contains a number of internal Speedscale files but the one that we will be editing in this guide is `raw.jsonl`. That file contains the raw traffic capture with each line in the file representing a request/response pair (RRPair). The other files in the directory are automatically generated and will be overwritten after a `push` to the cloud. For more information about Speedscale's data model, look [here](../reference/replay_data_model.md).

It is also possible to edit the snapshot metadata file stored at `<user directory>/snapshots/<snapshot id>.json`. But that won't be necessary for this example.

## Prerequisites

- Speedscale java [demo](https://github.com/speedscale/demo) is installed
- [speedctl](../setup/install/cli.md) is installed

## Create a Sample Raw File

The raw file contains one RRPair record per line. RRPairs can be ether inbound or outbound. Inbound RRPairs become tests when processed. Outbound RRPairs become mocks. This process happens automatically when the snapshot is analyzed.

We'll be creating an inbound RRPair in this guide. To learn how to edit outbound RRPairs, check out this [guide](./replay/mocks/from-scratch.md).

On your local machine create a file called `raw.jsonl`. The location of the file isn't important but we'll use the `~/Downloads` directory for simplicity. Insert the following line into your `~/Downloads/raw.jsonl` file.

```json
{
  "msgType": "rrpair",
  "resource": "MY_SERVICE",
  "ts": "2023-07-19T21:42:35.974594462Z",
  "l7protocol": "http",
  "duration": 5,
  "tags": {
    "k8sClusterName": "MY_SERVICE",
    "sequence": "530",
    "targetPort": "4143",
    "clientType": "goproxy",
    "proxyCID": "532",
    "proxyId": "MY_SERVICE",
    "proxyProtocol": "tcp:http",
    "k8sAppLabel": "MY_SERVICE",
    "k8sAppPodNamespace": "matthewleray",
    "proxyReqAddr": "192.168.240.1:50516",
    "reverseProxyHost": "host.docker.internal",
    "targetHost": "localhost",
    "captureMode": "proxy",
    "compressed": "gzip",
    "k8sAppPodName": "MY_SERVICE",
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
  "cluster": "MY_SERVICE",
  "namespace": "matthewleray",
  "service": "MY_SERVICE",
  "tech": "JSON",
  "network_address": "localhost:4143",
  "command": "GET",
  "location": "/spacex/ship",
  "status": "200",
  "detectedTech": ["HTTP", "JSON", "HTTP Auth", "Bearer", "JWT"],
  "http": {
    "req": {
      "url": "/spacex/ship",
      "uri": "/spacex/ship",
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
        "X-Xss-Protection": ["0"],
        "Cache-Control": ["no-cache, no-store, max-age=0, must-revalidate"],
        "Content-Type": ["application/json"],
        "Date": ["Wed, 19 Jul 2023 21:42:35 GMT"],
        "Expires": ["0"],
        "Pragma": ["no-cache"],
        "X-Content-Type-Options": ["nosniff"],
        "X-Frame-Options": ["DENY"]
      },
      "bodyBase64": "H4sIAAAAAAAE/wAmANn/eyJzaGlwX2lkIjoiNjE4ZmFkN2U1NjNkNjk1NzNlZDhjYWE5In0BAAD//7vdkzAmAAAA"
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

Also, make sure that the Speedscale demo app was installed with the default service name `MY_SERVICE`. If that's not what you used, just find/replace each reference. The format of the RRPair is fairly self explanatory and in the real world you'll want to modify it to match the request you desire. You can add as many RRPairs, either inbound or outbound, as you like with each request occupying one line. Remember not to pretty print the JSON.

## Create a Snapshot

Use the speedctl create command to create a snapshot both locally and in the cloud.

```bash
speedctl create snapshot --name testing --service MY_SERVICE --raw ~/Downloads/raw.jsonl
```

A full snapshot metadata JSON will be printed. Look for the `id` key as this is the unique ID we'll use to identify this snapshot. If you look on your local machine at `~/.speedscale/data/snapshots`, you'll see a new subdirectory with the same snapshot ID as is printed by this command. Your raw file should be present in that directory. You should also see the snapshot appear in your snapshot list in Speedscale cloud.

## Push to the Cloud

The create command will automatically synchronize with Speedscale cloud. However, you may want to iteratively make changes and upload them. Use the following command to synchronize when you're ready.

```bash
speedctl push snapshot <snapshot_id>
```

This will cause an analysis job to be run in Speedscale cloud and you should see the UI update with your new traffic.

## Run a Replay

Run a replay in the same way you normally would outlined in our [tutorial](../tutorial.md#replay). Select your new snapshot by name (in this example we called it `testing`).

## Wrap up

In this guide we learned how to create a new Snapshot using the Speedscale API/CLI, populate it with an RRPair and run it against a demo app. For more help make sure to join the Speedscale [community](https://slack.speedscale.com).
