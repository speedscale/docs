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

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`languages/dotnet` directory)
- Stack: .NET minimal API that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `dotnet run`
- Quick validation: `./lab/tests/run_tests.sh --recording`

This is the current public .NET demo used for local proxymock examples.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Run the .NET demo from a macOS or Linux shell. For native Windows, see Windows TLS trust below."
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
cd mock-lab/languages/dotnet
proxymock record -- dotnet run`,
      note: 'proxymock starts the .NET service as a child process and sets its proxy and TLS environment variables. On macOS, proxymock adds its CA to the keychain by default. On Linux and native Windows, configure certificate trust as described below.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/languages/dotnet
proxymock mock -- dotnet run`,
      note: 'The mocked run should no longer need live downstream access.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/languages/dotnet
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping .NET changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

On Linux, modern .NET uses OpenSSL and respects `SSL_CERT_FILE`. On macOS, .NET validates certificates with the system keychain and ignores `SSL_CERT_FILE`. proxymock adds its CA to the keychain unless you pass `--no-cert-install`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and any platform-specific caveats.

### Windows TLS trust {#windows-tls-trust}

.NET on Windows validates certificates with the Windows certificate store and ignores `SSL_CERT_FILE`. Follow the [Windows certificate store](/proxymock/getting-started/language-reference#windows-tls-trust) steps to trust the proxymock CA and verify the mock, then route the client through proxymock.

For `HttpClient` on .NET Core 3.0 or later using its default proxy settings, set `HTTPS_PROXY` in the PowerShell session that launches the HTTPS client. Use the configured proxy address if you changed the default listener.

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:4140"
```

.NET Framework ignores proxy environment variables, so point it at proxymock through the Windows system proxy or a `defaultProxy` entry in its app.config.
