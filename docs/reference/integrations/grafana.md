# Grafana K6

Speedscale can export traffic in the open source [Grafana K6](https://github.com/grafana/k6) test case format. This lets you use your familiar tools to send test requests to your app with traffic that was collected by Speedscale. Speedscale will take inbound requests and turn them into a sequence of requests made in a complete K6 script. Note that only the raw traffic is exported. There is no limitation on how many times snapshots can be exported. However, keep in mind transforms and other data manipulation logic are not part of the export due to the difference in paradigms (automated vs script-driven).

### Export

To export your snapshot into a K6 test, simply run:

```
speedctl export snapshot --type k6 --output script.js {SNAPSHOT_ID}
```

### Questions?

Note: because new features are regularly added, you can check the latest capabilities by running:

```
speedctl export snapshot --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).

:::tip
If you want to capture transformed traffic you can do so by attaching a sidecar to your app while the Speedscale generator is running. This will capture the transformed traffic as a new snapshot which can be exported to k6. This does not export that actual logic into a script but it will let you export the end result.
:::