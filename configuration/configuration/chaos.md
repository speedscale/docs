---
description: How chaos can be configured for mock services
---

# Chaos

### Chaos

Available settings for chaos:

| Key                       | Description                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| **chaosPercent**          | Random % of the transactions that will perform with a chaos setting.    |
| **badStatusCodes**        | Set to `true` to return error status codes.                             |
| **intermittentResponses** | Set to `true` to not respond at all to some transactions.               |
| **randomLatency**         | Set to `true` to respond with different latency than what was recorded  |
| **randomHighLatencyMs**   | Set to the value you want to use for high latency.                      |

### Chaos Example

```javascript
  "chaos": {
    "chaosPercent": 25,
    "badStatusCodes": true,
    "intermittentResponses": true,
    "randomLatency": true,
    "randomHighlatencyMs": 5000
  }
```
