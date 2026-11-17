---
title: Database traffic
description: "What Speedscale and proxymock record about each database call your services make: the statement and its bound values, who ran it on which connection, how it ended, and the request that ran it, with no access to the database."
sidebar_position: 7.5
---

# Database traffic

Speedscale records the calls your services make to their databases from the network, the same way it records HTTP and gRPC. It reads the database's own wire protocol, so you see every statement your app actually sent and every answer it got, without database credentials, an agent on the database server, or database logs to turn on.

That is what makes database calls useful far beyond mocking: you can watch them live, find the slow or failing ones, see which request ran them, compare two releases, export them as SQL, and replay them against a database to load or regression test it.

## What is recorded for each call

Every Postgres, MySQL, SQL Server and Oracle call is one request and response pair (RRPair). For SQL Server a call is one SQL batch, one RPC such as `sp_executesql` or a stored procedure called by name, one transaction request, or one attention (cancel). For Oracle a call is one round trip, such as an execute, a fetch, a commit or a cancel, with the server's whole reply. Besides the raw request and response, Speedscale works out these facts and makes each of them something you can filter, group and show as a column:

| Fact | What it holds |
|---|---|
| Statement | The SQL your app sent, such as a whole T-SQL batch. Its **shape** masks literals and parameters, so every execution of one logical statement shares it. |
| Bound values | The parameter values of a prepared statement or RPC, shown filled into the SQL. |
| Operation and tables | The leading command, such as `SELECT` or `UPDATE`, and the tables the statement names. |
| Event | A statement, a login or a logout. |
| User, database, application | Who logged in, to which database, and the client's application name. |
| Session | The server's id for the connection: the Postgres backend pid, the MySQL connection id, the SQL Server session id (SPID) or the Oracle session id (SID). |
| Transaction | Whether the statement ran inside a transaction, and whether that transaction had already failed. |
| Outcome | Rows returned or changed, and warnings. For SQL Server, also the return value and return status of a stored procedure and its informational messages, such as `PRINT` output. |
| Error | The SQLSTATE for Postgres, the error number for MySQL and SQL Server, or the `ORA-` code for Oracle, with its name. SQL Server sends no SQLSTATE, so a well-known error number such as `2627` takes the name of the condition it amounts to, `unique_violation`. Oracle errors keep their `ORA-` code, such as `ORA-00001`, and a well-known one is named after it, `dup_val_on_index`. |
| Attention | Why a call needs a look: cancelled, timeout, deadlock, lock timeout, terminated, cancel request or aborted. |
| Trace id and route | The W3C trace id and the route the app wrote into a SQL comment, which link the statement to the request that ran it. See [Link queries to the request that ran them](../proxymock/databases/link-queries-to-requests.md). |

proxymock and the Speedscale cloud compute these facts the same way, so a filter selects the same calls on your laptop and in the dashboard.

Connection facts (user, database, application, session) need a capture from proxymock or the Speedscale operator at version 2.5.1103 or later. Trace ids and routes need 2.5.1153 or later. In the cloud, traffic indexed before an upgrade keeps the facts it was indexed with.

## Supported databases

| Database | Recorded and mocked | Database facts | Replayed against a database |
|---|---|---|---|
| PostgreSQL | Yes | Yes | Yes |
| MySQL and MariaDB | Yes | Yes | Yes |
| SQL Server, Azure SQL Database, Amazon RDS for SQL Server and Azure SQL Managed Instance | Yes | Yes | Yes |
| Oracle Database | Recorded; mocking is coming | Yes | Coming |
| MongoDB | Yes | No | No |
| Redis and Valkey | Yes | No | No |
| DynamoDB | Yes, as AWS API calls | No | No |

[Technology support](../reference/technology-support.md) lists every protocol.

## How the calls are recorded

- **Locally**, `proxymock record --map` listens on a local port and forwards to the real database, and your app connects to that port. See [Record your database](../proxymock/databases/record/postgresql.md).
- **In Kubernetes**, the Speedscale operator records database calls with the rest of a workload's traffic, through its sidecar or the [eBPF collector](/reference/ebpf-traffic-collection), with no change to the app.

Decoding SQL needs the conversation in clear text where it is recorded. Locally, connect your app to proxymock without TLS for the recording, for example with `sslmode=disable` for Postgres or `ssl-mode=DISABLED` for MySQL. The eBPF collector reads Postgres and MySQL TLS traffic before it is encrypted. SQL Server connections can stay encrypted: proxymock, and the sidecar with outbound TLS interception on, decrypt them; see [Record SQL Server](../proxymock/databases/record/sqlserver.md#encryption). The eBPF collector reads Oracle TCPS traffic from the thin drivers before it is encrypted; Native Network Encryption cannot be read. See [Record Oracle](../proxymock/databases/record/oracle.md#tcps).

SQL Server is recorded through proxymock or the sidecar, which decrypt encrypted connections the way they decrypt HTTPS, when the driver trusts the proxymock or Speedscale certificate authority. The sidecar needs outbound TLS interception for this; without it, a connection that encrypts only its login is recorded without the user and application name, and a fully encrypted one records only its opening handshake. [Record SQL Server](../proxymock/databases/record/sqlserver.md) shows the settings for each driver and the limits.

## Privacy

Recorded statements hold real values: the literals in the SQL, the bound parameters, and the rows that came back. [Data loss prevention](/guides/dlp/creating-rules) rules redact them before they leave your environment, and you can [author and test those rules locally](../proxymock/guides/local-rules.md) with proxymock against your own recordings. The statement shape, which most filters and reports use, never contains a literal value. SQL Server passwords, Windows (SSPI) authentication data and Microsoft Entra ID access tokens are never recorded. Oracle logins are recorded without the encrypted password, session keys, salts or server proof.

## Where to go next

- [Databases in the Speedscale cloud](../guides/databases/index.md): watch, filter and inspect database calls across your services, and mock or replay them.
- [Databases in proxymock](../proxymock/databases/index.md): record, inspect, compare, mock and replay database calls on your own machine.
