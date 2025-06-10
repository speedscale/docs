---
sidebar_position: 6
---

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
[Claude Desktop](https://claude.ai/download), [VSCode](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) or [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp) interact.
Once installed, you will be able to interact with proxymock using your normal chat interface. 
This is made possible by the [Model Context Protocol](https://modelcontextprotocol.io).

Installation instructions for proxymock are [here](https://docs.speedscale.com/proxymock/getting-started/installation/) (it's really easy)

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

Additionally, you can re-detect and install by running `proxymock mcp --install`.
```
:::
