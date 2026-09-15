---
title: Java with proxymock
description: "Record and mock Java traffic locally or in CI with HTTP proxies, SOCKS, port mappings, and JVM truststore settings."
sidebar_position: 3
---

# Java with proxymock

Start with `proxymock record -- java -jar app.jar` for a Java application that uses the default HTTP proxy settings. proxymock starts the JVM and supplies the HTTP/HTTPS proxy and TLS truststore properties.

For an IDE, custom HTTP client, or database connection, use the configuration below. The Kubernetes Java agent is not needed for this local proxy workflow.

## Record an application

Run from your application's directory, with a JDK installed and `JAVA_HOME` set to that JDK. Replace `app.jar` with your built application:

```bash
proxymock init
proxymock admin certs --jks
proxymock record --out ./proxymock/java-recording \
  --app-port 8080 -- java -jar app.jar
```

If your app serves HTTP on port 8080, send test requests to **port 4143** to record inbound traffic too. Replace `/your-endpoint` with a real application route:

```bash
curl http://localhost:4143/your-endpoint
```

Outbound calls that use the configured proxy go through **port 4140**. Stop the recording with Ctrl-C after exercising the workflow. Wait for the recorder to exit before starting mocks; both commands use port 4140. Then run the application with the recorded dependency responses:

```bash
proxymock mock --in ./proxymock/java-recording \
  --no-passthrough -- java -jar app.jar
```

Send requests directly to the application's port 8080 during this mock run. `--no-passthrough` prevents unmatched requests that reach the proxy from going to live dependencies. It cannot block connections from a client that bypasses the proxy entirely.

The wrapper recognizes direct Java commands and common JVM launchers such as `mvn`, `mvnw`, `gradle`, and `gradlew`. It does not detect Java hidden behind an arbitrary shell script, Docker command, or IDE. Configure those JVMs explicitly, and restart long-lived build daemons so they receive the settings.

## HTTP proxy, SOCKS proxy, or port mapping?

A proxy setting is an instruction to the **client library**. Setting an environment variable does not redirect every connection made by the process.

| Traffic | Start with | How it works |
| --- | --- | --- |
| HTTP | HTTP proxy | The client sends its request to proxymock, including the destination URL. |
| HTTPS | HTTP proxy plus Java truststore | The client uses HTTP `CONNECT` to request a connection to the destination. proxymock handles the TLS connection so it can record or mock the exchange. |
| gRPC over TLS | The gRPC client's HTTP CONNECT proxy support plus its TLS trust settings | gRPC uses HTTP/2. Configure the actual gRPC transport; ordinary Java HTTP settings may not be sufficient. |
| JDBC or another TCP client with SOCKS support | SOCKS proxy | The client asks proxymock to connect to a destination host and port, then sends its protocol over that connection. |
| MongoDB, Redis, or another client that ignores proxy settings | `--map` | Point the client's connection settings at a dedicated local port forwarded by proxymock. |

SOCKS is a way to route TCP connections. It does not turn database traffic into HTTP or make an unsupported protocol recordable. TLS trust is still required when proxymock terminates TLS on that route. Check [Technology Support](../../reference/technology-support.md) for supported protocols.

### What about `HTTP_PROXY` and `SOCKS_PROXY`?

For clients that support environment variables, these are common settings:

```bash
export HTTP_PROXY=http://localhost:4140
export HTTPS_PROXY=http://localhost:4140
export ALL_PROXY=socks5h://localhost:4140
```

Use the HTTP pair **or** the SOCKS setting according to the client. Some clients use lowercase names (`http_proxy`, `https_proxy`, `all_proxy`). The `socks5h` URL convention asks supporting clients to resolve the destination hostname through the proxy; `socks5` can resolve it locally.

`SOCKS_PROXY` is not a universal environment variable, and the standard Java networking stack does not use it to configure SOCKS. Use it only when your specific library documents it. Java's standard proxy configuration uses JVM properties, shown below, rather than these shell variables. See [Java networking properties](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/doc-files/net-properties.html).

Both proxymock's HTTP and SOCKS interfaces use port **4140** by default. For `HTTPS_PROXY`, `http://localhost:4140` describes the proxy connection; the destination request still uses HTTPS.

## Run Java separately: HTTP and HTTPS {#manual-http}

This is useful for IDEs, custom truststores, and applications started by scripts. First, create the [Java truststore](../../reference/java/tls.md#desktop). Start proxymock in one terminal:

```bash
proxymock record --out ./proxymock/java-recording --app-port 8080
```

In another terminal, launch the application with both routing and trust settings:

```bash
java \
  -Dhttp.proxyHost=localhost -Dhttp.proxyPort=4140 \
  -Dhttps.proxyHost=localhost -Dhttps.proxyPort=4140 \
  -Djavax.net.ssl.trustStore="$HOME/.speedscale/certs/cacerts.jks" \
  -Djavax.net.ssl.trustStorePassword=changeit \
  -jar app.jar
```

For a custom store, replace the path and password. For an IDE, put these `-D` arguments in the application's **VM options**, not its program arguments. `JAVA_TOOL_OPTIONS` is another way to pass JVM properties to a process started by a launcher. For example, these routing settings preserve any existing options:

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} \
-Dhttp.proxyHost=localhost -Dhttp.proxyPort=4140 \
-Dhttps.proxyHost=localhost -Dhttps.proxyPort=4140"
```

Add the truststore settings in the same JVM configuration when capturing HTTPS.

The default Java proxy selector bypasses loopback destinations. If you need to capture an outbound call to another local service, add `-Dhttp.nonProxyHosts=`. To keep selected destinations direct, use a pipe-separated list such as `'-Dhttp.nonProxyHosts=localhost|127.*|*.internal.example'`. This property applies to HTTP and HTTPS. Every bypassed request is absent from the proxy recording.

These settings apply to clients that use the JVM proxy configuration. Apache HttpClient, Reactor Netty, gRPC, and other libraries can have their own proxy configuration or override the default selector. For gRPC Java, consult its [ProxyDetector API](https://grpc.github.io/grpc-java/javadoc/io/grpc/ProxyDetector.html). Verify that a real request appears in the recording before continuing.

## SOCKS for Java TCP clients {#socks}

With proxymock running separately, configure a client that uses Java's SOCKS-capable socket path:

```bash
java \
  -DsocksProxyHost=localhost \
  -DsocksProxyPort=4140 \
  -DsocksProxyVersion=5 \
  -jar app.jar
```

`socksProxyHost` takes a hostname, not a URL. Keep the real database hostname and port in your JDBC URL. The client sends the destination to the proxy when it opens the connection. Add the truststore options from the HTTP example if that connection uses intercepted TLS.

Some JDBC drivers work through this socket path; others have driver-specific SOCKS or TLS settings. NIO and Netty-based clients can bypass the JVM SOCKS properties. If the connection is absent from the recording, use an explicit driver proxy setting or a port mapping. For example, the MongoDB Java Sync Driver documents its own [SOCKS5 settings](https://www.mongodb.com/docs/drivers/java/sync/current/security/socks/).

You can set HTTP proxy properties and SOCKS properties in the same JVM. Explicit HTTP proxy settings take precedence for clients that honor them; SOCKS can serve other supported socket connections. The automatic proxymock Java wrapper sets HTTP/HTTPS properties, not SOCKS properties.

## Port mapping for clients without proxy support {#map}

For a PostgreSQL server at `db.example.internal:5432`, start:

```bash
proxymock record --out ./proxymock/java-db \
  --map 65432=postgres://db.example.internal:5432
```

In your application's datasource configuration, change the destination to the local listener:

```text
jdbc:postgresql://localhost:65432/appdb
```

Keep the database name, credentials, and required driver options. Replace the example hostname and database with your own. For this mapped connection, Java proxy properties are unnecessary: the JDBC URL already points to proxymock.

After recording, stop the recorder and use the same mapping for mocks:

```bash
proxymock mock --in ./proxymock/java-db --no-passthrough \
  --map 65432=postgres://db.example.internal:5432
```

Run your app with the same local JDBC URL. For databases using TLS, preserve the driver's trust and hostname-verification requirements; changing the URL to `localhost` can affect the name the driver verifies. Follow the protocol-specific guide for TLS configuration.

See [PostgreSQL](./postgres.md), [MySQL](./mysql.md), and [MongoDB](./mongodb.md) for database details. A mapping handles routing; it does not remove authentication or protocol-specific setup requirements.

## Run with mocks in CI {#ci}

Install your chosen proxymock release and a JDK, set `JAVA_HOME`, and restore the recorded files into the job. Initialize using the [headless TLS setup](../../reference/java/tls.md#ci).

The Bash example below assumes a built `app.jar`, HTTP readiness at `/health`, and an executable `./ci/test.sh` that tests the application on port 8080. Replace those application-specific paths. Tests must return a nonzero exit code when a response is wrong.

```bash
#!/usr/bin/env bash
set -euo pipefail

proxymock mock --in ./proxymock/java-recording \
  --no-passthrough --timeout 10m -- java -jar app.jar &
mock_pid=$!
trap 'kill "$mock_pid" 2>/dev/null || true; wait "$mock_pid" 2>/dev/null || true' EXIT

ready=false
for attempt in {1..60}; do
  if ! kill -0 "$mock_pid" 2>/dev/null; then
    echo "The mock/application process exited before readiness" >&2
    exit 1
  fi
  if curl --fail --silent --max-time 2 http://localhost:8080/health >/dev/null; then
    ready=true
    break
  fi
  sleep 1
done
if [ "$ready" != true ]; then
  echo "Application did not become ready" >&2
  exit 1
fi

./ci/test.sh
```

This runs the application and proxy in the same job environment. For Docker or separate service containers, configure a reachable proxy hostname and mount the Java truststore into the application container. See [Docker](./docker.md).

Keep the recorded inputs stable between runs, and inspect mock results for unmatched requests. `--no-passthrough` closes the proxy's fallback path; CI network restrictions are needed if you also want to prevent clients from connecting directly to real dependencies.

## Troubleshooting

| Symptom | Likely cause or next step |
| --- | --- |
| App works, recording is empty | The client ignored proxy settings, bypassed the destination, or was started before settings changed. Test one outbound request and inspect the result. |
| Only inbound traffic is missing | Send recording requests to port 4143 and set `--app-port` to the application's actual port. |
| HTTP works, HTTPS fails | Check [Java TLS trust](../../reference/java/tls.md). |
| HTTP is captured, database traffic is missing | HTTP proxy properties do not redirect ordinary database connections. Use SOCKS-capable driver settings or `--map`. |
| `SOCKS_PROXY` has no effect | Use JVM SOCKS properties or the driver's own proxy settings. |
| Wrapper works, IDE does not | Set VM options in the application run configuration and restart the JVM. |
| `Connection refused` | Check that proxymock is running and reachable at the configured host and port, especially across containers. |
| Mock run still calls a real dependency | Use `--no-passthrough`, then check for proxy bypasses or an unconfigured client. |
