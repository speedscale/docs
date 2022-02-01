---
sidebar_position: 3
---

# Complex Example

The default Forwarder configuration includes a variety of rules for different traffic types. At a high level, this filter combines `ORs` three different filter rules together to determine whether an RRPair should be filtered out of the data stream. The first filter block starting on line 7 filters based on `User-Agent`. The second filter block starting on line 41 filters based on `URL`. The last filter block starting on line 66 filters based on host name.

```
{
    "conditions": [
        {
            "operator": "OR",
            "filters": [
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "header": {
                        "key": "User-Agent",
                        "value": "ELB-HealthChecker/"
                    }
                },
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "header": {
                        "key": "User-Agent",
                        "value": "kube-probe"
                    }
                },
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "header": {
                        "key": "User-Agent",
                        "value": "Prometheus/"
                    }
                },
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "header": {
                        "key": "User-Agent",
                        "value": "GoogleHC/"
                    }
                }
            ]
        },
        {
            "operator": "OR",
            "filters": [
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "optUrl": "/healthz"
                },
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "optUrl": "/livez"
                },
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "optUrl": "/readyz"
                },
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "optUrl": "/hystrix.stream"
                }
            ]
        },
        {
            "operator": "OR",
            "filters": [
                {
                    "include": true,
                    "operator": "CONTAINS",
                    "host": "monitoring.us-east-1.amazonaws.com"
                }
            ]
        }
    ],
    "operator": "OR",
    "id":"standard"
}
```

