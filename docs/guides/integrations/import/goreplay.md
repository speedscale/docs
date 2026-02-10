# Import from GoReplay

Speedscale can import traffic in the open source [GoReplay format](https://github.com/buger/goreplay). This lets you use your familiar tools to send test requests to your app with traffic that was collected by Speedscale.

### Import

If you have existing GoReplay traffic and want to import into Speedscale, simply run:

```
speedctl import goreplay {GOR_FILE} {FLAGS}
```

### Questions?

Note: because new features and flags are regularly added, you can check the latest capabilities by running:

```
speedctl import goreplay --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
