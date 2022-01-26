---
description: Customization of how the generator will replay the snapshot
---

# Generator

### Generator

Available settings for generator:

| Key                       | Description                                                                                           | Default |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| **numReplicas**           | This is the number of copies of the traffic to replay.                                                | 1       |
| **requestTimeoutSeconds** | The maximum number of seconds any single request will wait for a response from the system under test. | 10      |

### Generator Example

```javascript
  "generator": {
    "numReplicas": 3,
    "requestTimeoutSeconds": 30
  }
```
