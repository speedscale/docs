---
title: Architecture
sidebar_position: 1
---

import HowItWorksSvg from './architecture/how-proxymock-works.svg';

# Architecture

`proxymock` is a desktop cli tool that allows you to create a mock server from a recording of your application's traffic. It is a great way to get started with traffic replay. `proxymock` is free and the VS Code UI is open source. It DOES NOT require a subscription to Speedscale Enterprise. The backend for `proxymock` is actually a local Speedscale Enterprise mock server and so it is already enterprise-grade even though it's free.

<HowItWorksSvg />

Ideally, `proxymock` stands in for any backend dependencies your code needs, as mock server. `proxymock` contains most of the business logic for creating and managing mock servers with the UI acting as a layer on top of it. The `proxymock` cli is not open source but the VSCode extension is.

The `proxymock` cli utilizes a proxy to redirect traffic. When it works, it's essentially fully automatic. When you have an unusual configuration, you may want to do some of the networking yourself to reach the cli.

:::tip
When using a supported environment, you do not need to change any application code or configuration. This all happens transparently when you start a debugger session. If it doesn't work automatically, you can use the `proxymock` cli to manually configure the proxy.
:::

`proxymock` sends telemetry data to speedscale to help us improve the product and know what features are important. It does not send any information about the specific nature of your traffic (like URLs, ports or other sensitive data). If you don't believe us, feel free to sniff the traffic and see for yourself.