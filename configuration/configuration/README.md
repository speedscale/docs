---
description: Customize how the replay is performed.
---

# Replay Configuration

Speedscale's load generator relies upon a basic set of config items to determine how it will behave at runtime. You can get a list of these configs by running `speedctl testconfig list` and downloading a single one with a command like `speedctl testconfig get standard` .

### Example Config

```javascript
{
  "id": "standard",
  "asserters": [
    {
      "type": "http_statuscode"
    },
    {
      "type": "http_headers"
    },
    {
      "type": "http_response_cookies"
    },
    {
      "type": "http_response_body"
    }
  ],
  "chaos": {},
  "generator": {
    "numReplicas": 1
  },
  "rules": [
    {
      "metricName": "passAssertPct",
      "type": "TOO_LOW",
      "value": 100,
      "action": "ALERT"
    }
  ]
}

```

### Configuration

| Key           | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| **id**        | Name of the configuration                                   |
| **asserters** | List of the types of asserts that will be performed         |
| **chaos**     | Rules for how chaos can be configured for mock services     |
| **generator** | Customization of how the generator will replay the snapshot |
| **rules**     | List of rules for determining a successful replay           |

###

###

###

###
