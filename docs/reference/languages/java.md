---
title: Java
description: "Java guidance for Speedscale and proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 1
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Java

Java is fully supported by Speedscale. Use this page for Java-specific proxy settings, TLS trust configuration, demo guidance, and the proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)
- Shared sidecar docs: [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and [TLS Support](/getting-started/installation/sidecar/tls.md)
- GKE Autopilot guidance: [GCP](/guides/integrations/gcp.md)

## Choose Your Java Capture Mode

Quick links:

- [eBPF / Java agent](#ebpf-java-agent)
- [Transparent sidecar](#transparent-sidecar)
- [Dual sidecar](#dual-sidecar)
- [TLS Trust](#tls-trust)
- [proxymock](#proxymock)

## eBPF / Java Agent {#ebpf-java-agent}

Use this when your cluster supports [eBPF traffic collection](/reference/ebpf-traffic-collection). For Java,
Speedscale uses a Java agent for JVM traffic capture.

Workload annotations:

```yaml
capture.speedscale.com/enabled: "true"
capture.speedscale.com/java-agent: "true"
```

:::warning
`capture.speedscale.com/java-agent: "true"` is mutually exclusive with
`sidecar.speedscale.com/inject: "true"`. Do not combine Java-agent capture and sidecar injection on the same
workload.
:::

## Transparent Sidecar {#transparent-sidecar}

Transparent proxy is the default sidecar mode and should be the primary sidecar path for Java when your
environment allows it.

For plain HTTP capture or non-decrypted TLS passthrough, sidecar injection is enough:

```yaml
sidecar.speedscale.com/inject: "true"
```

If you need outbound TLS decryption, add:

```yaml
sidecar.speedscale.com/inject: "true"
sidecar.speedscale.com/tls-out: "true"
sidecar.speedscale.com/tls-java-tool-options: "true"
```

Use `sidecar.speedscale.com/tls-java-tool-options-value` only if you need to override the default truststore
flags with a custom `JAVA_TOOL_OPTIONS` string, for example to preserve existing JVM settings:

```yaml
sidecar.speedscale.com/inject: "true"
sidecar.speedscale.com/tls-out: "true"
sidecar.speedscale.com/tls-java-tool-options-value: >-
  -Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
  -Djavax.net.ssl.trustStorePassword=changeit
  -Xmx512m
  -Dspring.profiles.active=prod
```

If both `sidecar.speedscale.com/tls-java-tool-options` and
`sidecar.speedscale.com/tls-java-tool-options-value` are set, the custom value takes precedence.

## Dual Sidecar {#dual-sidecar}

Use dual sidecar mode only when transparent proxy is unavailable. This is not the default Java sidecar path.

Common examples:

- GKE Autopilot
- platforms that block the networking changes required for transparent proxy
- workloads with other environment-specific restrictions called out in [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md)

In dual mode, Java must do two separate things:

- route outbound traffic through the sidecar forward proxy
- trust the Speedscale CA when `tls-out` is enabled

This is the annotation-driven example for Java in dual mode:

```yaml
sidecar.speedscale.com/inject: "true"
sidecar.speedscale.com/proxy-type: "dual"
sidecar.speedscale.com/proxy-protocol: "tcp:http"
sidecar.speedscale.com/proxy-port: "8080"
sidecar.speedscale.com/tls-out: "true"
sidecar.speedscale.com/tls-java-tool-options-value: >-
  -Dhttp.proxyHost=127.0.0.1
  -Dhttp.proxyPort=4140
  -Dhttps.proxyHost=127.0.0.1
  -Dhttps.proxyPort=4140
  -Dhttp.nonProxyHosts=localhost|127.0.0.1|*.svc|*.cluster.local
  -Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
  -Djavax.net.ssl.trustStorePassword=changeit
```

Why `tls-java-tool-options-value` is useful here:

- dual mode needs proxy flags that `tls-java-tool-options: "true"` does not add
- the annotation lets the operator write one merged `JAVA_TOOL_OPTIONS` value
- you avoid manually patching the container `env` block in the workload spec

If you cannot use the annotation-driven path, you can still set `JAVA_TOOL_OPTIONS` directly in the
container `env`, but that should be treated as a fallback.

## TLS Trust {#tls-trust}

Java typically needs an explicit truststore when TLS interception is involved. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact `proxymock certs --jks` command, JVM flags, and custom truststore workflow.

How that trust is configured depends on the capture mode:

- Transparent sidecar: use `sidecar.speedscale.com/tls-java-tool-options: "true"` for the default truststore
  flags, or `sidecar.speedscale.com/tls-java-tool-options-value` if you need a custom `JAVA_TOOL_OPTIONS`
  value.
- Dual sidecar: truststore configuration alone is not enough. You also need the Java proxy flags shown in
  [Dual Sidecar](#dual-sidecar).
- proxymock: use the local truststore flags shown in the shared
  [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page.

## proxymock {#proxymock}

Use this for local development and CI. Conceptually this is similar to dual proxy mode because Java sends
traffic through a forward proxy and trusts the proxymock CA, but it does not use Kubernetes annotations.

### Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`java` directory)
- Stack: single-file Java HTTP service that calls one downstream, the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `java App.java` (JDK 11+ source-file mode, no Maven or other build tool)
- Quick validation: `./lab/tests/run_tests.sh --recording`

This is the canonical public Java demo for the proxymock quickstart and local replay workflow.

When proxymock wraps the JVM with `proxymock record -- java App.java`, it auto-injects `JAVA_TOOL_OPTIONS` for you, so no manual proxy host/port or truststore export is needed.

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Java first success on a developer workstation."
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
cd mock-lab/java
proxymock record -- java App.java`,
      note: 'proxymock records the app while it starts the Java service as a child process. It auto-injects `JAVA_TOOL_OPTIONS` for the proxy and truststore, so no manual export is needed.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/java
proxymock mock -- java App.java`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/java
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Java changes.',
    },
  ]}
/>
