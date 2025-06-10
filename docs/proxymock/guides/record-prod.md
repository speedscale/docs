---
title: Record Production Traffic
---

# Tests and Mocks from Production Traffic

This guide will show you how to safely record your live Kubernetes-based application and generate mocks for local desktop use. By the end, you will be able to reproduce a remote environment on your local desktop with a few clicks.

This guide assumes that you have already installed a sidecar or other recorder. If you don't have one, you can install one on a demo app by following the [getting started guide](../../intro.md).

:::tip
This guide is for **proxymock** but requires a Speedscale account. If you don't have one, you can sign up for a free trial at [speedscale.com](https://app.speedscale.com/signup).
:::

## Prerequisites

- A sidecar deployed to an app [see getting started](../../quick-start.md)
- A Speedscale [account](https://app.speedscale.com/signup)
- proxymock installed on your local machine

## Inspect Production Traffic

1. Open the speedscale traffic viewer and select the service you want to inspect. For this guide we'll se the **java-server** demo that you can install with the [getting started guide](../../intro.md).

