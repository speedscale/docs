# Postman

Speedscale can export and import traffic in the open source Postman [collection format](https://github.com/postmanlabs/postman-collection). This lets you use your familiar tools to send test transactions to your app with traffic that was collected by Speedscale.

### Export

To export your snapshot into a postman collection, simply run:

```
speedctl export postman {SNAPSHOT_ID} {FILE} {FLAGS}
```

### Import

If you have an existing Postman collection and want to import into Speedscale, simply run:

```
speedctl import postman {SNAPSHOT_ID} {FILE} {FLAGS}
```

### Questions?

Note: because new features and flags are regularly added, you can check the latest capabilities by running:

```
speedctl export postman --help
speedctl import postman --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
