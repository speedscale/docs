---
sidebar_position: 9
title: Compare RRPairs
description: Compare request/response pairs across datasets to identify differences between deployments, environments, or versions.
---

# Compare RRPairs Across Datasets

Speedscale lets you compare request/response pairs across two datasets — snapshots, replay reports, or mock recordings — to identify exactly what changed. This is useful for validating deployments, comparing environments, and catching regressions before they reach production.

## Use Cases

- **Before/after a deploy** — capture traffic before and after a code change, then compare to see what responses changed
- **Staging vs. production** — compare the same requests across environments to verify staging behaves like production
- **Version comparison** — replay the same snapshot against two versions of a service and diff the results
- **Mock validation** — compare mock responses against real service responses to verify mock accuracy

## Comparing in the Dashboard

### Selecting Two Datasets

1. Navigate to the **Snapshots** or **Reports** section in the dashboard
2. Select the first dataset (your baseline)
3. Select the second dataset (the one you're comparing against)
4. Click **Compare** to open the comparison view

### Reading the Diff View

The comparison view shows RRPairs side by side with differences highlighted:

![Side-by-side RRPair comparison showing field differences](./compare-rrpairs-diff.png)

- **Status code changes** — highlighted when the response code differs between datasets
- **Header differences** — added, removed, or modified headers are called out
- **Body differences** — field-level diffs show exactly which values changed in the response body, with additions in green and removals in red
- **Latency differences** — response time changes are shown so you can spot performance regressions

### Filtering to Changed RRPairs

By default, the comparison shows all RRPairs. Use the filter controls to narrow the view:

- **Show only changed** — hide matching RRPairs and focus on differences
- **Filter by change type** — show only status code changes, body changes, or header changes
- **Filter by endpoint** — focus on a specific API path

## Comparing via the CLI

The proxymock CLI includes a `compare` command for diffing RRPair files locally:

```bash
proxymock compare --baseline ./dataset-a --target ./dataset-b
```

This compares RRPair files in the two directories and outputs a summary of differences. Options include:

- `--output json` — output the diff as structured JSON for programmatic use
- `--ignore-headers` — exclude headers from the comparison (useful when headers contain timestamps or request IDs)
- `--ignore-fields` — exclude specific JSON fields from body comparison

```bash
# Compare only response bodies, ignoring timestamps
proxymock compare \
  --baseline ./before-deploy \
  --target ./after-deploy \
  --ignore-fields "$.timestamp,$.requestId"
```

## Interpreting Diffs

When reviewing comparison results, focus on these categories:

### Status Code Changes

A status code change (e.g., 200 → 500) is the most obvious regression signal. Investigate these first.

### Body Field Changes

Not all body changes are regressions. Common expected changes include:

- **Timestamps** — naturally differ between runs
- **Request IDs and correlation IDs** — unique per request
- **Ordering** — array elements may appear in a different order

Use the `--ignore-fields` flag (CLI) or the field ignore controls (dashboard) to suppress expected noise.

### Latency Changes

A significant latency increase on a specific endpoint may indicate a performance regression, a slower dependency, or infrastructure differences between the two environments.

### Header Changes

New or removed headers can indicate middleware changes, proxy configuration differences, or framework upgrades.

## Exporting a Comparison Report

From the dashboard comparison view, click **Export** to download the comparison as a report. The export includes:

- Summary statistics (total RRPairs, changed count, change rate)
- Per-endpoint breakdown of changes
- Full diff details for each changed RRPair

This is useful for attaching to pull requests, sharing with QA, or archiving for compliance.
