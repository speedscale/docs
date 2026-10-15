---
title: Validate code changes
description: Replay an unchanged baseline against a candidate and require runtime validation before merge.
---

# Validate code changes

Start with [prepared traffic](./prepare-traffic.md), a working build and a candidate you can run locally or in CI. Configure dependency mocks and disable passthrough for calls that must stay isolated. Keep unit tests and code review in the pipeline.

## Save the working result

Run from the application directory. Replace these example paths and port with your prepared recording and runtime:

```shell
proxymock replay --in ./proxymock/baseline \
  --test-against http://localhost:8080 \
  --out ./proxymock/results/baseline
```

Inspect the report before accepting it. Existing failures in this observed baseline can be exempted by the regression gate, so a broken baseline is not a safe starting point.

## Check the candidate

Start the candidate with the same mocks and configuration, then run:

```shell
proxymock replay --in ./proxymock/baseline \
  --test-against http://localhost:8080 \
  --baseline ./proxymock/results/baseline \
  --fail-on-new-mismatch --out ./proxymock/results/candidate
```

Exit `3` indicates a new mismatch. Inspect `replay-verdict.json` and the request-level result. Return the expected and observed behavior, selected dependency context and exact rerun command to the developer or coding agent. Do not put raw payloads in the pull request notification.

## Repair and gate merge

Run the repaired build against the same recording, baseline and assertions, writing to a new output directory. Require the CI check to pass for the current candidate revision before merge into trunk. Configure branch protection separately; the replay command does not configure it for you.

For a captured HTTP error, [verify the fix](./reproduce-production-incidents.md) as well. A regression check and a fix check answer different questions.

Use the existing [CI/CD guide](/proxymock/guides/cicd/) for pipeline wiring and [replay verdicts](/proxymock/guides/replay-verdicts/) for gate behavior. Preserve command exit codes. Treat missing reports, empty inputs, startup failures and incomplete execution as failed checks.

## Review baseline changes

Keep intentional behavior changes separate from a repair. Review the new expected behavior and evidence before replacing the accepted baseline. Record the dataset, build, transforms, check configuration and report reference so a later run can be compared fairly.
