---
title: QABot
sidebar_position: 0
---

# QABot

QABot automates the creation of realistic and reliable tests and service mocks using traffic replay. By recording a running instance of your application and replaying the traffic against it multiple times, QABot compares the results and generates data modification suggestions called Recommendations. These Recommendations are automatically applied to the original snapshot to improve the accuracy of service mocks and tests.

:::tip Active Beta
QABot is currently in active beta. To activate this feature in your environment, join the [Speedscale community](https://speedscale.com/community/) or contact your Speedscale representative.
:::

## Overview

Traffic replay solves the problem of needing to write test scripts that immediately fall out of date. QABot solves the data integrity problem that prevents test scripts and mocks from working reliably in a CI pipeline.

The recording of the traffic covers both inbound and outbound HTTP, API and Database requests. QABot compares the results of multiple replay runs and generates Recommendations to handle dynamic data that changes between runs.

## Complete Workflow

### Step 1: Record a Snapshot

Start by capturing traffic from a running instance of your service. This snapshot becomes the baseline — it contains the inbound requests QABot will replay and the outbound responses it will use to build mocks.

You can capture traffic using the [Traffic Viewer](/guides/capture/filter) or the [CLI](/guides/cli). The snapshot should include a representative sample of your service's traffic: typical CRUD operations, authentication flows, and any flows you want covered in CI.

### Step 2: Point QABot at a Test Environment

QABot needs a running instance of your service to replay against. This can be:

- A Kubernetes deployment in a staging or dev cluster
- A local instance running via Docker
- Any environment where your service is accessible and you can observe responses

QABot will use this environment to run multiple replays and compare results.

### Step 3: Run the Comparator

QABot replays the captured traffic against your test environment multiple times. On each run, it captures the responses and compares them:

- **Identical responses** — these fields are stable and can be asserted on
- **Changing responses** — these fields contain dynamic data that needs to be handled

The comparator identifies patterns in the changing data and classifies them by type (timestamps, tokens, IDs, etc.).

### Step 4: Review and Apply Recommendations

After comparison, QABot generates Recommendations — suggested transforms that will handle the dynamic data it found. Each Recommendation includes:

- **What changed** — the specific field and how it changed between runs
- **Why it matters** — whether the change would cause a replay failure or mock mismatch
- **Suggested fix** — the transform chain QABot proposes (e.g., extract-replace for a token, time-shift for a timestamp)

Recommendations are applied automatically to the snapshot. You can review them before they take effect and reject any that don't make sense for your use case.

### Step 5: Deploy to CI

After QABot has applied its Recommendations, the snapshot is ready for CI:

- **Service mocks** are built from the outbound traffic, with dynamic data properly handled
- **Test assertions** are configured to account for fields that legitimately change between runs
- **The replay** can run reliably in a CI pipeline without manual tuning

## How QABot Handles Dynamic Data

### OAuth Tokens

QABot detects OAuth authorization flows by comparing token values across runs. When it finds tokens that change (access tokens, refresh tokens, JWTs), it generates extract-replace transforms that:

1. Extract the token from the initial auth response
2. Replace the stale token in subsequent requests with the fresh one
3. Update mock responses to return consistent tokens

This means your replays automatically handle token expiration without manual transform configuration.

### Timestamps and Dates

Timestamps are the most common cause of replay failures. QABot identifies timestamp fields by detecting values that shift predictably between runs and generates time-shift transforms that adjust timestamps relative to the current time. This covers:

- Unix epoch timestamps
- ISO 8601 date strings
- Custom date formats (detected via pattern matching)

### Rotating IDs

Request IDs, correlation IDs, and other per-request identifiers change on every run. QABot distinguishes between:

- **IDs that need correlation** — where the same ID appears in a request and a later response (e.g., an order ID returned by a POST that's used in a subsequent GET). QABot creates correlation transforms to link these.
- **IDs that can be ignored** — where the ID is unique per request and doesn't affect downstream behavior. QABot configures assertions to skip these fields.

### Session Tokens

Session tokens that rotate between runs are handled similarly to OAuth tokens. QABot detects the session establishment flow, extracts the token from the response, and replaces it in subsequent requests.

## Known Limitations

- **Non-HTTP protocols** — QABot currently focuses on HTTP and database traffic. Message broker protocols (Kafka, RabbitMQ) are not yet supported in the comparator
- **Stateful workflows** — QABot handles sequential request chains well, but complex branching workflows (where the next request depends on a conditional response) may require manual transform configuration
- **Large snapshots** — very large snapshots (thousands of RRPairs) increase comparison time. Consider filtering to the most important flows for initial QABot runs
- **Custom authentication schemes** — QABot auto-detects standard OAuth and session token patterns. Custom auth mechanisms may need manual transform setup

## Feedback

QABot is in active beta and improving rapidly. If you encounter issues or have suggestions:

- Share feedback on [Slack](https://slack.speedscale.com)
- Email [support@speedscale.com](mailto:support@speedscale.com)
- Report specific Recommendation issues through the dashboard — your feedback helps improve the comparison engine
