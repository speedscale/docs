---
description: "Create and manage schedules in Speedscale to automate actions like snapshots and replays, enhancing your API testing and traffic replay processes."
sidebar_position: 10
---

# Schedules

Schedules provide a way to run Speedscale actions on a regular basis.  Actions like
creating a fresh snapshot from a running service or running a replay.  Running
replays on a schedule enables regular testing when running Speedscale inside
CI/CD is not feasible.

![schedules-list](schedules-list.png)

## Cron Expressions

Speedscale schedules use a
[cron expression](https://en.wikipedia.org/wiki/Cron) to define when the actions
should run, but there are several predefined intervals to get up and running
right away.

![scheduler-interval](scheduler-interval.png)

The cron expression here, `0 15 * * 1-5`, defines a schedule which will run every
day at 15:00 UTC, Monday through Friday.

Visit [crontab.guru](https://crontab.guru/) for help creating and
understanding cron expressions.

## Actions

There are several actions to choose from which can be re-ordered as necessary.

### Snapshot

Creates a fresh snapshot from a service running in your cluster. The service
must have recorded traffic during the window specified or the snapshot will fail.

### Replay

Runs a replay, generating a report, from an existing snapshot. The replay may
use an existing snapshot, or one created from a previous action.

### Sidecar

Ensures the Speedscale sidecar exists, or does not exist, on a workload running
in your cluster.  A workload must have the sidecar attached to capture traffic.
This action is useful for ensuring a workload is capturing traffic, or turning
capture on and off to capture for a schedule without capturing traffic
continuously.

:::info
The sidecar action asynchronously sends a command to add the sidecar to a
workload but does not wait for it to complete.  Traffic will also take up to 2
minutes to be visible in the Speedscale cloud after capture so it may be
necessary to use a Wait action after the sidecar action to achieve consistent
results.
:::

### Wait

Waits before advancing to the next action. This is useful for waiting for
traffic after ensuring a sidecar exists on a workload, or when some out of band
work is performed in between actions.

### Notify

Sends a notification when the action is reached during execution. Place this
action anywhere in the sequence — for example, at the end to report the overall
outcome, or immediately after a replay to alert on test failures.

#### Trigger conditions

| Trigger | When it fires |
|---------|---------------|
| **Always** (default) | Every time the action is reached, regardless of prior results |
| **On failure** | Only when at least one earlier action in the job recorded an error |
| **On success** | Only when all earlier actions completed without error |

#### Channels

**Webhook** sends an HTTP POST to a URL you provide. The request body is a JSON
object with the following fields:

```json
{
  "job_id": "my-job",
  "job_description": "Nightly regression",
  "execution_id": "3f7a...",
  "start_time": "2024-05-01T15:00:00Z",
  "status": "failure",
  "failed_tasks": [
    { "index": 1, "message": "Error: report completed with errors: [timeout]" }
  ]
}
```

You can point the webhook URL at any HTTP endpoint — a Slack incoming webhook,
a PagerDuty event endpoint, a custom service, or a tool like
[RequestBin](https://requestbin.com) for testing.

To pass additional headers (for example, an authorization token) use the
**Headers** field when configuring the action.

**Email** support is coming in a future release.

:::tip
Combine the Notify action with **On failure** and `continue_on_failure` enabled
to get an alert any time a scheduled replay misses its goals without stopping
the rest of the job.
:::


