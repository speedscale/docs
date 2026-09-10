---
title: Go
description: "Go guidance for Speedscale and proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 4
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Go

Go is fully supported by Speedscale. Use this page for Go-specific proxy settings, TLS trust configuration, demo guidance, and the proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Kubernetes Sidecar

When Go runs with the Speedscale sidecar in `forward` or `dual` mode, the Go runtime must still send
outbound traffic to the sidecar. Set `HTTP_PROXY` and `HTTPS_PROXY` to `http://127.0.0.1:4140` unless you
changed `proxy-out-port`.

If `tls-out` is enabled, trust and routing are separate concerns:

- routing: `HTTP_PROXY` and `HTTPS_PROXY`
- TLS trust: `SSL_CERT_FILE` or the language-specific trust mechanism in your image

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and
[TLS Support](/getting-started/installation/sidecar/tls.md) for the shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`languages/go` directory)
- Stack: Go HTTP service that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `go run .`
- Quick validation: `./lab/tests/run_tests.sh --recording`

This is the canonical public Go demo for the proxymock quickstart and local replay workflow.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Go first success on a developer workstation."
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
cd mock-lab/languages/go
proxymock record -- go run .`,
      note: 'proxymock records the app while it starts the Go service as a child process.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/languages/go
proxymock mock -- go run .`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/languages/go
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Go changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

Go usually respects `SSL_CERT_FILE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and any OpenSSL-specific notes.
