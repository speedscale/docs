---
title: Author DLP and Filter Rules Locally
description: "Build and test DLP redaction rules, traffic filters, and transforms against local RRPair files with no cloud, no API key, and no network. The rule is the same JSON document Speedscale Cloud uses, so it round-trips through cloud pull and push. Available as CLI verbs, MCP tools, and web editors."
sidebar_position: 15
---

# Author DLP and Filter Rules Locally

Redaction and filter rules decide what leaves your environment and what gets kept. proxymock lets you author and test those rules against RRPair files on your own machine, with no Speedscale account, no API key, and no network access. That is what makes the air-gap story honest: you can prove exactly what a rule redacts or drops before any traffic moves anywhere.

Three rule kinds share the same local workflow:

- **DLP** redacts sensitive values out of traffic.
- **Filter** keeps or drops whole RRPairs.
- **Transform** rewrites values in place, for example re-signing a JWT or shifting a timestamp.

Each is available three ways: as a CLI verb (`proxymock dlp`, `proxymock filter`, `proxymock transform`), as an MCP tool (the `dlp` and `config` tools), and as an editor in `proxymock web`. Whichever you use, the config is the **same JSON document Speedscale Cloud uses**, so a rule authored locally uploads with `proxymock cloud push`, and a cloud rule tests locally after `proxymock cloud pull`. The engines match too: the DLP pipeline is identical to what `proxymock record --dlp-config` applies at capture time, the filter engine is the one the forwarder runs, and the transform engine is the one the cloud Transforms tab and the responder apply at replay. What you see locally is what runs in production.

## Before you begin

- `proxymock` [installed](../getting-started/quickstart/quickstart-cli.md).
- A directory of RRPair files to test against, for example a `recorded-*` run or an [imported BYOC pull](./byoc-bucket.md).
- A rule to test. Write one by hand, or start from a cloud rule: `proxymock cloud pull dlp standard` writes the shipped `standard` DLP rule to disk. Pulling needs an account; testing and applying do not.

## Redact with DLP {#dlp}

`dlp test` reports what a config would redact without changing any file: per-location match counts, and the file and location of each match. Run it against a recording to see what a rule catches:

```shell
# report what a rule would redact
proxymock dlp test --dlp-config my-dlp.json --in ./recorded

# test a rule downloaded with 'proxymock cloud pull dlp standard'
proxymock dlp test --dlp-config standard --in ./recorded

# inspect the full before/after redaction of one file
proxymock dlp test --dlp-config my-dlp.json --show-redacted ./recorded/api/foo.md
```

Because `dlp test` runs the same pipeline as capture-time redaction, its report is exactly what a live recording with `--dlp-config` would produce. Iterate on the JSON until the match counts cover the values you care about and nothing you need.

When the rule is right, `dlp apply` writes redacted copies to a separate directory. The input files are never modified, and `--out` must be outside `--in`:

```shell
proxymock dlp apply --dlp-config my-dlp.json --in ./recorded --out ./redacted
```

You can also redact at the moment traffic enters your workspace. `proxymock import s3 --dlp-config` applies the rule to matched RRPairs before they are written, so sensitive values from a [BYOC pull](./byoc-bucket.md) never touch disk unredacted, and `proxymock record --dlp-config` redacts at capture time.

## Keep or drop with filters {#filter}

A filter classifies each RRPair: one that matches the filter is dropped, one that does not is kept. `filter test` reports the split without writing anything:

```shell
# report which RRPairs would be kept or dropped
proxymock filter test --filter-config my-filter.json --in ./recorded

# list every dropped RRPair, not just a sample
proxymock filter test --filter-config my-filter.json --in ./recorded --show-dropped
```

`filter apply` writes only the RRPairs the filter keeps to a new directory:

```shell
proxymock filter apply --filter-config my-filter.json --in ./recorded --out ./filtered
```

The filter config uses the Speedscale [traffic filter language](/reference/filters/structure.md), the same expressions the forwarder evaluates in-cluster.

## Rewrite values with transforms {#transform}

Transforms change values rather than dropping records: re-signing a JWT, rotating a message id, shifting a timestamp into the replay window. `transform test` previews the change, `transform apply` writes transformed copies:

```shell
# preview what a transform set would change
proxymock transform test --transform-config my-transforms.json --in ./recorded

# show the full before/after of one file
proxymock transform test --transform-config my-transforms.json --show ./recorded/api/foo.md
```

For the transform language and the built-in transform library, see [Transforms](/guides/transformation/overview.md). Many transforms can be generated for you instead of hand-written: [Recommendations](./recommendations.md) detects rotating values and writes the transform chains automatically.

## From an AI agent (MCP) {#mcp}

The same authoring loop is available to an AI coding assistant, so it can build and check its own redaction and filter rules:

- The **`dlp`** tool takes an `action` of `test` or `apply`, plus the config path and input directories. `test` is read-only; `apply` writes redacted copies.
- The **`config`** tool covers filters and transforms with an `action` of `filter-test`, `transform-test`, or `transform-apply`. The two `-test` actions are read-only previews; `transform-apply` writes transformed copies. To write only the RRPairs a filter keeps, use the `proxymock filter apply` CLI command.

Both tools run offline and read and write the same JSON documents as `proxymock cloud pull/push`, so a rule an agent authors round-trips to Speedscale Cloud unchanged. See the [MCP Tools reference](../how-it-works/mcp-tools.md) for the full parameters.

## From proxymock web {#web}

`proxymock web` ships editors for DLP and filter rules. Load a run, author the rule against its traffic, and preview what it redacts or drops before you save. The saved rule is the same JSON the CLI and MCP paths read, so you can start a rule in the browser and finish it on the command line, or the reverse.

## Round-trip to Speedscale Cloud {#round-trip}

Local authoring and cloud enforcement are two ends of the same rule:

```shell
# pull a cloud rule, refine it locally, push it back
proxymock cloud pull dlp standard
proxymock dlp test --dlp-config standard --in ./recorded
# edit the JSON, re-test, then:
proxymock cloud push dlp
```

The same `pull`/`push` pair works for `filter` and `transform`. Author where it is fastest to iterate, prove the behavior against real RRPairs, and enforce the identical rule in the cluster.

## Next steps

- [Pull Traffic from a BYOC Bucket](./byoc-bucket.md) is the natural source of traffic to redact and filter.
- [Fix Replay Failures with Recommendations](./recommendations.md) generates transform chains for rotating values.
- The [proxymock CLI reference](/reference/proxymock-cli-reference.md#local-rule-authoring-commands) lists every flag for `dlp`, `filter`, and `transform`.
