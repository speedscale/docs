---
title: Python
description: "Python guidance for Speedscale and proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 5
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Python

Python is fully supported by Speedscale. Use this page for Python-specific proxy settings, TLS trust configuration, demo guidance, and the proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Kubernetes Sidecar

When Python runs with the Speedscale sidecar in `forward` or `dual` mode, configure the runtime to use the
sidecar's forward proxy on `127.0.0.1:4140` unless you changed `proxy-out-port`.

Typical settings:

```bash
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
```

If `tls-out` is enabled, also trust the Speedscale CA separately, commonly with `REQUESTS_CA_BUNDLE` for
`requests`-based applications.

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and
[TLS Support](/getting-started/installation/sidecar/tls.md) for the shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`python` directory)
- Stack: standard-library Python (no Flask, no Makefile) that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `python3 app.py`
- Traffic generator: `./lab/tests/run_tests.sh --recording`

This is the current public Python demo used for local proxymock examples.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Python first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize proxymock',
      command: `brew install speedscale/tap/proxymock\nproxymock init`,
      note: 'Use browser sign-in by default. Use `proxymock init --api-key <your key>` only for CI or other headless environments.',
    },
    {
      title: 'Clone the demo and start recording',
      command: `git clone https://github.com/speedscale/mock-lab\ncd mock-lab/python\nproxymock record -- python3 app.py`,
      note: 'proxymock records the app while it starts the Python service as a child process. The app listens on port 8080 and calls the CNCF projects API downstream.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/python\nproxymock mock -- python3 app.py`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/python\nproxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Python changes.',
    },
  ]}
 />

## TLS Trust {#tls-trust}

The demo app uses the standard-library `urllib` client and needs no manual CA configuration locally — proxymock injects the trusted bundle for you. For Python applications that use `requests`, trust the Speedscale certificate bundle with `REQUESTS_CA_BUNDLE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and related options.
