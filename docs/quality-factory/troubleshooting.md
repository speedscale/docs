---
title: Troubleshooting
description: Diagnose empty recordings, dynamic values, mock misses and misleading replay results.
---

# Troubleshooting

## No requests or missing dependencies

Confirm capture was enabled, requests used the capture path and the selected recording contains inbound traffic for this service. Outbound-only data does not supply inbound replay requests. Check [language routing and TLS setup](/proxymock/getting-started/language-reference/). Reject empty inputs rather than reporting a pass.

## Expired authentication or changing fields

Compare repeat runs of the unchanged build. Handle OAuth, timestamps, IDs and session tokens through [Prepare traffic](./prepare-traffic.md). Review recommendations before applying them; broad ignores can hide defects.

## Mock misses or unexpected live calls

Confirm the recording contains the outbound response and the app routes that dependency through the mock server. Use `--no-passthrough` when isolation is required. Inspect [mock match rate](/proxymock/guides/mock-match-rate/) and [Java routing](/proxymock/guides/java/) for client-specific setup. A TLS certificate error is a setup failure, not an application regression.

## Failure matches but the report looks successful

Matching a captured error means the failure reproduced. Use [fix verification](./reproduce-production-incidents.md) and the intended business assertions. An ungated replay mismatch does not automatically fail the command.

## Fix verification rejects the input

`--verify-fix` needs a recording with HTTP errors of at least `400` matching `--expect`. Use the incident recording, not a healthy baseline. Do not combine it with `--fail-on-new-mismatch`; run regression validation separately.

## Passing status but wrong application behavior

Check whether body comparison was disabled and whether the needed assertion exists. The local TLS example checks status only. Kafka matching needs a separate business check. See [Verify results](./verify-results.md).

## Wrong build, stale output or missing report

Confirm the candidate revision and target port. Write each run to a fresh output directory and inspect its completion, counts and gate exit. Missing or incomplete reports cannot satisfy a required check. Rerun after a candidate changes; an earlier revision's result is stale.

## Duplicate alerts or missing notifications

Check authentication, delivery logs, deduplication and bounded retry configuration in your orchestration. Replaying traffic does not configure alert delivery. Send authorized report references only, without raw payloads. The [integration boundaries](./integrations.md) identify what must be configured separately.
