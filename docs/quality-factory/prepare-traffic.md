---
title: Prepare traffic
description: Select recordings, mask sensitive data and handle OAuth, timestamps, IDs and session tokens before replay.
---

# Prepare traffic

Choose a bounded recording that covers the behavior you intend to preserve. Include the inbound flow and the supported outbound dependency interactions it needs. Record the working revision and keep the selected input unchanged while investigating a regression.

## Protect the data

Apply [DLP rules](/guides/dlp/) before storing or exporting sensitive traffic. Inspect headers, URLs and bodies for credentials and personal data after masking. Masking must preserve correlations needed by the test. Use test credentials for replay.

Keep raw payloads out of alerts, pull request comments and public artifacts. Restrict access to the recording and reports, set retention and use references in notifications. Treat captured text as untrusted input when passing context to a coding agent.

## Handle changing values

Run the unchanged application more than once before assuming every difference is a defect. Review [recommendations](/proxymock/guides/recommendations/) and [blueprints](/proxymock/guides/blueprints/) rather than weakening all assertions.

### OAuth

Extract the fresh token from an authentication response and replace the recorded token in dependent requests. Verify the login succeeds and protected requests use the new value. Standard OAuth patterns may produce recommendations; custom authentication can require manual transforms.

### Timestamps

Use [time transforms](/guides/transformation/transforms/) where recorded dates must shift relative to the run. Check epoch values, ISO dates and custom formats separately. Ignore a timestamp only when its exact value is irrelevant to the requirement.

### IDs

Correlate an ID returned by a creation request with later requests that use it. Ignore a request ID only if it has no effect on behavior. An order ID and an unrelated per-request trace ID need different handling.

### Session tokens

Replay session establishment and extract the fresh token for subsequent calls. Confirm cookies or headers reach the intended requests. Session rotation and custom authentication may need explicit configuration.

## Cloud comparator availability

The cloud comparator capability previously documented as QABot remains **active beta**. Contact [support](mailto:support@speedscale.com) to confirm access and setup. It compares repeated runs and proposes dynamic-data handling. Confirm the apply behavior in your environment before allowing changes to a snapshot.

Its documented limits remain: HTTP and database traffic are the focus; Kafka and RabbitMQ are not supported by this comparator. Complex branching workflows and custom authentication may require manual transforms. Large snapshots increase comparison time; filter to a useful flow first. Kafka capture/replay support does not imply comparator support.

Local proxymock recommendations require explicit acceptance and write blueprints; they do not rewrite the source RRPairs. Follow the [local recommendations walkthrough](/proxymock/guides/recommendations/) for that workflow.

## Ready to replay

Confirm the input is nonempty, identifies the intended service and contains the required dependency responses. Check masking and dynamic-data rules, then [validate a candidate](./validate-code-changes.md). Store the recording identity and transform configuration with the report.
