---
title: Python
description: "Python guidance for Speedscale and Proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 5
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Python

Python is fully supported by Speedscale. Use this page for Python-specific proxy settings, TLS trust configuration, demo guidance, and the Proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared Proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Demo App

- Public demo: [speedscale/demo/python](https://github.com/speedscale/demo/tree/main/python)
- Stack: Flask
- Local run: `make local`
- Traffic generator: `make capture`

This is the current public Python demo used for local Proxymock examples.

## Proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Python first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize Proxymock',
      command: `brew install speedscale/tap/proxymock\nproxymock init`,
      note: 'Use browser sign-in by default. Use `proxymock init --api-key <your key>` only for CI or other headless environments.',
    },
    {
      title: 'Clone the Python demo and install dependencies',
      command: `git clone https://github.com/speedscale/demo\ncd demo/python\nmake install`,
      note: 'The Python demo now includes a small Makefile so setup is repeatable.',
    },
    {
      title: 'Run the app',
      command: `cd demo/python\nmake local`,
      note: 'The app listens on port 5001 and exposes a health check plus the SpaceX proxy endpoint.',
    },
    {
      title: 'Capture a real workflow',
      command: `cd demo/python\nmake capture`,
      note: 'The capture flow records outbound SpaceX traffic through Proxymock.',
    },
    {
      title: 'Run with mocks',
      command: `cd demo/python\nmake mock`,
      note: 'Mock mode replays the captured response without reaching the live SpaceX API.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd demo/python\nmake replay`,
      note: 'Use replay as the regression check before shipping Python changes.',
    },
  ]}
 />

## TLS Trust {#tls-trust}

Python applications that use `requests` should trust the Speedscale certificate bundle with `REQUESTS_CA_BUNDLE`. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact command and related options.
