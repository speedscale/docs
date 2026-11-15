---
title: Record SQL Server
description: "Record your app's SQL Server, Azure SQL Database, Amazon RDS for SQL Server and Azure SQL Managed Instance traffic with proxymock: the port map, encrypted connections with SqlClient, mssql-jdbc and go-mssqldb, what each call records, and the limits."
sidebar_position: 7
---

# Record SQL Server

proxymock records the calls your app makes to Microsoft SQL Server and shows them in every database view: [Live SQL](../watch-live-sql.md), [inspect a statement](../inspect-a-statement.md), [link queries to requests](../link-queries-to-requests.md), the [SQL inventory](../sql-inventory.md) and [SQL script export](../export-sql-script.md). The Speedscale dashboard shows the same calls for traffic recorded in Kubernetes; see [Databases](../../../guides/databases/index.md).

It reads the TDS protocol that SQL Server speaks, so it works with SQL Server, Azure SQL Database, Amazon RDS for SQL Server and Azure SQL Managed Instance, and with any client that connects to them, such as SqlClient for .NET, mssql-jdbc for Java, go-mssqldb for Go and `sqlcmd`. Encrypted connections are recorded too: proxymock decrypts them the way it decrypts HTTPS (see [Encryption](#encryption)).

SQL Server traffic is recorded and inspected. [Mocking a database](../mock-a-database.md) and [replaying statements against one](../load-and-regression-testing.md) cover PostgreSQL and MySQL, not SQL Server.

## Start the recorder {#start-recording}

Map a local port to your SQL Server and start the recorder:

```bash
proxymock record --map 11433=localhost:1433 --app-port 8080
```

The recorder listens on port 11433 and forwards to SQL Server on 1433. proxymock recognizes SQL Server by the PRELOGIN message that opens every connection, not by the port, so a named instance on another port is mapped the same way, such as `--map 11433=localhost:50123`. See the [architecture page](../../how-it-works/architecture.md) for how the recorder works.

## Point your app at the recorder {#configure-client}

Change the server address in your connection string to the mapped port. Keep your encryption setting, and let the driver accept the certificate proxymock presents, as the next section explains.

SqlClient (.NET):

```text
Server=localhost,11433;Database=shop;User Id=app;Password=<password>;Encrypt=True;TrustServerCertificate=True
```

mssql-jdbc (Java):

```text
jdbc:sqlserver://localhost:11433;databaseName=shop;encrypt=true;trustServerCertificate=true
```

go-mssqldb (Go):

```text
sqlserver://app:<password>@localhost:11433?database=shop&encrypt=true&TrustServerCertificate=true
```

`sqlcmd`:

```bash
sqlcmd -S tcp:localhost,11433 -d shop -U app -N m -C
```

Change these settings only for the environment you record, such as a local or test database. Keep the driver checking the server certificate everywhere else.

## Encryption {#encryption}

proxymock decrypts encrypted SQL Server connections and records them in full, the way it records HTTPS. It ends the driver's TLS session with a certificate signed by the proxymock certificate authority, and opens its own TLS session to SQL Server. Every encryption setting is recorded, including the login, so each call knows its user, database and application name:

| Driver setting | How the driver encrypts | What the driver must trust |
|---|---|---|
| No encryption, such as go-mssqldb `encrypt=disable` | Nothing | Nothing |
| Encryption off, such as SqlClient `Encrypt=False`, mssql-jdbc `encrypt=false`, `sqlcmd -N o`, or the default of older drivers | The login packet only | The proxymock certificate, or `TrustServerCertificate=True` |
| Encryption on, such as `Encrypt=True` or `Encrypt=Mandatory`, the default of SqlClient 4.0 and later and mssql-jdbc 10.2 and later | The whole connection | The proxymock certificate, or `TrustServerCertificate=True` |
| TDS 8.0 strict, such as SqlClient `Encrypt=Strict` or mssql-jdbc `encrypt=strict` | The whole connection, from its first byte | The proxymock certificate. Strict encryption always checks the certificate and ignores `TrustServerCertificate`. |

To make the driver trust proxymock's certificate authority instead of skipping the check, add `~/.speedscale/certs/tls.crt` to the trust store your driver uses. For Java, `proxymock admin certs --jks` creates `~/.speedscale/certs/cacerts.jks` with the password `changeit`, which mssql-jdbc reads with `trustStore=<path>;trustStorePassword=changeit` or the JVM's `javax.net.ssl.trustStore` setting. See [Java](../../guides/java.md).

For strict encryption the certificate proxymock presents carries the host name the driver connects to. If the driver checks a different name, set it with `HostNameInCertificate` in SqlClient or `hostNameInCertificate` in mssql-jdbc.

The Speedscale sidecar in Kubernetes decrypts SQL Server connections when outbound TLS interception is on, with the `sidecar.speedscale.com/tls-out: "true"` annotation, and the app trusts the Speedscale certificate authority. See [TLS support](../../../getting-started/installation/sidecar/tls.md). Without it the sidecar records what the driver does not encrypt: everything after the login on a connection that encrypts only the login packet, with the user and application name unknown, and only the PRELOGIN on a fully encrypted connection.

## What gets recorded

Open the recording in proxymock web:

```bash
proxymock web
```

Each call is one RRPair:

- **SQL batches** with their full T-SQL text. A batch can hold several statements and return several result sets.
- **RPC calls**: `sp_executesql`, which SqlClient, go-mssqldb and the first execution in mssql-jdbc send; `sp_prepexec` and `sp_execute`, which mssql-jdbc and SqlClient use for prepared statements, where an `sp_execute` shows the SQL it was prepared with; and stored procedures called by name. Each carries its parameters with their types and values.
- **Responses**: rows of every built-in type, row counts, return values and return status.
- **Errors** with the SQL Server error number and message, such as `2627` for a duplicate key, and **informational messages**, such as `PRINT` output and `RAISERROR` at severity 10 or below.
- **Transactions**: `BEGIN`, `COMMIT` and `ROLLBACK` sent as T-SQL or as the driver's transaction manager requests.
- **Attention**: a cancel the driver sends when a command times out or the app cancels it.

Every call also carries the connection's user, database, application name and session id (SPID), and whether it ran inside a transaction. [Database traffic](../../../concepts/database-traffic.md) lists every fact and how to filter on it.

In the statement view, **With values** fills the parameters into the SQL as T-SQL literals, such as `N'text'` for a string and `0x0A1B` for binary, so you can copy the statement into `sqlcmd` or SQL Server Management Studio. An exported script ends each batch with `GO`.

Passwords, Windows (SSPI) authentication data and Microsoft Entra ID access tokens are never recorded.

## Limits

- An Azure SQL Database client inside Azure uses the redirect connection policy by default: after the login the server sends the driver to the database node, and the driver reconnects there directly, around the recorder. Record from outside Azure, where the proxy policy is the default, or set the server's connection policy to **Proxy** for the recording.
- An inbound SQL Server, one that proxymock or the sidecar receives connections for rather than connects to, records encrypted connections as the sidecar does without `tls-out`. See [Encryption](#encryption).
- Connections with MultipleActiveResultSets (MARS) turned on, such as `MultipleActiveResultSets=True` in SqlClient, are not decoded past the PRELOGIN. Turn MARS off for the recording.
- Bulk load data sent by BCP or SqlBulkCopy, table-valued parameters and Always Encrypted columns are not decoded.
- SQL Server calls are not mocked by `proxymock mock` and not replayed against a database.

## In Kubernetes {#kubernetes}

When your app runs in Kubernetes with the Speedscale operator, the sidecar records SQL Server calls with the rest of the workload's traffic, with no `--map`. Turn on outbound TLS interception to record encrypted connections; see [Encryption](#encryption). The calls appear on the dashboard's **Traffic** page with the database columns and filters; see [Watch live SQL](../../../guides/databases/watch-live-sql.md).
