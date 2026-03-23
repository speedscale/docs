---
title: Mocking LLM APIs
description: "Use proxymock to record and mock LLM API calls from OpenAI, Anthropic, Gemini, and other providers for zero-cost local development and CI testing."
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Mocking LLM APIs

If your application calls an LLM provider like OpenAI, Anthropic, or Gemini, every request costs money -- even during development and testing. **proxymock** eliminates that cost by recording real LLM responses once and replaying them locally.

This is useful when you are:

- Iterating on prompt wrappers, response parsing, or fallback logic
- Running tests in CI without provider API keys
- Validating UI behavior with realistic AI responses
- Avoiding rate limits during rapid development

For a broader overview of LLM simulation including Speedscale Cloud, see the [LLM Simulation guide](/guides/mocking/llm-simulation).

## Supported Providers

**proxymock** works with any HTTP-based LLM API. The following providers are auto-detected and labeled automatically:

| Provider | Detected via |
|---|---|
| OpenAI | `api.openai.com` |
| Anthropic Claude | `api.anthropic.com` |
| Google Gemini | `generativelanguage.googleapis.com` |
| Grok (xAI) | `api.x.ai` |
| OpenRouter | `openrouter.ai` |

If your provider is not in this list, it will still work -- proxymock captures all outbound HTTP/HTTPS traffic regardless of the destination.

## Step 1: Record Real LLM Traffic

Start **proxymock** in record mode, pointing at your application's port:

```bash
proxymock record --app-port 8000
```

Then run your application and trigger the workflows that make LLM calls. For example, if your app has a `/api/run` endpoint that calls OpenAI:

```bash
curl -X POST http://localhost:4143/api/run \
  -H "Content-Type: application/json" \
  -d '{"ticket_id": "T001", "provider": "openai"}'
```

**proxymock** captures every outbound call your application makes, including the LLM provider requests and any other backend calls (databases, internal services, etc.). The captured traffic is written to the `proxymock/` directory as [RRPair files](/proxymock/how-it-works/rrpair-format.md).

Stop recording with `Ctrl+C` when you have covered the scenarios you need.

:::tip
You only need to record once per set of scenarios. After that, you can replay the same responses indefinitely without any API keys.
:::

## Step 2: Inspect Captured Traffic

Check what was captured:

```bash
ls proxymock/
```

You will see RRPair files for each request/response pair. Open one to verify the LLM response was captured correctly. The files are plain text and human-readable.

API keys and other sensitive headers are automatically redacted, so the captured data is safe to commit to version control.

## Step 3: Replay with Mocks

Start **proxymock** in mock mode:

```bash
proxymock mock --in ./proxymock
```

Now start your application. Configure it to route outbound traffic through proxymock by setting the proxy environment variables:

```bash
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
```

When your application makes an LLM call, **proxymock** matches the request using [signature matching](/proxymock/how-it-works/signature.md) and returns the recorded response. If a request does not match any recording, it passes through to the real provider.

The result: your application behaves exactly as it did during recording, but with zero LLM cost and instant responses.

## Using in CI/CD

Commit the `proxymock/` directory to your repository. In your CI pipeline, run **proxymock** in mock mode before starting your test suite:

```bash
# Start proxymock in the background
proxymock mock --in ./proxymock &

# Set proxy environment variables
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140

# Run your tests -- no API keys needed
pytest tests/
```

No LLM provider API keys are required in the CI environment. The tests run against recorded responses, making them fast, free, and deterministic.

See the [CI/CD guide](./cicd.md) for more details on pipeline integration.

## Using with Docker

If your application runs in Docker, pass the proxy environment variables to the container:

<Tabs>
<TabItem value="record" label="Record">

```bash
# Start proxymock on the host
proxymock record --app-port 8000

# Run your app container with proxy settings
docker run \
  -e http_proxy=http://host.docker.internal:4140 \
  -e https_proxy=http://host.docker.internal:4140 \
  -p 8000:8000 \
  your-app:tag
```

</TabItem>
<TabItem value="mock" label="Mock">

```bash
# Start proxymock on the host
proxymock mock --in ./proxymock

# Run your app container with proxy settings
docker run \
  -e http_proxy=http://host.docker.internal:4140 \
  -e https_proxy=http://host.docker.internal:4140 \
  your-app:tag
```

</TabItem>
</Tabs>

See the [Docker guide](./docker.md) for Docker Compose examples and more details.

## Tips

- **Record all providers at once.** If your application supports multiple LLM providers, record a session that exercises each one. The mock will serve the correct response for each provider based on the request signature.
- **Re-record when prompts change.** If you modify the prompt template in your application, the request body changes and may not match the old recording. Re-record to capture the new prompt/response pair.
- **Combine with replay for full testing.** Use `proxymock replay` to send recorded inbound requests to your application while mocking outbound LLM calls. This gives you end-to-end test coverage.

## Further Reading

- [LLM Simulation guide](/guides/mocking/llm-simulation) -- full overview covering both proxymock and Speedscale Cloud
- [Signature Matching](/proxymock/how-it-works/signature.md) -- how proxymock matches requests to recorded responses
- [RRPair Format](/proxymock/how-it-works/rrpair-format.md) -- the file format for captured traffic
- [CI/CD Integration](./cicd.md) -- running proxymock in CI pipelines
