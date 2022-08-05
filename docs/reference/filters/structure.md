---
sidebar_position: 2
---

# Structure

:::note
These sections are provided for reference, most users should create filters using the [UI](../from-traffic-viewer).
:::

Filter rule sets are collections of filters combined together with an operator.

Each individual filter has a condition, criteria and an operator. Condition/Criteria pairs are combined together with an `AND` or `OR` like a simple equation to determine if an RRPair is included. The basic format is:

```
{
    "id":"<unique ID>",
    "operator": "<OR|AND>",
    "conditions": [
        {
            "operator": "<OR|AND>",
            "filters": [
                {
                    "include": <true|false>,
                    "operator": "<CONTAINS|EQUAL>",
                    ...
                },
        },
        {
            ...
        }
    ]
}
```

Line 2 is an ID that must be unique in Speedscale Cloud.

Line 3 must be either `OR` or `AND` and will dictate whether all of the following conditions are or'd or and'd together.

Line 4 starts an array of conditions that must be satisfied for a RRPair to be included.

Line 6 determines whether the block of filters starting on line 7 will be ANDed or ORed together.

Line 7 starts an array of filters that must be satisfied

Line 9 determines whether this criteria means that the RRPair is included or excluded if satisfied.

Line 10 can be either `CONTAINS` if it only requires a substring match or `EQUAL` if an exact match is required.

Line 11 will be one of the following conditions:

```
    string Host = 5 [json_name = "host"];
    string Tag = 6 [json_name = "tag"];
    bytes RequestBodyHash = 9 [json_name = "requestBodyHash"];
    FilterRequestJSONBody request_body_json = 12 [json_name = "requestBodyJson"];
    FilterRequestXMLBody request_body_xml = 13 [json_name = "requestBodyXml"];
    TrafficDirection Direction = 16 [json_name = "direction"];
    string Tech = 17 [json_name = "tech"];
    string L7Protocol = 22 [json_name = "l7protocol"];
    string NetworkAddress = 23 [json_name = "network_address"];
    string Service = 24 [json_name = "service"];
    string Cluster = 25 [json_name = "cluster"];
    string Namespace = 26 [json_name = "namespace"];
    google.protobuf.StringValue OptURL = 27 [json_name="optUrl"];
    google.protobuf.StringValue DetectedCommand = 28 [json_name="detectedCommand"];
    google.protobuf.StringValue DetectedLocation = 29 [json_name="detectedLocation"];
    google.protobuf.StringValue DetectedStatus = 30 [json_name="detectedStatus"];
    TimeRangeFilter TimeRange = 31 [json_name="timeRange"];
    HeaderFilter Header = 32 [json_name="header"];
    HTTPReqXPathFilter HTTPReqXPath = 33 [json_name="httpReqXPath"];
    HTTPReqSOAPXPathFilter HTTPReqSOAPXPath = 34 [json_name="httpReqSoapXPath"];
```

Check out the protobufs for explanations of each type of filter if you enjoy learning the hard way. Or just build your filter in the Traffic Viewer and copy/paste it if you are in a rush.
