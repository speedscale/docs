---
title: Create and Verify Blueprints
description: Save reusable transforms in proxymock blueprints, preview their changes, and verify that their rules run during replay.
sidebar_position: 8
---

# Create and Verify Blueprints

A blueprint saves the transforms that make recorded traffic work in another run: replacing a credential, shifting a timestamp, or carrying a new ID into later requests. Active blueprints apply during replay and mocking without rewriting the original recording.

## Blueprints and transforms

Both proxymock and Speedscale Cloud use the same [extractors and transform library](/concepts/transforms.md). The saved configurations have different wrappers:

| Term | What it contains | Where you use it |
| --- | --- | --- |
| Transform | One operation, such as `constant` or `jwt_resign` | Inside a chain in either product |
| Transform chain | An extractor and ordered transforms, optionally scoped by filters | Generator or responder configuration |
| Traffic Transform Template | A reusable Cloud transform configuration | Cloud snapshots and replay configuration |
| Blueprint | A transform configuration plus a name, activation state, and other local metadata | A proxymock workspace |

A blueprint JSON file stores its transform configuration under `tokenizeConfig`. The JSON accepted by `proxymock transform test --transform-config` is the transform configuration itself. Passing a complete blueprint wrapper as that file is not the same operation.

## Create a blueprint from traffic

Run these commands from the application directory. Replace the recording directory with yours:

```shell
proxymock web --in ./proxymock/recorded-example
```

1. Open a request in **Requests**.
2. Use the transform action beside a header or query field, or right-click a body field.
3. Choose the operation and enter its configuration. proxymock saves field edits in the **Field Transforms** blueprint, scoped to the request's endpoint and method.
4. Open **Blueprints** to inspect the saved rules, change their filters, or disable a blueprint you do not want applied.

See [Modifying Tests/Mocks](./modify-rrpairs.md#applying-transforms-in-proxymock-web) for the field editor. You can also accept a [replay recommendation](./recommendations.md) or a [mock match-rate recommendation](./mock-match-rate.md); those workflows save blueprints too.

Choose the execution side deliberately. Generator request chains change what is sent to your app. Responder request chains change the request used for mock matching. Responder response chains change the mock response returned to your app. See [Where to Transform Traffic](/concepts/transforms.md#where-to-transform-traffic).

## Preview changes

In **Requests**, select the **Preview blueprints** lens to inspect the before/after changes for the selected traffic. Review the affected fields and filters before replaying. A preview uses the available traffic; values that depend on a future login response or other runtime state still need a real replay to verify them.

For standalone transform configurations, [test and apply commands](./local-rules.md) work directly on RRPair files: `transform test` previews changes to files, while `transform apply` writes transformed copies to a separate output directory.

## Verify a replay

```shell
proxymock replay \
  --in ./proxymock/recorded-example \
  --test-against http://localhost:8080 \
  --require-blueprint 'Field Transforms'
```

Replace `Field Transforms` with the exact saved name. Repeat `--require-blueprint` to require more than one blueprint.

At startup, proxymock reports loaded blueprints and their source files. After replay, it reports completed transform chains. A blueprint can load successfully while none of its chains match the traffic. `--require-blueprint` fails the command if the named blueprint was not loaded or none of its chains ran. It does not prove that every chain ran or that your application's response was correct; use [replay verdicts and gates](./replay-verdicts.md) for those checks.

`--load-test` reduces response collection and omits transform activity reporting. It cannot be combined with `--require-blueprint`.

## Storage and discovery

Saved rules normally live in `proxymock/blueprints/`. Replay and mock commands search the directory supplied to `--in` and its immediate parent, under either `blueprints/` or `proxymock/blueprints/`. This search stops at the immediate parent. Blueprints come only from the workspace: nothing under `~/.speedscale` is applied, so what is in the repo is what runs.

Blueprints are reusable across recordings in a workspace. You do not need to recreate one to bind it to a new snapshot ID. Activation and matching filters determine whether it contributes changes. Keep filters narrow when a workspace contains traffic for several services.

The [workspace layout reference](../how-it-works/workspace-layout.md#blueprints) describes storage and diagnostics. Use [secret references](./secrets.md) for credentials and preserve any dataframes the transforms depend on when moving configuration between machines.

## Reuse with Speedscale Cloud

[Cloud push and pull](/reference/proxymock-cli-reference.md#cloud) transfer snapshot configuration and supporting artifacts. A snapshot push merges active blueprint chains into the uploaded snapshot's transform configuration and preserves blueprint files for reuse. Inspect the destination configuration and test a small replay after transfer, especially when paths, credentials, or target addresses change.

For a standalone Cloud transform template, use `proxymock cloud pull transform <id>`, which writes it into the workspace as `proxymock/blueprints/<id>.json`, so the next replay or mock of that workspace applies it. `proxymock cloud push transform <id>` reads the same file. Keep the distinction between a bare transform configuration and a blueprint wrapper when editing JSON.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No blueprint is loaded | Confirm the input directory, discovery depth, valid JSON, and activation state. Check the source paths printed at startup. |
| Blueprint loads but no chain runs | Check the chain's filters and generator/responder side. During replay, a `network_address` filter must match the replay target: `localhost` does not match `127.0.0.1`. |
| A field changes in preview but replay fails | Inspect runtime variables, secret resolution, and authentication responses. Preview cannot supply a credential that only the app creates during replay. |
| An unexpected rule applies | Check the blueprints in the `--in` directory and its immediate parent. Startup messages identify each source file. |
| No activity warning appears | Load mode (`--load-test`) omits transform attribution, so no per-blueprint activity is reported. |
| A required blueprint ran but the result is wrong | Inspect individual chains and the replay verdict. The requirement checks that at least one chain ran, not application correctness. |
