---
title: Record Oracle
description: "Record, mock and replay your app's Oracle Database traffic with proxymock or the eBPF collector and see it in every database view: the port map, the tested thin drivers, TCPS, what each call records, the mock and the password it needs, replay against a real database, and the limits."
sidebar_position: 7
---

# Record Oracle

proxymock records the calls your app makes to Oracle Database and shows them in every database view: [Live SQL](../watch-live-sql.md), [inspect a statement](../inspect-a-statement.md), [link queries to requests](../link-queries-to-requests.md), the [SQL inventory](../sql-inventory.md) and [SQL script export](../export-sql-script.md). The Speedscale dashboard shows the same calls for traffic recorded in Kubernetes; see [Databases](../../../guides/databases/index.md).

It reads the TNS and TTC protocols that Oracle Database speaks, so it works with any client that talks to Oracle over the network, whatever language the app is written in.

Oracle traffic is recorded, inspected and mocked: `proxymock mock` answers your app's Oracle calls from a recording, so the app runs without its database (see [Mock Oracle](#mock)). The recorded calls also replay against a real Oracle database to regression or load test it; see [Replay against a database](#replay).

To try every step on a sample app first, the [Oracle lab](https://github.com/speedscale/mock-lab/tree/main/labs/oracle) runs the same shop API in Go, Java, Node.js and Python against Oracle AI Database 26ai Free in Docker, then records it, mocks it and replays its SQL against the database.

## Supported drivers {#drivers}

These drivers are tested against Oracle AI Database 26ai Free 23.26.3, over plain TCP and over TCPS:

| Driver | Language |
|---|---|
| JDBC thin (ojdbc11) | Java |
| python-oracledb, thin mode | Python |
| node-oracledb, thin mode | Node.js |
| go-ora | Go |
| ODP.NET managed driver | .NET |

Thick-mode clients, the ones that load the Oracle Call Interface (OCI) from Oracle Instant Client or a full client install, are not tested. These include SQL\*Plus, python-oracledb in thick mode, godror and the ODP.NET unmanaged driver. Under eBPF capture their TCPS traffic cannot be decrypted, because they use Oracle's own TLS library rather than OpenSSL.

## Start the recorder {#start-recording}

Map a local port to your Oracle listener and start the recorder:

```bash
proxymock record --map 11521=localhost:1521 --app-port 8080
```

The recorder listens on port 11521 and forwards to the Oracle listener on 1521. proxymock recognizes Oracle by the TNS CONNECT message that opens every connection, not by the port, so a listener on another port is mapped the same way. The default ports are 1521 for plain TCP and 2484 for TCPS. See the [architecture page](../../how-it-works/architecture.md) for how the recorder works.

## Point your app at the recorder {#configure-client}

Change the host and port in your connect string to the mapped port, and keep the service name. Connect over plain TCP for the recording; to record TCPS connections, see [TCPS](#tcps).

JDBC thin (Java):

```text
jdbc:oracle:thin:@//localhost:11521/FREEPDB1
```

python-oracledb:

```python
oracledb.connect(user="app", password=password, dsn="localhost:11521/FREEPDB1")
```

node-oracledb:

```javascript
await oracledb.getConnection({ user: "app", password, connectString: "localhost:11521/FREEPDB1" });
```

go-ora (Go):

```text
oracle://app:<password>@localhost:11521/FREEPDB1
```

ODP.NET managed (.NET):

```text
User Id=app;Password=<password>;Data Source=localhost:11521/FREEPDB1
```

## TCPS {#tcps}

proxymock records TCPS connections by ending the driver's TLS session with a certificate signed by the proxymock certificate authority, the same way its other TLS recorders do, so the driver must trust it: add `~/.speedscale/certs/tls.crt` to the trust store or wallet the driver reads. Map the TCPS listener port, usually 2484, the same way as a plain one.

A server that asks the client to renegotiate TLS and present a wallet client certificate cannot be recorded through the proxy, because the recorder has no such certificate to present. That connection passes through untouched, so the app keeps working, but the session is not recorded.

In Kubernetes, the [eBPF collector](/reference/ebpf-traffic-collection) records TCPS connections from the thin drivers above in full. It reads the traffic inside the app, before the driver encrypts it, so the app needs no certificate changes. Thick-mode clients use Oracle's own TLS library, which the collector cannot read, so their TCPS connections are not recorded.

## Native Network Encryption {#nne}

Native Network Encryption (NNE) encrypts the session inside the driver, before the data reaches the socket.

proxymock records NNE sessions from go-ora and other clients that use Oracle's legacy encryption negotiation. It terminates the negotiation on each side of the proxy and re-encrypts toward the client and the server, so the call is recorded decoded. Encryption (AES) and the optional data-integrity checksum (SHA) are both handled.

Modern JDBC thin (23ai) uses a newer negotiation that rejects a terminating proxy right after login, so its NNE sessions pass through the recorder untouched: the app keeps working, but the session is not recorded. Connect over TCPS instead to record a JDBC app that requires encryption.

The eBPF collector cannot read NNE for any client, because the driver encrypts before the data reaches the socket. A session the collector sees negotiate NNE is recorded up to its negotiation and no further.

The mock does not offer NNE, so a client that requires it cannot be mocked; see [Mock Oracle](#mock). A replay against a database cannot use NNE or checksumming; see [Replay against a database](#replay).

## What gets recorded

Open the recording in proxymock web:

```bash
proxymock web
```

Each round trip is one RRPair:

- **Connection setup**: the TNS connect and its accept, refuse or redirect, and the protocol and data type negotiation.
- **Logins**, with the user, the service name, the client program and machine, and the server session id and serial number as `V$SESSION` shows them.
- **Statement executions** with their full SQL text and their bind values, whether the SQL uses positional (`:1`) or named (`:id`) binds. A re-execute that names only a cursor still shows the SQL the cursor was opened with.
- **Fetches** and the rows they return, with every column decoded to its type, including `NUMBER`, `DATE`, `TIMESTAMP`, `INTERVAL`, `ROWID`, LOBs, `JSON`, `VECTOR` and `BOOLEAN`. Rows the server sends in compressed form, with repeated column values left out, show their full values.
- **Errors** with their `ORA-` number and message, such as `ORA-00001` for a unique constraint violation and `ORA-00942` for a missing table. `ORA-01403`, no data found, ends a fetch normally and is not an error.
- **Transactions**: commits and rollbacks, sent as SQL or as the driver's own commit and rollback calls.
- **Cancels**: the break a driver sends when a call times out or the app cancels it, with the reset that answers it.

Every call also carries the connection's user, service name and session id, and whether it ran inside a transaction. [Database traffic](../../../concepts/database-traffic.md) lists every fact and how to filter on it.

Connection pool pings written as SQL, such as `SELECT 1 FROM DUAL`, are left out of the recording, as they are for the other databases. The driver's own ping calls are recorded.

Recordings never contain passwords. The login's encrypted password, its session keys, salts and the server's proof are dropped when the call is decoded; the recording only notes that they were sent.

## Mock Oracle {#mock}

Start the mock with the same port map the recording used and a test config that holds the database password (see [The mock needs the password](#mock-password)), and keep the app's connect string pointed at the mapped port:

```bash
proxymock mock --map 11521=localhost:1521 --test-config oracle-mock -- your-app
```

The mock answers each statement execution and fetch with the reply recorded for the same statement, matched on the normalized SQL and not on the values bound to it, as the other SQL mocks are. See [Mock a database](../mock-a-database.md) for what happens when nothing matches exactly. A statement with no recording gets the user-defined Oracle error `ORA-20999: Speedscale: responder miss: no recorded reply for this call`, which every driver reports as an ordinary database error, and appears as a miss in the mock's output.

These drivers are tested against the mock over plain TCP: JDBC thin, python-oracledb in thin mode, node-oracledb in thin mode, go-ora and the ODP.NET managed driver. Over TCPS, JDBC thin, go-ora and ODP.NET are tested, and python-oracledb and node-oracledb are tested with their server name check turned off; see [TCPS and Native Network Encryption](#mock-tcps). Thick-mode clients are not tested.

A recording made with one driver serves another, but each reply is shaped by what the driver asked for, such as how many rows it fetches at a time. The mock answers with the recording of the same driver when it has one, and sends no more rows than the driver asks for.

### The mock needs the password {#mock-password}

The mock needs the password of the database user your app logs in as. Oracle drivers check that the server knows the password before they finish the login (O5LOGON), so a mock without it cannot complete the login, and refuses it with `ORA-01017`. Recordings never contain the password, so the mock cannot learn it from them.

Put the user and password in the `responder.oracle` section of a [test config](../../guides/test-configs.md), and pass the config to the mock with `--test-config`, as a workspace test config name such as `oracle-mock` or a path to the config's JSON file. A replay that starts the mock takes the same flag. Use a secret reference such as `${{secret:oracle-credentials/password}}`, which reads the file `proxymock/secrets/oracle-credentials/password`, rather than a literal password, because a literal value is stored with the test config; see [Secrets](../../guides/secrets.md):

```json
{
  "id": "oracle-mock",
  "responder": {
    "oracle": {
      "username": "app",
      "password": "${{secret:oracle-credentials/password}}"
    }
  }
}
```

The mock accepts that password for that user only. Leave `username` empty to accept the password for any user, such as when the app logs in as more than one user with the same password.

In Kubernetes, add the same `responder.oracle` section to the test config the replay runs with, such as a workspace test config passed to `proxymock cluster replay start --test-config`. Speedscale mounts every secret the test config references into the mock, so the Kubernetes secret `oracle-credentials`, with a `password` key, only has to exist in the namespace of the workload you replay.

### TCPS and Native Network Encryption {#mock-tcps}

The mock answers TCPS connections. It ends the driver's TLS session with a certificate signed by the proxymock certificate authority, so the driver must trust it, as with other TLS mocks: add `~/.speedscale/certs/tls.crt` to the trust store or wallet your driver reads. For Java, `proxymock admin certs --jks` creates `~/.speedscale/certs/cacerts.jks` with the password `changeit`, which the JDBC thin driver reads with the JVM's `javax.net.ssl.trustStore` setting; see [Java](../../guides/java.md). In Kubernetes, the app trusts the Speedscale certificate authority; see [TLS support](../../../getting-started/installation/sidecar/tls.md).

python-oracledb and node-oracledb in thin mode check that the server certificate names the host they connect to, but they do not tell the server that name, so the mock's certificate cannot name it and the login fails with `DPY-6006` in python-oracledb or `NJS-508` in node-oracledb. For a test against the mock, turn the check off: `ssl_server_dn_match=False` in python-oracledb, or `sslServerDNMatch: false` in node-oracledb.

A client that requires Native Network Encryption, such as JDBC thin with `oracle.net.encryption_client=REQUIRED`, cannot be mocked, because the mock does not offer NNE. Connect over TCPS for the test, or turn NNE off for it.

### What the mock answers on its own

A break the driver sends when a call times out or the app cancels it is answered with the reset a server sends, and the call ends with `ORA-01013`. The mock answers each call as soon as it arrives, so a cancel only reaches it between calls. Cancels are not yet tested end to end against the mock.

Requests a driver or pool sends for its own housekeeping are answered even when the recording does not hold them: pings, `ALTER SESSION` statements, and commits and rollbacks, sent as SQL or as the driver's own calls.

To read or rewrite one bound value, for example to store the id a lookup asks for in a variable, use the [`oracle_param`](/guides/transformation/extractors/oracle_param) extractor. It does not change what the mock matches on.

## Replay against a database {#replay}

The recorded Oracle calls can be replayed against a real Oracle database, to regression test a migration or an upgrade, or to load test the database with many sessions. It works the same way as for SQL Server, Postgres, MySQL, Redis and MongoDB: a tests filter makes the recorded calls the tests, and the database is the system under test. proxymock replays and replays in a Kubernetes cluster both support it. [Load and Regression Test a Database](../load-and-regression-testing.md) walks through both kinds of test.

Replay changes the database's data, so point it at a disposable database, never production.

```bash
proxymock replay --in ./proxymock \
  --tests-filter '(direction IS OUT) AND (tech IS Oracle)' \
  --test-against oracle://localhost:1521/FREEPDB1 \
  --test-config my-config
```

### The address {#replay-address}

The address is `oracle://host:port/SERVICE`. The port defaults to 1521, and the path is the service name. With no path, the replay uses the service the recording connected to. The address never holds credentials, and a replay with a user or password in it is refused.

| Address | What it does |
|---|---|
| `oracle://db:1521/FREEPDB1` | Connects over plain TCP |
| `oracle://db:2484/FREEPDB1?ssl=true` | Connects over TCPS and verifies the server's certificate and host name |
| `oracle://db:2484/FREEPDB1?ssl=true&ssl_verify=false` | Connects over TCPS without verifying the certificate. go-ora's spelling, `SSL Verify=false`, works too |
| `?sslmode=disable`, `require`, `verify-ca` or `verify-full` | The libpq-style modes, as in the test config |

### Credentials {#replay-credentials}

Put the user and password in the `generator.oracle` section of the test config, with the password as a secret reference such as `${{secret:oracle-credentials/password}}` rather than a literal. A literal password is stored with the test config and every report that uses it, and proxymock logs a warning when it finds one. See [Secrets](../../guides/secrets.md).

```json
{
  "id": "my-config",
  "generator": {
    "oracle": {
      "username": "app",
      "password": "${{secret:oracle-credentials/password}}",
      "database": "FREEPDB1"
    }
  }
}
```

| Field | What it sets |
|---|---|
| `username` and `password` | The database user the replay logs in as |
| `database` | The service name |
| `tlsMode` | TCPS: unset or `PROTOCOL_TLS_MODE_DISABLE` for plain TCP, `PROTOCOL_TLS_MODE_REQUIRE` for TCPS without verifying the certificate, and `PROTOCOL_TLS_MODE_VERIFY_CA` or `PROTOCOL_TLS_MODE_VERIFY_FULL` to verify it. See [TLS](../load-and-regression-testing.md#tls) |
| `caCertificate` | The PEM certificates the verifying modes trust, instead of the system's |
| `clientCertificate` | A PEM certificate followed by its private key, for a server that asks for one. Keep it in a secret |
| `connectTimeout` | How long to wait for each connection |

A field left empty falls back to the environment variables `ORACLE_USER`, `ORACLE_PASSWORD` and `ORACLE_SERVICE`. The service and TLS settings in the address win over the test config.

In Kubernetes, add the same `generator.oracle` section to the test config the replay runs with. Speedscale mounts every secret it references into the replay, so the Kubernetes secret `oracle-credentials`, with a `password` key, has to exist in the namespace of the workload you replay.

### How the replay connects {#replay-connect}

The replay connects to the database the way the recorded driver connected. It replays each driver's own handshake from the recording and opens one session per driver, so the database answers the replay as it answered your app. A recording that holds no login connects the way go-ora does.

### What the replay sends {#replay-sent}

Every recorded call is sent as it was recorded: statements, array binds, PL/SQL calls with OUT binds, REF CURSORs, implicit results and LOB reads. Recorded cursor ids and LOB locators are mapped to the ones the replay's own session gets back.

A call on a cursor or LOB that was opened before recording started is skipped, because the replay has nothing to map it to. An execute that names its SQL is the exception: the replay parses that SQL again and runs it.

Each replayed call's result is compared with its recording as for the other databases: the result code, the row count and the rows.

### Tested

These drivers were recorded against Oracle AI Database 26ai Free and replayed against it with identical results, over TCP and over TCPS: JDBC thin, python-oracledb in thin mode, node-oracledb in thin mode, go-ora and the ODP.NET managed driver. A load test with 4 virtual users for 30 seconds ran with 0 failed requests.

### Not supported {#replay-limits}

- Native Network Encryption and checksumming. The replay reports a clear error when the database requires them; connect over TCPS instead.
- Password verifiers older than 12c. The replay user needs a 12c or later password verifier.

## Limits

- Native Network Encryption is recorded through the proxy for legacy-negotiation clients such as go-ora, but a modern JDBC NNE session passes through uncaptured, and the eBPF collector cannot read NNE for any client; see [Native Network Encryption](#nne). A client that requires NNE cannot be mocked.
- A TCPS server that asks the client to renegotiate TLS with a wallet client certificate cannot be recorded through the proxy; see [TCPS](#tcps).
- Thick-mode clients are not tested, and their TCPS traffic is not recorded by the eBPF collector; see [Supported drivers](#drivers).
- A RAC SCAN listener redirects each client to a node listener on another address or port. proxymock rewrites the redirect so the client reconnects through the recorder, and routes the new connection to the node the listener named, so the whole session is recorded. Under eBPF the collector sees both connections anyway, because it watches sockets rather than addresses.
- Advanced Queuing, direct path loads, two-phase commit, object types and SQL\*Net compression are not decoded.
- A connection that was already open when recording started cannot be decoded, because the recording missed its negotiation. Start recording before the app opens its connections.
- The mock needs the database user's password in the test config; see [The mock needs the password](#mock-password).
- Over TCPS, python-oracledb and node-oracledb need their server name check turned off for the mock; see [TCPS and Native Network Encryption](#mock-tcps).
- A replay against a database cannot use Native Network Encryption or checksumming, or log in with a password verifier older than 12c; see [Replay against a database](#replay).
- A replay skips calls on a cursor or LOB that was opened before recording started, except an execute that names its SQL; see [What the replay sends](#replay-sent).

## Benchmark results {#benchmarks}

Oracle's license terms, for the free OTN license and the commercial licenses alike, do not allow publishing the results of benchmarks run against Oracle Database without Oracle's consent. Check your license before you publish performance numbers from tests that ran against an Oracle database.

## In Kubernetes {#kubernetes}

When your app runs in Kubernetes with the Speedscale operator, the [eBPF collector](/reference/ebpf-traffic-collection) or the sidecar records Oracle calls with the rest of the workload's traffic, with no `--map`. The collector treats ports 1521 and 2484 as Oracle listener ports when it works out which side of a connection is the server. The calls appear on the dashboard's **Traffic** page with the database columns and filters; see [Watch live SQL](../../../guides/databases/watch-live-sql.md). A replay that mocks Oracle needs `responder.oracle` in its test config; see [The mock needs the password](#mock-password). A replay against an Oracle database needs `generator.oracle`; see [Credentials](#replay-credentials).
