---
title: Read protobuf bodies with your schemas
description: "Upload .proto files or descriptor sets to Speedscale so recorded gRPC and protobuf traffic shows real field and enum names in the dashboard, and snapshots keep the schemas they were taken with."
sidebar_position: 4.5
---

# Read protobuf bodies with your schemas

Speedscale shows a recorded protobuf or gRPC body without any schema, by field number, in the [Protoscope and Wire JSON views](./bodies.md#grpc). Give it the schema and the same body reads with your names:

```json
{
  "account_id": "acct-1001",
  "amount": 50.5,
  "decision": "DECISION_APPROVE"
}
```

Schemas are applied when a body is shown, so adding one names traffic recorded before it. Nothing in your recordings changes, and transforms keep working on the Wire JSON form.

## Where a schema goes

There are two places, depending on who owns the API:

- **The service's contract**, for the gRPC API a service serves. Open the service page and use the **Contract** section. The contract also grades [Spec adherence](../readiness/spec-adherence.md) for that service's replays.
- **The protobuf schema library**, for APIs a service calls but does not own, such as a partner's gRPC API or another team's service. Open **Settings** and the **Protobuf schemas** tab. Every service's traffic can use a library schema.

Both accept the same files, 3 MiB or smaller:

- A `.proto` file. It can only import the well-known `google/protobuf` files.
- A `.zip` of `.proto` files, laid out the way your imports name them, so `acme/orders/v1/orders.proto` can import `acme/common/v1/money.proto`.
- A compiled descriptor set: `.binpb`, `.pb`, `.protoset` or `.desc`, from `buf build -o` or `protoc --include_imports --descriptor_set_out`. It must include the files it imports.

A schema that does not compile is refused with the compiler's file and line. Uploading a library schema under a name that already exists replaces it. Only admins can upload, replace or remove schemas; everyone can see them.

## How a body finds its schema

A body resolves to a message type by the first rule that matches:

1. **gRPC and gRPC-Web calls** resolve by the method in the request path, `/package.Service/Method`. The request uses the method's input type and the response its output type. Every message of a stream uses the same type.
2. **Bare protobuf bodies**, sent with a content type such as `application/x-protobuf`, resolve when the Content-Type names the message: `application/x-protobuf; proto=acme.orders.v1.Order`.

The service's own contract is searched first, then the library. If both define the same message, the contract wins.

## Read named bodies

In the traffic viewer's request and response **Body** tab, a protobuf body opens in the **Named** view when a schema matches: JSON with the `.proto` field names, enum value names and readable numbers. A stream shows one object per message, in an array. **Protoscope** shows the exact wire data with the field names as comments, and **Wire JSON** is the stored form that transforms address.

A badge above the body shows the message type, the schema it came from and the schema's hash. Hover it to see whether it came from the service's contract or the library, the gRPC method that matched it, and whether a snapshot pinned it.

When no schema matches, the body opens in Protoscope with the reason, for example "No schema: no schema declares the gRPC method /billing.v1.Billing/Charge", and a link to the Protobuf schemas tab.

## When the schema does not match the traffic

A schema older or newer than the service that sent the traffic can disagree with it: a field the schema does not declare, or one it declares with another type. The Named view cannot show those fields, so it leaves them out and lists them above the body:

```
2 fields did not match fraud.v1.CheckResponse and are left out here. Protoscope shows every byte.
  $.score: type mismatch, expected string, got fixed64
  $: undocumented field number 3 (not in fraud.v1.CheckResponse), got length-delimited ("OK")
```

Switch to Protoscope to see every field as it was sent.

## Snapshots keep their schemas

A snapshot records the library schemas in effect when it was taken, and the service contract it was taken with, by hash. Its traffic, and the reports that replay it, keep rendering with those schemas after someone replaces or removes them. Live traffic always uses the current schemas. Removing a library schema keeps its stored copy, so pinned snapshots never lose it.

To work with the same schemas locally, put the `.proto` files in your proxymock workspace; see [Read gRPC bodies with your .proto](../../proxymock/grpc/name-fields-with-your-proto.md).
