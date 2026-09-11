---
title: Java
description: "Choose Java capture, TLS trust, and proxy settings for Kubernetes, desktop development, and CI."
sidebar_position: 1

---

# Java

Use the setup that matches where your Java application runs. Proxy routing and TLS trust are separate settings: routing sends requests through Speedscale, and trust lets Java accept certificates used by a proxy or mock responder.

| Your setup | Start here |
| --- | --- |
| Local development, IDE, or CI | [Java with proxymock](/proxymock/guides/java) |
| Kubernetes with eBPF capture | [Java agent setup and compatibility](/reference/java/agent) |
| Kubernetes with a proxy sidecar | [Transparent sidecar](#transparent-sidecar) or [dual sidecar](#dual-sidecar) |
| Certificate errors or custom corporate CAs | [Java TLS trust](/reference/java/tls) |

## eBPF / Java Agent {#ebpf-java-agent}

The Java agent captures supported traffic inside the JVM and sends it to the eBPF collector. It does not replace the application's TLS certificates. Enabling it requires new pods and a JVM restart.

```yaml
capture.speedscale.com/enabled: "true"
capture.speedscale.com/java-agent: "true"
```

Follow [Java agent setup and framework support](/reference/java/agent) for installation, tested JDKs and clients, and known capture gaps. Do not combine Java-agent capture with `sidecar.speedscale.com/inject: "true"` on the same workload.

## Transparent Sidecar {#transparent-sidecar}

Transparent proxy is the default sidecar mode and should be the primary sidecar path for Java when your environment allows it.

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

Use `sidecar.speedscale.com/tls-java-tool-options-value` only if you need to override the default truststore flags with a custom `JAVA_TOOL_OPTIONS` string, for example to preserve existing JVM settings:

```yaml
sidecar.speedscale.com/inject: "true"
sidecar.speedscale.com/tls-out: "true"
sidecar.speedscale.com/tls-java-tool-options-value: >-
  -Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
  -Djavax.net.ssl.trustStorePassword=changeit
  -Xmx512m
  -Dspring.profiles.active=prod
```

If both `sidecar.speedscale.com/tls-java-tool-options` and `sidecar.speedscale.com/tls-java-tool-options-value` are set, the custom value takes precedence.

## Dual Sidecar {#dual-sidecar}

Use dual sidecar mode only when transparent proxy is unavailable. This is not the default Java sidecar path.

Common examples:

- [GKE Autopilot](/getting-started/installation/install/gke-autopilot)
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
  -Dhttp.nonProxyHosts=localhost|127.0.0.1
  -Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
  -Djavax.net.ssl.trustStorePassword=changeit
```

The example bypasses loopback destinations. Adding `*.svc` or `*.cluster.local` would also bypass in-cluster dependencies and leave their requests out of the proxy recording.

Why `tls-java-tool-options-value` is useful here:

- dual mode needs proxy flags that `tls-java-tool-options: "true"` does not add
- the annotation lets the operator write one merged `JAVA_TOOL_OPTIONS` value
- you avoid manually patching the container `env` block in the workload spec

If you cannot use the annotation-driven path, you can still set `JAVA_TOOL_OPTIONS` directly in the container `env`, but that should be treated as a fallback.

## TLS Trust {#tls-trust}

Java uses a truststore to decide which certificates to accept. The required store differs between desktop proxymock and Kubernetes. Passive Java-agent capture keeps the original TLS connection, while proxy interception and mocked TLS dependencies require trusting the Speedscale CA.

See [Java TLS trust](/reference/java/tls) for truststore selection, desktop and CI commands, Kubernetes setup, replay, and corporate CAs.

## proxymock {#proxymock}

Start with [Java with proxymock](/proxymock/guides/java). It covers automatic JVM configuration, IDE settings, HTTP versus SOCKS, database port mappings, and a CI mock workflow.
