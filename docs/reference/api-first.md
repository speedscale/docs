# Control Speedscale via API

Speedscale practices *api first* development which means that every capability available via the UI is available programmatically. Internally, Speedscale engineers build and test every user-initiated capability using APIs that are designed to be customer facing. Once the API-initiated version of a feature is complete, a UI-option is added. This means that Speedscale satisfies two very different usage models:

- *API-driven* - CI systems or expert users can initiate Speedscale data collection as well as replay using `speedctl` or the underlying grpc API.
- *UI-driven* - casual users can initiate the same actions via a point and click interface

There should be little or no difference between the capabilities offered using either option.

# Integrating with Speedscale

Speedscale is designed to either run standalone or as part of a wider testing platform. For example, let's imagine we want to record new traffic from production every hour and make it available in a staging environment. This is accomplished using only Speedscale by setting up an hourly [schedule](https://dev.speedscale.com/schedules) for recording and/or replay. No external components or tools are required for the full lifecycle of this activity.

However, many larger enterprises wish to use an existing test orchestration platform that was likely built in-house. This is fully supported and allows whatever degree of control is desired. Using the same example as above, the custom orchestrator can use its own scheduler and call the `speedctl infra sidecar` command every hour to trigger Speedscale. Either approach will produce an hourly snapshot of production data except one is controlled by an outside system and one is fully contained within Speedscale.

# Exporting Data

All Speedscale data (request/response pairs, replay results, etc) are exportable using `speedctl pull` or a similar command/API. Most data is exported using JSON or equivalent formats. Speedscale is designed to provide data portability (within your selected security model) between your environments and across your tool ecosystem.

Custom integrations are also available for common platforms like Grafana, New Relic, Datadog and Dynatrace. Join our [slack](https://slack.speedscale.com) to ask about any special situations.
