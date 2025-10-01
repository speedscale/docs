---
sidebar_position: 1
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import MacCLIInstall from './index/\_cli_macos_minified.mdx'
import LinuxCLIInstall from './index/\_cli_linux_minified.mdx'
import { 
  QuickstartCard, 
  FAQCard, 
  HelpCard, 
  ReferenceCard, 
  EnterpriseCard 
} from '@site/src/components/Cards';

# Overview

This guide provides a step by step guide to creating an sandbox for testing your code. This involves automatic generation of tests and a [mock server](/reference/glossary.md#mock-server) for a simple Go application using only the **proxymock** CLI.

## [Getting started in 30 seconds](./getting-started/quickstart) {#getting-started}

<Tabs>
  <TabItem value="mac" label="macOS">
    <MacCLIInstall />
  </TabItem>
  <TabItem value="linux" label="Linux">
    <LinuxCLIInstall />
  </TabItem>
  <TabItem value="binary" label="Other (Detailed)">
    For other operating systems and more detailed instructions, see the [installation](./getting-started/installation.md) instructions.
  </TabItem>
</Tabs>

Need another OS like Windows or are you having issues? See advanced [installation](./getting-started/installation.md).

## What proxymock does for you

- **Observability into API and database payloads**: Get an instant list of all calls going into and out of your app. proxymock records full-fidelity payloads without OpenTelemetry or other code changes.

- **Writes tests and mocks**: Instantly create tests and mocks by recording inbound requests and outbound requests while your app runs.

- **Pair tester for your AI**: Let your AI run its own realistic tests and isolation experiments so it can check its work and do more before interrupting you.

- **Replicates production environments**: Instanly replicate a remote Kubernetes/ECS/VM environment to get real user requests, databases and other dependencies on your desktop.

## Why you'll love it

- **Human and AI readable markdown format** - Get full visibility into your app's inbound and outbound requests in a format that works for LLMs and humans. Once you have a full fidelity recording of how your app behaves you can start to understand how it works.

- **Works with APIs, databases and even gRPC** - Record and playback a wide variety of protocols include HTTP, Postgres, gRPC, AWS services, GCP services and [more](../reference/technology-support.md). Instead of standing up a test environment for Postgres, just record off the network and create a Postgres simulation with exact data.

- **Terminal UI** - proxymock :heart: s both vim and GUI users. Navigate your traffic using a built in tui or view requests directly with an IDE.

- **MCP inegration** - proxymock makes its tools available via MCP. Check out our YouTube [channel](https://www.youtube.com/@speedscale) for prompt ideas that let your LLM use proxymock to analyze bugs.

If you want to deploy any of these [mocks](/reference/glossary.md#mock) or [tests](/reference/glossary.md#test) in the cloud or CI/CD, you can sign up for a **free** account [here](https://app.speedscale.com/signup).

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
  <QuickstartCard />
  <FAQCard />
  <HelpCard />
  <ReferenceCard />
  <EnterpriseCard />
</div>
