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

[Export to Locust](./locust.md) generates HTTP load tests from recorded traffic, with a Kubernetes example that uses BYOC captures and dependency mocks.
