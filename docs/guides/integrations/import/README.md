---
description: "Import third-party traffic into Speedscale Cloud or local proxymock RRPair files for tests and dependency mocks."
sidebar_position: 0
---

# Import

Importers convert third-party traffic into Speedscale RRPairs that can be replayed as tests or served as dependency mocks.

Choose where the imported traffic should live:

- `speedctl import` creates a snapshot in Speedscale Cloud.
- `proxymock import` writes local RRPair files and does not require a Speedscale account.

| Format | Cloud snapshot | Local proxymock files |
| --- | --- | --- |
| [GoReplay](./goreplay.md) | `speedctl import goreplay` | `proxymock import goreplay` |
| [HAR and browser traffic](./import-har.md) | `speedctl import har` or the UI | `proxymock import har` |
| [HTTP wire files](./http_wire.md) | `speedctl import http-wire` | `proxymock import http-wire` |
| [Postman](./import-postman.md) | `speedctl import postman` or the UI | `proxymock import postman` |
| [WireMock](./wiremock.md) | `speedctl import wiremock` | `proxymock import wiremock` |

[Charles Proxy](./import-charles.md) sessions can be converted to HAR and passed to either HAR importer. [JMeter migration](./jmeter.md) records requests while the JMeter plan runs; it does not import `.jmx` files directly.
