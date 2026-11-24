---
title: Test Plans
description: Check a change against its requirements with proxymock test plans, which list each requirement and the requests that test it, show which ones the recorded traffic covers, and report a result per requirement after a replay.
sidebar_position: 10.5
---

# Test Plans

A recording shows what your service did. A PRD or a ticket says what it should do. A test plan joins the two: each requirement in its source's words, with the requests that prove it.

proxymock checks a plan against the recorded traffic and your OpenAPI spec, says how to close each gap, and after a replay reports whether every requirement was met.

proxymock never decides what a requirement means. You, or your coding agent with the [test-plan skill](../agent-skills.md#test-with-recorded-traffic), write the plan. Every check proxymock makes compares requests and statuses.

## Write a plan

Plans live in the workspace, at `proxymock/plans/<name>.yaml`. Start from a template:

```bash
proxymock plan init checkout
```

Replace the example with your requirements:

```yaml
name: checkout
source: PRD "Checkout v2"
requirements:
  - id: R1
    text: A shopper sees the price of an item, tax included.
    source: PRD 2.1
    cases:
      - id: R1.1
        category: functional
        request: GET /price?item={sku}
        expect: {status: 200}
      - id: R1.2
        category: negative
        request: GET /price?item=does-not-exist
        expect: {status: 404}
  - id: R2
    text: A shopper can cancel an order.
    cases:
      - id: R2.1
        category: functional
        request: DELETE /orders/{id}
        expect: {status: 204}
```

| Field | Holds |
| --- | --- |
| `name` | The plan's name |
| `source` | Where the requirements come from |
| `requirements[].id`, `text`, `source` | One requirement, in its source's words, and the passage it comes from |
| `cases[].id` | A name for the case, unique in the plan |
| `cases[].category` | `functional`, `contract`, `negative`, `auth`, `journey` or `load` |
| `cases[].request` | `METHOD /path?query`. A path segment written `{name}` or `*` matches any one segment. A query parameter must be present with that value, or with any value when written `{name}` |
| `cases[].expect.status` | The status the request must get, such as `201`, or a class, such as `4xx`. Leave it out to accept any status |
| `cases[].notes` | What the case needs that the request alone does not say, such as "an order that does not exist" |

## Check a plan

```bash
proxymock plan check --plan checkout --in proxymock/recorded
```

Each case comes back in one of four states, with what closes the gap:

| State | Meaning | To close it |
| --- | --- | --- |
| `covered` | The recording has the request, answered with the expected status | Nothing |
| `contradicted` | The recording has this exact request, but never with the expected status | Record it again once the service meets the requirement, or check that the expected status is right |
| `spec-only` | The OpenAPI spec documents the operation | Write the request with [`proxymock generate`](./openapi.md), then send it through `proxymock record` |
| `uncovered` | Nothing in the workspace sends the request, or a templated request was only recorded with other statuses | Send a request through [`proxymock record`](../getting-started/quickstart/quickstart-cli.md#recording) |

Only a case that names one exact request can be contradicted. A templated case such as `GET /orders/{id}` expecting `404` is not contradicted by another order that answered `200`: that recording was sent other input.

The spec is the workload's spec in `proxymock/applications/` when there is one, or the file `--spec` names.

| Flag | Use it to |
| --- | --- |
| `--plan` | Name the plan: a file, or a name in `proxymock/plans/` |
| `--in` | Name the recordings to look in |
| `--spec` | Name the OpenAPI spec |
| `--json` | Write the result as JSON |
| `--fail-on-gaps` | Exit `1` unless the recording covers every case, which gates a pipeline on the plan being testable |

The `test_plan` MCP tool runs the same check for a coding agent.

## Replay with a plan

```bash
proxymock replay --in proxymock/recorded --test-against localhost:8080 --plan checkout --test-config regression
```

A case is the replayed requests whose recording is the case's request with the expected status. Each requirement gets a result:

| Result | Meaning |
| --- | --- |
| `passed` | Every case's requests answered as recorded |
| `failed` | A request of one of its cases did not answer as recorded |
| `not-run` | A case had no replayed request, so the requirement was not fully exercised |

The results go in four places:

- `plan-result.json` in the replay output, with each case's replayed and failed counts.
- A **Requirements** section in `replay-summary.md`, failed requirements first, which a [pull request comment](./cicd.md#report-the-result-on-the-pull-request) shows.
- A `requirements` suite in the [JUnit report](./cicd.md#junit-report), with a test case per plan case. A case that was not exercised is skipped.
- The [failure bundles](./replay-verdicts.md#failure-bundles), where each failed request names the requirement it breaks, and its fix prompt says so.

The plan does not change the exit code: a failed requirement already failed its requests. Use `proxymock plan check --fail-on-gaps` before the replay to fail on requirements nothing tests.

A requirement is judged on the recording. After a change that meets a new requirement, a case recorded from the old behavior fails. Record it again and replay.
