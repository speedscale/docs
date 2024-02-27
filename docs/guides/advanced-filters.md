---
title: Advanced Snapshot Filters
sidebar_position: 39
---

Speedscale has the ability to create snapshots based on very fine grained traffic criteria including HTTP header values, JSON or XML payload values and many more. However, to use this capability you must initiate snapshot creation using speedctl, our CLI. The following sections demonstrate how to filter based on some common advanced criteria.

## Creating a Snapshot

To create a snapshot using the CLI, follow the instructions in this section. For specific filtering examples skip to the next section, but return when you are ready to implement them in a snapshot.

1. Create a file called `update.json` and paste the following snapshot JSON definition into it. Edit start time, end time and service name in both the metadata and `filter_expression` keys. Paste in your desired filter criteria as well. Save.

```json
{
  "meta": {
    "name": "my new snapshot",
    "startTime": "2023-06-16T15:42:46Z",
    "endTime": "2023-06-16T15:47:46.999Z",
    "serviceName": "your-service-name"
  },
  "tokenConfigId": "standard",
  "tokenizerConfig": {
    "name": "standard",
    "out": [
      {
        "type": "http_match_request_body",
        "filters": {}
      }
    ],
    "id": "standard",
    "protected": true
  },
  "filter_expression": {
    "conditions": [
      {
        "filters": [
          {
            "include": true,
            "service": "your-service-name"
          }
        ]
      },
      {
        "filters": [
          {
            "include": true,
            "timeRange": {
              "startTime": "2023-06-14T16:57:25Z",
              "endTime": "2023-06-14T17:12:25.999Z"
            }
          }
        ]
      }
    ]
  },
  "disableTokenDiscovery": true
}
```

2. Trigger snapshot creation with `speedctl put`

```bash
speedctl put snapshot update.json
ed00843b-29f2-43c1-b644-40ae44b3162d
```

This command prints out a new snapshot ID that you can copy and paste into the search bar.

## Filter By JSON Value

As an example, let's filter for a single user ID stored in the JSON request body. This would allow us to isolate a single user's API calls, store them in a snapshot, and then scale up that traffic to many users by transforming the user ID. To accomplish the first goal of filtering based on a JSON value, we will use the `reqFilter` filter criteria. `reqFilter` is capable of doing a key/value document comparison but for this example we'll just search requests where the `user_number=0`.

Note: `reqFilter` type by default is set to JSON (`REQ_FILTER_TYPE_JSON`) but it's capable of filtering other key/value documents like: XML (`REQ_FILTER_TYPE_XML`), SOAPXPath (`REQ_FILTER_TYPE_SOAPXPATH`) and XPath (`REQ_FILTER_TYPE_XPATH`).

1. Create a JSON document with the keys and values you want to match on. In this example, we insert the following snippet and append to the `filter_expression->criteria` section of your snapshot definition

```json
{
  "filters": [
    {
      "include": true,
      "reqFilter": {
        "key": "user_number",
        "value": "0"
      }
    }
  ]
}
```

2. Trigger snapshot creation (see instructions at beginning of this page)

## Filter by HTTP Header Value

As an example, let's filter for a single user ID stored in an HTTP request header. This would allow us to isolate a single user's API calls, store them in a snapshot, and then scale up that traffic to many users by transforming the user ID. To accomplish the first goal of filtering based on a request header value, we will use the `header` filter criteria. Modify and append the following snippet to the `filter_expression->criteria` section of your snapshot definition.

```json
{
  "filters": [
    {
      "include": true,
      "operator": "CONTAINS",
      "header": {
        "key": "user-id",
        "value": "0"
      }
    }
  ]
}
```

This filter should be inserted into the snapshot creation workflow at the beginning of this page.

## Filter by gRPC Value

Speedscale decodes gRPC into a general purpose JSON format that can be worked with like any other JSON. This format can be difficult to read because it is a translation of raw wire format, but it has the major upside of not requiring protobuf access to decode. As an example, let's take a section of [Google Spanner](https://cloud.google.com/spanner) traffic and filter out one specific SQL statement. To do this, we use the `reqFilter` filter because the gRPC request payload will be in JSON when passed through the filters.

For this example, let's isolate the `SELECT 1` SQL statement. For Google Spanner, the SQL statement is stored at JSONPath `fieldsMap.3.fields.0.asString`. `reqFilter` is capable of doing a key/value document comparison, so for this example we'll search requests where `fieldsMap.3.fields.0.asString=SELECT 1`. Follow the steps below to create your own filter:

1. Create the following key/value `reqFilter` filter and append it to the `filter_expression->criteria` section of your snapshot definition

```json
{
  "filters": [
    {
      "include": true,
      "reqFilter": {
        "key": "fieldsMap.3.fields.0.asString",
        "value": "SELECT 1"
      }
    }
  ]
}
```

2. Trigger snapshot creation (see instructions at beginning of this page)

## Reference

Speedscale supports the following filter types on RRpairs:

```
host
tag
reqFilter
requestBodyHash
direction
tech (show in UI as Detected Tech)
l7protocol
network_address
service
cluster
namespace
optUrl
detectedCommand (shown in the UI as Operation)
detectedLocation
detectedStatus
timeRange
header
uuid
snapshotId
```
