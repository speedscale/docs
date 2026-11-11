---
title: Read gRPC bodies with your .proto
description: "Put your service's .proto files in the proxymock workspace so recorded gRPC and protobuf bodies show real field and enum names in proxymock web, the CLI and your AI coding assistant."
---

# Read gRPC bodies with your .proto

Without a schema, proxymock shows a protobuf message by field number: `3: 50.5` in the [Protoscope view](./index.md#read-a-body-as-protoscope) and `"3:I64": 4632304060471443456` in the stored JSON. Add the service's `.proto` files to the workspace and the same recorded call reads with the names from your schema:

```json
{
  "account_id": "acct-1001",
  "user_id": "user-7",
  "amount": 50.5,
  "kind": "DEPOSIT",
  "merchant_category": "5411"
}
```

Schemas are applied when a body is shown, not when it is recorded. Adding a schema names traffic you recorded before it, and nothing in your recordings changes.

## Add your schemas to the workspace

Schemas live in the workspace's `proxymock/protos/` directory, next to your recordings, so they are reviewed and versioned with them. proxymock reads them from nowhere else.

The simplest way to add them is `proxymock protos add`:

```bash
# a whole proto tree, laid out the way your imports name the files
proxymock protos add ./proto

# one service's file, finding its imports in a shared proto tree
proxymock protos add ../shared/proto/acme/orders/v1/orders.proto --proto-path ../shared/proto

# a descriptor set built with buf or protoc
buf build -o orders.binpb
proxymock protos add orders.binpb
```

`add` compiles every input first and writes nothing unless all of them compile. It copies each `.proto` file together with every file it imports, so the workspace compiles on its own. The well-known `google/protobuf` files are not copied, because proxymock always has them. A file that already exists in `proxymock/protos/` with other content is only replaced with `--force`.

You can also copy files into `proxymock/protos/` yourself. The directory is an import root, the same as `protoc -I proxymock/protos`: a file that imports `acme/common/v1/money.proto` expects it at `proxymock/protos/acme/common/v1/money.proto`. These inputs are accepted:

- `.proto` files, anywhere under the directory, compiled together.
- Zips of `.proto` files.
- Compiled descriptor sets: `.binpb`, `.pb`, `.protoset` or `.desc`, gzip-compressed or not, from `buf build -o` or `protoc --include_imports --descriptor_set_out`. A descriptor set must include the files it imports.

Each schema input is limited to 25 MiB and 5,000 files. If one `.proto` file does not compile, it is skipped and reported with its file and line, and the other files still name your traffic.

## See what the workspace provides

```bash
proxymock protos list --methods
```

```
SCHEMA   DIGEST        FILES  MESSAGES  SERVICES
protos/  58db9ec25837  2      4         acme.orders.v1.Orders, fraud.v1.FraudChecker
  /acme.orders.v1.Orders/WatchOrder
  /fraud.v1.FraudChecker/CheckTransaction
```

`protos/` is every `.proto` file in the directory, compiled together. A zip or descriptor set is listed under its own file name. The digest identifies the exact schema content, so you can tell which version named a body.

## Check how a recorded call resolves

```bash
proxymock protos check proxymock/recorded
```

```
proxymock/recorded/localhost/2026-10-26_16-45-46.515954Z.md  /fraud.v1.FraudChecker/CheckTransaction
  request   fraud.v1.CheckRequest  from protos/ (58db9ec25837, matched by grpc-method)
  response  fraud.v1.CheckResponse  from protos/ (58db9ec25837, matched by grpc-method)
```

Add `--show named` to print each body with its field names, or `--show protoscope` for the exact wire data. Add `--json` for scripts. When a body does not resolve, `check` says why, for example `no schema declares the gRPC method /billing.v1.Billing/Charge`.

A body resolves to a message type by the first rule that matches:

1. **gRPC and gRPC-Web calls** resolve by the method in the request path, `/package.Service/Method`. The request uses the method's input type and the response its output type. Every message of a stream uses the same type.
2. **Bare protobuf bodies**, sent with a content type such as `application/x-protobuf`, resolve when the Content-Type names the message: `application/x-protobuf; proto=acme.orders.v1.Order`. The `messageType=` and `type=` parameters work the same way.
3. **Mapping rules** name the types of protobuf calls that neither of the above covers. See below.

## Map protobuf calls over plain HTTP

Protobuf sent over plain HTTP often has a path like `/v1/orders/42` and a Content-Type of just `application/x-protobuf`, so nothing in the call names its message. Add a mapping rule:

```bash
# the response of every call under /v1/orders is an Order
proxymock protos map '/v1/orders/**' --response acme.orders.v1.Order

# only POSTs to one host, with both bodies named
proxymock protos map /v1/orders --host orders.acme.internal --method POST \
  --request acme.orders.v1.CreateOrderRequest --response acme.orders.v1.Order
```

The path is a glob matched segment by segment, where `*` matches one segment, and a trailing `/**` matches the path and anything below it. `--host` is a glob matched against the request host, with or without its port. Rules are tried in the order they were added, and the first one that covers a call wins. A rule with the same host, method and path as an existing one replaces it, and `--remove` removes it.

The types must be declared by a schema in `proxymock/protos/`, so a misspelled name is refused when you add the rule. Rules live in `proxymock/protos/mappings.json`, next to the schemas, and `proxymock protos list` shows them.

## Read named bodies in proxymock web

In proxymock web, the Body tab of a protobuf request or response adds a **Named** view, and opens it by default when a schema matches. A badge above the body shows the message type, the schema it came from and its digest. Hover it to see the rule that matched.

- **Named** shows the body as JSON with the `.proto` field names, enum value names and readable numbers. A stream shows one object per message, in an array.
- **Protoscope** adds the field names as comments, `3: 50.5  # amount`, and still shows every byte.
- **Wire JSON** is the stored field-number JSON. Blueprints and edits use it.

To add or remove schemas from the browser, open **Protobuf Schemas** under Config. It lists the schemas, files and mapping rules in `proxymock/protos/`. Choose a `.proto` file and enter its import path, such as `acme/orders/v1/orders.proto`, and it is checked against the schemas already there before it is added, so a file that imports one of them is accepted. A zip or a descriptor set must compile on its own. A file that does not compile is refused with its file and line.

Changes to `proxymock/protos/` apply the next time you open a request, without restarting. If a file there does not compile, a warning above the body names it; hover it for the file and line. If your `.proto` files import files kept outside the workspace, start proxymock web with `--proto-path <dir>` (or `-I <dir>`).

## When the schema does not match the traffic

A schema older or newer than the service that sent the traffic can disagree with it. A field may be missing from the schema, or declared with another type. The Named view cannot show those fields, so it leaves them out and says so above the body:

```
2 fields did not match fraud.v1.CheckResponse and are left out here. Protoscope shows every byte.
  $.score: type mismatch, expected string, got fixed64
  $: undocumented field number 3 (not in fraud.v1.CheckResponse), got length-delimited ("OK")
```

The Protoscope view stays exact, so switch to it to see the fields the schema could not name. `proxymock protos check` lists the same mismatches.

## Let your AI coding assistant read named bodies

The [proxymock MCP server](../how-it-works/mcp-tools.md#protos) has a `protos` tool with the same `list`, `check`, `add` and `map` actions, plus `unmap`. Its `check` action returns each recorded body as named JSON, which an assistant reads far more reliably than field-number JSON. Ask it to "check the recorded gRPC calls against our protos" or to "add the protos in ./proto to the workspace".
