---
title: Kotlin
description: "Kotlin guidance for Speedscale and proxymock, including JVM agent capture, proxy setup, TLS trust, and a first-success workflow."
sidebar_position: 10
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Kotlin

Kotlin/JVM is supported by Speedscale anywhere the underlying JDK, network client, and TLS provider are supported. Kotlin compiles to JVM bytecode, so it uses the Java agent, proxy, and truststore paths rather than a separate Kotlin capture mechanism.

- Support matrix: [Technology Support](/reference/technology-support)
- Java agent compatibility: [Java Agent Setup](/reference/java/agent#compatibility)
- Java truststore reference: [Java TLS Trust](/reference/java/tls)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## eBPF / Java Agent {#ebpf-java-agent}

The eBPF collector captures plaintext TCP traffic from Kotlin services without language-specific setup. For TLS, the Operator-managed Java agent observes supported socket and JSSE paths inside the JVM and sends the plaintext to `nettap`.

Enable the Java agent on the Kotlin workload:

```bash
kubectl annotate deployment my-kotlin-app -n my-namespace \
  capture.speedscale.com/enabled="true" \
  capture.speedscale.com/java-agent="true" --overwrite
```

The agent changes the pod template, so the workload must restart. Kotlin coroutines do not create a separate capture mechanism; compatibility depends on the actual client and transport beneath them. Follow [Java agent setup and framework support](/reference/java/agent) for supported JDKs, clients, TLS providers, and known gaps.

## Kubernetes Sidecar

Kotlin/JVM uses the same sidecar configuration as Java. Standard JVM HTTP clients do not use `HTTP_PROXY` or `HTTPS_PROXY`. Configure `http.proxyHost`, `http.proxyPort`, `https.proxyHost`, and `https.proxyPort`, or use the JVM SOCKS properties for a compatible client.

If `tls-out` is enabled, also configure the Speedscale JKS truststore. See [Java proxy settings](/proxymock/guides/java) and [Java TLS trust](/reference/java/tls) for the shared JVM behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`languages/kotlin` directory)
- Requirements: Kotlin compiler and JDK 17 or newer
- Stack: single-file Kotlin/JVM HTTP service using `java.net.http.HttpClient` to call the CNCF projects API at `https://demo-api.trafficreplay.com`
- Build and run: `kotlinc App.kt -include-runtime -d app.jar && java -jar app.jar`
- Quick validation: `./lab/tests/run_tests.sh --recording`

The demo uses the JVM SOCKS proxy and JKS truststore because its standard Java HTTP client ignores `HTTP_PROXY` and `HTTPS_PROXY`.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Kotlin first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize proxymock',
      command: `brew install speedscale/tap/proxymock
proxymock init
proxymock admin certs --jks`,
      note: 'Set `JAVA_HOME` before generating the JKS truststore. Use browser sign-in by default; API keys are intended for CI and other headless environments.',
    },
    {
      title: 'Build the demo and start recording',
      command: `git clone https://github.com/speedscale/mock-lab
cd mock-lab/languages/kotlin
kotlinc App.kt -include-runtime -d app.jar
export JAVA_TOOL_OPTIONS="\${JAVA_TOOL_OPTIONS:-} -DsocksProxyHost=localhost -DsocksProxyPort=4140 -DsocksProxyVersion=5 -Djavax.net.ssl.trustStore=$HOME/.speedscale/certs/cacerts.jks -Djavax.net.ssl.trustStorePassword=changeit"
proxymock record -- java -jar app.jar`,
      note: 'The SOCKS properties route `java.net.http.HttpClient` through proxymock, and the truststore properties let it verify the proxymock CA.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/languages/kotlin
export JAVA_TOOL_OPTIONS="\${JAVA_TOOL_OPTIONS:-} -DsocksProxyHost=localhost -DsocksProxyPort=4140 -DsocksProxyVersion=5 -Djavax.net.ssl.trustStore=$HOME/.speedscale/certs/cacerts.jks -Djavax.net.ssl.trustStorePassword=changeit"
proxymock mock -- java -jar app.jar`,
      note: 'Reuse the compiled jar. The mocked run should no longer need the live downstream dependency.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/languages/kotlin
proxymock replay --test-against http://localhost:8080`,
      note: 'Proxy and truststore properties are not needed for replay against the local application port.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

Kotlin/JVM uses a Java truststore. Generate the proxymock JKS with `proxymock admin certs --jks`, then set `javax.net.ssl.trustStore` and `javax.net.ssl.trustStorePassword` in `JAVA_TOOL_OPTIONS` as shown above. IDE users can place the same `-D` properties in the application's VM options. See [Java TLS trust](/reference/java/tls) for CI, Kubernetes, corporate CA, and troubleshooting details.
