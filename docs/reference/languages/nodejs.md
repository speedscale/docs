---
title: Node.js
description: "Node.js guidance for Speedscale and proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 3
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Node.js

Node.js is fully supported by Speedscale, but proxy behavior depends on the HTTP client library. Use this page for Node-specific proxy settings, TLS trust configuration, demo guidance, and the proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Kubernetes Sidecar

When Node.js runs with the Speedscale sidecar in `forward` or `dual` mode, sidecar injection alone is not
enough for outbound capture. The Node runtime or client library must still use the sidecar's forward proxy on
`127.0.0.1:4140`.

For many apps this starts with:

```bash
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
```

Some Node.js HTTP clients ignore those variables unless you also configure an agent or library-specific proxy
setting. If `tls-out` is enabled, also trust the Speedscale CA with `NODE_EXTRA_CA_CERTS`.

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and
[TLS Support](/getting-started/installation/sidecar/tls.md) for the shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`node` directory)
- Stack: zero-dependency Node HTTP service (built-in `http` plus the global `fetch`) that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `node index.js` (no `npm install` and no `npm start`)
- Quick validation: `./lab/tests/run_tests.sh --recording`

This is the canonical public Node.js demo for the proxymock quickstart and local replay workflow.

### Proxy configuration for the fetch-based demo

The mock-lab Node demo makes its downstream call with the global `fetch`. Node's `fetch` ignored proxy
environment variables until Node 24, so the generic `HTTP_PROXY`/`HTTPS_PROXY` approach does not route
`fetch` traffic on older runtimes.

This demo requires **Node 24** (or 22.21+). Before `proxymock record` or `proxymock mock`, set:

```bash
export NODE_USE_ENV_PROXY=1
export NODE_EXTRA_CA_CERTS="$HOME/.speedscale/certs/tls.crt"
```

`NODE_USE_ENV_PROXY=1` tells `fetch` to honor the proxy environment variables, and `NODE_EXTRA_CA_CERTS`
trusts the proxymock CA for the intercepted TLS connection. These are not needed for `proxymock replay`.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Node.js first success on a developer workstation."
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
cd mock-lab/node
export NODE_USE_ENV_PROXY=1
export NODE_EXTRA_CA_CERTS="$HOME/.speedscale/certs/tls.crt"
proxymock record -- node index.js`,
      note: 'Requires Node 24 (or 22.21+). proxymock records the app while it starts the Node service as a child process. The two environment variables make `fetch` use the proxy and trust the proxymock CA.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/node
export NODE_USE_ENV_PROXY=1
export NODE_EXTRA_CA_CERTS="$HOME/.speedscale/certs/tls.crt"
proxymock mock -- node index.js`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/node
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Node.js changes. The proxy environment variables are not needed for replay.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

The mock-lab Node demo uses the global `fetch`, which honors `NODE_EXTRA_CA_CERTS` for the intercepted TLS
connection. Set it to the proxymock CA together with `NODE_USE_ENV_PROXY=1`:

```bash
export NODE_USE_ENV_PROXY=1
export NODE_EXTRA_CA_CERTS="$HOME/.speedscale/certs/tls.crt"
```

This requires Node 24 (or 22.21+), because `fetch` did not honor the proxy environment variables on earlier
runtimes. For the exact command and client-specific caveats, use the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page.
