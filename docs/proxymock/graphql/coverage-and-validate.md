---
title: Schema coverage and contract checks
description: "Measure which GraphQL queries, mutations and response fields a proxymock recording reaches with proxymock coverage, and check every recorded response against the schema with proxymock validate: type, non-null, enum, missing and unselected fields, with exact JSON paths and CI exit codes."
---

# Schema coverage and contract checks

A recording says what your clients did. The schema says what they could do. `proxymock coverage` compares the two and lists what the recording never reached, and `proxymock validate` checks that every recorded response is one the schema allows. Both read the schema from SDL, an introspection result, or a running endpoint, and both are the same commands you use with an OpenAPI spec.

## Measure coverage

```bash
proxymock coverage --spec schema.graphql --in proxymock/recorded-<timestamp>
```

Coverage counts three things for each root query and mutation field:

- **Operations**, named `query.<field>` and `mutation.<field>`. An operation is covered when a recorded request selects that root field. A request that selects several root fields covers each of them.
- **Statuses**, `200` for a response with no errors and `200+errors` for one whose `errors` array is not empty. Covering `200+errors` means the recording shows the operation failing, which is usually the gap worth filling first.
- **Fields**, the response paths below the root field, such as `$.data.user.email` or `$.data.plans[].price`, five levels deep. A field is covered when a successful response contains it. Fields are counted under their schema name, so an alias such as `me: user(...)` covers `$.data.user`, and fields selected through fragments count like any other.

Run on the recording committed with the [graphql-demo](https://github.com/speedscale/demo/tree/master/graphql-demo) app, it reports:

```
Recording/schema coverage: 9 inbound HTTP pair(s), 7 matched
Covered: 6/6 operations, 6/12 statuses, 23/27 fields
POST query.user: 2 pair(s) [...]
  status 200: 2 pair(s) [...]
    $.data.user: 2 pair(s) [...]
    $.data.user.email: 2 pair(s) [...]
    $.data.user.id: 2 pair(s) [...]
    $.data.user.plan: 1 pair(s) [...]
    $.data.user.tags: 0 pair(s)
  status 200+errors: 0 pair(s)
...
Unknown routes: 2
  POST /graphql (200) [...]: persisted query without query text
  POST /api/search (200) [...]: not a GraphQL request
Ranked gaps:
  1. status POST mutation.createUser (200+errors)
  ...
  10. field POST query.user (200) $.data.user.tags
```

Requests that coverage cannot attribute to an operation are listed, not dropped: a persisted query with no query text, a request that is not GraphQL, and an operation whose root field is not in the schema are unknown routes, and a response with a status other than 200 is an undocumented status.

Add `--json` for a report a script or CI job can read. It has the same shape as OpenAPI coverage: a `summary` with covered and total counts for operations, statuses and fields, every operation with its pairs, and the ranked `gaps`. Keep the schema fixed when you compare two reports, so their totals mean the same thing.

## Check responses against the schema

```bash
proxymock validate --spec schema.graphql --in proxymock/recorded-<timestamp>
```

For each recorded GraphQL request, validate parses the document, resolves its selection against the schema, and walks the response's `data` alongside it. Because it follows the request's own selection, aliases, named and inline fragments, `__typename` and `@include` or `@skip` are all accounted for. It reports:

| Violation | Example |
|---|---|
| A value of the wrong type | `$.data.plans[1].price: type mismatch, expected Int, got string ("49")` |
| `null` where the schema says non-null | `$.data.user.email: null for non-null type String!` |
| A value that is not a member of its enum | `$.data.user.tier: enum violation, expected one of ["FREE","PRO"], got string ("GOLD")` |
| A selected field missing from the response | `$.data.createUser.email: selected field "email" missing` |
| A field the request did not select | `$.data.user.extra: field not in the request's selection, got boolean (true)` |

Each pair gets a verdict: `CONFORMANT`, `VIOLATION`, or `NO_ROUTE` when its root field is not in the schema, which usually means the schema is older than the server. A response with `null` data and errors is conformant, since that is how GraphQL reports a failed operation. Requests that are not GraphQL, such as a health check, and introspection queries are skipped.

The run ends with a line such as `checked 7 pair(s): 6 conformant, 1 violating, 0 without a spec route`, and the exit code is the one to gate on:

| Exit | Meaning |
| --- | --- |
| `0` | Every checked pair is conformant. |
| `2` | At least one violation. |
| `3` | No violations, but at least one pair's root field is not in the schema. |
| `1` | A precondition failed, such as an unreadable schema or no GraphQL requests to check. |

Validate the recording to check what your server really returns, and validate a replay's output to check what a new build returns: a violation that appears between the two is a change the new build made.

## Use a running endpoint as the schema

`--spec` takes the URL of a GraphQL endpoint. proxymock runs an introspection query on every run and caches the result in the `--in` directory, beside the recording, as `<host>_<port>.introspection.json`:

```bash
proxymock validate --spec http://localhost:8080/graphql --in proxymock/recorded-<timestamp>
```

When the endpoint cannot be reached, proxymock uses the cached copy and says so on stderr, so the check still runs in CI with no server. The cached file is itself a schema you can pass to `--spec`, which pins a check to one version of the schema.

## Which requests are checked

Coverage counts inbound requests only, the ones your server received, for the one workload the recording holds or the one you name with `--workload`. Validate checks every GraphQL request in the directory you give it, inbound and outbound. Name a workload with `--workload` to check only that workload's inbound requests.

## Related

- [Contract-test recorded or replayed traffic](https://github.com/speedscale/skills/tree/main/skills/proxymock-contract-test), the agent skill that runs these checks from an AI coding assistant.
- [Generate tests and mocks from a schema](./generate.md) for operations the recording never reached.
