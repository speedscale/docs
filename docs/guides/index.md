---
title: How-to Guides
description: "How-to guides for Speedscale and proxymock, grouped by job: capture, observe, snapshot, mock, replay, load test, handle auth, transform, protect data, automate and work with AI agents."
sidebar_position: 1
---

# How-to Guides

Each guide covers one job. The sections follow the order most teams work in: capture traffic, look at it, cut a snapshot, mock the dependencies, then replay. Guides that use the proxymock CLI and guides that use the dashboard sit side by side under the same job.

New to Speedscale? Start with a [tutorial](/tutorials/) instead. To judge a replay result, see [Readiness and reports](./readiness/index.md).

## Capture

Get traffic out of a running service.

- [Set up Kubernetes capture](./capture/kubernetes.md)
- [Capture TLS traffic](./tls.md)
- [Capture cluster ingress traffic](./ingress.md)
- [Work a cluster with the proxymock CLI](/proxymock/guides/cluster.md)

## Observe traffic

Read what was captured before you build anything on it.

- [Traffic overview](./capture/traffic.md)
- [Filter the traffic view](./capture/filter.md)
- [Compare two RRPairs](./compare-rrpairs.md)
- [Trace a request without traces](/proxymock/guides/trace-without-traces.md)

## Snapshots and filters

Pick the slice of traffic a replay will use.

- [Create a snapshot](./creating-a-snapshot.md)
- [Create traffic filters](./creating-filters.md)
- [Create a snapshot with the API](./manual_snapshot.md)

## Mock

Stand in for databases and downstream APIs with recorded responses.

- [Mock backends in a replay](./replay/mocks/README.md)
- [Improve the mock match rate](/proxymock/guides/mock-match-rate.md)
- [Generate mocks from OpenAPI](/proxymock/guides/openapi.md)
- [Refine signatures](./signature-refinement-guide.md)

## Replay and regression

Run recorded traffic against a build and check the responses.

- [Replay from the dashboard](./replay/README.md)
- [Replay with Kubernetes manifests](./replay/kube.md)
- [Replay a Cloud snapshot locally](/proxymock/guides/cloud-snapshot-local.md)
- [Tune a replay locally](/proxymock/guides/replay-tuning.md)
- [Bootstrap a regression test with no recording](/proxymock/guides/bootstrap-regression-test.md)
- [Act on traffic recommendations](./recommendations.md)

## Load test

Multiply recorded traffic to find the limit of a service.

- [Run a load test](./replay/load-test.md)
- [Shape the load pattern](./load-patterns.md)
- [Test one endpoint while stressing another](./replay/endpoint-load-how-to.md)

## Auth and sessions

Keep logins, tokens and session IDs valid during a replay.

- [Replace credentials](./replay/replace-credentials.md)
- [Re-sign JWTs](./replay/resign-jwt.md)
- [Identify a session or ID](./identify-session.md)
- [Link sessions](./linked-sessions.md)

## Transform data

Change requests and responses before they are replayed or mocked.

- [How transforms work](./transformation/overview.md)
- [Smart replace](./transformation/smart-replace.md)
- [Variables](./transformation/variables.md)

## Protect data (DLP)

Redact sensitive fields before traffic leaves your environment.

- [Data Loss Prevention](./dlp/index.md)
- [Author DLP and filter rules locally](/proxymock/guides/local-rules.md)

## CI/CD and automation

Run replays from a pipeline and gate on the result.

- [CI/CD with cluster replay](./integrations/cicd/cicd.md)
- [Gate CI on replay results](/proxymock/guides/replay-verdicts.md)
- [REST API for CI and scripts](/proxymock/guides/rest-api.md)

## AI agents

Let a coding agent or the dashboard assistant do the work.

- [AI chat assistant](./ai-assistant.md)
- [Agent skills](/proxymock/agent-skills.md)
- [Model Context Protocol (MCP)](/proxymock/how-it-works/mcp.md)
- [Integration testing with Kiro](/proxymock/guides/kiro.md)

## More

- [Technologies](/technologies/): databases, Kafka and other message brokers, gRPC, GraphQL, LLM apps, AWS services, browsers and languages
- [Import](./integrations/import/README.md) and [export](./integrations/export/README.md): move traffic to and from other tools
- [Reference](/reference/): commands, transforms, extractors and test config fields
