---
title: Go
description: "Go guidance for Speedscale and Proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 4
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Go

Go is fully supported by Speedscale. Use this page for Go-specific proxy settings, TLS trust configuration, demo guidance, and the Proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared Proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

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

- Public demo: [speedscale/outerspace-go](https://github.com/speedscale/outerspace-go)
- Stack: Go service with HTTP and gRPC endpoints
- Local run: `go run main.go`
- Quick validation: `./tests/run_http_tests.sh --recording`

This is the canonical public Go demo for the Proxymock quickstart and local replay workflow.

## Proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Go first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize Proxymock',
      command: `brew install speedscale/tap/proxymock
proxymock init`,
      note: 'Use browser sign-in by default. Use `proxymock init --api-key <your key>` only for CI or other headless environments.',
    },
    {
      title: 'Start recording',
      command: `git clone https://github.com/speedscale/outerspace-go
cd outerspace-go
proxymock record -- go run main.go`,
      note: 'Proxymock records the app while it starts the Go service as a child process.',
    },
    {
      title: 'Generate one real workflow',
      command: `cd outerspace-go
./tests/run_http_tests.sh --recording`,
      note: 'The HTTP test script drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd outerspace-go
proxymock mock -- go run main.go`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd outerspace-go
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Go changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

Go usually respects `SSL_CERT_FILE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and any OpenSSL-specific notes.
