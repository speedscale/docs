---
description: How to determine whether a replay was run through successfully.
---

# Rules

### Rules

This section lets you define what constitutes a successful replay run. This should be configured as a list or array of rules.

| Key            | Description                                           |
| -------------- | ----------------------------------------------------- |
| **metricName** | Select the correct metric name.                       |
| **type**       | Whether the value is `TOO_LOW` or `TOO_HIGH`          |
| **value**      | What value will trigger the rule                      |
| **action**     | Whether or not to send an `ALERT` if the rule is met. |

### Rules Example

```javascript
  "rules": [
    {
      "metricName": "avgLatency",
      "value": 200,
      "action": "ALERT"
    },
    {
      "metricName": "transactionsPerSecond",
      "type": "TOO_LOW",
      "value": 50,
      "action": "ALERT"
    },
    {
      "metricName": "assertsuccesspct",
      "type": "TOO_LOW",
      "value": 100,
      "action": "ALERT"
    }
  ]
```

### Metric Names

Here are the possible metric names:

| Metric                    | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| **minLatency**            | Minimum latency for any single replayed transaction.                 |
| **maxLatency**            | Maximum latency for any single replayed transaction.                 |
| **avgLatency**            | Average latency for all of the transactions.                         |
| **p{#}Latency**           | Percentile latency (50, 75, 90, 95, 99) for all of the transactions. |
| **transactionsPerSecond** | Total Transactions / Number of Seconds for the replay to complete.   |
| **transactionsPerMinute** | Total Transactions / Number of Minutes for the replay to complete.   |
| **passAssertPct**         | Percentage of assertions that passed during a replay.                |
| **failAssertPct**         | Percentage of assertions that failed during a replay.                |
