---
title: C++
description: "C++ guidance for Speedscale and proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 7
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# C++

C++ is fully supported by Speedscale. Use this page for C++-specific proxy settings, TLS trust configuration, demo guidance, and the proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Kubernetes Sidecar

When a C++ application runs with the Speedscale sidecar in `forward` or `dual` mode, the application must
still send outbound traffic to the sidecar. With libcurl, set `HTTP_PROXY` and `HTTPS_PROXY` to
`http://127.0.0.1:4140` unless you changed `proxy-out-port`; libcurl honors these `*_proxy` environment
variables.

If `tls-out` is enabled, trust and routing are separate concerns:

- routing: `HTTP_PROXY` and `HTTPS_PROXY`
- TLS trust: libcurl uses a compiled-in CA bundle and does not read `SSL_CERT_FILE`, so the CA must be
  supplied through libcurl directly (see [TLS Trust](#tls-trust))

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and
[TLS Support](/getting-started/installation/sidecar/tls.md) for the shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`cpp` directory)
- Stack: C++ HTTP service using POSIX sockets and libcurl that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Build and run: `c++ -std=c++17 main.cpp -o app -lcurl && ./app` (requires `libcurl4-openssl-dev`)
- Quick validation: `./lab/tests/run_tests.sh --recording`

This is the canonical public C++ demo for the proxymock quickstart and local replay workflow.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest C++ first success on a developer workstation."
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
cd mock-lab/cpp
c++ -std=c++17 main.cpp -o app -lcurl
proxymock record -- ./app`,
      note: 'Build first (install `libcurl4-openssl-dev` so the build can link libcurl), then let proxymock supervise the compiled `./app` binary as it records the downstream calls.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/cpp
proxymock mock -- ./app`,
      note: 'Reuse the `./app` binary you already built. The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/cpp
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping C++ changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

libcurl does not read `SSL_CERT_FILE`; it trusts a compiled-in CA bundle. To trust the proxymock CA for the
downstream HTTPS call, the demo passes the certificate to libcurl directly:

```c
curl_easy_setopt(curl, CURLOPT_CAINFO, getenv("SSL_CERT_FILE"));
```

This is already done in `mock-lab/cpp/main.cpp`. Without it, the downstream HTTPS call fails certificate
verification on Linux. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact `SSL_CERT_FILE` path.
