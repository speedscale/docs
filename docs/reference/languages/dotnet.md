---
title: .NET
description: ".NET guidance for Speedscale and proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 2
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# .NET

.NET is fully supported by Speedscale. Use this page for .NET-specific proxy settings, TLS trust configuration, demo guidance, and the proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Kubernetes Sidecar

When .NET runs with the Speedscale sidecar in `forward` or `dual` mode, configure outbound traffic to use
the sidecar's forward proxy on `127.0.0.1:4140` unless you changed `proxy-out-port`.

Typical settings:

```bash
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
```

If `tls-out` is enabled, trust the Speedscale CA separately, commonly with `SSL_CERT_FILE` on Linux-based
.NET containers.

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and
[TLS Support](/getting-started/installation/sidecar/tls.md) for the shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`dotnet` directory)
- Stack: .NET minimal API that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `dotnet run`
- Quick validation: `./lab/tests/run_tests.sh --recording`

This is the current public .NET demo used for local proxymock examples.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest .NET first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize proxymock',
      command: `brew install speedscale/tap/proxymock
proxymock init`,
      note: 'Use browser sign-in by default. Use `proxymock init --api-key <your key>` only for CI or other headless environments.',
    },
    {
      title: 'Start recording',
      command: `git clone https://github.com/speedscale/mock-lab
cd mock-lab/dotnet
proxymock record -- dotnet run`,
      note: 'proxymock records the app while it starts the .NET service as a child process and injects the proxy and TLS settings automatically — HttpClient picks them up with no manual HTTP_PROXY/HTTPS_PROXY exports.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/dotnet
proxymock mock -- dotnet run`,
      note: 'The mocked run should no longer need live downstream access.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/dotnet
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping .NET changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

On macOS and Linux, modern .NET usually respects `SSL_CERT_FILE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and any platform-specific caveats.
