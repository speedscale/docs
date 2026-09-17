---
title: Rust
description: "Rust guidance for Speedscale and proxymock, including rustls eBPF support, binary requirements, proxy setup, TLS trust, and a first-success workflow."
sidebar_position: 9
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Rust

Rust is supported by Speedscale for Kubernetes capture and local development. For TLS capture, identify whether the application uses rustls or OpenSSL because each backend has a different eBPF probe path.

- Support matrix: [Technology Support](/reference/technology-support)
- eBPF TLS matrix: [TLS Traffic Visibility](/reference/ebpf-traffic-collection#tls-traffic-visibility)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## eBPF Capture {#ebpf-capture}

The eBPF collector captures plaintext TCP traffic from Rust applications without language-specific setup. `nettap` v0.1.77 and newer also capture HTTPS plaintext from supported rustls and tokio-rustls applications. The verified matrix includes rustls 0.23, tokio-rustls 0.26, and Apollo Router 2.17.

Rust statically links rustls into the application. To attach the probes, `nettap` must find the rustls functions in the Linux ELF symbol table. Preserve those symbols in release builds:

```toml title="Cargo.toml"
[profile.release]
strip = "none"
lto = false
```

Do not run `strip` on the resulting binary. Aggressive link-time optimization can inline or remove probe targets even when the symbol table remains. Rust applications that use `native-tls` with OpenSSL 3.x use the collector's OpenSSL probe path instead.

After targeting the workload, verify that the collector found the expected TLS backend:

```shell
kubectl -n speedscale logs daemonset/nettap | grep -E "rustls|ssl"
```

For rustls, the logs report `attaching rustls uprobes/uretprobes for process`. If the binary is stripped or its required functions are absent, TLS payloads remain opaque while plaintext TCP traffic remains visible.

## Kubernetes Sidecar

When Rust runs with the Speedscale sidecar in `forward` or `dual` mode, configure the HTTP client to send outbound traffic to `http://127.0.0.1:4140` unless you changed `proxy-out-port`. Proxy environment variable support depends on the client. reqwest can use `HTTP_PROXY` and `HTTPS_PROXY`; other clients may require an explicit proxy builder.

TLS trust also depends on the client and backend. rustls does not provide one universal environment-variable trust mechanism, so add the certificate at `SSL_CERT_FILE` to the client's root certificate store. The mock-lab demo includes this setup.

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and [TLS Support](/getting-started/installation/sidecar/tls.md) for shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`languages/rust` directory)
- Requirements: a current stable Rust toolchain
- Stack: Rust HTTP service that calls the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `cargo run`
- Quick validation: `./lab/tests/run_tests.sh --recording`

The demo configures its HTTP client to use proxymock's proxy environment variables and trust the certificate at `SSL_CERT_FILE`.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Rust first success on a developer workstation."
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
cd mock-lab/languages/rust
proxymock record -- cargo run`,
      note: 'proxymock supplies the proxy and certificate environment variables used by the demo client.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/languages/rust
proxymock mock -- cargo run`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/languages/rust
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Rust changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

With rustls, load the certificate at `SSL_CERT_FILE` into the client's root certificate store. With an OpenSSL-backed client, configure its CA file through the client or OpenSSL settings. Do not disable certificate verification. The mock-lab Rust demo provides the concrete client configuration for both proxy routing and trust.
