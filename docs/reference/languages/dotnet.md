---
title: .NET
description: ".NET guidance for Speedscale and Proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 2
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# .NET

.NET is fully supported by Speedscale. Use this page for .NET-specific proxy settings, TLS trust configuration, demo guidance, and the Proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared Proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Demo App

- Public demo: [speedscale/demo/csharp](https://github.com/speedscale/demo/tree/main/csharp)
- Stack: .NET 8 minimal API
- Local run: `dotnet run`
- Quick validation: `curl http://localhost:5128/health`

This is the current public .NET demo used for local Proxymock examples.

## Proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest .NET first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize Proxymock',
      command: `brew install speedscale/tap/proxymock
proxymock init`,
      note: 'Use browser sign-in by default. Use `proxymock init --api-key <your key>` only for CI or other headless environments.',
    },
    {
      title: 'Start recording',
      command: `git clone https://github.com/speedscale/demo
cd demo/csharp
proxymock record --app-port 5128`,
      note: 'The app listens on port 5128 while proxymock records inbound traffic on 4143.',
    },
    {
      title: 'Route .NET traffic through the proxy and run the app',
      command: `cd demo/csharp
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
dotnet run`,
      note: 'The HTTP_PROXY and HTTPS_PROXY variables are enough for the sample app and most .NET clients.',
    },
    {
      title: 'Generate one real workflow',
      command: `curl http://localhost:4143/health
curl http://localhost:4143/weatherforecast`,
      note: 'Make one real pass through the demo so the recorded traffic contains a representative workflow.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd demo/csharp
proxymock mock --in-dir ./proxymock/recorded
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
dotnet run`,
      note: 'The mocked run should no longer need live downstream access.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd demo/csharp
proxymock replay --in-dir ./proxymock/recorded --test-against http://localhost:5128`,
      note: 'Use replay as the regression check before shipping .NET changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

On macOS and Linux, modern .NET usually respects `SSL_CERT_FILE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and any platform-specific caveats.
