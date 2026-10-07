---
title: Database traffic
description: "What Speedscale and proxymock record about each database call your services make: the statement and its bound values, who ran it on which connection, how it ended, and the request that ran it, with no access to the database."
sidebar_position: 7.5
---

# Database traffic

Speedscale records the calls your services make to their databases from the network, the same way it records HTTP and gRPC. It reads the database's own wire protocol, so you see every statement your app actually sent and every answer it got, without database credentials, an agent on the database server, or database logs to turn on.

That is what makes database calls useful far beyond mocking: you can watch them live, find the slow or failing ones, see which request ran them, compare two releases, export them as SQL, and replay them against a database to load or regression test it.

## What is recorded for each call

Every Postgres and MySQL call is one request and response pair (RRPair). Besides the raw request and response, Speedscale works out these facts and makes each of them something you can filter, group and show as a column:

| Fact | What it holds |
|---|---|
| Statement | The SQL your app sent. Its **shape** masks literals and parameters, so every execution of one logical statement shares it. |
| Bound values | The parameter values of a prepared statement, shown filled into the SQL. |
| Operation and tables | The leading command, such as `SELECT` or `UPDATE`, and the tables the statement names. |
| Event | A statement, a login or a logout. |
| User, database, application | Who logged in, to which database, and the client's application name. |
| Session | The server's id for the connection: the Postgres backend pid or the MySQL connection id. |
| Transaction | Whether the statement ran inside a transaction, and whether that transaction had already failed. |
| Outcome | Rows returned or changed, and warnings. |
| Error | The SQLSTATE for Postgres or the error number for MySQL, with its name. |
| Attention | Why a call needs a look: cancelled, timeout, deadlock, lock timeout, terminated, cancel request or aborted. |
| Trace id and route | The W3C trace id and the route the app wrote into a SQL comment, which link the statement to the request that ran it. See [Link queries to the request that ran them](../proxymock/databases/link-queries-to-requests.md). |

proxymock and the Speedscale cloud compute these facts the same way, so a filter selects the same calls on your laptop and in the dashboard.

Connection facts (user, database, application, session) need a capture from proxymock or the Speedscale operator at version 2.5.1103 or later. Trace ids and routes need 2.5.1153 or later. In the cloud, traffic indexed before an upgrade keeps the facts it was indexed with.

## Supported databases

| Database | Recorded and mocked | Database facts | Replayed against a database |
|---|---|---|---|
| PostgreSQL | Yes | Yes | Yes |
| MySQL and MariaDB | Yes | Yes | Yes |
| MongoDB | Yes | No | No |
| Redis and Valkey | Yes | No | No |
| DynamoDB | Yes, as AWS API calls | No | No |

[Technology support](../reference/technology-support.md) lists every protocol.

## How the calls are recorded

- **Locally**, `proxymock record --map` listens on a local port and forwards to the real database, and your app connects to that port. See [Record your database](../proxymock/databases/record/postgresql.md).
- **In Kubernetes**, the Speedscale operator records database calls with the rest of a workload's traffic, through its sidecar or the [eBPF collector](/reference/ebpf-traffic-collection), with no change to the app.

Decoding SQL needs the conversation in clear text where it is recorded. Locally, connect your app to proxymock without TLS for the recording, for example with `sslmode=disable` for Postgres or `ssl-mode=DISABLED` for MySQL. The eBPF collector reads TLS traffic before it is encrypted.

## Privacy

Recorded statements hold real values: the literals in the SQL, the bound parameters, and the rows that came back. [Data loss prevention](/guides/dlp/creating-rules) rules redact them before they leave your environment, and you can [author and test those rules locally](../proxymock/guides/local-rules.md) with proxymock against your own recordings. The statement shape, which most filters and reports use, never contains a literal value.

## Where to go next

- [Databases in the Speedscale cloud](../guides/databases/index.md): watch, filter and inspect database calls across your services, and mock or replay them.
- [Databases in proxymock](../proxymock/databases/index.md): record, inspect, compare, mock and replay database calls on your own machine.
