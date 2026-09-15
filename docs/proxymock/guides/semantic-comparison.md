---
title: Compare Response Meaning
description: Configure semantic response comparison in proxymock with explicit similarity thresholds and optional model judging.
sidebar_position: 11
---

# Compare Response Meaning

Use semantic comparison when an acceptable response can change its wording or structure between runs. Ordinary replay verdicts detect stable response-body changes. `--semantic` scores body similarity and places each scored pair in a match, divergent, or fail band. Status-code checks still apply.

```shell
proxymock replay \
  --in ./proxymock/recorded-example \
  --test-against http://localhost:8080 \
  --out ./proxymock/results/semantic-check \
  --semantic \
  --semantic-pass 0.92 \
  --semantic-fail 0.70
```

Run from the application directory with your own recording and target. Choose thresholds using responses you have reviewed, especially near the boundaries.

| Score | Default band | Effect on body matching |
| --- | --- | --- |
| At least `0.92` | Match | Accepts the body even when fields changed |
| At least `0.70`, below `0.92` | Divergent | Reports divergence without treating that body as a failure |
| Below `0.70` | Fail | Treats the body as a mismatch |

The defaults apply when configuration and flags do not override them. Review `replay-verdict.json` for scores and bands. Semantic scoring does not automatically enable a CI failure gate; combine it with the [appropriate replay gate](./replay-verdicts.md). A divergent result is not a confirmed regression.

## Choose where text scoring runs

| `--semantic-embedder` | Execution | Configuration |
| --- | --- | --- |
| `builtin` | In process, offline; the default | No model endpoint or vendor key |
| `local` | An Ollama-compatible endpoint | `--semantic-endpoint`, `--semantic-model` |
| `openai` | OpenAI embeddings | `OPENAI_API_KEY`, optionally `--semantic-model` |

Selecting an external embedding service sends the text being scored to that service. Use the built-in option or a locally hosted endpoint when traffic must remain local.

## Optional judging of divergent pairs

Judging is off by default. `--semantic-judge` can ask a model to adjudicate pairs in the divergent band:

- `managed`: uses your Speedscale login.
- `openai`: uses `OPENAI_API_KEY`, or an OpenAI-compatible endpoint supplied with `--semantic-judge-endpoint`. Specify `--semantic-judge-model`.
- `anthropic`: uses `ANTHROPIC_API_KEY`.

`--semantic-judge-cap` limits model calls per run and defaults to `25`. Pairs beyond the cap keep their score and are reported as skipped. A judge failure leaves the original score intact. Review which endpoint receives the response text and the cost of those calls before enabling judging.

## Limits

- Similarity is a configurable acceptance policy. It can accept field changes that strict comparison would flag. Keep contract validation and explicit checks for critical values.
- `--semantic` cannot be combined with `--ignore-body-changes`, `--no-out`, or `--load-test`.
- Threshold, embedder, and judge options require `--semantic`.
- Pairs without the data needed for semantic scoring retain their structural verdict. Inspect unscored and unreplayed pairs as well as average scores.

For schema correctness, [validate responses against OpenAPI](./openapi.md#validate-recorded-and-replayed-responses).
