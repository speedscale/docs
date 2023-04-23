---
sidebar_position: 8
---

# Test Configs

Test Configs enable you to change how traffic is [replayed](./replay.md) in
your system. Most aspects of the replay can be controlled including which
traffic is replayed, what success conditions are tested and other environmental
configuration. Test Configs are stored as templates. When a replay is
initiated, you can start from a template but then modify it your specific
replay.

Get started with
[your test configs in Speedscale](https://app.speedscale.com/config)
or with the [reference docs](../../reference/configuration).

## What can be controlled?

* Generator configuration like number of traffic copies, delay between requests and replay host
* Responder behavior like number of replicas and chaos settings
* Cluster-specific settings like whether to collect logs, include a sidecar or cleanup stale containers
* Assertions like whether to check response bodies or status codes
* Goals like the number of requests that can fail before the report is considered a failure

## Why store this in a template?

You may want to tune a replay and then use it over and over again. For example,
you might have a perfect chaos scenario mimicking a situation you once saw in
production. This is especially handy when inserting Speedscale as a gate in
your CI system.

## How can I integrate Test Configs with my GitOps workflow?

Test configs are internally represented as JSON files. Simply store the JSON
file in your git repository and then upload it to Speedscale before you use it.
For example:

```bash
speedctl put testconfig my_config.json
```
