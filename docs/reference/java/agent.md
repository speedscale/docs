---
title: Java agent and framework support
description: "Enable the Speedscale Java agent in Kubernetes and check tested Java, HTTP client, and Netty capture compatibility."
sidebar_position: 2
---

# Java agent and framework support

The Speedscale Java agent records network data inside the JVM. It can read supported TLS traffic before encryption or after decryption, so capture does not require replacing certificates or changing application code.

Use this guide for Java-agent capture in Kubernetes. For local or CI recording through a proxy, use [Java with proxymock](../../proxymock/guides/java.md).

## How it works with eBPF

The eBPF collector, called nettap, observes network traffic on Kubernetes nodes. Java's standard TLS implementation runs inside the JVM, so Speedscale uses a Java instrumentation agent to capture that traffic. The agent sends captured data to nettap for processing.

The agent loads through the JVM's `-javaagent` startup option, so enabling it requires new pods and a JVM restart. It instruments socket and TLS APIs used by the application. It does not route requests through an HTTP or SOCKS proxy. Your application keeps its existing TLS trust and client certificates during capture.

The agent and eBPF collector coordinate capture to avoid duplicate data. Do not assume eBPF will fill every Java-agent gap automatically. Verify the application's requests and responses after enabling capture.

## Enable capture

Follow [Kubernetes capture with eBPF and Java Agent](/guides/capture/kubernetes) for operator and collector prerequisites, both capture annotations, supported manifest placement, rollout and JVM restart requirements, port exclusions, persistence across Helm/GitOps redeploys, and verification. Enable `capture.speedscale.com/enabled` and `capture.speedscale.com/java-agent` on the workload's top-level metadata.

Use the compatibility matrix below to check the application's transport and TLS provider before depending on a recording.

## Tested compatibility {#compatibility}

The tables below summarize the Java-agent compatibility harness shipped with nettap **v0.1.74**, reviewed September 10, 2026. All rows were exercised on **JDK 11, 17, 21, and 25**. These are agent-level capture checks, not a certification of every application or framework configuration.

The Java-agent image version can be pinned separately from the operator. Check the image on the pod's init container when comparing your installation with this table. Older agent versions have different results.

### Captured requests and responses

| Library or API | Version tested | Captured traffic |
| --- | --- | --- |
| JDK `Socket` and `HttpURLConnection` | Each tested JDK | Plain TCP and HTTP. Blocking server tests include fragmented requests and reused connections. |
| JDK `SSLSocket` and `HttpsURLConnection` | Each tested JDK | TLS. |
| OkHttp | 4.12.0 | HTTP and HTTPS. |
| Apache HttpClient | 4.5.14 and 5.4.1 | HTTP and HTTPS. |
| OpenTelemetry OTLP/HTTP exporter using OkHttp | 1.64.0 | HTTP and HTTPS, including sequential exports on a reused connection. |
| JDK `SocketChannel` | Each tested JDK | Plain TCP with single-buffer writes. See the gathering-write limit below. |
| JDK `java.net.http.HttpClient` | Each tested JDK | HTTPS. Plain HTTP has a capture gap below. |
| Jetty HttpClient | 11.0.24 | HTTPS. Plain HTTP has a capture gap below. |
| Netty NIO transport | 4.1.115.Final | Plain client and server traffic; client TLS using the JDK TLS provider. |
| Netty Linux epoll transport | 4.1.115.Final | Plain client and server traffic; client TLS using the JDK TLS provider. |
| JDK `AsynchronousSocketChannel` with `CompletionHandler` | Each tested JDK | Plain TCP using callback-based reads and writes. |

### Known capture gaps

These limits apply across the four tested JDK versions in this matrix.

| Configuration | Result | Practical consequence |
| --- | --- | --- |
| JDK `SocketChannel` gathering writes (sending several buffers at once), including plain HTTP from JDK HttpClient and Jetty HttpClient | Response captured; request missing | Check for complete request/response pairs. Use a supported capture path if these requests are needed. |
| Netty NIO or epoll **server-side TLS** with the JDK provider | Not captured by the agent in the harness | A working Netty TLS client does not establish inbound TLS coverage. |
| `AsynchronousSocketChannel` methods returning `Future` | Not captured by the agent | Callback-based methods and Future-returning methods have different coverage. |
| Netty TLS using OpenSSL/tcnative 2.0.69.Final, with Java-agent images older than v0.1.94 | Not captured by the Java agent | TLS happens in native code. From v0.1.94 the agent captures Netty TLS over BoringSSL; see [gRPC Java and Google Cloud clients](#grpc-java). |

### Spring Boot, WebFlux, gRPC, and database clients

Framework names alone do not determine capture support. The network transport is how a library reads and writes connections. NIO uses Java channels; epoll is a Linux-specific transport. The TLS provider handles encryption. Check both:

- **Spring Boot MVC / Tomcat:** check the server connector and the outbound HTTP client separately. The matrix's JDK socket tests are not a full Tomcat compatibility test.
- **Spring WebFlux / Reactor Netty:** determine whether it uses NIO or Linux epoll, and JDK TLS or native OpenSSL. Client and server TLS have different results above.
- **gRPC Java:** check its Netty transport and TLS provider, and the agent version below. A transport-level test does not verify all gRPC streaming behavior in your application.
- **JDBC, MongoDB, and Redis clients:** check the driver version and I/O implementation. A driver's use of a covered socket API is useful evidence, but does not establish end-to-end database record/replay support.
- **OpenTelemetry:** the tested OTLP/HTTP exporter row verifies that exporter path. It does not certify coexistence with every auto-instrumentation agent or classpath. Confirm that your existing telemetry still arrives after enabling capture.

### gRPC Java and Google Cloud clients {#grpc-java}

Google Cloud Java client libraries, such as `google-cloud-pubsub`, call their services over gRPC with `grpc-netty-shaded`. That library carries its own copy of Netty. On Linux it uses Netty's native epoll transport, and for TLS it uses BoringSSL from its bundled `netty-tcnative`, not the JDK's TLS provider.

| Java-agent image | Plaintext gRPC | gRPC over TLS (BoringSSL) |
| --- | --- | --- |
| v0.1.93 and older | Not captured | Not captured |
| v0.1.94 and newer | Captured | Captured. The agent reads the data before encryption and after decryption, and the application keeps its own TLS trust. |

This was tested on November 16, 2026, with `google-cloud-pubsub` 1.160.0 on JDK 21, publishing and subscribing against the Pub/Sub emulator over plaintext gRPC and over TLS. The captured bytes were compared with what a recording proxy saw on the same connections. In the TLS runs the handshake ran in BoringSSL; the JDK's TLS engine did not handshake.

A sidecar that decrypts outbound TLS captures these clients too. `grpc-netty-shaded` verifies the server with the JVM's default trust store even when BoringSSL runs the handshake, so the Speedscale truststore set in `JAVA_TOOL_OPTIONS` works for it. See [Java TLS trust](./tls.md#kubernetes).

For an application using a custom TLS provider, native-image runtime, or an unlisted JDK, validate that exact configuration before depending on the recording. See [Technology Support](../technology-support.md) for protocol-level support.

## Troubleshooting

| Symptom | Next check |
| --- | --- |
| No agent init container or `-javaagent` option | Check annotations, operator admission, and whether the pod was created after enabling the agent. |
| Init container cannot start | Check image access, volume permissions, and platform resource requirements. |
| JVM fails at startup | Inspect the agent error and all existing `JAVA_TOOL_OPTIONS`, including other agents and options supplied by a ConfigMap or Secret. |
| App works, but traffic is missing | Identify the client/server transport and TLS provider, then compare them with the matrix. Check capture port exclusions too. |
| Only responses are visible | Check whether the client uses gathering writes. |
| HTTPS client capture works, inbound HTTPS does not | Check the Netty server-side TLS gap. |
| Capture works, replay reports a certificate error | Configure [replay trust](./tls.md#replay); passive capture did not require the responder CA. |

When reporting a capture problem, include the agent image version, JDK version, framework/client version, TLS provider, and whether the missing traffic is inbound or outbound. Include a small reproducible request and the observed capture result.
