---
title: MySQL Load and Regression Testing
description: "Record your app's real MySQL traffic with proxymock, then replay those exact statements to regression test a schema change or a MySQL upgrade and to load test the database, from an AI assistant, the CLI or the Speedscale dashboard."
sidebar_position: 8.5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MySQL Load and Regression Testing

This guide shows how to turn your app's real MySQL traffic into three kinds of test:

- **A quick mock check.** Record once, run your app against a mocked database, and replay your app's own traffic to confirm it still works with no database running.
- **A database regression test.** Replay the recorded statements once against a new schema, a migration or a new MySQL version, such as a move from 8.0 to 8.4 LTS, and see every statement that now fails.
- **A database load test.** Replay the recorded statements with many concurrent sessions to find out how the database holds up under your app's real statement mix.

Every step works two ways. You can ask an AI coding assistant that has the [proxymock MCP server](../how-it-works/mcp-tools.md) installed, or you can run the proxymock CLI yourself. The load and regression steps also work from the Speedscale dashboard for traffic recorded in Kubernetes.

The same steps work for MariaDB, which speaks the MySQL protocol. The replay has been tested against MySQL 8.0, MySQL 8.4 and MariaDB 11.4.

## Before you start {#prerequisites}

- proxymock installed. See [installation](../getting-started/installation.md).
- An app that talks to MySQL. The examples use the `go-mysql` app from the [speedscale/demo](https://github.com/speedscale/demo) repository, which uses server-side prepared statements and a checkout transaction, but any MySQL client works.
- For the regression and load tests, a MySQL database you can change freely. Replays run real inserts, updates and deletes, so never point them at production.

## Quick start: record, mock and check {#quick-start}

This is the shortest path: get some traffic, run the mock locally, and run a quick replay to check the mock.

**1. Record.** Start the recorder, then start your app with its MySQL port pointed at the recorder:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Record my app's traffic with proxymock. My app listens on port 8080 and talks to MySQL on localhost:3306, so map a local port to it and start my app pointed at that port."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock record --map 13306=localhost:3306 --app-port 8080
```

In a second terminal, start your app against the recorder:

```bash
MYSQL_PORT=13306 go run .
```

</TabItem>
</Tabs>

Use your app for a minute so it runs its usual statements, for example by calling its API through the recorder on port 4143 with `curl`. Then stop the recorder. The recording is in the `proxymock` directory: your app's inbound requests, and every MySQL command it sent, including each prepared statement's prepare, execute and close.

**2. Run the mock.** Stop the recorder, then start the mock with your app:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Stop recording and run a proxymock mock server for MySQL on port 13306, then start my app against it."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock mock --map 13306=localhost:3306 -- env MYSQL_PORT=13306 go run .
```

</TabItem>
</Tabs>

Your app now talks to proxymock on port 13306 as if it were the database.

**3. Check the mock with a replay.** Replay the recorded inbound requests against your app while the mock answers its statements:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Replay the recorded traffic against my app on localhost:8080 with the mock server running, and tell me whether every response matched and whether every database call hit a mock."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock replay --test-against http://localhost:8080
```

</TabItem>
</Tabs>

If every request matches, your app works end to end with no database at all. If some database calls miss their mocks, see [Improve Mock Match Rate with AI](./mock-match-rate.md).

## How proxymock decides what to replay {#choosing-tests}

Every recorded RRPair has a direction. Inbound traffic is what your app received, and outbound traffic is what your app sent, including every MySQL statement. By default a replay sends the inbound traffic to your app as tests and serves the outbound traffic as mocks.

To load or regression test the database itself, flip that for the MySQL traffic with a **tests filter**: the recorded statements become the tests, and the database is the system under test. Everything the filter does not match is mocked, and the recorded direction never changes.

| Where you replay | How to choose the tests |
|---|---|
| proxymock CLI | `--tests-filter '(direction IS OUT) AND (tech IS MySQL)'` on `proxymock replay` |
| AI assistant (proxymock MCP) | Ask for it, or pass the `tests-filter` parameter of the `replay_traffic` tool |
| proxymock web | The **Tests filter** field on the Replay tab |
| Speedscale dashboard | **Choose replay tests** in the snapshot's actions menu, then pick the database under **Outbound dependencies** |

To keep your app's inbound tests too, use `(direction IS IN) OR (tech IS MySQL)`. [Choose What a Replay Tests](./choose-replay-tests.md) covers the filter syntax, saving a filter with the workspace, and promoting a single file.

## Connect to the database {#credentials}

The replay connects to MySQL with its own sessions, so it needs a user and password. Point the replay at the database with a `mysql://` address that includes the host, port and database name, but no credentials. Credentials in the address are rejected so they never end up in shell history or reports.

proxymock looks for the user and password in the same places as the `mysql` client:

- The `MYSQL_USER` and `MYSQL_PWD` environment variables.
- The `[client]` section of `~/.my.cnf`, which can also set `database`, `ssl-mode` and `ssl-ca`. An AI assistant runs proxymock through the MCP server, which inherits the environment the assistant was started with, so `~/.my.cnf` is the simplest option there.
- The `generator.mysql` section of a test config. It takes `username`, `password`, `database`, `tlsMode` and `connectTimeout`. Use a secret reference such as `${{secret:mysql-creds/password}}` for the password, because a literal value is stored with the test config and the report.

```ini
[client]
user = replay
password = "your-password"
```

```json
{
  "generator": {
    "mysql": {
      "username": "replay",
      "password": "${{secret:mysql-creds/password}}",
      "database": "app",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

Settings in the address win over the test config, which wins over the environment and `~/.my.cnf`.

### TLS {#tls}

Set the TLS mode with `?ssl-mode=` on the address, for example `mysql://db.internal:3306/app?ssl-mode=VERIFY_IDENTITY`, or with `tlsMode` in the test config. The modes are the ones the `mysql` client uses:

| ssl-mode | Test config `tlsMode` | What it does |
|---|---|---|
| `PREFERRED` (default) | `PROTOCOL_TLS_MODE_PREFER` | Encrypts when the server offers TLS, and connects without it otherwise |
| `DISABLED` | `PROTOCOL_TLS_MODE_DISABLE` | Never encrypts |
| `REQUIRED` | `PROTOCOL_TLS_MODE_REQUIRE` | Always encrypts, without checking the server's certificate |
| `VERIFY_CA` | `PROTOCOL_TLS_MODE_VERIFY_CA` | Checks that a trusted CA signed the certificate |
| `VERIFY_IDENTITY` | `PROTOCOL_TLS_MODE_VERIFY_FULL` | Also checks that the certificate names the host |

The two verifying modes trust the system's certificate authorities, or the file named by `ssl-ca` in `~/.my.cnf`. For Amazon RDS or Aurora, download the RDS certificate bundle and name it there.

MySQL 8.4 authenticates with `caching_sha2_password` by default. Over TLS the password is sent inside the encrypted connection. Without TLS, proxymock asks the server for its public key and encrypts the password with it, as `mysql --get-server-public-key` does.

Before any load starts, the replay connects once to each database. A wrong password or a missing database stops the replay straight away with the server's error message, such as `1045` for access denied, instead of failing every statement.

## Regression test the database {#regression}

Replay the recorded statements once against the new version of your database: a migrated schema, a new MySQL release, or a different instance type. Start from a database in the state the recording expects, for example a copy restored from the dump you recorded against.

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Replay only the recorded MySQL traffic against mysql://localhost:3306/app once, and list every statement whose result differs from the recording, with the MySQL error."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
MYSQL_USER=<user> MYSQL_PWD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS MySQL)' \
  --test-against mysql://localhost:3306/app \
  --fail-if "requests.result-match-pct < 100"
```

</TabItem>
</Tabs>

A statement that succeeded when it was recorded but returns an error now is reported under **RESULT MISMATCH** for its SQL. Prepared statements are listed by their SQL, once for the prepare and once for the execute.

For example, the demo recorded on MySQL 8.4 replays against a fresh MySQL 8.0 with no mismatches. After a migration renames the `order_count` column that the app still uses, the same replay reports every `SELECT` and `UPDATE` that names it:

```
│ UPDATE users SET order_count = order_count + 1 WHERE id = ?  │ StatementExecute │ 7 │ ... │ 100% │
...
1 EVALS FAILED
 ✘ failed eval "requests.result-match-pct < 100.00" - observed requests.result-match-pct was 71.43
```

The replayed RRPair in the output directory holds the full MySQL error, including its number and SQLSTATE, here `1054` with the message `Unknown column 'order_count' in 'field list'`.

The `--fail-if` condition makes the command exit with code 1 when any statement's result changed, which is what you want in CI.

## Load test the database {#load}

Replay the recorded statements with several concurrent sessions for a fixed time:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Load test my MySQL database at mysql://localhost:3306/app with the recorded MySQL traffic: 10 virtual users for one minute in load-test mode. Summarize latency and failures by statement."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
MYSQL_USER=<user> MYSQL_PWD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS MySQL)' \
  --test-against mysql://localhost:3306/app \
  --vus 10 --for 1m --load-test
```

</TabItem>
</Tabs>

Each virtual user opens one database session, keeps it for the whole run, and replays the recorded statements in order, so prepared statements carry over from one statement to the next. When a pass through the recording ends inside a transaction, that transaction is rolled back so the next pass starts clean. `--load-test` skips response scoring, which keeps the replay itself light so the database is the bottleneck. The results table shows latency percentiles and throughput for every statement, and the **FAILED** column shows how many statements could not be sent, with their share of the total.

On a laptop, the demo's recording replayed by 5 virtual users for 15 seconds sent 61,800 statements, about 4,100 a second, with none failing to send. Two kinds of result mismatch showed up, and both are worth reading:

- **`1062` Duplicate entry** on the user `INSERT`. Every virtual user replays the same recorded usernames, so after the first one the rest collide. See [Regenerate unique values](#regenerate) to send a fresh value each time.
- **`1213` Deadlock found when trying to get lock** on the checkout's `UPDATE`. Concurrent checkouts for the same user insert an order, which takes a lock on the user row through the foreign key, and then update that row. Under load, MySQL resolves the deadlock by rolling one transaction back. That is a real finding about the app: its checkout needs a retry, or it should take the row lock first.

While the test runs, each virtual user holds one session, and the sessions carry the program name `speedscale-generator`. Count them as a user that can read `performance_schema`:

```sql
SELECT count(*) FROM performance_schema.session_connect_attrs
WHERE attr_name = 'program_name' AND attr_value = 'speedscale-generator';
```

A handful of failures right at the end of a timed run are statements that were still running when the time ran out.

### Regenerate unique values {#regenerate}

To stop recorded unique keys from colliding, add a blueprint that regenerates them. The `mysql_param` extractor picks one parameter of a prepared statement by its position, counting the `?` placeholders from 1, and a transform such as `rand_string` replaces it on every replay. Save this as `proxymock/blueprints/unique-users.json` in the workspace:

```json
{
  "id": "unique-users",
  "name": "Unique users",
  "tokenizeConfig": {
    "generator": [
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "mysql_param", "config": {"index": "3"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "[a-z0-9]{12}@load\\.test"}}]
      },
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "mysql_param", "config": {"index": "4"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "user-[a-z0-9]{12}"}}]
      }
    ]
  }
}
```

With it, the demo's user `INSERT` went from nearly every statement failing with `1062` to no mismatches, and each pass wrote new users. You can build the same blueprint in the **Blueprints** editor of `proxymock web`, where the extractor is listed as **MySQL Statement Parameter**. See [mysql_param](/guides/transformation/extractors/mysql_param).

## Replay from the Speedscale dashboard {#dashboard}

For traffic recorded in Kubernetes, you can run the same regression and load tests from the dashboard. You can also upload a local recording with `proxymock cloud push snapshot`.

1. Open the snapshot and choose **Choose replay tests** from its actions menu. The action is available once the snapshot has finished analyzing and is not locked.
2. Select **Outbound dependencies** and check the MySQL database, shown as its host and port with the detected technology. Check **Also keep inbound tests** if you want your app's inbound traffic replayed as well. The dialog previews the filter it will save.
3. Save. The snapshot is reanalyzed, the snapshot page shows the active selection as **Replay tests:** followed by the filter, and the database appears as a service you can replay against.
4. Add the database credentials to the test config's `generator.mysql` section, with the password as a secret reference.
5. Start a replay and target the database's address.

Secrets referenced from `generator.mysql` are not mounted into the replay automatically yet. Add the secret to the replay's `secretRefs` until they are.

## What gets replayed {#what-gets-replayed}

| Recorded command | What the replay does |
|---|---|
| Query (`COM_QUERY`), including several statements in one query | Sends it and reads every result |
| Statement prepare | Prepares it on the session, or reuses the same SQL if the session already has it open |
| Statement execute | Runs the prepared statement with the recorded parameters, preparing it first if needed |
| Statement close | Closes the statement |
| Change of default database (`COM_INIT_DB`) and ping | Sends it |
| Handshake, authentication, quit, change user, reset connection | Skipped: the replay manages its own connections |
| `LOAD DATA LOCAL`, cursor fetches, long data | Skipped for now |

Each replayed statement keeps its OK packet (affected rows, insert id and warnings) or its error, and a sample of up to 20 rows.

## Tips and limits {#limits}

- **Use a disposable database.** Replays change data. Reset it between runs, for example by restoring a dump.
- **Row ids come from the recording.** Recorded statements use the ids the original database handed out. On a fresh copy, auto-increment ids can differ, especially once concurrent inserts fail and use up ids, so recorded foreign keys may point at rows that do not exist and fail with `1452`. Start regression tests from a copy of the recorded database.
- **Statements prepared before recording started** are skipped, because the recording does not hold their SQL. Start recording before your app opens its connections.
- **Transactions across connections.** Recorded traffic mixes statements from many app connections, and a replay does not yet regroup them by connection. A replay can therefore send a `COMMIT` without its `START TRANSACTION`, and proxymock logs a warning when that happens.
- **Insert ids and timestamps differ from the recording** on every run. They do not count as mismatches: a statement's result is scored by whether it succeeded, not by the values it returned.

## Related {#related}

- [Choose What a Replay Tests](./choose-replay-tests.md)
- [MySQL Mocking](./mysql.md)
- [PostgreSQL Load and Regression Testing](./postgres-load-testing.md)
- [Compare SQL between recordings](./sql-compare.md)
- [proxymock CLI reference](/reference/proxymock-cli-reference)
