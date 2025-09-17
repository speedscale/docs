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

MCP is a lightweight, open protocol that standardizes how LLM clients (IDEs, chat apps) talk to capability providers (like proxymock). It defines a small set of API types so tools can interoperate:

- Tools: Callable functions with typed inputs/outputs exposed by a server (e.g., "start_mock", "record_traffic"). Great for invoking actions.
- Prompts: Parameterized prompt templates the client can render and send to the model for consistent instructions (e.g., "generate test from capture").
- Resources: Read‑only documents or data the client can fetch by URI (e.g., local files, logs, recordings) to ground the model.
- Events/Status: Lightweight notifications so clients can stream progress, results, or errors to the user.

Together these make agent integrations predictable across different clients ([Cursor](https://cursor.com), [Claude Desktop](https://claude.ai/download), [VS Code](https://code.visualstudio.com)/[Copilot Chat](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp)) without custom adapters.

## Agentic vs IDE Assistants

- Agentic tools (e.g., [Claude](https://claude.ai) with MCP): Plan multi‑step changes, call tools autonomously, and generate cohesive cross‑file updates. Best for scaffolding features, wiring integrations, or orchestrating proxymock actions end‑to‑end.
- Interactive IDE tools (e.g., [GitHub Copilot](https://github.com/features/copilot), [Cursor](https://cursor.com)): Offer fast, in‑editor completions and small, targeted edits with strong local context. Best for iterative refactors, filling functions, and polishing code.
- Practical workflow: Use agentic generation to draft broader changes or runnable flows, then rely on IDE assistants for tight iteration, review, and final touches.

proxymock provides support for both types of workflows. For fully agentic workflows you should consider using a full sandbox environment with dedicated resources. This will allow your AI agents to run autonomously without your laptop. 

## Slash Commands vs Prompting

When interacting with agentic tools or IDE assistants via MCP, you can use both **slash commands** and **natural language prompts** to trigger actions in proxymock.

- **Slash Commands**: These are structured commands that usually start with a `/` (for example, `/start_mock` or `/record_traffic`). Slash commands are directly mapped to specific MCP tools or actions. They are precise, unambiguous, and ideal for quickly invoking a known capability. Many chat-based IDEs and agentic tools (like Cursor or Claude Desktop) support slash commands for tool discovery and execution.

  - *Example*:
    ```
    /replay_traffic
    ```
    This will immediately trigger a replay to start via MCP.

- **Prompting**: This involves using natural language to describe what you want the tool or agent to do (for example, "run a mock server" or "please record all API calls"). Prompts are flexible and can be more conversational, allowing the agent to interpret your intent and choose the appropriate tool or sequence of actions. This is especially useful for more complex or multi-step tasks.

  - *Example*:
    ```
    Please start recording all API calls and generate a test for the latest traffic using proxymock
    ```

**When to use which?**

- Use **slash commands** when you know the exact action you want and want to execute it quickly.
- Use **prompts** for more descriptive, multi-step, or open-ended requests, or when you want the agent to decide the best course of action.

Most modern agentic IDEs and chat tools support both approaches, and MCP is designed to handle either style seamlessly. Try both to see which fits your workflow best!

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
        "proxymock-simulator": {
            "command": "/Users/some_user/.speedscale/proxymock",
            "args": [
                "mcp"
            ]
        }
    }
}

Additionally, you can re-detect and install by running `proxymock mcp install`.
```
:::
