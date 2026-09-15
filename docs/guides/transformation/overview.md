---
description: Configure reusable Cloud transform templates and find the equivalent blueprint workflow in proxymock.
sidebar_position: 0
---

# Traffic Transformation

Transforms adapt recorded traffic for replay: replace credentials, shift dates, or carry a value from one response into a later request. They can also adjust outbound requests and responses used by mocks.

## Choose your workflow

| Environment | Saved configuration | Start here |
| --- | --- | --- |
| Speedscale Cloud | Traffic Transform Template | Configure snapshot tuning, then save a reusable template |
| proxymock | Blueprint | [Create and Verify Blueprints](/proxymock/guides/blueprints.md) |
| Local JSON authoring | Bare transform configuration | [Test and apply local rules](/proxymock/guides/local-rules.md) |

These workflows use the same [transform engine](/concepts/transforms.md), [extractors](./extractors/README.md), and [transforms](./transforms/README.md). A blueprint wraps the transform configuration with local metadata; it is not the same JSON document as a bare Cloud template.

## Tune a Cloud snapshot

1. Run a small replay against your test application.
2. Inspect inbound accuracy failures and outbound mock misses separately. Open the relevant request to understand which value changed.
3. Open the snapshot's **Tuning** tab. Review a recommendation, the transform chains it proposes, and the traffic affected by each chain.
4. Apply a targeted change, then replay again to check the result.

Use **Traffic** to inspect requests and responses, selecting inbound or outbound traffic as needed. A chain that matches no traffic cannot fix the replay. Check its filter and execution side before adding more transforms.

Correctness failures may require an application fix or a new recording. Change transforms only when the difference is an expected consequence of replaying in a different context. For a complete local iteration loop, see [Replay Tuning](/proxymock/guides/replay-tuning.md).

## Extractors and Transforms

Each chain extracts a value, applies its transforms in order, then writes the result back. See [Basic Principles](/concepts/transforms.md#basic-principles) for the execution model and [Where to Transform Traffic](/concepts/transforms.md#where-to-transform-traffic) for generator and responder placement.

Use [`json_path`](./transforms/json_path.md) for JSON, [`xml_path`](./transforms/xml_path.md) for XML, and [`graphql`](./transforms/graphql.md) for GraphQL values addressed by [semantic path](../graphql/semantic-paths.md).

## Where to Transform Traffic

Generator request chains change what the app receives. Generator response chains can store values returned by the app. Responder request chains affect mock matching; responder response chains affect what the mock returns. The extractor selects the request or response field.

Initialize reusable values with generator or responder variables. Generator variables are scoped to a virtual user. See [Variables](./variables.md) and [Embedded Syntax](./embedded-syntax.md) for storage and runtime references.

## Traffic Transform Templates

A Traffic Transform Template saves a Cloud transform configuration for use with later snapshots. Review templates in [Traffic Transforms](https://app.speedscale.com/trafficTransforms).

### How to Use Transform Templates

<iframe src="https://www.youtube.com/embed/XSN8wG_-RO8?rel=0&modestbranding=1" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>

1. Configure transforms for a snapshot and verify them with a replay.
2. Save the configuration as a template.
3. Select the saved template for another snapshot and review its filters, variables, and credentials before replaying.

The video shows an earlier dashboard layout. Current snapshot tuning is under **Tuning**, and requests are under **Traffic**.

For local reuse, save a [blueprint](/proxymock/guides/blueprints.md). A recording's snapshot ID does not bind a local blueprint; active rules can apply to other recordings in the workspace when their filters match.
