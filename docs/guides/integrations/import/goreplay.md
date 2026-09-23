---
description: "Import GoReplay captures into Speedscale Cloud or local proxymock RRPair files."
sidebar_position: 1
---

# Import from GoReplay

Speedscale can import traffic in the open source [GoReplay format](https://github.com/buger/goreplay). Each request becomes an inbound test. Recorded responses become test baselines when they are present in the capture.

## Import to Speedscale Cloud

If you have existing GoReplay traffic and want to import into Speedscale, simply run:

```bash
speedctl import goreplay {GOR_FILE} {FLAGS}
```

## Import to local proxymock files

The local importer does not require a Speedscale account:

```bash
proxymock import goreplay capture.gor --out ./goreplay-rrpairs
proxymock replay --in ./goreplay-rrpairs \
  --test-against http://localhost:8080
```

Use `--service-name` when the capture should be associated with a name other than `localhost`.

### Questions?

Note: because new features and flags are regularly added, you can check the latest capabilities by running:

```bash
speedctl import goreplay --help
proxymock import goreplay --help
```

Also feel free to ask questions on the [Community](https://slack.speedscale.com).
