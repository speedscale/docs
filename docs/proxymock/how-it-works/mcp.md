---
sidebar_position: 6
---

import MCPProtocolCard from '@site/src/components/Cards/MCPProtocolCard';
import AICodeGenerationCard from '@site/src/components/Cards/AICodeGenerationCard';
import LearningResourcesCard from '@site/src/components/Cards/LearningResourcesCard';
import CommunitySupportCard from '@site/src/components/Cards/CommunitySupportCard';

# Model Context Protocol (MCP)

:::tip
MCP support requires proxymock be installed. **It's free.** Instructions are [here](https://docs.speedscale.com/proxymock/getting-started/installation/).
:::

**proxymock** records API/Database calls going into and out of an app running on your local desktop.

* inbound requests become tests
* outbound requests become service mocks (automatically)
* recordings are portable

You can learn more at [proxymock.io](https://proxymock.io)

An MCP server is built into **proxymock** to let Agent-based LLM tools like [Cursor](https://cursor.com), 
[Claude Desktop](https://claude.ai/download), [VS Code](https://code.visualstudio.com) or [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp) interact.
Once installed, you will be able to interact with proxymock using your normal chat interface. 
This is made possible by the [Model Context Protocol](https://modelcontextprotocol.io).

Installation instructions for proxymock are [here](https://docs.speedscale.com/proxymock/getting-started/installation/) (it's really easy)

## MCP at a Glance

MCP is a lightweight, open protocol that standardizes how AI applications (IDEs, chat apps) connect to capability providers (like proxymock). It defines a small set of API types so tools can interoperate:

- Tools: Callable functions with typed inputs/outputs that models can invoke autonomously (e.g., "start_mock", "record_traffic"). The AI decides when to call these.
- Prompts: Parameterized prompt templates that users explicitly select, often surfaced as slash commands (e.g., "generate test from capture"). User-controlled, not auto-invoked.
- Resources: Read‑only documents or data that can be fetched by URI (e.g., local files, logs, recordings) to ground the model with context.
- Sampling: Allows servers to request LLM completions from the host application, enabling agentic behaviors while maintaining user control.

Together these make agent integrations predictable across different AI applications ([Cursor](https://cursor.com), [Claude Desktop](https://claude.ai/download), [VS Code](https://code.visualstudio.com)/[Copilot Chat](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp)) without custom adapters.

## Agentic vs IDE Assistants

- Agentic tools (e.g., [Claude](https://claude.ai) with MCP): Plan multi‑step changes, call tools autonomously, and generate cohesive cross‑file updates. Best for scaffolding features, wiring integrations, or orchestrating proxymock actions end‑to‑end.
- Interactive IDE tools (e.g., [GitHub Copilot](https://github.com/features/copilot), [Cursor](https://cursor.com)): Offer fast, in‑editor completions and small, targeted edits with strong local context. Best for iterative refactors, filling functions, and polishing code.
- Practical workflow: Use agentic generation to draft broader changes or runnable flows, then rely on IDE assistants for tight iteration, review, and final touches.

proxymock provides support for both types of workflows. For fully agentic workflows you should consider using a full sandbox environment with dedicated resources. This will allow your AI agents to run autonomously without your laptop. 

## Slash Commands vs Natural Language

When interacting with AI assistants via MCP, you can use both **slash commands** and **natural language** to work with proxymock.

- **Slash Commands**: These are structured commands that usually start with a `/` (for example, `/record_my_app` or `/find_breaking_api_changes`). In MCP terminology, slash commands typically invoke **prompts**—predefined templates that you explicitly select. They provide a consistent, repeatable way to trigger specific workflows. Many AI applications (like Cursor or Claude Desktop) surface MCP prompts as slash commands in their UI.

  - *Example*:
    ```
    /find_breaking_api_changes
    ```
    This invokes a guided workflow that helps you compare recorded and replayed traffic to identify API regressions.

- **Natural Language**: You can describe what you want in plain language (for example, "run a mock server" or "please record all API calls"). The AI interprets your intent and may automatically invoke MCP **tools**—capabilities that the model can call autonomously—or combine multiple actions to fulfill your request. This is flexible and works well for exploratory or multi-step tasks.

  - *Example*:
    ```
    Please start recording all API calls and generate a test for the latest traffic using proxymock
    ```

**When to use which?**

- Use **slash commands** when you want a specific, predefined workflow or template applied consistently.
- Use **natural language** for exploratory work, multi-step tasks, or when you want the AI to determine the best approach.

Most modern AI applications support both approaches, and MCP enables seamless integration of both interaction styles. Try both to see which fits your workflow best!

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <MCPProtocolCard />
  <AICodeGenerationCard />
  <LearningResourcesCard />
  <CommunitySupportCard />
</div>

## Re-installing the MCP Server

The `proxymock init` command should automatically check for the presence of common MCP clients and ask to install. That is all that is usually necessary.

:::info

If the `proxymock init` command fails or you are using an unknown IDE, you can manually configure the ProxyMock MCP server by modifying your client's `mcp.json`. This should not be necessary for most users.

```json
{
    "mcpServers": {
        "proxymock": {
            "command": "/Users/me/.speedscale/proxymock",
            "args": [
                "mcp"
            ],
            "type": "stdio"
        }
    }
}
```

Additionally, you can re-detect and install by running `proxymock mcp install`.
:::
