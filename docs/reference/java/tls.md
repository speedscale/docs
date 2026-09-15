---
title: Java TLS trust
description: "Configure Java truststores for Speedscale capture and replay in Kubernetes, on a workstation, and in CI."
sidebar_position: 1
---

# Java TLS trust

When a Java application calls an HTTPS service, it checks whether it trusts the certificate presented by that service. If proxymock or a Speedscale proxy decrypts the connection, Java must trust the Speedscale certificate authority (CA).

The Java agent captures traffic inside the JVM without replacing the server's certificate. That capture mode does not require adding a Speedscale CA. Mocking a TLS dependency later does require trust configuration.

## Choose your setup

| What you are doing | Trust configuration |
| --- | --- |
| Capturing with the Java agent in Kubernetes | Keep the application's existing trust configuration. See [Java agent](./agent.md). |
| Decrypting outbound TLS with a Kubernetes sidecar | Mount the Speedscale truststore and tell Java to use it. See [Kubernetes](#kubernetes). |
| Recording or mocking with proxymock | Use the local truststore. See [Desktop](#desktop). |
| Running Java tests in CI | Create the truststore in the job that runs Java. See [CI](#ci). |
| Replaying against a Java workload with mocked TLS dependencies | The workload must trust the mock responder. See [Replay](#replay). |

## How Java chooses what to trust

A **truststore** contains trusted certificates. A **keystore** can contain your application's private key and certificate, used to identify it to a peer. Changing a truststore does not supply a client certificate for mutual TLS (mTLS).

Java's standard TLS implementation, JSSE, looks for trusted certificates in this order:

1. The file selected by `-Djavax.net.ssl.trustStore=...`.
2. `$JAVA_HOME/lib/security/jssecacerts`, if present.
3. `$JAVA_HOME/lib/security/cacerts`.

An explicit truststore replaces this default selection; it does not add certificates to it. A configured file that does not exist can leave Java with no trusted certificates. Applications with their own `SSLContext` or trust manager can use different rules. See the [Java JSSE reference](https://docs.oracle.com/en/java/javase/21/security/java-secure-socket-extension-jsse-reference-guide.html).

Adding a certificate to the macOS Keychain or setting `SSL_CERT_FILE` alone does not configure a typical Java application's truststore. This explains why curl or a browser can succeed while Java reports `PKIX path building failed`.

## Desktop {#desktop}

Run these commands from your application's directory. Install a JDK, set `JAVA_HOME` to that JDK, and make sure the `java` command uses the same installation. A JRE-only image may be missing `keytool` or the CA bundle needed to create the store.

```bash
java -version
"$JAVA_HOME/bin/keytool" -help
proxymock init
proxymock admin certs --jks
```

`proxymock admin certs --jks` copies `$JAVA_HOME/lib/security/cacerts` to `$HOME/.speedscale/certs/cacerts.jks`, then imports the local Speedscale CA. It leaves the JDK's original store alone. These paths assume the default Speedscale home directory.

On macOS, `proxymock admin certs` also attempts to add the certificate to the Keychain and may prompt for permission. For headless jobs, use the [CI setup](#ci).

For a Java command launched directly by proxymock, record and mock modes set the HTTP proxy and truststore properties automatically:

```bash
proxymock record --out ./proxymock/java-recording -- java -jar app.jar
```

If the local store is missing, the wrapper attempts to create it. `JAVA_HOME` must be set for that operation. An existing store is reused, so regenerate it after changing the local CA or when you need a newer JDK CA bundle.

:::caution Custom certificates
Regenerating `cacerts.jks` replaces that local file with a fresh copy of the JDK store plus the Speedscale CA. If you added corporate certificates to it, use the [custom truststore workflow](#custom-truststore) instead.
:::

For an IDE or a JVM started separately, add these options to the application's JVM settings:

```bash
java \
  -Djavax.net.ssl.trustStore="$HOME/.speedscale/certs/cacerts.jks" \
  -Djavax.net.ssl.trustStorePassword=changeit \
  -jar app.jar
```

This configures trust only. Add [proxy routing](../../proxymock/guides/java.md#manual-http) so the requests reach proxymock. Restart the application after changing either setting.

## Kubernetes {#kubernetes}

For a transparent sidecar, add these annotations to the workload's `metadata.annotations`:

```yaml
metadata:
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls-out: "true"
    sidecar.speedscale.com/tls-java-tool-options: "true"
```

The operator mounts a Java truststore containing standard public CAs and the cluster's Speedscale CA. The Java option annotation tells the JVM to use it through `JAVA_TOOL_OPTIONS`:

```text
-Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
-Djavax.net.ssl.trustStorePassword=changeit
```

That path is inside the application container. It is different from the desktop path. The standard cluster store may not contain your organization's private CAs; use a merged store when those are required.

Transparent sidecar routing redirects connections without Java proxy properties. In dual or forward mode, configure both routing and trust. See the [Java dual-sidecar example](../languages/java.md#dual-sidecar).

The `sidecar.speedscale.com/tls-java-tool-options-value` annotation supplies custom JVM options and takes precedence over `tls-java-tool-options`. A custom truststore path must point to a file you mount in the application container. Check the resulting pod's `JAVA_TOOL_OPTIONS`, especially when the application already sets truststore properties or runs another agent. `SPEEDSCALE_JAVA_OPTS` is not an environment variable that Java reads automatically.

Do not combine sidecar injection with `capture.speedscale.com/java-agent: "true"` on the same workload. See [capture modes](../languages/java.md).

## Replay with mocked TLS dependencies {#replay}

A successful Java-agent recording does not prove that replay trust is configured. During capture, Java talks to the real dependency using its original certificate. During a replay with mocks, it talks to a Speedscale responder presenting a certificate issued by the Speedscale CA.

For a replay that includes a responder, the current operator adds Java truststore options when the workload has Java-agent capture enabled or has opted into Java TLS options. Preserve the relevant Java configuration in the workload used for replay. If your application uses a custom truststore or trust manager, include the responder's CA there too.

If recording works but replay fails with `PKIX path building failed`, inspect the **replay application's** truststore and JVM options. Adding the CA only to the load generator does not fix the application's outbound TLS connections.

## CI {#ci}

Use the same trust setup as desktop proxymock, inside the job or container that runs Java. Initialize proxymock without browser sign-in using a CI secret:

```bash
: "${JAVA_HOME:?Set JAVA_HOME to the CI JDK}"
: "${SPEEDSCALE_API_KEY:?Set this CI secret}"
proxymock init --api-key "$SPEEDSCALE_API_KEY" --no-rcfile-update --yes --quiet
"$JAVA_HOME/bin/keytool" -list \
  -keystore "$HOME/.speedscale/certs/cacerts.jks" \
  -storepass changeit -alias speedscale >/dev/null
```

With `JAVA_HOME` set, initialization attempts to create the Java store. The `keytool` check fails the step if the store or Speedscale certificate is missing. `--quiet` also skips interactive macOS Keychain setup and IDE setup. Install proxymock and the JDK before this step. The job needs the CA bundle at `$JAVA_HOME/lib/security/cacerts` and `keytool` at `$JAVA_HOME/bin/keytool`. See the [Java CI example](../../proxymock/guides/java.md#ci) for starting mocks and running tests.

If the JVM runs in another container, copy or mount the truststore into that container and use its container path. `localhost:4140` also refers to that container, so set the proxy host to a name or address it can reach.

Create the store alongside the CA used by that job. Reusing a cached truststore with a newly generated CA causes certificate failures.

## Keep corporate CAs in a custom truststore {#custom-truststore}

Copy the truststore your application already uses, then import the Speedscale CA into the copy. For local proxymock, that CA is `$HOME/.speedscale/certs/tls.crt`. For Kubernetes, use the CA from that cluster's `speedscale-certs` Secret, not your workstation's CA.

This example uses a JKS file and lets `keytool` prompt for the store password:

```bash
cp custom.jks custom-with-speedscale.jks
keytool -importcert \
  -alias speedscale-root \
  -file "$HOME/.speedscale/certs/tls.crt" \
  -keystore custom-with-speedscale.jks \
  -storetype JKS
keytool -list \
  -alias speedscale-root \
  -keystore custom-with-speedscale.jks \
  -storetype JKS
```

Select the merged file with `javax.net.ssl.trustStore` and the matching store password. For PKCS12, use `-storetype PKCS12` with `keytool` and `-Djavax.net.ssl.trustStoreType=PKCS12` with Java. A `.jks` filename alone does not establish the file's format.

Use [manual proxymock configuration](../../proxymock/guides/java.md#manual-http) with a custom store. The automatic wrapper adds properties pointing to its generated store.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `PKIX path building failed` | Does the running JVM use the intended store, and does that store contain the CA used by this proxy or responder? |
| Public HTTPS works, internal HTTPS fails | The selected store may be missing a corporate CA. Merge it with the application's original truststore. |
| Hostname or subject-alternative-name error | Check the requested hostname against the presented certificate. Trusting a CA does not fix a hostname mismatch. |
| The truststore works locally but not in a container | Check the mounted path, permissions, store format, and JVM settings inside the container. |
| Truststore flags have no effect | The client may create its own TLS context or use a native TLS provider. Configure that client's trust settings. |
| mTLS or certificate pinning fails through the proxy | CA trust alone is insufficient. mTLS also requires client identity; pinning checks a particular certificate or key. Check the application's TLS requirements before choosing interception. |

For a focused TLS diagnosis, start the application with `-Djavax.net.debug=ssl,handshake,trustmanager`. Inspect which truststore is loaded and which certificate is rejected. Remove the flag after diagnosis; its output is verbose and can include certificate and endpoint details.

Keep certificate and hostname verification enabled while fixing trust configuration.
