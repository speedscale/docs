---
title: Docker
sidebar_position: 8
---

Run Speedscale components via Docker Compose.

## Prerequisites

1. [Speedctl is installed](../../../getting-started/quick-start.md)
1. [Docker Desktop](https://docs.docker.com/desktop/) is installed

## Capturing Traffic

Create Docker Compose manifests by running `speedctl install`, and following
the `Docker` flow that allows you to capture traffic.  This will create working
manifests with sane defaults.  The created manifest file will be listed after
the command completes.

Bring up the containers using `docker compose --file <speedscale-manifest-file> up -d`
which will start the containers described in the compose file.  These
containers will aid in capturing traffic and sending it to the Speedscale
cloud.

Now you have to configure your application to use the socks
[proxy](../../../reference/glossary.md#proxy) running on `*:4140` on your server, and
configure it to [trust the local certificates](/getting-started/installation/sidecar/tls/#trusting-tls-certificates).

You can now run requests against your service through `localhost:4143` instead
of the normal port as our [goproxy](../../../reference/glossary.md#goproxy) is
acting as the entry point for the app now.

## Analyze Traffic

![Traffic](./docker/traffic.png)

You should be able to see traffic in the Speedscale UI after a few minutes and
now you can using this traffic to [create a snapshot](../../../guides/creating-a-snapshot.md).

## Replaying Traffic

Replaying traffic starts by creating manifests similar to the capture step
above.  Run `speedctl install` and choose the `Docker` flow that allows you to
replay recorded traffic.  When prompted, enter the ID of the snapshot you
created.

This will generate a [report](../../../reference/glossary.md#report) which you can find on the [reports page](../../../guides/reports/README.md).

:::note
The `speedctl install` command is just a helper and environment variables like
`SNAPSHOT_ID` and `TEST_CONFIG_ID` can be modified in the manifest file without
regenerating it every time.
:::

