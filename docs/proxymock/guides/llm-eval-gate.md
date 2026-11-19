---
title: Regression Test a Model Swap
description: Replay recorded LLM prompts against another model or checkpoint and fail CI when its tool calls or answers change.
sidebar_position: 11.5
---

# Regression Test a Model Swap

Before you move an application to another model, a new checkpoint, or a new quantization, replay the prompts production already sent and check that the answers are still right. proxymock sends each recorded LLM request to the candidate model, compares its answer with the recorded one, and reports three rates that a CI job can gate on.

This works for OpenAI-compatible chat and completions APIs, the format that OpenAI, Azure OpenAI, vLLM, NIM and TGI serve. Streamed and non-streamed responses are both scored, and a streamed replay of a non-streamed recording compares correctly. The candidate must serve the same API format that was recorded.

Scoring runs in process and makes no network call.

## Replay the recorded prompts at the candidate

Start from a recording of your application's LLM traffic, made with `proxymock record` or the Speedscale sidecar. The same replay also reports how fast the candidate answers: see [LLM Streaming Metrics](/guides/replay/llm-streaming-metrics.md).

In a recording of an application that calls a model, the LLM requests are outbound traffic. A replay sends inbound traffic by default and serves outbound calls as mocks, so select the LLM calls as tests with `--tests-filter`:

```shell
export CANDIDATE_API_KEY=your-candidate-key

proxymock replay \
  --in ./proxymock/recorded-example \
  --tests-filter '(networkaddr IS "api.openai.com:443")' \
  --test-against http://localhost:8000 \
  --llm-model checkpoint-b \
  --llm-api-key-env CANDIDATE_API_KEY \
  --fail-if 'llm.tool-call-match-pct < 100' \
  --fail-if 'llm.failure-pct > 5'
```

Use the address of the model API your application called. `(direction IS OUT)` selects every outbound call instead, which is enough when the model is the only dependency in the recording. Without a filter, a recording that holds only outbound calls has nothing to replay and the replay stops with an error. [Choose What a Replay Tests](./choose-replay-tests.md) has the filter syntax.

Leave out `--tests-filter` when you recorded in front of the model server itself, where the LLM requests are inbound.

| Flag | Effect |
| --- | --- |
| `--tests-filter` | Which recorded requests are sent to the candidate |
| `--test-against` | Address of the candidate model server |
| `--llm-model` | Model name sent in each recorded LLM request, in place of the recorded one |
| `--llm-api-key-env` | Name of the environment variable holding the candidate's API key, sent as a Bearer token in place of the recorded `Authorization` header |

Both overrides apply only to `POST` requests to a chat completions or completions endpoint. Everything else in each request is sent as recorded, including the sampling settings and the conversation history.

Pass the name of the variable to `--llm-api-key-env`, never the key. proxymock stores the variable name in the run's snapshot and reads the key when it sends a request. The replay output records each request as it was sent, as a recording does.

Leave out `--llm-api-key-env` to send the recorded `Authorization` header. Leave out `--llm-model` to send the recorded model name, for example when the candidate is a different server that serves the same model name.

## What is compared

Each recorded response and its replay are reduced to the answer itself: the text, the tool calls and the reason the model stopped. Response ids, timestamps and tool-call ids are ignored.

**Tool calls are compared structurally and decide the pair first.** The candidate must call the same functions the same number of times. Arguments are compared as parsed JSON:

- Keys, numbers, booleans and short strings must be equal.
- A string of four or more words is treated as prose and compared for meaning, so a reworded search query still matches.
- The order of calls within one response is ignored, and the number of reordered pairs is reported.

A tool-call mismatch fails the pair whatever its text says. That includes a tool call on one side and prose on the other, and arguments that are not valid JSON.

**Answer text is compared for meaning**, using the same scorer and thresholds as [semantic comparison](./semantic-comparison.md). Reasoning text is not scored. When a response offers several choices, only the first is scored.

| Situation | How it is counted |
| --- | --- |
| The candidate returns an error or no completion | A failure |
| The candidate refuses a request production answered | A failure |
| The candidate's answer is cut short | Scored on what arrived, and counted as truncated |
| The recorded answer is an error, a refusal or cut off | Left out of every rate |

## Gate on the three rates

| `--fail-if` name | Meaning |
| --- | --- |
| `llm.tool-call-match-pct` | Of the pairs where either side called a tool, the percentage whose calls matched |
| `llm.divergence-pct` | Percentage of scored pairs that did not match, failures included |
| `llm.failure-pct` | Percentage of scored pairs that failed |

No gate applies by default. A replay that scores LLM responses with no condition on these rates exits `0` and prints `scored but not gated`.

A condition on a rate that has nothing to measure is an error, not a pass. For example, `llm.tool-call-match-pct` is not reported when no scored pair called a tool.

The rates are not reported with `--no-out`, `--load-test` or `--ignore-body-changes`, because those options do not keep or score response bodies.

Use `--fail-if` for these rates. A test config goal on one of them is not evaluated in a local replay.

## Read the result

The replay prints each failed pair with its reason, then the rollup:

```text
LLM FAIL: POST /v1/chat/completions get_order: order_id 42 -> 43
LLM quality: 4 scored · tool calls 1/3 matched (33.3%) · divergence 75.0% · failures 50.0%
```

`replay-verdict.json` holds the detail:

- `summary.llm` has the counts behind each rate, the rates, the scorer version and the thresholds in force.
- Each LLM pair has an `llm` object with its band (`match`, `divergent` or `fail`), the reason, and the tool-call comparison.

A warning is printed when fewer than 30 pairs were scored, because each pair then moves a rate by several points.

## Measure the noise first

Requests are replayed with their recorded sampling settings, so a model can answer the same prompt differently on two runs. Before you compare a candidate, replay the recording at the model that produced it and note the divergence rate. That is the noise floor. Set your conditions above it, and gate on the rates across many prompts instead of on any single prompt.

The tool-call match rate is the most stable of the three, because it does not depend on wording.

## Use it with semantic comparison

The three rates are computed whether or not `--semantic` is set. Without `--semantic`, they are reported and every other verdict stays as it was.

With `--semantic`, an LLM pair's body verdict is its LLM result. A changed tool call fails the pair, a reworded answer is reported as divergent, and the optional judge can rule on the divergent pairs.
