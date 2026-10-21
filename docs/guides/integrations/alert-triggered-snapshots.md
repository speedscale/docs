---
title: Alert-triggered snapshots
slug: /guides/alert-triggered-snapshots
description: "Configure an alert receiver to select a recorded workload, preserve the incident interval, and keep outbound dependency context."
sidebar_position: 15
---

Use an observability alert to create a snapshot from traffic Speedscale already recorded. The receiver selects failing inbound requests and keeps the workload's outbound calls in the same interval, including successful dependency responses.

:::caution Experimental implementation
This guide accompanies the initial `speedctl alerts` implementation. Use a build that includes `speedctl alerts serve` and `speedctl alerts preview`; check `speedctl alerts --help`. Dashboard policy management, historical workload UID resolution, and exact dependency correlation are not included. Keep this guide and the supporting product change together when reviewing a release.
:::

## Record before the alert

Enable [Kubernetes recording](/guides/capture/infra) for the affected workload before the failure. A webhook cannot recover traffic that was never recorded, excluded before ingestion, expired, or could not be decoded. Retention needs to cover the alert's evaluation lookback, pending duration, delivery delay, and context before the incident.

The receiver uses the active `speedctl` cloud context for its tenant and API credentials. It does not change Kubernetes recording settings. Run it with credentials authorized to query traffic and create snapshots in that tenant.

The initial receiver is one process on a host with a private persistent volume. Put TLS termination in front of its HTTP listener before configuring an external provider. Its bearer token authenticates the provider; it is separate from the Speedscale API key.

## Configure a workload policy

Save this as `policies.json`. Replace `production`, `shop`, and `checkout` with the cluster, namespace, and service identity shown in your recorded traffic. A Kubernetes Service DNS name is not necessarily that identity.

```json
{
  "policies": [
    {
      "id": "checkout",
      "version": "1",
      "provider": "grafana",
      "secretEnv": "CHECKOUT_ALERT_TOKEN",
      "matchLabels": { "alertname": "CheckoutErrors" },
      "target": {
        "cluster": "production",
        "namespace": "shop",
        "name": "checkout"
      },
      "window": {
        "lookback": "5m",
        "pending": "0m",
        "before": "2m",
        "after": "1m",
        "settle": "2m",
        "maximum": "15m",
        "maxAge": "24h"
      },
      "seed": {
        "method": "POST",
        "path": "/checkout",
        "statuses": ["500", "502", "503", "504"]
      }
    }
  ]
}
```

All configured seed criteria are combined with AND. Values within `statuses` are alternatives. To select slow requests, use `durationMillis` with a positive millisecond threshold; if you also configure statuses, both the status and latency must match. Omit statuses to select latency alone.

The final snapshot contains matching inbound seeds OR outbound calls, with the exact cluster, namespace, service, and interval applied to every branch. An outbound authentication response with status `200` survives an inbound error filter.

This is a bounded fallback: all outbound calls in the window are context, not proven children of the failing requests. It captures dependency interactions observed by the caller, not the dependency service's internal traffic. Historical UIDs, deployment revisions, asynchronous work outside the interval, and complete recording coverage remain unverified. Every plan lists these limitations.

## Preview a Grafana notification

Save this deterministic example as `grafana.json`:

```json
{
  "alerts": [
    {
      "status": "firing",
      "fingerprint": "checkout-errors-shop-production",
      "labels": { "alertname": "CheckoutErrors" },
      "annotations": {
        "speedscale_evaluation_start": "2026-10-21T14:00:00Z",
        "speedscale_evaluation_end": "2026-10-21T14:05:00Z"
      },
      "startsAt": "2026-10-21T14:05:00Z"
    }
  ],
  "truncatedAlerts": 0
}
```

```bash
speedctl alerts preview \
  --policies policies.json --policy checkout --event grafana.json \
  --received-at 2026-10-21T14:07:00Z
```

Preview needs no cloud connection and creates no snapshot. It returns the fixed interval **13:58-14:06 UTC**, a ready time of **14:08 UTC**, seed and snapshot expressions, and a stable planned snapshot ID. The default preview tenant is `preview`; pass `--tenant` with the actual tenant ID to compare IDs with a live receiver.

The evaluation annotations are optional custom fields, not values Grafana automatically provides. Supply them only when your integration knows the actual evaluated interval. Otherwise the receiver estimates the interval ending at `startsAt`, using `lookback` plus `pending`. The resulting plan says `estimated-from-alert-start`. Notification arrival never replaces the event timestamp.

## Start the receiver

Create a token of at least 32 bytes through your secret-management workflow and inject it into `CHECKOUT_ALERT_TOKEN`. The JSON stores only its environment variable name.

```bash
mkdir -m 700 alert-state
speedctl alerts serve \
  --policies policies.json \
  --state-dir ./alert-state \
  --listen 127.0.0.1:8095
```

The receiver reads policy configuration and secrets at startup. Restart it to apply changes. Existing receipts keep their original plans. The state directory is bound to its original cloud tenant and endpoint and locked against a second receiver process.

For a local preview through HTTP:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $CHECKOUT_ALERT_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @grafana.json \
  http://127.0.0.1:8095/preview/checkout
```

Use a fresh event for live ingestion. Sending the fixed example to `/alerts/checkout` after its configured `maxAge` produces a validation error.

## Connect Grafana

Create a [webhook contact point](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/manage-contact-points/integrations/webhook-notifier/) using the standard Grafana JSON payload. Set its URL to your TLS endpoint followed by `/alerts/checkout`. Set HTTP authorization to Bearer with the policy token.

Route the `CheckoutErrors` rule to that contact point. The receiver matches labels on each element in `alerts[]`, so grouped notifications cannot substitute shared labels for an individual alert's identity. A policy always maps matching alerts to its configured target. Use separate policies and label constraints for different workloads.

The receiver rejects notifications reporting `truncatedAlerts` and batches larger than 100 alerts. Increase the contact point's alert limit or narrow notification grouping; do not accept an incomplete batch as complete evidence.

Resolved alerts create no snapshot. Repeated Grafana deliveries with the same fingerprint and original `startsAt` return the existing receipt. Recovery does not cancel a queued incident capture or extend its window.

## Connect Datadog

Add a policy with `provider: "datadog"`, a unique ID and token reference, and `matchLabels: { "monitor_id": "12345" }`. Configure a [Datadog webhook](https://docs.datadoghq.com/integrations/webhooks/) with this custom payload:

```json
{
  "monitor_id": "$ALERT_ID",
  "cycle_key": "$ALERT_CYCLE_KEY",
  "date": "$DATE",
  "transition": "$ALERT_TRANSITION",
  "scope": "$ALERT_SCOPE",
  "url": "$LINK"
}
```

Send it to `/alerts/YOUR_POLICY_ID` with the corresponding Bearer token in the Authorization header. Date values are epoch milliseconds. Scope tags become matchable labels; `monitor_id` is also available as a label.

Only `Triggered` creates a new plan. `Re-Triggered`, `Renotify`, `Recovered`, no-data transitions, and warning transitions do not create snapshots in this increment. The monitor, cycle key, and normalized scope identify an occurrence. Use a new cycle for a new incident.

Optional custom fields `evaluation_start` and `evaluation_end` accept RFC3339 timestamps together. If omitted, date provides the fallback alert time. Configure lookback and pending duration to cover your monitor's evaluation behavior.

## Connect Dynatrace

Add a policy with `provider: "dynatrace"`, its own token reference, and labels that match the intended problem. Use a [problem-triggered workflow](https://docs.dynatrace.com/docs/analyze-explore-automate/workflows/build/trigger/event-trigger) and an [HTTP request action](https://docs.dynatrace.com/docs/analyze-explore-automate/workflows/default-workflow-actions/http-request-workflow-action) to send:

```json
{
  "problem_id": "ORIGINAL_PROBLEM_ID",
  "state": "active",
  "started_at": "2026-10-21T14:05:00Z",
  "labels": { "service": "checkout", "environment": "production" }
}
```

Map these fields from the actual trigger payload using the workflow's event context. `started_at` must preserve the original problem start, normalized to RFC3339. The receiver expects this custom payload rather than Dynatrace's default notification format. Closed problems use `state: "closed"` and create no snapshot. Repeated active updates reuse the same problem/start receipt.

Allowlist your receiver host in Dynatrace External requests and use Credential Vault token authentication. If you wait for root-cause analysis, account for that additional notification delay in retention. Explicit evaluation start/end fields are optional and follow the same contract as Datadog.

## Inspect the result

Accepted ingestion returns HTTP `202` with a job ID, reserved snapshot ID, and authenticated status path:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $CHECKOUT_ALERT_TOKEN" \
  http://127.0.0.1:8095/jobs/checkout/JOB_ID
```

The receipt includes the frozen plan, latest state, seed count, and selected-pair count. Counts are preflight observations, not a guarantee that ingestion had completed. The receiver waits until the window end plus `settle`, then retries empty seed queries until five minutes after receipt or ready time, whichever is later.

| State | Meaning |
| --- | --- |
| `pending` | Waiting for the fixed interval or querying available traffic. |
| `creating`, `submitted` | Submission intent saved, or snapshot analysis pending. |
| `complete` | Snapshot analysis completed; capture coverage remains unverified. |
| `no_matching_failures` | No matching inbound seeds by the ingestion deadline. |
| `unknown`, `indeterminate` | Submission could not be confirmed. Inspect the reserved snapshot ID before further action. |
| `failed`, `analysis_timeout` | Query, selection, submission, or analysis needs investigation. |

Selections over one million request/response pairs fail rather than silently dropping dependency traffic. Narrow the workload, interval, or seed criteria; outbound context still covers the configured interval. A failed analysis is not reported as a successful capture.

The volume holds at most 1,000 receipts. Retain receipts for deduplication, monitor capacity, and plan receiver replacement deliberately. Deleting receipts or moving to a new volume removes that duplicate history. This is not a distributed queue or a retention-management API.

## Validate before rollout

In a test environment, record a checkout request that returns an included failure status while making a successful dependency call. Trigger the alert and inspect the [snapshot traffic](/guides/creating-a-snapshot). Confirm the workload and fixed interval, failing inbound requests, and successful outbound responses. Deliver the notification twice and confirm the job and snapshot IDs stay the same.

Repeat with a delayed notification, a receiver restart, and a deliberately unrecorded dependency. The initial receiver will list unverified coverage rather than claim it detected every gap. Attempt [replay](/guides/replay) separately in an isolated environment; state, concurrency, or resource failures may need additional evidence to reproduce.
