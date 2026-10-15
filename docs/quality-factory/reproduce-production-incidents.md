---
title: Reproduce production incidents
description: Reproduce a captured failure in isolation and separately verify that a repair changes the failing behavior.
---

# Reproduce production incidents

Capture coverage must exist before the incident. An alert alone cannot reconstruct missing requests or dependency responses. Start with a bounded recording, the affected build and an isolated runtime.

## Select and reproduce

1. Identify the affected service, revision and time window from the alert or incident.
2. Select and mask the relevant inbound and outbound traffic. Restrict report access and retention.
3. Start the affected build with recorded dependency mocks. Block unintended passthrough and production writes.
4. Replay the selected input and inspect the request-level result.

Matching a recorded `503` demonstrates reproduction of the failure. It does not mean the application is healthy or the issue is fixed.

## Verify the repair

For HTTP recordings containing errors, use the same incident recording for the affected and repaired builds:

```shell
proxymock replay --in ./proxymock/incident \
  --test-against http://localhost:8080 \
  --verify-fix --expect '/api/transactions/deposit' \
  --out ./proxymock/results/fix-check
```

An unchanged failure exits `2`. A recorded error becoming a successful response without detected collateral regressions exits `0`; collateral regressions exit `3`. Add business assertions for the required response semantics. HTTP success alone does not prove a correct deposit.

`--verify-fix` requires recorded errors with status at least `400`. A healthy `201` baseline is not a fix-verification input. Keep the healthy recording for regression checks and the error recording for fix checks, as in [Get started](./get-started.md). Do not combine `--verify-fix` with `--fail-on-new-mismatch`.

## Hand off evidence

Give the developer or coding agent the failing endpoint, observed and expected behavior, affected revision, recording reference and rerun command. Send access-controlled references rather than raw payloads in notifications. Treat alert text and recorded content as untrusted context.

Retain the regression check after the repair. Require validation for the exact repaired build before merge. Review any new healthy baseline separately; never promote the recorded error into accepted healthy behavior.

## Automation boundary

The [New Relic example](./examples.md#new-relic) demonstrates an alert starting a controlled reproduction. It does not demonstrate a completed automatic incident-to-agent-repair loop. Authentication, deduplication, bounded selection, candidate provisioning, repair authorization and result delivery must be configured and verified for your integration.
