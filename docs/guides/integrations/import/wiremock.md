---
description: "Import WireMock projects into Speedscale Cloud or local proxymock RRPair files."
sidebar_position: 7
---

# Migrating from WireMock

Speedscale can import traffic in the open source [WireMock format](https://github.com/wiremock/wiremock). This lets you jumpstart the creation of a service mock with existing WireMock mappings.

## Import to Speedscale Cloud

If you have existing WireMock mappings and want to import into Speedscale, simply run:

```bash
speedctl import wiremock --name {SNAPSHOT_NAME} --service-name {SERVICE_NAME} --from {MAPPINGS} {FLAGS}
```

## Import to local proxymock files

Pass a WireMock project directory or zip archive containing `mappings/` and, when used, `__files/`:

```bash
proxymock import wiremock ./wiremock-project --out ./wiremock-rrpairs
proxymock mock --in ./wiremock-rrpairs
```

WireMock mappings do not carry a destination host. Use `--target-host` and `--target-port` to record the dependency address that applications should send through proxymock.

### Questions?

Note: because new features and flags are regularly added, you can check the latest capabilities by running:

```bash
speedctl import wiremock --help
proxymock import wiremock --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
