---
title: Inspect a statement
description: "Open a recorded PostgreSQL, MySQL, SQL Server or Oracle call in proxymock web to see the statement with its bound values, who ran it, how it ended or why it failed, the request that caused it, and every other call on the same database connection."
---

# Inspect a statement

Every database call proxymock records opens in a detail view that answers the questions you would otherwise ask the database: what exactly ran, with which values, for whom, how it ended, and what else that connection was doing. Select any Postgres, MySQL, SQL Server or Oracle call in the Requests grid or the [Live SQL](./watch-live-sql.md) lens to open it.

## Info: who ran it and where it came from

The **Database** section at the top of the Info tab gathers what proxymock knows about the call:

- **caused by** names the inbound request that ran it, marked **by trace id** when the app wrote that request's trace id into the statement's SQL comment and **by time** when proxymock inferred it from timing. Select it to open that request. See [Link queries to the request that ran them](./link-queries-to-requests.md).
- **user**, **database** and **session** say who ran it on which connection. **Connection** opens the Connection tab.
- **transaction** says whether the statement ran inside a transaction, and whether that transaction had already failed.
- **event**, **operation**, **table**, **rows** and **statement** describe the call. The statement is its shape, with values masked, so it is the same for every execution of one statement.
- **route** and **trace** come from the SQL comment, when the app writes one.

Each fact has a filter and an exclude button, which add it to the Requests filters.

![The Database section of a call's Info tab: caused by POST /orders, my-app, by trace id; user demo, database shop, session 75 with a Connection link, transaction active, event statement, operation INSERT, table order_items, rows 1, the statement shape, route /orders and the trace id, each with filter and exclude buttons](./inspect-a-statement/database-facts.png)

## Request: the SQL with its values

The **Statement** view of the Request tab shows the SQL the call ran. A prepared statement arrives with placeholders and its values separately, so proxymock shows both:

- **SQL** shows the statement as the app sent it, with `$1`, `?`, `@p1` or `:1` placeholders.
- **With values** fills the bound values in as literals, so you can copy the statement into `psql`, `mysql` or `sqlcmd` and run it. SQL Server values are written as T-SQL, such as `N'text'` for a string and `0x0A1B` for binary.
- **Parameters** lists each placeholder with its type and value.

A value proxymock could not decode, or a statement that was prepared before recording started, is marked as such rather than guessed.

![The Request tab's Statement view with With values selected: INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (2, 2, 1, 59) with its SQL comment, and a Parameters table listing $1 int4 2, $2 int4 2, $3 int4 1 and $4 numeric 59](./inspect-a-statement/statement-values.png)

## SQL Server calls

A SQL Server call is one SQL batch, one RPC or one transaction request:

- A batch shows its full T-SQL text, which can hold several statements and return several result sets.
- An `sp_executesql` or `sp_prepexec` call shows the SQL it carries with its typed parameters. An `sp_execute` call shows the SQL its handle was prepared with.
- A stored procedure called by name shows the procedure and its parameters, and its response shows the rows, the return value and the return status.
- Informational messages, such as `PRINT` output and `RAISERROR` at severity 10 or below, appear with the response.
- `BEGIN`, `COMMIT` and `ROLLBACK`, whether sent as T-SQL or as the driver's transaction requests, mark the transaction on the Connection tab.

## Oracle calls

An Oracle call is one round trip from the driver and the server's whole reply to it:

- An execute shows its full SQL text, or a PL/SQL block, with its bind values. A re-execute that names only a cursor shows the SQL the cursor was opened with.
- A fetch shows the rows it returned, with every column decoded to its type, such as `NUMBER`, `DATE`, `TIMESTAMP`, a LOB, `JSON` or `VECTOR`.
- A commit or rollback, whether sent as SQL or as the driver's own call, marks the transaction on the Connection tab.
- A cancel shows the break the driver sent and the reset that answered it.

## Response: how it ended

The top of the Response tab says how the call ended:

- A successful call shows what it did, such as `INSERT 0 1` or the rows it returned. Writes return no rows, so this is where an `UPDATE` or `DELETE` says how many rows it changed.
- A failed call shows an error card with the message, the SQLSTATE, the MySQL or SQL Server error number or the Oracle `ORA-` code, and its name, the objects the server named, and the line of SQL the server pointed at with a caret under the position.
- A call that was cancelled, timed out, deadlocked, waited too long for a lock or was terminated shows why, and lists what other sessions were running at the same time, which is usually where the cause is.
- A login shows who connected to which database, the client application, the authentication method and the server version. For a SQL Server connection recorded without TLS interception whose driver encrypted the login packet, the user and application are not known; see [Record SQL Server](./record/sqlserver.md#encryption).

The **Result sets** view shows each table the query returned as a grid.

## Connection: everything that connection did

The **Connection** tab lists every call on the same database connection in order, from the login to the logout, with the selected one highlighted. Calls inside a transaction are grouped with a colored bar and a number, and a chip above the list says how each transaction ended (committed, rolled back, failed, ended or still open), how long it took and how long the client held it open without running anything.

Use it to see what led up to a failed or slow statement, whether a transaction held locks while the app did something else, and in what order a request's statements really ran. **Export as .sql** downloads the connection's statements as a script; see [Export a SQL script](./export-sql-script.md).

![The Connection tab: 45 requests on this connection, a chip reading #1 committed, 7.243 ms, 0.579 ms idle, Export as .sql, and the connection's calls in order from the login through selects, a transaction marked #1 in green from BEGIN through inserts and updates to COMMIT with the selected INSERT highlighted, and a pg_sleep call after it](./inspect-a-statement/connection.png)

## Related

- [Watch live SQL](./watch-live-sql.md)
- [Database traffic](../../concepts/database-traffic.md)
- [Inspect a statement in the Speedscale dashboard](../../guides/databases/inspect-a-statement.md)
