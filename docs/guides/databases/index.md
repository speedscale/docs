---
title: Databases
description: "See every statement your services send to PostgreSQL and MySQL, who ran it and how it ended, without database access: filter and inspect database calls in the Speedscale dashboard, then mock the database or replay its traffic against one."
sidebar_label: Overview
---

# Databases

Speedscale records the calls your services make to their databases, from the network, alongside the rest of their traffic. You get the statements your app actually sent in production or staging, with their bound values, who ran them, and how they ended, with no database credentials, no agent on the database server and no slow query log to turn on.

That turns database traffic into something you can use:

- **See what your services ask of the database.** Every statement, per service and over time, instead of a sample or a guess from the code.
- **Find the calls that matter.** Narrow millions of calls to the failing, slow, deadlocked or cancelled ones, or to one user, session or table.
- **Understand a single call.** The SQL with its values filled in, the error with its name, and what else ran on the same connection.
- **Test without the database, or test the database.** Mock the database so a service runs with no database at all, or replay the recorded statements against a database to regression test a migration or load test it.

[Database traffic](../../concepts/database-traffic.md) explains what is recorded for each call and which databases are supported.

## Watch database traffic

On the **Traffic** page, filter to a database protocol or add any **Database** filter and the grid switches to the **Database** columns: event, statement, application, user, database, session, duration, rows and status. The database icon in the grid toolbar switches between these columns and the default ones. Statements read as their shape, with values masked, so repeats of one statement line up. With a relative time range the grid follows new calls as they arrive, and the **Template** menu switches between common questions such as slow statements, errors, locks and logins. See [Watch live SQL](./watch-live-sql.md).

![The Traffic grid with the Database columns on for a service that talks to Postgres: Logout, Error, Login and Statement events, statement shapes such as DELETE FROM records WHERE id = ?, the JDBC driver as application, user traffic, database coverage, the session, duration, rows and status, with a 42P01 error and a purple bar marking statements inside a transaction](./overview/database-columns.png)

## Find database calls

The filter builder has a **Database** group. Each fact is its own filter:

| Filter | Example |
|---|---|
| Application, DB user, Database, Session | Every call one service account made, or everything on one connection |
| Transaction, Event | Statements inside a failed transaction, or every login |
| SQL operation, Table, Statement shape | Every `DELETE`, every call that touches `orders`, or every execution of one statement |
| Error, Attention, Rows | Every `40P01` deadlock, every timeout, or every query that returned more than 1,000 rows |

The value pickers offer the values in your traffic, and errors show with their names, such as `23505 · unique_violation`.

![The filter builder's filter type list, showing Trace ID and then the Database group: Application, DB user, Database, Session, Transaction, Event, SQL operation, Table, Statement shape, Error, Attention, Rows and Route](./overview/database-filters.png)

## Inspect a database call

Open any database call to see:

- The statement with its bound values filled in, so you can copy it into `psql` or `mysql`.
- How it ended: rows and command tags, or an error card with the SQLSTATE or MySQL error number, its name and the position in the SQL.
- Why it needs attention: a cancel, a timeout, a deadlock, a lock timeout or a terminated session. For a deadlock, a lock timeout, a timeout or a cancel, the drawer also lists the statements that were running at the same time, which is usually where the cause is.
- The login that opened the connection, and whether the statement ran inside a transaction.
- The **Connection** tab: every call on the same database connection in order, grouped into transactions with how each one ended.
- The result sets the database returned.

Every database fact in the drawer is also a one-click filter or exclusion. See [Inspect a statement](./inspect-a-statement.md).

![The Request tab of a Postgres Execute call: the statement DELETE FROM records WHERE id = $1 shown With values as DELETE FROM records WHERE id = 'postgres-138205', and its Parameters table with $1, varchar, postgres-138205](./overview/statement-values.png)

![The Response tab of a failed call: an error card reading relation records does not exist, 42P01, undefined_table, with a caret under the table name in the statement, and the call's database facts as one-click filters below it](./overview/error-card.png)

![The login card of a Postgres connection: user traffic, database coverage, application PostgreSQL JDBC Driver, auth SCRAM-SHA-256, the session, the server version and the client address, with the facts as one-click filters](./overview/login-card.png)

![The Connection tab: 32 requests on the same connection in order, from the login through inserts, selects, updates, a committed transaction marked in green, deletes and the logout, with the selected statement highlighted](./overview/connection.png)

## Link queries to the request that ran them

A database call says which inbound request ran it, and an inbound request counts the statements it ran and filters to them, linked exactly by the trace id your app writes into its SQL comments or otherwise by timing. See [Link queries to the request that ran them](./link-queries-to-requests.md).

## Export a SQL script

**Export SQL** on the Traffic page, or **Export as .sql** on a call's Connection tab, downloads the recorded statements as a `.sql` script with their values filled in, ready to run against a scratch database. See [Export a SQL script](./export-sql-script.md).

## See a snapshot's database schema

A snapshot with database traffic shows the tables and columns its statements read and write, inferred from the traffic, so you can see what a service depends on without access to the database. See [Inferred database schema](./inferred-schema.md).

## Mock a database

A snapshot serves recorded database responses as mocks, so a service runs in a replay without its database. [Mock a database](./mock-a-database.md) explains what a SQL mock matches on and the transforms that tune it.

## Load and regression test a database

Choose the database as the replay target and the recorded statements become the tests: replay them once against a migrated schema or a new version to see every statement that now fails, or with many sessions to load test the database. See [Load and Regression Test a Database](../../proxymock/databases/load-and-regression-testing.md#dashboard).

## Develop locally

proxymock records, inspects, compares, mocks and replays database traffic on your own machine with the same facts and filters. See [Databases in proxymock](../../proxymock/databases/index.md).
