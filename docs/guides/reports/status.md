---
description: "Explore the report status lifecycle in Speedscale, detailing active and terminal statuses for effective monitoring and troubleshooting of test reports"
sidebar_position: 10
---

# Report Status

This page describes the different statuses a Speedscale test [report](/reference/glossary#report) can have during its lifecycle, from creation through completion.

## Overview

A test report progresses through several statuses as it moves through the [replay](/reference/glossary#replay) and analysis pipeline. Understanding these statuses helps you monitor replay progress and troubleshoot issues.

## Status Lifecycle

```
Initializing → Testing → Analyzing → [Passed | Missed Goals | Error]
                  ↓
              Canceled
```

Any active status can transition to **Canceled** if a user cancels the replay. The **Error** status can be reached from any point if a fatal error occurs.

## Active Statuses

These statuses indicate that work is actively being performed on the report.

### Initializing

The report has been created and is being set up for replay execution.

**What's Happening:**
- Report metadata is being created
- [Snapshot](/reference/glossary#snapshot) data is being prepared
- Kubernetes resources (for cloud mode) or local processes (for CLI mode) are being initialized
- [Test config](/reference/glossary#test-config) is being validated and applied

**Typical Duration:** Seconds to minutes, depending on snapshot size and cluster resources

---

### Testing

The replay is actively executing traffic against the [system under test (SUT)](/reference/glossary#sut).

**What's Happening:**
- [Generator](/reference/glossary#generator) is sending requests from the snapshot to the SUT
- [Responder](/reference/glossary#responder) is mocking downstream dependencies
- Performance metrics (latency, throughput, error rates) are being collected
- [Assertions](/reference/glossary#assertion) are being evaluated in real-time

**Typical Duration:** Varies based on snapshot duration, traffic volume, replay configuration ([virtual users](/reference/glossary#vuser), TPS targets), and number of replicas.

---

### Analyzing

The replay execution has completed and results are being processed.

**What's Happening:**
- Collected metrics are being processed
- Aggregations are being calculated
- Assertions are being evaluated against goals
- Report artifacts are being generated and stored

**Typical Duration:** Seconds to minutes, depending on traffic volume

---

## Terminal Statuses

These statuses indicate that the report has reached a final state.

### Passed

The replay completed successfully and all goals were met.

**What It Means:**
- All configured assertions passed
- No notification rules were triggered
- Success rate and performance metrics met or exceeded expectations

**Exit Code:** 0 (when using `speedctl wait`)

---

### Missed Goals

The replay completed, but one or more goals were not met.

**What It Means:**
- Some assertions failed
- Notification rules were triggered (e.g., success rate below threshold)
- The system under test did not meet the configured expectations

**Exit Code:** 1 (when using `speedctl wait`)

**Common Causes:**
- Status code mismatches between recorded and replayed traffic
- Response body differences
- Performance degradation (increased latency, reduced throughput)
- Increased error rates

**What To Do:**
- Review failed assertions in the report
- Examine notifications for specific threshold violations
- Compare [request/response pairs](/reference/glossary#rrpair) to identify differences
- Check the Goals section to see which criteria were not met

---

### Error

The replay encountered a fatal error and could not complete.

**Exit Code:** 1 (when using `speedctl wait`)

**Common Causes:**
- Generator failed to initialize or crashed
- Responder encountered fatal errors
- Analyzer failed to process results
- Infrastructure issues (OOM, pod evictions, network failures)
- Invalid test config
- Snapshot data corruption or unavailability

**What To Do:**
- Check component logs (generator, responder, analyzer, [collector](/reference/glossary#collector))
- Verify test config validity
- Ensure SUT is accessible and healthy
- Check resource limits and availability

---

### Canceled

The replay was manually canceled by a user before completion.

**What Happened:**
- User invoked a cancel operation via API, CLI, or UI
- In-progress work was terminated
- Partial results may be available, depending on when cancellation occurred

**Exit Code:** 1 (when using `speedctl wait`)

---

## Watch a Replay's Progress

The status says where a replay is, and the **Replay progress** panel at the top of the report's **Overview** tab shows why. It is there while the replay runs and after it finishes. While it runs, the elapsed time ticks every second and new progress arrives every few seconds. Afterwards it shows how long the replay ran.

The stepper walks through six stages in order:

| Stage | Done when |
|---|---|
| **Provision** | The operator has created the replay's resources |
| **Mocks** | The responder has loaded the snapshot and is ready to answer |
| **App** | The system under test has rolled out and is ready |
| **Load** | The generator has sent its traffic, stage by stage |
| **Analyze** | Analysis of the results has finished |
| **Result** | The verdict is in |

A stage that does not apply to the replay, such as **Mocks** when nothing is mocked or **App** when traffic goes to a custom URL, is shown as skipped. While the load runs, a bar under the stepper shows the current stage, requests sent out of expected, virtual users and requests per second. When a stage is waiting on something, the bar says what it is waiting for and how long until that wait times out.

While a replay runs, or when a step failed, the panel opens on the stepper, the load bar and one lane per component: the **Operator**, the **Mocks** responder, the **App**, the **Generator**, the optional **Collector** and the **Analysis**. Otherwise it shows how long each phase took; click **Expand lanes** to see the stepper and the lanes.

When a step fails, it turns red and a card below the stepper names the component, the reason and the severity, with the suggested fix and a docs link when there is one. A button such as **Show generator logs** filters the timeline below to that component's logs, and **Kubernetes events** filters it to Kubernetes events. When Kubernetes reported problems for the failed step, the card lists them under **What Kubernetes shows** with a hint for each, such as an image that cannot be pulled or a missing CSI driver, lists problems that cleared under **Cleared on their own**, and adds the component's own fixes under **Other things to try**. When a step stops making progress and Kubernetes reported warnings for it, a card says the step **is not progressing** and lists the warnings, such as an image that cannot be pulled. This answers most "is my replay running?" questions without `kubectl`.

## Checking Report Status

### Using the CLI

```bash
# Wait for report completion and get exit code based on status
speedctl wait report <report-id>

# List recent reports for a specific service
speedctl get reports --service my-service
```

### Using the UI

Reports are listed on the [reports page](https://app.speedscale.com/reports) with status indicated by color and label. Click into any report to see detailed status information and results.

---

## Troubleshooting

### Report Stuck in "Initializing"

- Check that the snapshot exists and contains traffic
- Verify test config is valid
- In cloud mode: ensure Kubernetes cluster has sufficient resources
- In CLI mode: ensure local services are accessible

### Report Stuck in "Testing"

- Check generator logs for errors or crashes
- Verify SUT is reachable and responding
- Check for resource constraints (CPU, memory, network)
- Ensure responder is running if mocking dependencies

### Report Stuck in "Analyzing"

- Check analyzer service logs
- Verify S3 connectivity and permissions
- Check for large traffic volumes that may require extended processing

### Understanding "Missed Goals"

1. Review the **Goals** section of the report to see which assertions failed
2. Check **Notifications** for threshold violations
3. Use the assertion details to identify specific requests that failed
4. Compare recorded vs replayed [request/response pairs](/reference/glossary#rrpair) for differences

### Diagnosing "Error" Status

1. Review component logs in order: generator → responder → analyzer
2. Look for resource exhaustion or infrastructure issues
3. Verify test config meets validation requirements
4. Check the report's error events for structured error information
