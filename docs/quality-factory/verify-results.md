---
title: Verify results
description: Distinguish reproduced errors, regression failures and confirmed HTTP repairs in replay evidence.
---

# Verify results

A completed replay is not automatically a passing application check. Review the selected gate and its exit code, `replay-verdict.json` and request-level results. See [replay verdicts](/proxymock/guides/replay-verdicts/) for the full CLI behavior.

## Interpret the result

| Result | What it establishes |
| --- | --- |
| Recorded error matches observed error | The selected failure reproduced; it is still a failure |
| New mismatch, regression gate exit `3` | The candidate differs from the observed baseline in a gated way |
| Fix gate exit `2` | The selected recorded HTTP error is not confirmed fixed |
| Fix gate exit `0` | Selected recorded errors became successes without detected collateral regressions |
| Fix gate exit `3` | The fix check detected a collateral regression |
| Setup error or missing/incomplete output | No passing evidence; investigate the run |

Default comparison includes response status and stable body differences. The [local TLS fixture](./get-started.md) deliberately uses `--ignore-body-changes`, so its evidence covers status only. It does not establish response-body or business correctness.

For Kafka, a protocol match does not establish the business result. Add an assertion on the resulting application state, as in the [synthetic Kafka example](./examples.md#kafka).

## Retain enough evidence

- The trigger or incident reference, service and exact build revision.
- The recording identity and selection window, with input counts.
- The transforms, mock policy, assertions and command used.
- Completion status, exit code, request findings and report reference.
- The affected build failing and repaired build passing the same reviewed check.

Confirm the report belongs to this run, not an earlier output directory. Reject empty input and skipped execution. Do not use `--exit-zero` to hide a gate failure.

Keep raw payloads in access-controlled storage, subject to DLP and retention. Notifications and public evidence should contain bounded summaries and report references only.
