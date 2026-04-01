---
title: Node.js
description: "Node.js guidance for Speedscale and Proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 3
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Node.js

Node.js is fully supported by Speedscale, but proxy behavior depends on the HTTP client library. Use this page for Node-specific proxy settings, TLS trust configuration, demo guidance, and the Proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared Proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Demo App

- Public demo: [speedscale/demo](https://github.com/speedscale/demo) (`node` directory)
- Stack: Express
- Local run: `npm install && npm start`
- Quick validation: `curl http://localhost:3000/`

This is the current public Node.js demo used for local Proxymock examples.

## Proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Node.js first success on a developer workstation."
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
cd demo/node
proxymock record --app-port 3000 --out ./proxymock/recorded`,
      note: 'The app listens on port 3000 while proxymock records inbound traffic on 4143 and saves the capture in `./proxymock/recorded`.',
    },
    {
      title: 'Route traffic through the proxy and run the app',
      command: `cd demo/node
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
npm install
npm start`,
      note: 'Many Node HTTP clients need explicit proxy support, so set the environment variables and client agent together when needed.',
    },
    {
      title: 'Generate one real workflow',
      command: `curl http://localhost:4143/
curl http://localhost:4143/nasa
curl http://localhost:4143/events
curl http://localhost:4143/bin`,
      note: 'Exercise the demo endpoints once so the recording reflects the real outbound calls.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd demo/node
proxymock mock --in ./proxymock/recorded
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
npm start`,
      note: 'The mocked run should no longer need live downstream access.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd demo/node
proxymock replay --in ./proxymock/recorded --test-against http://localhost:3000`,
      note: 'Use replay as the regression check before shipping Node.js changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

Node.js usually respects `NODE_EXTRA_CA_CERTS`. For the exact command and client-specific caveats, use the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page.
