# grpc_field

### Purpose

**grpc_field** takes a GRPC payload and extracts individual fields based on their field number. GRPC is a high speed binary wire protocol that is most commonly wrapped in HTTP/2. Speedscale has the ability to extract and transform individual fields using this transform.

The intended use for this transform is to follow either a http request or response body extractor. If you are transporting GRPC over a non-http protocol then use the extractor appropriate for that transport instead. This transform does not require http, only that the incoming binary payload be in GRPC wire format.

GRPC can embed messages within messages. For this use case, chain together two grpc_field transforms and set the `embedded` flag on the second instance. Messages embedded within messages have a slightly different format and so this flag must be set only on the second, third, etc grpc_field transforms but not on the first.

### Usage

```
"type": "grpc_field",
"config": {
    "field": "zero indexed integer",
    "embedded": "boolean"
}
```

### Example

#### Configuration

```
"type": "grpc_field",
"config": {
    "field": "14",
    "embedded": "false"
}
```

This config will extract field 14 from a request/response body and turn it into a human readable string or byte array. Numerical types like Byte32, VarInt, etc will be converted into numerical strings like `5704`. You can discover the field number by looking at the source protobuf (usually stored with your API documentation) or by looking at the JSON representation shown in the Speedscale traffic viewer. Speedscale does not require a protobuf definition to convert to JSON or extract fields, but having them makes things easier for humans to understand.

#### Input Token

```
<binary gobbeldygook>
```

#### Transformed Token

```
the string stored in field number 14
```


| Key                | Description                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **field**     | grpc field number to extract
| **embedded**            | (optional) Indicates whethe this is the top level message (true) or a child message (false). Defaults to false.
