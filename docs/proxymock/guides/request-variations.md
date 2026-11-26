---
title: Request Variations
description: Test that your service refuses bad input and the wrong credentials with proxymock variations, which write bad-input copies of recorded requests and judge each one on being rejected.
sidebar_position: 10.6
---

# Request Variations

Production traffic is mostly good requests, so a recording rarely tests how your service refuses a bad one. `proxymock variations` writes bad-input copies of your recorded requests. Each changes one thing your service must refuse, and the rest of the request stays as real as the recording.

## Write variations

```bash
proxymock variations --in proxymock/recorded
```

The variations land in `proxymock/variations` as a recording. One recorded request per endpoint is the base. Each kind of variation is written where it applies:

| Kind | What it changes | Needs |
| --- | --- | --- |
| `no-auth` | Removes the request's credential: `Authorization`, `Cookie` and API key headers | A request that carries one |
| `other-user` | Sends the request with another recorded user's credential, on a resource named by an id in the path | Requests from two users, told apart by their credentials |
| `type` | Sends a body field with the wrong JSON type | A JSON body |
| `missing-field` | Leaves out a field the spec requires | An OpenAPI spec |
| `boundary` | Sends a value just outside the spec's length or range | An OpenAPI spec |
| `enum` | Sends a value the spec's enum does not allow | An OpenAPI spec |

An `other-user` variation tests object-level authorization: whether your service checks that the resource belongs to the caller, not only that the caller is signed in.

| Flag | Use it to |
| --- | --- |
| `--in` | Name the recordings to make the variations from |
| `--out` | Name the directory to write them to. The default is `proxymock/variations` |
| `--spec` | Name the OpenAPI spec. The default is the workload's spec in `proxymock/applications/` when there is one |
| `--kinds` | Write only some kinds, such as `--kinds no-auth,other-user` |
| `--json` | Write the result as JSON |

Each variation records the status the spec documents for the refusal, or the usual one: `401` for `no-auth`, `403` for `other-user`, and `400` for bad input. A variation counts toward a [test plan](./test-plans.md) case with that status.

## Replay variations

Run the app against [`proxymock mock`](../getting-started/quickstart/quickstart-cli.md#run-mocks) and replay the variations as their own run:

```bash
proxymock replay --in proxymock/variations --test-against localhost:8080 \
  --fail-if 'requests.response-match-pct < 100'
```

A variation is judged on being refused, not on matching its recorded status, because services answer the same mistake with `400`, `401`, `403`, `404` or `422`:

| Outcome | Meaning | Passes |
| --- | --- | --- |
| Refused | The service answered with a `4xx` | Yes |
| Accepted | The service answered with a `2xx` or `3xx` | No |
| Failed | The service answered with a `5xx`, so the bad input reached code that did not expect it | No |
| Refused after writing | The service answered with a `4xx`, but called a dependency with `POST`, `PUT`, `PATCH` or `DELETE` while handling the request | No |
| No response | Nothing came back | No |

The write check reads the calls the mock server recorded while the request was in flight. Without `proxymock mock` running, a variation is judged on its status alone. Name the mock server's output with `--mocks-out` when it is outside the workspace.

The replay summary counts the variations by outcome, and each failed one gets a [failure bundle](./replay-verdicts.md#failure-bundles) with the likely cause and a next step, such as checking that the resource belongs to the caller.

Do not pass `--test-config` when you replay variations. A test config's status assertions compare with the recorded status exactly, so a service that answers `422` where the variation recorded `400` would fail them.
