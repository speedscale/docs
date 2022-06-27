# Timestamp Shift

Extracting and time shifting a date is a very common use case. Generally you do this when a client sends a request to the Service Under Test (SUT) that includes a timestamp that is absolute but must be a certain amount of time in the past.

For this example let's imagine we have an e-commerce application that searches for a list of results based on search criteria. For this specfiic example let's say we record a request/response including a search request with a time-based filter on the results. In order for the traffic to replay realistically, we'll want to shift the date in the search parameters so that it is reasonably current.

#### Objective

Have the generator send an updated timestamp that is 50 days in the past, just like the original RRPair.

#### Download Repository

The example data necessary for this example can be found in the Speedscale github repository:

```
git clone https://github.com/speedscale/example-config
```

#### Configuration

Switch to the `date` directory.

Inspect `timewarp.json`. Inside is a complete example for a tokenconfig that will direct the analyzer to tokenize and then date shift a query parameter with search filter instructions. Look closely at the `pattern` and `regex` transform sections.

Inspect `raw.jsonl`. Note that the date at the end of the `filter` query parameter (`2021-04-19`) matches the `pattern` in the transform definition. This date is the value that the transform will target.

#### Experiment

Run the following command to analyze `raw.jsonl` using the the configuration in `timewarp.json`.

```
speedctl transform raw.jsonl timewarp.json
```

Inspect the query parameters in `action.jsonl`. In a production system this file contains a set of requests the generator would send and expect responses for. Notice the query parameter `{speedscale_date(1200h0m0s)}` has replaced the date originally found in the `filter` query parameter. The 1200h is automatically calculated as the time between when the request was recorded and the date in the query parameter. Conveniently, it's exactly 50 days in the past and so we want any new requests to also have a query parameters 50 days in the past when they are sent.

When the generator runs this new action file, it will see the `speedscale_date` directive and insert the correct time shifted value in the original format.


To run this transform configuration in your environment copy/paste the contents of `timewarp.json` into a new tokenconfig in your tenant and use it in your replay configuration.

:::info
Join slack.speedscale.com to ask real time questions. Our expert engineers are always happy to help with configuration issues.
:::
