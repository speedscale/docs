---
description: "Explore the Model Context Protocol (MCP) for proxymock to enable seamless integration with AI tools and enhance your API testing and mocking capabilities."
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
[Claude Desktop](https://claude.ai/download), [VS Code](https://code.visualstudio.com), [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp) or [Amazon Kiro](https://kiro.dev) interact.
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

For the full list of tools, prompts, and resources the proxymock MCP server exposes — with parameters and read-only markers — see the [MCP Tools & Prompts Reference](./mcp-tools.md).

For the agent skills Speedscale publishes and what each one is for, see [Agent skills](../agent-skills.md).

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

## Install or remove an agent integration

Agent setup is optional and separate from `proxymock init`. It needs no Speedscale account. Select the client and preview the paths before applying changes:

```bash
proxymock mcp install --client claude-code --skills --dry-run
proxymock mcp install --client claude-code --skills
```

Replace `claude-code` with `cursor`, `claude-desktop`, `vscode`, `gemini`, `opencode`, `kilo-code`, `hermes-agent`, `codex` or `kiro`. The selected client must be detected. Interactive confirmation defaults to decline and shows the scope, transport, MCP config path and skills path.

Omit `--skills` for MCP only. Use `--skills-only` for bundled skills without MCP. Skills are supported for Claude Code, Codex, Kiro, Kilo Code and Hermes Agent. Other selected clients receive MCP registration only.

### Scope and unattended setup

The default `--scope auto` prefers the current project for Cursor, Claude Code, VSCode, Gemini, OpenCode, Codex and Kiro. Other clients use user scope, shown before confirmation. Choose `--scope project` to reject global-only destinations, or `--scope user` when you deliberately want a global integration. Run project setup from the application repository.

For unattended setup, `--yes` only skips confirmation. It never selects clients:

```bash
proxymock mcp install --client codex --skills --yes
proxymock mcp install --all-clients --yes
```

The second command explicitly selects every detected client and omits skills. `proxymock mcp install --yes` without client selection now exits without writes. Migrate scripts to a named client or an explicit `--all-clients` choice. The older `mcp --install` flag is deprecated; use the scoped subcommand.

Codex project setup writes `.codex/config.toml` and optional `.agents/skills`. The host still decides whether to trust project configuration. Installation never approves hooks or changes host trust settings.

### Preserve edits and remove an integration

Managed installation leaves unowned or edited skills unchanged and refuses to overwrite an unowned or edited proxymock MCP entry. Keep the ownership record next to the client config (the config filename plus `.proxymock-install.json`). Older installations without a record remain unchanged; use `proxymock mcp json` for a manual config block instead of deleting unfamiliar entries.

To remove owned artifacts, use the same client and scope as the install:

```bash
proxymock mcp uninstall --client claude-code --skills --dry-run
proxymock mcp uninstall --client claude-code --skills
```

Omit `--skills` to remove only the MCP registration. Edited files and unrelated client settings remain. Initializing or upgrading the CLI does not silently restore removed integrations.

### Network transport and manual setup

Local stdio is the default. For a remote dev box or container, use matching HTTP settings on the server and installer:

```bash
proxymock mcp run --http --port 7799
proxymock mcp install --client claude-code --http --port 7799
```

The installer writes `http://localhost:7799/mcp`. If the host runs elsewhere, use `proxymock mcp json --http --port 7799` and configure a reachable address in the client. The older `--sse` transport is deprecated.

Restart the selected agent after setup. For clients the installer does not recognize, `proxymock mcp json` prints a config block without changing files.
