---
sidebar_position: 7
---

# Migrating from WireMock

Speedscale can import traffic in the open source [WireMock format](https://github.com/wiremock/wiremock). This lets you jumpstart the creation of a service mock with existing WireMock mappings.

### Import

If you have existing WireMock mappings and want to import into Speedscale, simply run:

```
speedctl import wiremock --name {SNAPSHOT_NAME} --service-name {SERVICE_NAME} --from {MAPPINGS} {FLAGS}
```

### Questions?

Note: because new features and flags are regularly added, you can check the latest capabilities by running:

```
speedctl import goreplay --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
