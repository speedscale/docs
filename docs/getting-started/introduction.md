---
description: "Get started with Speedscale to automate API quality testing, leveraging observability and AI for effortless traffic replay and test generation."
slug: /
sidebar_position: 1
sidebar_label: Getting Started
---

# Getting Started

Speedscale captures real API traffic from your running services and replays it against code changes before release. In Kubernetes environments, Speedscale can collect traffic with goproxy sidecars and eBPF-based collection, including encrypted traffic paths, so teams can validate behavior without rewriting services.

Use Speedscale if you need to:

- Reproduce production behavior in a controlled test environment
- Catch API regressions before merge or deploy
- Validate AI-generated code changes against real traffic patterns

Speedscale is different from static checks and synthetic-only tests because it validates runtime behavior using real request and response data.

![Speedscale home screen](./home-screen.png)

### AI Assistant

The fastest way to get started is the **AI assistant** on the home screen. Ask it questions in natural language — it can help you record traffic, find snapshots, run replays, and interpret results. See the [AI Chat Assistant guide](/guides/ai-assistant) for details on what it can do.

Speedscale follows a 3-part workflow: **Observe**, **Analyze**, and **Replay**.

### Observe <a href="#observe" id="observe"></a>

In **Observe**, the Speedscale proxy (goproxy) captures traffic in a late-stage environment (for example UAT, staging, or production). The environment is instrumented via Kubernetes sidecars or proxy servers, depending on your platform.

![](../speedscale-data-capture.png)

The proxy captures two data flows: inbound traffic to your API and outbound traffic to dependencies, including responses. This allows Speedscale to transform inbound requests into replayable tests and dependency traffic into mocked services for isolated replay.

Captured traffic is sent to Speedscale for storage and analysis.

Once you have Speedscale installed, [view your services](https://app.speedscale.com/).

### Analyze <a href="#analyze" id="analyze"></a>

In **Analyze**, you inspect historical traffic by API to understand real system behavior. Traffic is broken into requests and responses so you can investigate normal and failure paths.

![](../observe-rrpair.png)

Use filters to isolate the specific traffic patterns you want to test.

![](../select-service-map.png)

Once your application receives traffic, [view your traffic in Speedscale](https://app.speedscale.com/analyze)

### Replay <a href="#playback" id="playback"></a>

In **Replay**, you run recorded traffic against the candidate version of your service before release. Speedscale can orchestrate this replay environment and execute the run automatically.

![](../100-pct-report.png)

If you do not want outbound calls to hit real dependencies during replay, use a responder to stand in for those systems with captured responses.

Once you have run a replay, [view your test reports](https://app.speedscale.com/reports).
