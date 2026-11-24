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
  intro="Run the .NET demo from a macOS shell. For native Windows, see the Windows TLS trust steps below."
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
      note: 'proxymock starts the .NET service as a child process and sets its proxy and TLS environment variables. Configure certificate trust for the client as described below.',
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

On macOS and Linux, modern .NET usually respects `SSL_CERT_FILE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and any platform-specific caveats.

### Windows TLS trust {#windows-tls-trust}

For native Windows .NET clients using the default certificate validation, trust the proxymock CA in the Windows certificate store. Apply trust to the runtime that opens the HTTPS connection. If the test calls your app and your app calls the dependency, configure trust for your app's account or Windows environment.

1. Locate the public CA, `tls.crt`, from the proxymock instance serving the mock. The default Windows path is `%USERPROFILE%\.speedscale\certs\tls.crt`. Run `proxymock admin certs` if you need to generate the CA. Share only the public certificate with your endpoint administrator and keep `tls.key` on the mock host.
2. Choose the trust store approved by your endpoint administrator. For machine-level trust, have them deploy the CA to **Local Computer > Trusted Root Certification Authorities**. For an approved manual install, run the following from elevated PowerShell with the actual path to the public certificate.

   ```powershell
   certutil.exe -addstore Root "C:\path\to\tls.crt"
   ```

   If per-user trust is approved, open `certmgr.msc` in an interactive session as the user running the HTTPS client. Import the CA into **Trusted Root Certification Authorities > Certificates** and review the Windows confirmation prompt. Per-user imports can require a UI and fail in headless sessions. For unattended jobs, have your administrator provision trust for the account or environment where the client runs.

3. To verify mocking, start proxymock with your recording and disable passthrough. The example assumes proxymock and the client are running on the same Windows host.

   ```powershell
   proxymock mock --in .\proxymock\recording --out .\proxymock\mock-results --no-passthrough
   ```

   For .NET `HttpClient` using its default proxy settings, set `HTTPS_PROXY` in the PowerShell session that launches the HTTPS client. Use the configured proxy address if you changed the default listener.

   ```powershell
   $env:HTTPS_PROXY = "http://127.0.0.1:4140"
   ```

   Run a request that exercises the mocked dependency with TLS validation enabled. Confirm the expected response and check the mock output for `match=HIT` and zero passthrough. An unmatched request returns HTTP 404. When the trust is no longer needed, have the certificate owner remove the CA from the trust store by its exact thumbprint.

See [Microsoft's Windows certificate store guide](https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/inspect-certificates-manage-certificate-stores) and [certutil reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil#-addstore).
