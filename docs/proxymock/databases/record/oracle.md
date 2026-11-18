---
title: Record Oracle
description: "Record your app's Oracle Database traffic with proxymock or the eBPF collector and see it in every database view: the port map, the tested thin drivers, TCPS, what each call records, and the limits."
sidebar_position: 7
---

# Record Oracle

proxymock records the calls your app makes to Oracle Database and shows them in every database view: [Live SQL](../watch-live-sql.md), [inspect a statement](../inspect-a-statement.md), [link queries to requests](../link-queries-to-requests.md), the [SQL inventory](../sql-inventory.md) and [SQL script export](../export-sql-script.md). The Speedscale dashboard shows the same calls for traffic recorded in Kubernetes; see [Databases](../../../guides/databases/index.md).

It reads the TNS and TTC protocols that Oracle Database speaks, so it works with any client that talks to Oracle over the network, whatever language the app is written in.

Oracle traffic is recorded and inspected. Mocking Oracle with `proxymock mock` and replaying the recorded statements against an Oracle database are coming in a later release.

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

In Kubernetes, the [eBPF collector](/reference/ebpf-traffic-collection) records TCPS connections from the thin drivers above in full. It reads the traffic inside the app, before the driver encrypts it, so the app needs no certificate changes. Thick-mode clients use Oracle's own TLS library, which the collector cannot read, so their TCPS connections are not recorded.

## Native Network Encryption {#nne}

Native Network Encryption (NNE) encrypts the session inside the driver, before the data reaches the socket, so the eBPF collector cannot read it for any client. A session that negotiates NNE is recorded up to its negotiation and no further. Use TCPS instead of NNE for the services you record. Recording NNE sessions through proxymock is not supported yet.

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

Connection pool pings, such as `SELECT 1 FROM DUAL` and the driver's own ping calls, are recorded but hidden from Live SQL, as they are for the other databases.

Recordings never contain passwords. The login's encrypted password, its session keys, salts and the server's proof are dropped when the call is decoded; the recording only notes that they were sent.

## Limits

- Native Network Encryption cannot be recorded; see [Native Network Encryption](#nne).
- Thick-mode clients are not tested, and their TCPS traffic is not recorded by the eBPF collector; see [Supported drivers](#drivers).
- A RAC SCAN listener redirects each client to a node listener on another address or port. Record every port the cluster uses, or connect the app to a node listener directly. Rewriting the redirect so the client stays on the recorder comes in a later release.
- Advanced Queuing, direct path loads, two-phase commit, object types and SQL\*Net compression are not decoded.
- A connection that was already open when recording started cannot be decoded, because the recording missed its negotiation. Start recording before the app opens its connections.
- Mocking Oracle and replaying its statements against a database are not available yet.

## Benchmark results {#benchmarks}

Oracle's license terms, for the free OTN license and the commercial licenses alike, do not allow publishing the results of benchmarks run against Oracle Database without Oracle's consent. Check your license before you publish performance numbers from tests that ran against an Oracle database.

## In Kubernetes {#kubernetes}

When your app runs in Kubernetes with the Speedscale operator, the [eBPF collector](/reference/ebpf-traffic-collection) or the sidecar records Oracle calls with the rest of the workload's traffic, with no `--map`. The collector treats ports 1521 and 2484 as Oracle listener ports when it works out which side of a connection is the server. The calls appear on the dashboard's **Traffic** page with the database columns and filters; see [Watch live SQL](../../../guides/databases/watch-live-sql.md).
