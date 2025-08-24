---
title: How-to Guides
sidebar_position: 1
---

import {
  SnapshotCard,
  ReplayGuideCard,
  LocalCaptureCard,
  BrowserCaptureCard,
  DlpCard,
  SessionCard,
  TlsCard,
  TroubleshootingCard
} from '@site/src/components/Cards';

# How-to Guides

This section contains practical, step-by-step guides for using Speedscale's API testing platform. Whether you're capturing traffic, running replays, or configuring advanced features, these guides will help you accomplish specific tasks.

## Getting Started

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <SnapshotCard />
  <LocalCaptureCard />
  <BrowserCaptureCard />
</div>

## Testing & Replay

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <ReplayGuideCard />
  <SessionCard />
</div>

## Security & Configuration

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <DlpCard />
  <TlsCard />
  <TroubleshootingCard />
</div>

## Additional Resources

- **[Advanced Filters](./advanced-filters)** - Create sophisticated traffic filters for precise capture
- **[CLI Usage](./cli)** - Command-line interface for power users
- **[Ingress Traffic](./ingress)** - Capture cluster ingress traffic
- **[Reports](./reports/)** - Understanding test results and performance metrics
- **[GraphQL Support](./graphql)** - Working with GraphQL APIs
- **[JSON Payloads](./json-payloads)** - Handling complex JSON data structures
- **[Load Patterns](./load-patterns)** - Configure realistic load testing scenarios
- **[Argo Integration](./argo)** - Using Speedscale with Argo Rollouts
- **[OTEL Integration](./otel)** - OpenTelemetry integration guide
- **[Prometheus Metrics](./prometheus)** - Monitoring with Prometheus
- **[CMEK](./cmek)** - Customer-managed encryption keys