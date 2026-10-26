---
title: Mock a gRPC dependency
description: "Answer your service's calls to a gRPC dependency from a proxymock recording, so tests and AI coding assistants run with no dependency, and fix calls the mock does not match."
---

# Mock a gRPC dependency

`proxymock mock` answers your service's gRPC calls from recorded or generated calls, so the service runs with no dependency: nothing to deploy, no test account to share, and the same answers every time.

## Run the mock

Start the mock with the same mapping you recorded with, and point your service at the mapped port:

```bash
proxymock mock --in ./proxymock/recorded-fraud --map 18580=localhost:18551 -- ./your-service
```

Calls that match a recorded call get its response. Calls that do not match go on to the real dependency at `localhost:18551`, and the mock's output lists each call as a match or a pass-through. Add `--no-passthrough` to answer a call that matches nothing with an HTTP 404 instead, so a test can never reach the real dependency. A gRPC client reports that 404 as `Unimplemented`:

```
ERROR:
  Code: Unimplemented
  Message: unexpected HTTP status code received from server: 404 (Not Found); malformed header: missing HTTP content-type
```

A service that sets `grpc_proxy` instead of using a mapped port works the same way: point `grpc_proxy` at the mock's outbound port (4140 by default, `--proxy-out-port` to change it).

You can call the mock yourself to check it, with the dependency stopped:

```bash
grpcurl -plaintext -proto fraud.proto -d '{"account_id":"acct-1001","user_id":"user-7","amount":12.5,"transaction_type":"DEPOSIT","merchant_category":"5411"}' localhost:18580 fraud.v1.FraudChecker/CheckTransaction
```

## What a call has to match

A gRPC mock matches on the method path, the host and the whole request message. A call that asks for a different account than the recording did is a different call, so it does not match. That keeps answers exact, and it means a mock answers only the requests that were recorded or written into it.

When a call does not match, the mock's output shows the closest recorded call and the fields that differ:

```
Almost matched signature #0: ...
< http:requestBodyJSON: {"1:LEN":"acct-2","2:LEN":"user-7",...}
> http:requestBodyJSON: {"1:LEN":"acct-1001","2:LEN":"user-7",...}
```

Three ways to make it match:

- **Record the call.** Run the scenario once more with `proxymock record`, so the recording holds the request your service really sends.
- **Edit the recorded request.** Change the values in the mock file's request body to the ones your service sends. The mock matches on the edited message the next time it starts.
- **Ignore the volatile field.** When a field changes on every call, such as a request id or a pod name, a transform removes it from the match. [Improve Mock Match Rate with AI](../guides/mock-match-rate.md) has an AI assistant find the calls that missed and write the fix, and [Using Transforms for better Mocks](../../guides/replay/mocks/edit-sig.md) walks through the same fix for a protobuf field by hand.

## Mock a dependency you have never recorded

When there is no recording yet, generate the mock from the dependency's `.proto`:

```bash
proxymock generate --direction outbound --out ./proxymock/mocks-fraud ./fraud.proto
```

A generated mock answers only the request it was generated with, whose strings are `example_value`. Edit its request body to the values your service sends, as above, and treat its response as made up until you replace it with a recorded one. [Generate tests and mocks from a .proto](./generate-from-a-proto.md) explains what the generated messages contain.
