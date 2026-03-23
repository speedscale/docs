---
title: LLM Simulation
description: "Simulate LLM API responses from OpenAI, Anthropic, Gemini, and other providers to eliminate non-production AI spend in development, CI, and load testing."
sidebar_position: 6
---

# LLM Simulation

LLM simulation replaces live AI provider calls with recorded responses during development, CI, and load testing. Instead of paying for real model inference every time a developer refreshes a screen or a CI pipeline runs, you capture one real interaction and replay it everywhere else.

This works with both [Speedscale Cloud](#using-speedscale-cloud) (for Kubernetes and staging environments) and [proxymock](#using-proxymock) (for local development and CI).

## Why Simulate LLM APIs?

Most teams expect their AI bill to come from production traffic. In practice, a large portion comes from non-production activity: developers iterating on prompt wrappers, CI pipelines running the same scenarios on every pull request, and load tests hammering model endpoints in staging.

A mid-size support center running Claude Sonnet at 10,000 tickets per day can spend around $180K per year on LLM API calls. Much of that spend is not production traffic.

LLM simulation fixes this by drawing a clear line between environments that need a real model and environments that do not.

### Cost

Every LLM call costs real money. When the same workflow runs hundreds of times in CI or gets multiplied during a load test, those costs compound fast. Simulation reduces non-production LLM spend to zero.

### Speed

Real LLM calls add 500ms to 3s of latency per request. Mocked responses return in milliseconds. This makes development feedback loops and CI pipelines significantly faster.

### Determinism

LLM responses vary between calls even with the same input. That non-determinism makes assertions difficult and causes flaky tests. Simulated responses are identical every time, giving you repeatable test results.

### Rate Limits

LLM providers enforce rate limits and token quotas. Load tests and batch CI runs can easily hit those limits, causing failures that have nothing to do with your application. Simulation avoids provider throttling entirely.

## When to Use Real LLMs vs. Simulation

| Scenario | Use real LLM | Use simulation |
|---|---|---|
| Production traffic | Yes | |
| Prompt quality evaluation | Yes | |
| Provider comparison | Yes | |
| Developing pipeline logic | | Yes |
| CI / regression tests | | Yes |
| Load testing | | Yes |
| Staging validation | | Yes |

Use real providers when the goal is to evaluate the model itself: prompt quality, provider latency, output quality, or true cost. Use simulation when the goal is to test your application logic: response parsing, fallback handling, UI behavior, throughput, and retry logic.

## Supported Providers

Speedscale automatically detects and supports popular LLM provider APIs. No special configuration is required.

| Provider | Auto-detected via |
|---|---|
| OpenAI | `api.openai.com` |
| Anthropic Claude | `api.anthropic.com` |
| Google Gemini | `generativelanguage.googleapis.com` |
| Grok (xAI) | `api.x.ai` |
| OpenRouter | `openrouter.ai` |

Any HTTP-based LLM API will work even if it is not on this list. The auto-detection simply adds provider-specific labeling. See the full [technology support](../../reference/technology-support.md#supported-llm-providers) page for details.

## How It Works

LLM simulation follows the same capture-and-replay pattern as any other [service mock](./mocks.md), with one important difference: the captured data includes realistic AI responses, token counts, and latency rather than hand-written stubs.

1. **Capture** -- Run your application once with real LLM providers. Speedscale records every outbound API call including headers, request body (prompt), response body (completion), timing, and token usage.
2. **Analyze** -- Speedscale generates [signature/response pairs](./signature.md) from the captured traffic. Each unique LLM request gets a signature that identifies it during replay.
3. **Replay** -- When your application makes the same call during a test, Speedscale matches the request signature and returns the recorded response. Your application cannot tell the difference.

Sensitive values like provider API keys are automatically redacted so the captured data is safe to store, share, and commit to version control.

## Using Speedscale Cloud

Speedscale Cloud captures and replays LLM traffic in Kubernetes environments using the operator and sidecar.

### Capture LLM Traffic

Deploy the Speedscale sidecar to your service. When your application makes outbound calls to LLM providers, the sidecar records them transparently -- no code changes required.

1. [Install the operator](../../getting-started/installation/install/kubernetes-operator.md) if you have not already.
2. Add the Speedscale sidecar annotation to your deployment.
3. Run your workflow once with real provider API keys configured.
4. Open the snapshot in the Speedscale UI. You will see each LLM API call with its full request and response.

The captured traffic includes the internal service calls (like a tools service or database) alongside the outbound LLM calls. This gives you a complete picture of the runtime interaction.

:::tip
You only need one good recording. Run the workflow with all the providers and scenarios you care about, then reuse that snapshot indefinitely.
:::

### Replay with Mocked LLMs

Once you have a snapshot, replay uses the Speedscale responder to serve recorded LLM responses:

- **Regression testing** -- Run a standard [replay](../replay/README.md) with the responder handling all outbound LLM calls. Your application exercises the same code paths without any provider API keys.
- **Load testing** -- Configure a [load test](../replay/load-test.md) to multiply the traffic. The responder serves LLM mocks at any scale with no provider cost and no rate limiting.
- **CI integration** -- Add replay to your [CI/CD pipeline](../integrations/cicd/cicd.md) so every pull request validates the LLM integration without live calls.

### Customizing Signatures

Speedscale generates good default signatures for LLM requests. If you need to adjust matching behavior -- for example, ignoring a timestamp field in the prompt or wildcarding a model version in the URL -- see the [modifying signatures](./modifying.md) guide.

## Using proxymock

[proxymock](/proxymock/index.md) captures and replays LLM traffic on your local machine or in CI without requiring Kubernetes.

### Record

Start proxymock in record mode and run your application:

```bash
proxymock record --app-port 8000
```

Make requests to your application that trigger LLM calls. proxymock captures the outbound traffic to OpenAI, Anthropic, Gemini, or any other HTTP-based provider and writes the request/response pairs to the local `proxymock/` directory.

### Mock

Switch to mock mode. proxymock serves the recorded LLM responses without any provider API keys:

```bash
proxymock mock --in ./proxymock
```

Your application makes the same outbound calls, but proxymock intercepts them and returns the recorded responses. Zero cost, instant responses, fully deterministic.

### CI Integration

Commit the `proxymock/` snapshot directory to your repository. In CI, run proxymock in mock mode before starting your tests. No API keys are needed in the CI environment.

```bash
proxymock mock --in ./proxymock &
# run your test suite
```

See the full [proxymock LLM simulation guide](/proxymock/guides/llm-simulation.md) for a step-by-step walkthrough, and the [proxymock CI/CD guide](/proxymock/guides/cicd.md) for pipeline setup.

## Demo Application

The [LLM simulation demo](https://github.com/speedscale/demo/tree/master/llm-simulation-demo) is a support-ticket triage application that demonstrates this pattern end to end.

The demo runs a 3-step AI pipeline (triage, analysis, response drafting) against OpenAI, Anthropic, Gemini, and xAI/Grok. It includes 20 sample tickets and tracks timing, token usage, and projected cost per run. With 4 providers enabled, a single "Analyze All" run makes 240 LLM API calls -- exactly the kind of repetitive non-production traffic that simulation eliminates.

## Further Reading

- [Service Mocking concepts](../../concepts/service_mocking.md) -- how Speedscale service mocking works
- [Signature Matching](./signature.md) -- how requests are matched to recorded responses
- [Modifying Signatures](./modifying.md) -- customizing match behavior for LLM requests
- [Technology Support](../../reference/technology-support.md#supported-llm-providers) -- full list of auto-detected LLM providers
- [The Hidden AI Bill](https://speedscale.com/blog/llm-simulation-missing-runtime-enterprise-ai-agents/) -- blog post on non-production LLM cost
