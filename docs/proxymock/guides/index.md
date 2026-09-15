---
title: Guides
description: "Explore practical how-to guides for using proxymock effectively in your API testing and traffic replay scenarios."
sidebar_position: 3
---

import { GrpcCard, OpenApiCard, ModifyRrpairsCard, LlmSimulationCard, DatadogSyntheticsCard, CredentialsSwapCard, RecommendationsCard, ReplayTuningCard, MockMatchRateCard } from '@site/src/components/Cards';

# Guides

This section contains how-to guides for practical uses of **proxymock**.

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <RecommendationsCard />
  <ReplayTuningCard />
  <MockMatchRateCard />
  <CredentialsSwapCard />
  <LlmSimulationCard />
  <DatadogSyntheticsCard />
  <GrpcCard />
  <OpenApiCard />
  <ModifyRrpairsCard />
</div>

## Configure and verify replays

- [Create and Verify Blueprints](./blueprints.md): save, preview, and check runtime transforms.
- [Gate CI on Replay Results](./replay-verdicts.md): baseline comparisons, fix verification, and exit codes.
- [Compare Response Meaning](./semantic-comparison.md): similarity thresholds and optional judging.
