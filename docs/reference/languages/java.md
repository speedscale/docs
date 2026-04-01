---
title: Java
description: "Java guidance for Speedscale and Proxymock, including proxy setup, TLS trust, demo app details, and a first-success workflow."
sidebar_position: 1
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# Java

Java is fully supported by Speedscale. Use this page for Java-specific proxy settings, TLS trust configuration, demo guidance, and the Proxymock local workflow.

- Support matrix: [Technology Support](/reference/technology-support)
- Shared Proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## Demo App

- Public demo: [speedscale/demo/java](https://github.com/speedscale/demo/tree/main/java)
- Stack: Spring Boot
- Local run: `make local`
- Traffic generator: `make client` or `make client-capture`

This is the current public Java demo used for local Proxymock examples.

## Proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest Java first success on a developer workstation."
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
cd demo/java
proxymock record --app-port 8080`,
      note: 'The app listens on port 8080 while proxymock records inbound traffic on 4143.',
    },
    {
      title: 'Route Java traffic through the proxy and run the app',
      command: `cd demo/java
export JAVA_TOOL_OPTIONS="$JAVA_TOOL_OPTIONS \
-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=4140 \
-Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=4140 \
-Djavax.net.ssl.trustStore=\${HOME}/.speedscale/certs/cacerts.jks \
-Djavax.net.ssl.trustStorePassword=changeit"
make local`,
      note: 'This keeps the JVM on the proxy path and uses the proxymock truststore for TLS interception.',
    },
    {
      title: 'Generate one real workflow',
      command: `cd demo/java
make client-capture`,
      note: 'Exercise the SpaceX and Treasury requests once so the exported capture reflects the real demo flow.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd demo/java
proxymock mock --in-dir ./proxymock/recorded
make local-capture`,
      note: 'The mocked run should no longer need live downstream access.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd demo/java
proxymock replay --in-dir ./proxymock/recorded --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Java changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

Java typically needs an explicit truststore when TLS interception is involved. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact `proxymock certs --jks` command, JVM flags, and custom truststore workflow.
