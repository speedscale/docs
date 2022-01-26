# Simple Example

To filter out monitoring calls from AWS ELB and Prometheus requires configuring a filter to exclude any traffic with a `User-Agent` of `ELB-HealthChecker/` or `Prometheus`. As a formula it would look like this:

```
allow = ["User-Agent" ~= "ELB-HealthChecker/" || "User-Agent" ~= "Prometheus/"]
```

The resulting filter expression would be:

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
                        "value": "Prometheus/"
                    }
                },
            ]
        },
    ],
    "operator": "OR",
    "id":"simple-filter"
}
```

