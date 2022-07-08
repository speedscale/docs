# Assertions

Assertions compare the response received from the application during testing to
what the original recorded traffic, viewable in the [traffic
snapshot](../../../analyze/traffic-viewer/view-snapshot).

The assertions UI provides a fairly comprehensive description of each parameter.
For most users that is all you need. However, this subsection is provided for
reference when editing JSON configuration directly.

## JSON

Let's look at some sample test config JSON.

```
{
  "id": "sample",
  "chaos": {
    "chaosPercent": 10,
    "badStatusCodes": true,
    "randomLatency": true,
    "randomHighLatencyFactor": 3,
    "randomHighlatencyMs": 5000
  },
  "generator": {
    "numReplicas": 1,
    "replicaDelay": 50,
    "requestTiming" "FLAT",
    "runDuration": 5m
  },
  "assertionGroups": [
    {
      "configs": [
        {
          "type": "httpStatusCode"
        }
      ]
    },
    {
      "configs": [
        {
          "type": "httpHeaders"
        }
      ]
    },
    {
      "configs": [
        {
          "type": "httpResponseCookies"
        }
      ]
    }
  ],
  "rules": [
    {
      "metricName": "avgLatency",
      "type": "TOO_HIGH",
      "value": 100,
      "action": "ALERT",
    },
    {
      "metricName": "p95Latency",
      "value": 500,
      "action": "ALERT",
      "location": "/orders"
    },
    {
      "metricName": "p99Latency",
      "value": 750,
      "action": "ALERT",
      "location": "/users"
    },
  ],
  "version": 2,
  "responder": {
    "numReplicas": 1
  }
}
```

Let's discuss what goes in each section:

### `id`

A common identifier for the test config.

### `chaos`

Chaos configuration for adding gremlins to your replay.  These settings affect responder traffic from your "mocked" dependencies.

- `chaosPercent` - The percentage of responses the chaos settings affect
- `badStatusCodes` - Inject bad status codes like 404 and 500 into responses
- `randomLatency` - Add random latency to the response
- `randomHighLatencyFactor` - Scale the latency factor
- `randomHighlatencyMs` - Milliseconds of latency to inject

### `generator`

Configuration to control how the generator process creates load with your recorded traffic

- `numReplicas` - The number of "virtual users" to run, with each virtual user replaying a full copy of the snapshot traffic
- `replicaDelay` - Amount of time, in milliseconds, to wait in between starting each virtual user
- `requestTiming` - One of "NONE", "FLAT", "RECORDED", or "MULTIPLE" to set the delay pattern between virtual user requests
- `flatRequestDelay` - Milliseconds to wait between virtual user requests when the requestTiming is "FLAT"
- `requestTimeoutSeconds` - Maximum number of seconds to wait for a virtual user request to complete
- `runDuration` - When set, the replay will cycle through snapshot traffic for this period of time

### `responder`

Configuration to control how the responder creates "mock" instances of your dependencies.

### `assertionGroups`

Configuration for various "asserters" which validate replay traffic against the
original traffic.  The various asserters are disussed in subsequent sections.

### `rules`

Rules or "goals" to determine whether a replay has passed or failed.

- `metricName` - Name of the metric to validate
- `value` - Threshold for the alert rule
- `type` - One of "TOO_HIGH" or "TOO_LOW" determines how to evaluate the value, whith "TOO_HIGH" meaning the rule will trigger if the observed value is higher than the set value
- `action` - Action taken on failure
- `location` - An optional URI location limits the rule evaluation to specific requests

