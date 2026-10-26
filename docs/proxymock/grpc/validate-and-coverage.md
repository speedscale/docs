---
title: Validate and measure coverage
description: "Check recorded or replayed gRPC responses against the .proto message types with proxymock validate, and see which RPCs, status codes and response fields a recording reaches with proxymock coverage."
---

# Validate and measure coverage

Two commands read a recording against a `.proto` file. `proxymock validate` checks that each response message still matches its declared type. `proxymock coverage` reports which RPCs, gRPC status codes and response fields the recording reaches. Both run locally, with no Speedscale account, and take the same flags as for an [OpenAPI spec](../guides/openapi.md#validate-recorded-and-replayed-responses).

:::note
`.proto` support in `validate` and `coverage` needs proxymock 2.5.1249 or newer.
:::

## Validate responses against the .proto

```bash
proxymock validate --spec ./fraud.proto --in ./proxymock/recorded-fraud
```

```
CONFORMANT POST /fraud.v1.FraudChecker/CheckTransaction (0)  [proxymock/recorded-fraud/localhost/2026-10-26_14-39-40.838177Z.md]

checked 1 pair(s): 1 conformant, 0 violating, 0 without a spec route
```

Each gRPC call is matched to its `/package.Service/Method` in the `.proto`, and its response message is checked for:

- **A changed type.** A field whose encoding cannot be its declared type, such as a number where the `.proto` declares a string.
- **An unknown enum value.** A number the enum does not declare.
- **An undeclared field.** A field number the message does not declare.
- **A missing required field.** Only fields declared `required`, in proto2. In proto3 a field left at its zero value is not sent at all, so it cannot be told apart from a missing one.

The number in parentheses is the gRPC status code. A call that ended with any status other than `OK` (0) carries no response message, so it conforms.

A type change shows the field path, using the field names from the `.proto`. Here the `.proto` changed `double risk_score` to `string risk_score`:

```
VIOLATION  POST /fraud.v1.FraudChecker/CheckTransaction (0)  [proxymock/recorded-fraud/localhost/2026-10-26_14-39-40.838177Z.md]
  $.risk_score: type mismatch, expected string, got fixed64
```

The exit code tells CI what happened:

| Exit | Meaning |
| --- | --- |
| `0` | Every checked call conforms. |
| `2` | At least one violation. |
| `3` | No violations, but at least one call's method is not in the `.proto` (`NO_ROUTE`). |
| `1` | The check could not run: the `.proto` does not compile, the directory is missing, or it holds no gRPC calls. |

Run it on a recording to learn whether a dependency still matches its contract, or on a replay's output to learn whether your change broke the service's own contract. Pass `-I` with each import root when the `.proto` imports other files.

## Measure what a recording covers

```bash
proxymock coverage --spec ./fraud.proto --in ./proxymock/recorded-fraud
```

```
Recording/schema coverage: 1 inbound HTTP pair(s), 1 matched
Covered: 1/1 operations, 1/1 statuses, 3/3 fields
POST /fraud.v1.FraudChecker/CheckTransaction: 1 pair(s) [localhost/2026-10-26_14-39-40.838177Z.md]
  status OK: 1 pair(s) [localhost/2026-10-26_14-39-40.838177Z.md]
    $.approved: 1 pair(s) [localhost/2026-10-26_14-39-40.838177Z.md]
    $.reason: 1 pair(s) [localhost/2026-10-26_14-39-40.838177Z.md]
    $.risk_score: 1 pair(s) [localhost/2026-10-26_14-39-40.838177Z.md]
```

For a `.proto`:

- **Operations** are every RPC in the `.proto`, streaming ones included.
- **Statuses** are gRPC status names. `OK` is listed for every RPC, and an error status such as `NOT_FOUND` appears when the recording holds one, because a `.proto` does not declare error statuses.
- **Fields** are the response message's fields, with nested and repeated fields as paths such as `$.items[].sku`. A field counts as covered when a recorded response sets it.

The report ends with ranked gaps: RPCs no call reached first, then statuses, then fields. Add `--json` for the same machine-readable report OpenAPI coverage writes. Coverage counts inbound calls only, so measure the recording of your own service, not of its dependencies.
