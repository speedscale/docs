---
title: Record gRPC traffic
description: "Record the gRPC calls your service receives and the gRPC calls it makes to its dependencies with proxymock, then read each recorded call as an editable file."
---

# Record gRPC traffic

`proxymock record` sits in front of your gRPC service, behind it, or both, and writes every call it sees to a file. Inbound calls become tests you can replay at the service. Outbound calls to gRPC dependencies become mocks you can serve in their place.

The examples on this page use a small fraud-check service with one unary RPC, `fraud.v1.FraudChecker/CheckTransaction`, listening on port 18551. Use your own service's port in its place.

## Record the calls your service receives

Start the recorder with your service's port, and either let it launch the service or start the service yourself:

```bash
proxymock record --app-port 18551 --proxy-in-port 18571 --out ./proxymock/recorded-fraud -- ./fraud-service
```

Then send your clients, tests or load to the recorder's inbound port, 18571 here (4143 by default), instead of the service's own port. For example, with [grpcurl](https://github.com/fullstorydev/grpcurl):

```bash
grpcurl -plaintext -proto fraud.proto -d '{"account_id":"acct-1001","user_id":"user-7","amount":12.5,"transaction_type":"DEPOSIT","merchant_category":"5411"}' localhost:18571 fraud.v1.FraudChecker/CheckTransaction
```

The recorder forwards each call to the service and writes the call and the service's real response under the output directory, one file per call, grouped by host. Stop it with Ctrl-C.

:::tip
The Go gRPC SDK treats `localhost` as a special case. If a client on your machine must reach a gRPC server on your machine through the recorder and the call does not appear, use your machine's fully qualified hostname (from the `hostname` command) instead of `localhost`.
:::

## Record the calls your service makes

To record a gRPC dependency, put the recorder between your service and the dependency. Two ways work:

- **A mapped port.** `--map` makes the recorder listen on a local port and forward to the real dependency. Point your service at the mapped port. This works for every client.
- **The proxy environment variable.** Most gRPC clients honor `grpc_proxy`. Set it to the recorder's outbound port when you start your service, for example `grpc_proxy=http://$(hostname):4140`. The [language reference](../getting-started/language-reference.md) has the details for each runtime.

A mapped port, recording calls to a dependency on port 18551 through local port 18580:

```bash
proxymock record --map 18580=localhost:18551 --out ./proxymock/recorded-fraud -- ./your-service
```

Outbound calls land in a directory named for the dependency's host and port, `localhost-18551` here, next to the inbound calls. You can record both directions in one run by passing `--app-port` and `--map` together.

## Read a recorded call

Each call is a markdown file with the request, the response and the matching signature:

```
### REQUEST ###
POST http://localhost:18551/fraud.v1.FraudChecker/CheckTransaction HTTP/2.0
Content-Type: application/grpc

{
  "1:LEN": {
    "12:I64": 3544385894514713443
  },
  "2:LEN": "user-7",
  "3:I64": 4623226492472524800,
  "4:LEN": "DEPOSIT",
  "5:LEN": "5411"
}

### RESPONSE ###
HTTP/2.0 200 OK
Content-Type: application/grpc

{
  "1:VARINT": 1,
  "2:I64": 4576918229304087675,
  "3:LEN": "OK"
}
```

The gRPC status travels in the `Grpc-Status` trailer, and proxymock shows it as the call's status, `OK` here. Message fields appear by field number and wire type, as [the overview](./index.md#how-proxymock-shows-a-grpc-call) explains. Edit any value and proxymock encodes the message again when it mocks or replays the call.

Field 1 above is the string `acct-1001`, yet it shows as a nested message. proxymock decodes without the `.proto`, so it has to guess what a length-delimited field holds, and these nine bytes also happen to read as a message with one 64-bit field. The guess changes only the display: the field is written back byte for byte. To change such a value, replace the whole object with a string, for example `"1:LEN": "acct-2002"`.

## Next steps

- [Mock a gRPC dependency](./mock-a-grpc-dependency.md) from the outbound calls you recorded.
- Replay the inbound calls at a new build of your service with `proxymock replay --in ./proxymock/recorded-fraud --test-against http://localhost:18551`.
- [Validate the recording](./validate-and-coverage.md) against the `.proto` and see which RPCs it covers.
