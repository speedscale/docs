---
title: Data and Privacy
description: "Ensure data security and privacy with proxymock, which handles your data responsibly and complies with strict best practices during API testing."
sidebar_position: 11
---

# Data and Privacy

We take data security and privacy seriously. **proxymock** is designed to handle your data responsibly, ensuring that all interactions comply with strict security and privacy best practices. Traffic captured by **proxymock** will not be shared with anyone, not even us, unless you explicitly authorize.  Your traffic will **never** be shared with a third party. See the [Speedscale Terms of Service](https://speedscale.com/legal/terms-service/) for more detailed information.

# Telemetry

**proxymock** sends telemetry data to Speedscale to help us improve the product
and know what features are important. It also contacts the Speedscale API to
validate your API key on each run. It does **not** send any information about
the specific nature of your traffic (like URLs, ports, content or other
sensitive data). If you don't believe us feel free to sniff the traffic (you
could do that with **proxymock**) and see for yourself.

## Counts in your tenant's admin digest

When you run **proxymock** while signed in to a Speedscale tenant, your runs may be counted in that tenant's [weekly admin digest](../../reference/weekly-digest.md).

The digest shows counts only, such as how many developers ran **proxymock** last week and how many of them ran it through a coding agent.

It never shows names, and it never shows what was run.

Runs made while not signed in to a tenant are not counted.

## Run without a connection to Speedscale

`proxymock record`, `mock`, `replay` and `replay score` do their work on your machine, so they run without a connection to Speedscale. When the Speedscale API cannot be reached, the command prints one warning and continues. Its sign-in waits at most three seconds, and CLI logs are not uploaded for that run.

Anything a local run reads from Speedscale cloud still needs the connection. Each of these fails with an error that says the cloud could not be reached:

- A user data file or snapshot artifact that is not on disk.
- A DLP config that the test config references by id.
- The `managed` judge of [semantic comparison](../guides/semantic-comparison.md#optional-judging-of-divergent-pairs).

An API key that Speedscale rejects still stops these commands. Commands that work with the cloud, such as `proxymock cloud`, pulls, pushes and cloud replays, still require the connection.

A run started from the MCP server or the proxymock web UI signs in when it starts, and fails when it cannot.
