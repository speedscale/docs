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
- Shared sidecar docs: [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and [TLS Support](/getting-started/installation/sidecar/tls.md)
- GKE Autopilot guidance: [GCP](/guides/integrations/gcp.md)

## Kubernetes Sidecar {#kubernetes-sidecar}

Use this section when Java is running in Kubernetes with the Speedscale sidecar rather than local Proxymock.

For outbound HTTP(S) capture, configure the workload with `proxy-type: "forward"` or `proxy-type: "dual"`
and use `proxy-protocol: "http"` or `proxy-protocol: "tcp:http"`. The sidecar listens for outbound traffic
on `127.0.0.1:4140` by default.

If `tls-out` is enabled, Java must do two separate things:

- route outbound traffic through the sidecar with JVM proxy flags
- trust the Speedscale CA with the mounted JKS truststore

### Manual In-Cluster JVM Flags

If your container already defines `JAVA_TOOL_OPTIONS`, merge the Speedscale settings into that existing
value. Kubernetes environment variables replace existing values; they do not append automatically.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  template:
    metadata:
      annotations:
        sidecar.speedscale.com/inject: "true"
        sidecar.speedscale.com/proxy-type: "dual"
        sidecar.speedscale.com/proxy-protocol: "tcp:http"
        sidecar.speedscale.com/proxy-port: "8080"
        sidecar.speedscale.com/tls-out: "true"
    spec:
      containers:
      - name: app
        env:
        - name: JAVA_TOOL_OPTIONS
          value: >-
            -Dhttp.proxyHost=127.0.0.1
            -Dhttp.proxyPort=4140
            -Dhttps.proxyHost=127.0.0.1
            -Dhttps.proxyPort=4140
            -Dhttp.nonProxyHosts=localhost|127.0.0.1|*.svc|*.cluster.local
            -Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
            -Djavax.net.ssl.trustStorePassword=changeit
```

This is the most explicit option because it keeps the outbound proxy settings and truststore settings in one
place.

### Using `tls-java-tool-options`

If you enable the Java TLS helper annotation:

```yaml
sidecar.speedscale.com/tls-out: "true"
sidecar.speedscale.com/tls-java-tool-options: "true"
```

the operator handles the truststore flags, but you still must provide the proxy flags yourself, for example:

```yaml
env:
- name: JAVA_TOOL_OPTIONS
  value: >-
    -Dhttp.proxyHost=127.0.0.1
    -Dhttp.proxyPort=4140
    -Dhttps.proxyHost=127.0.0.1
    -Dhttps.proxyPort=4140
    -Dhttp.nonProxyHosts=localhost|127.0.0.1|*.svc|*.cluster.local
```

When available in your image, `SPEEDSCALE_JAVA_OPTS` exposes the truststore flags separately so they can be
merged with your existing startup command. Keep any existing application-specific JVM options when adding the
Speedscale flags.

## Demo App

- Public demo: [speedscale/demo](https://github.com/speedscale/demo) (`java` directory)
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
proxymock record --app-port 8080 --out ./proxymock/recorded`,
      note: 'The app listens on port 8080 while proxymock records inbound traffic on 4143 and saves the capture in `./proxymock/recorded`.',
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
proxymock mock --in ./proxymock/recorded
make local-capture`,
      note: 'The mocked run should no longer need live downstream access.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd demo/java
proxymock replay --in ./proxymock/recorded --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping Java changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

Java typically needs an explicit truststore when TLS interception is involved. See the shared [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) page for the exact `proxymock certs --jks` command, JVM flags, and custom truststore workflow.

For Kubernetes sidecar mode, truststore configuration alone is not enough. You also need the proxy flags
shown in [Kubernetes Sidecar](#kubernetes-sidecar).
