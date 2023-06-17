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
            },
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

As an example, let's filter for a single user ID stored in the JSON request body. This would allow us to isolate a single user's API calls, store them in a snapshot, and then scale up that traffic to many users by transforming the user ID. To accomplish the first goal of filtering based on a JSON value, we will use the `requestBodyJson` filter criteria. `requestBodyJson` is capable of doing a full key/value document comparison but for this example we'll just search requests where the `user_number=0`.

1. Create a JSON document with the keys and values you want to match on. In this example, we'll use this simple JSON document: `{user_number: "0"}` to extract a single user's calls.

2. Base64 the JSON document

(on Mac and Linux)
```bash
$ echo {user_number:0} | base64
e3VzZXJfbnVtYmVyOjB9Cg==
```

3. Insert the base64 string into the following snippet and append to the `filter_expression->criteria` section of your snapshot definition

```json
            {
                "filters": [
                    {
                        "include": true,
                        "operator": "CONTAINS",
                        "requestBodyJson": {
                            "compare": true,
                            "body": "e3VzZXJfbnVtYmVyOjB9Cg==",
                            "includeKeys": [
                                "location_number"
                            ]
                        }
                    }
                ]
            }

```

4. Trigger snpashot creation

## Filter by HTTP Header Value

As an example, let's filter for a single user ID stored in an HTTP request header. This would allow us to isolate a single user's API calls, store them in a snapshot, and then scale up that traffic to many users by transforming the user ID. To accomplish the first goal of filtering based on a request header value, we will use the `header` filter criteria. Modify and append the following snippet to the `filter_expression->criteria` section of your snapshot definition.

```json
            {
                "filters": [
                    {
                        "include": true,
                        "operator": "CONTAINS",
                        "header":{
                            "key":"user-id","value":"0"
                        }
                    }
                ]
            }
```