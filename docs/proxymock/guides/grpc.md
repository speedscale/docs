---
title: Mock gRPC APIs
---

# Mock gRPC APIs

**proxymock** can be used with most gRPC services simply by running your app and recording traffic. Making a new mock is very easy and you can learn more about it in the [create your own mocks](../getting-started/quickstart/quickstart-cli.md#recording) section. A list of known supported technologies can be found [here](../../reference/technology-support.md). However, your API or Database may just work so you should try it out.

Check out this video for a walkthrough of gRPC observability and mocking on the local desktop:
<iframe src="https://player.vimeo.com/video/1062574345?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" width="640" height="582" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

:::tip
The go gRPC SDK treats localhost as a special case. If you need to record locally to a gRPC server residing on your local machine then put in your fully qualified hostname (found by running the `hostname` command in a terminal) instead of `localhost`.
:::

## General API Information

gRPC follows a consistent wire format and usually works with **proxymock** without modification. You can learn more about the raw gRPC encoding [here](https://protobuf.dev/programming-guides/encoding/). gRPC is typically a wrapper (usually HTTP2) around the protobuf binary format. We will use those terms interchangeably in this doc since **proxymock** handles these details natively.

The example data for this doc was generated using the OpenTelemetry example from the grpc github repository [here](https://github.com/grpc/grpc-go/tree/master/examples/features/opentelemetry) along with **proxymock**.

### Command Type

gRPC includes the command type right in the URL description. The URL tells you what server and rpc (command) are being sent, just like REST. From the grpc-go example:

```
/grpc.examples.echo.Echo/UnaryEcho
```

This indicates a call is being made to the Echo server and the UnaryEcho rpc.

### Body Format

protobuf encodes data in a binary format that can only be read by machines or humans with unreasonable amounts of patience. There is an Interface Definition Language (IDL) that is used to translate between this binary format and humans. These IDL mappings are stored in *.proto* files with comments and other handy information. Those *.proto* files are typically compiled into callbacks and other functions managed by your language's gRPC SDK.

Each *.proto* file has a list of messages containing fields. Translating this to REST, think of the message/rpc as the endpoint+command and the fields as the body. The fields themselves are hashmaps containing key/value pairs along with embedded child fields. It's just hashmaps within hashmaps all the way down. Each key is a field number and the value can be one of a variety of different types from numbers to binary arrays.

During normal development, an API is defined in a set of *.proto* files. A compiler is then run called *protoc* that converts those mappings into callbacks. To use the API, engineers typically call the language-specific callbacks and interact with friendly helper functions created by *protoc*.

When you're reading packets off the wire we may not have access to the *.proto* files to understand mappings. If you do, that's great and you can map field numbers to what is in the proto by matching the field numbers in the message to what *proxymock* displays. For common APIs such as those provided by Google you can often times find the actual protobuf like this one for [BigQuery Storage](https://github.com/googleapis/googleapis/blob/master/google/cloud/bigquery/storage/v1beta2/storage.proto).

If all else fails, you can usually figure out what you need just by looking at context. For instance, if you're working with [Google BigQuery](https://cloud.google.com/bigquery) and you see `15:SELECT * FROM my_table` it's usually pretty easy to figure out that field #15 is the query. if you want to change what SQL statement matches a response, just change that field.

*proxymock* converts gRPC payloads into JSON to make them human readable. The format for these body payloads is:

```json
{
    "<fieldNumber>:<fieldType>": "<value>"
}
```

Modifying the fieldType or fieldNumber is unusual, but technically possible. If you modify the response body JSON then *proxymock* will automatically modify the binary response when mocking.

### Example

*proxymock* will decode the binary protobuf wire format into JSON payloads like this:

```json
{
    "1:LEN": "varlength messages types are just strings"
}
```

This is a proprietary format since no official protobuf->JSON mapping exists at this time. If you modify the values in this hashmap and re-analyze your snapshot it will also update your mock server.