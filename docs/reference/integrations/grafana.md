# Grafana K6

Speedscale can export traffic in the open source [Grafana K6](https://github.com/grafana/k6) test case format. This lets you use your familiar tools to send test transactions to your app with traffic that was collected by Speedscale.

### Export

To export your snapshot into a K6 test, simply run:

```
speedctl export k6 {SNAPSHOT_ID} {FILE} {FLAGS}
```

### Questions?

Note: because new features are regularly added, you can check the latest capabilities by running:

```
speedctl export k6 --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
