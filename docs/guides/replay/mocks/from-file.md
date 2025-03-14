---
title: Replace Values from File
sidebar_position: 9
---

In this guide we will store a list of values in a file and use them to replace
values in requests made to your application.

## Prerequisites

If these requirements do not make sense start with the [quickstart guide](/quick-start.md).

- [speedctl](/setup/install/cli.md) installed
- captured application [traffic](/reference/glossary.md#traffic)
- an understanding of the [file extractor](/reference/transform-traffic/extractors/file.md) and [csv transform](/transform/transforms/csv.md)

## The Problem

We will create a contrived example so we have something concrete to work with.  Your API accepts orders from clients, but it's important that the order IDs are in the database your application will reference.  You recorded traffic from production and want to [replay](/reference/glossary.md#replay) in your staging environment, meaning the order IDs are unlikely to exist.  Our goal is to populate requests data with order numbers from the environment where the replay will be run.

The client will update the price of an item on an order by sending a `PUT` request to the `/orders/update/price` [endpoint](/reference/glossary.md#endpoint).

```json
{
  "order": {
    "id": "75392",
    "product_sku": "b5c247d",
    "price": "10.00"
  }
}
```

The snapshot traffic you've captured contains requests with JSON bodies that look like this, but if the order ID doesn't exist the update will fail.  We need to replace the order IDs in the requests made from the [generator](/reference/glossary.md#generator) to your API during replay.

## Upload Values File

Let's create a CSV file with values to pull from.

```bash
cat > staging-order-ids.csv << EOF
95218
21562
43514
EOF
```

Now upload this file to user data storage in S3 via `speedctl`.

```bash
speedctl put user-data staging-order-ids.csv
```

You can view and edit this file later via the `push`, `edit`, and `pull` commands.

```bash
speedctl pull user-data staging-order-ids.csv
speedctl edit user-data staging-order-ids.csv
speedctl push user-data staging-order-ids.csv
```

## Create Transforms

With the CSV file stored in the Speedscale cloud we can use a transform to extract the values with the [file extractor](/reference/transform-traffic/extractors/file.md) and parse it with the [CSV transform](/transform/transforms/csv.md).

:::note
JSON does not support comments but they are added below for clarity.
:::

```bash
cat > replace-from-csv.json << EOF
{
  "id": "replace-from-csv",
  # generatorVariables are populated when the generator starts and do not interact directly with data from RRPairs.
  "generatorVariables": [
    {
      # name of the variable to store this data in
      "name": "order-ids",
      "config": {
        "extractor": {
          "type": "file",
          "config": {
            # s3:// is relative to the Speedscale user data directory for your tenant
            "filename": "s3://staging-order-ids.csv"
          }
        },
        "transforms": [
          {
            "type": "csv",
            "config": {
              # pick the first column of the CSV data
              "column": "0"
            }
          }
        ]
      }
    }
  ],
  # generator transforms are run for every request which meets the filter criteria
  "generator": [
    {
      # only run this transform on requests that will use the stored variable to modify data
      "filters": {
        "filters": [
          {
            "include": true,
            "detectedLocation": "/orders/update/price"
          },
          {
            "include": true,
            "detectedCommand": "PUT"
          }
        ]
      },
      # extract the request body before the generator makes the request to your API
      "extractor": {
        "type": "req_body"
      },
      # target the path in the body JSON and insert the variable
      "transforms": [
        {
          "type": "json_path",
          "config": {
            "path": "order.id"
          }
        },
        {
          "type": "var_load",
          "config": {
            "name": "order-ids"
          }
        }
      ]
    }
  ]
}
EOF
speedctl put transform replace-from-csv.json
```

Each time the `order-ids` variable is used it will pull the next value from the CSV column selected.  If all values are used the variable will start over from the first value.

## Run a Replay

Navigate to your application in the [traffic viewer](/reference/glossary.md#traffic-viewer).  Select a small window of traffic from your application and click the `Replay` button. When prompted, select the `replace-from-csv` transform.  The created [report](/reference/glossary.md#report) will show each request made in the [assertions](/reference/glossary.md#assertion) table.  Verify the request data sent to your application matches your expectations.

