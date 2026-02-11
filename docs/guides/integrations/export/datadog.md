---
sidebar_position: 1
---


# Export to Datadog

Export data from your Speedscale environment to Datadog.

### Prerequisites

In order to utilize the integration you need to capture the following from Datadog:

* [API Key](https://docs.datadoghq.com/account_management/api-app-keys/) - An API key is required by the Datadog Agent to submit metrics and events to Datadog

A best practice is to save this into environment variables like so:

```
export DDOG_API_KEY=0
```

### Exporting Data

Now you can select a specific report and export it using `speedctl`:

```
export SPD_REPORT_ID=0
speedctl export datadog report ${SPD_REPORT_ID} --apiKey ${DDOG_API_KEY}
✔ {"status":"ok",...}
```

After you have exported the report, you should see it in the Datadog event stream.

![](./datadog-event.png)

