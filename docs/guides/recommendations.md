---
sidebar_position: 6
title: Traffic Recommendations
description: Understand and act on automated recommendations in your replay reports.
---

# Traffic Recommendations

After a replay completes, Speedscale automatically analyzes the results and generates **recommendations** — actionable insights that identify potential issues and suggest how to fix them. Recommendations appear in the replay report and help you quickly understand what went wrong and what to do about it.

## Where to Find Recommendations

Recommendations appear in the **Recommendations** panel of a replay report. Navigate to any completed report and look for the Recommendations tab. Each recommendation includes a description of the issue, which RRPairs are affected, and a suggested action.

:::tip
Recommendations are generated automatically — you don't need to configure anything to start seeing them.
:::

## Recommendation Types

Speedscale detects several categories of issues:

| Recommendation | What It Detects | How to Act on It |
|---|---|---|
| **Memory Growth** | RSS or heap size increasing across requests during replay | Review your transform chain for object accumulation. Check if the service under test has a memory leak triggered by the replay workload. |
| **K8s Error Events** | Pod restarts, OOMKills, or scheduling failures during replay | Check cluster health and resource limits. Increase memory or CPU requests if the pod is being OOMKilled. |
| **Unreplaced Token** | Redacted or tokenized values still present in replayed traffic | Add extract-replace transforms for the flagged fields. This commonly occurs when DLP redaction tokens were not replaced with test data before replay. |
| **Random Value** | Field values that appear random and may need correlation between request and response | Create correlation transforms so that values like session IDs or request IDs are properly linked across the request chain. |
| **Latency Regression** | Response times significantly higher than the baseline snapshot | Compare latency percentiles against the snapshot baseline. Investigate whether the regression is caused by the service, the mock, or infrastructure contention. |
| **Volume Mismatch** | Request count differs significantly from what was expected based on the snapshot | Check capture completeness. If using a traffic multiplier, verify the multiplier setting. A volume mismatch may also indicate that some requests are being dropped or filtered. |
| **Error Rate Deviation** | 4xx/5xx error rates higher than the baseline snapshot | Review service dependencies and mock configurations. A spike in errors often indicates that a downstream mock is not returning the expected responses. |

## Reading a Recommendation

Each recommendation includes:

- **Type** — which category the recommendation falls into (see table above)
- **Severity** — how significant the issue is relative to overall replay health
- **Affected RRPairs** — the specific requests and responses where the issue was detected
- **Suggested Action** — a concrete next step to resolve the issue

## Applying Recommendations

When you see a recommendation, you can:

1. **Click the recommendation** to view full details and affected RRPairs
2. **Review the suggested action** and decide whether to apply it
3. **Apply the fix** — for transform-related recommendations (like unreplaced tokens or random values), Speedscale can generate the appropriate transform chain for you
4. **Re-run the replay** to verify the issue is resolved

### Batch-Applying Recommendations

If a report contains multiple recommendations of the same type (for example, several unreplaced tokens), you can select multiple recommendations and apply them together. This creates a single set of transforms that addresses all selected issues at once.

## How Recommendations Relate to DLP

Some recommendations — particularly **Unreplaced Token** — are closely related to [Data Loss Prevention](./dlp/index.md). The typical workflow is:

1. DLP rules redact PII in captured traffic, replacing sensitive values with `REDACTED-` tokens
2. During replay, those tokens need to be replaced with realistic test data
3. If the replacement step is missed, the **Unreplaced Token** recommendation will flag the issue and suggest the appropriate extract-replace transform

For more on DLP workflows, see [Understanding DLP Recommendations](./dlp/recommendations.md).

## Tips

- **Start with high-severity recommendations** — these have the biggest impact on replay accuracy
- **Unreplaced tokens and random values** are the most common recommendations for new users and are straightforward to fix with transforms
- **Memory growth and latency regressions** may indicate real bugs in your service, not just configuration issues — these are worth investigating beyond the replay context
- **Re-run after applying fixes** to confirm the recommendations are resolved in the next report
