---
sidebar_position: 4
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ArchitectureOverview from './outerspace-go.png'
import MacCLIInstall from '../../index/_cli_macos_minified.mdx'
import LinuxCLIInstall from '../../index/_cli_linux_minified.mdx'
import { EditingTestsCard, CICDIntegrationCard, RemoteRecordersCard } from '@site/src/components/Cards';

# Quickstart (MCP)

This guide provides a step-by-step approach to creating a [mock server](/reference/glossary.md#mock-server) and tests for a simple Go application using proxymock's MCP (Model Context Protocol) integration with AI coding assistants like Cursor, Claude, or GitHub Copilot.

## Before you begin

Make sure you have:

- An AI coding assistant with MCP support (Cursor, Claude Code, GitHub Copilot, Cline, etc)
- A terminal or command prompt open
- [go version 1.23.1](https://go.dev/doc/install) or newer installed

<img src={ArchitectureOverview} alt="Architecture Overview" width="500" style={{ display: 'block', margin: '0 auto' }} />

For this example we'll be using a simple demo app that accepts an API request, calls two downstream APIs and returns the results.

## How MCP Works with proxymock

Instead of typing commands manually, you'll describe what you want to do in natural language. Your AI assistant will understand your intent and execute the appropriate proxymock commands through the MCP integration.
 
For example, instead of typing:

| CLI Command      | AI Assistant Request                                |
|------------------|-----------------------------------------------------|
| proxymock record | "Please create a traffic recording using proxymock" |

## Step 1: Install proxymock {#install-proxymock}

<Tabs>
  <TabItem value="mac" label="macOS">
    <MacCLIInstall />
  </TabItem>
  <TabItem value="linux" label="Linux">
    <LinuxCLIInstall />
  </TabItem>
  <TabItem value="binary" label="Other (Detailed)">
    For other operating systems and more detailed instructions, see the [installation](../installation.md) instructions.
  </TabItem>
</Tabs>

Need another OS like Windows or are you having issues? See advanced [installation](../installation.md).

Open a terminal window and run the following command to obtain an API key:

```shell
proxymock init
```

Don't worry, we don't sell marketing data or give your email address to any bot nets.

:::important
This tutorial assumes you allow the MCP server configuration to be installed in Cursor, Claude Code, etc. If you do not answer Yes to these questions you need to add the MCP configuration manually.
:::

## Step 2: Install the demo app {#install-demo-app}

<Tabs>
  <TabItem value="cursor" label="Cursor">
    Open a chat session and instruct your AI assistant:

    ```
    First, clone the git repository https://github.com/speedscale/outerspace-go. Next, open a new cursor window with only the outerspace-go directory in the workspace.
    ```

    A new IDE window should open in the outerspace-go directory.
  </TabItem>
  <TabItem value="claude" label="Claude Code">
    Open Claude Code from the command line and instruct your AI assistant:

    ```
    First, clone the git repository https://github.com/speedscale/outerspace-go. Next, change your working directory to outerspace-go.
    ```

    Claude will change its working directory to outerspace-go.
  </TabItem>
  <TabItem value="copilot" label="Visual Studio Copilot">
    Visual Studio Copilot Agent-mode does not currently support direct git repository cloning. For the moment, it may be easier to run the CLI-based [workflow](./quickstart-cli.md).

  </TabItem>
  <TabItem value="other" label="Other">
    If your LLM/IDE of choice supports Agent mode and can run commands like git directly then you can likely use the following prompt. Otherwise, check out the CLI-based [demo](./quickstart-cli.md).

    ```
    First, clone the git repository https://github.com/speedscale/outerspace-go. Next, change your working directory to outerspace-go.
    ```

    This should cause your chatbot to switch directories 
  </TabItem>
</Tabs>

:::caution
Make sure your AI chatbot is in **Agent mode**. Running these commands in Ask (or similar) mode will not leave you with a smile on your face.
:::

## Step 3: Record traffic {#recording}

Type this into your AI assistant's chat interface:
```shell
record traffic using proxymock
```

The LLM should take a series of steps:
1. Start the proxymock recording
1. Discover and run tests against the endpoint
1. Investigate the proxymock logs
1. Produce a new directory of recordings in a new directory `outerspace-go/proxymock/recorded-...`

**Ask your AI assistant:**
> "Show me the recorded traffic files"

Your AI assistant will point at the new directory of RRPairs and produce a summary. Your summary may look something like this (depending on which LLM you use):
```shell
📊 Traffic Summary:
Total files: 14 RRPair files
Inbound requests: 10 (to your application)
Outbound requests: 4 (to external APIs)
External APIs called: SpaceX API (3 calls), Numbers API (1 call)
Response times: 1ms to 690ms
These files can now be used for:
Mocking: Create a mock server with these responses
Replay testing: Test your application against recorded traffic
API change detection: Compare with future recordings
The traffic capture successfully recorded both the requests made to your application and the external API calls your application made to SpaceX and Numbers APIs!ls proxymock
...
recorded-2025-07-30_15-31-43.701537Z
```

**To inspect a specific request, ask:**
> "Show me the contents of the first recorded request"

Your AI assistant will display the request and response details like this:
```shell
📄 First Recorded Request
Here's the complete contents of the first recorded request:
File: proxymock/recorded-2025-01-27_12-05-00/localhost/2025-08-04_17-29-15.74063Z.md

### REQUEST (TEST) ###
GET http://localhost:8080/ HTTP/1.1
Accept: */*
Accept-Encoding: gzip
Host: localhost
Proxy-Connection: Keep-Alive
User-Agent: curl/8.7.1

### RESPONSE
Content-Type: application/json
Date: Mon, 04 Aug 2025 17:29:15 GMT
```

## Step 4: Run mock server and tests {#run-mocks}

**Ask your AI assistant:**
> "Run a mock server using proxymock and start my application with the correct environment varaibles"

Your demo app will now start using the local mock server.

:::note
When running a mock server your app no longer requires access to backend systems. The app will talk locally to proxymock instead of outside APIs.
:::

**To run tests against your app, ask:**
> "Replay the recorded traffic against my app with the proxymock mock server running"

Your AI assistant will run the proxymock server, your app and a regression test. The incoming regression test will run the same requests that were observed in step 1. In other words, inbouned requests now become regression tests that can be used for comparison. Your AI assistant may produce findings like this:

```shell
✅ Key Findings:
No breaking changes detected - All response bodies match exactly
No functional differences - All API responses are identical
Only timestamp differences - Expected behavior for date headers
All endpoints working - Your application handled all requests correctly
```

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <EditingTestsCard />
  <CICDIntegrationCard />
  <RemoteRecordersCard />
</div>
