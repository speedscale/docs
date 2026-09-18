---
description: "Export Speedscale results to monitoring tools and generate automatic test scripts with our comprehensive guide on exporters for real-time dashboard information."
sidebar_position: 0
---

# Export

Speedscale exporters cover three workflows:

- Stream application traces, metrics, and logs to an observability platform.
- Correlate a trace with the request and response captured by Speedscale.
- Turn captured traffic into automatic tests and dependency mocks.

Use the vendor guides for [Datadog](./datadog.md), [Dynatrace](./dynatrace.md), and [New Relic](./new-relic.md) to configure live OpenTelemetry export. Each vendor is a separate destination channel with its own collector, credentials, filters, retries, and on/off control.

Traffic-format exporters work from either a Speedscale Cloud snapshot or local RRPair files:

| Format | Cloud snapshot | Local proxymock recording |
| --- | --- | --- |
| [Gatling](./gatling.md) | `speedctl export snapshot --type gatling` | `proxymock export gatling` |
| [k6](./grafana.md) | `speedctl export snapshot --type k6` | `proxymock export k6` |
| [Locust](./locust.md) | `speedctl export snapshot --type locust` | `proxymock export locust` |
| [Postman](./postman.md) | `speedctl export snapshot --type postman` | `proxymock export postman` |
| [WireMock](./wiremock.md) | `speedctl export snapshot --type wiremock` | `proxymock export wiremock` |

The local commands do not require a Speedscale account. They read RRPair files produced by `proxymock record`, a cloud snapshot pull, or a BYOC bucket import.
