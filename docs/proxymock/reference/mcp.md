---
sidebar_position: 6
---

# Model Context Protocol (MCP)

**proxymock** provides a set of commands for Agent-based LLM tools like [Cursor](https://cursor.com), 
[Claude Desktop](https://claude.ai/download), [VSCode](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) or [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp). 
Once installed, you will be able to interact with proxymock using your normal chat interface. 
This is made possible by the [Model Context Protocol](https://modelcontextprotocol.io).

## Installing ProxyMock MCP Server

The `proxymock init` command should automatically check for the presence of common MCP clients and ask to install. That is all that is necessary.

:::info

If the `proxymock init` command fails, you can manually configure the ProxyMock MCP server by modifying your client's `mcp.json`. This should not be necessary for most users.

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

Additionally, you can re-detect clients by running `proxymock mcp --install`.
```
:::

## Helpful Prompts

Your agent is now able to start a mock server on command. Here are some helpful example prompts that cause **proxymock** actions in most Agentic chat interfaces:

```
run a mock server
```

```
stop the mock server
```

```
start recording api calls
```

```
run a regression test
```

Try them out for yourself!