---
title: PostgreSQL Load and Regression Testing
description: "Record your app's real PostgreSQL queries once, then replay them against a database to load test it or to catch schema and version regressions, from an AI coding assistant, the proxymock CLI or the Speedscale dashboard."
sidebar_position: 8
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# PostgreSQL Load and Regression Testing

This guide shows how to turn your app's real PostgreSQL traffic into three kinds of test:

- **A quick mock check.** Record once, run your app against a mocked database, and replay your app's own traffic to confirm it still works with no database running.
- **A database regression test.** Replay the recorded queries once against a new schema, a migration or a new PostgreSQL version, and see every statement that now fails.
- **A database load test.** Replay the recorded queries with many concurrent sessions to find out how the database holds up under your app's real query mix.

Every step works two ways. You can ask an AI coding assistant that has the [proxymock MCP server](../how-it-works/mcp-tools.md) installed, or you can run the proxymock CLI yourself. The load and regression steps also work from the Speedscale dashboard for traffic recorded in Kubernetes.

## Before you start {#prerequisites}

- proxymock installed. See [installation](../getting-started/installation.md).
- An app that talks to PostgreSQL. The examples use the `go-postgres` app from the [speedscale/demo](https://github.com/speedscale/demo) repository, but any PostgreSQL client works.
- For the regression and load tests, a PostgreSQL database you can change freely. Replays run real inserts, updates and deletes, so never point them at production.

## Quick start: record, mock and check {#quick-start}

This is the shortest path: get some traffic, run the mock locally, and run a quick replay to check the mock.

**1. Record.** Start the recorder, then start your app with its PostgreSQL port pointed at the recorder:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Record my app's traffic with proxymock. My app listens on port 8080 and talks to PostgreSQL on localhost:5432, so map a local port to it and start my app pointed at that port."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock record --map 15432=localhost:5432 --app-port 8080
```

In a second terminal, start your app against the recorder:

```bash
PGUSER=<user> PGPORT=15432 go run main.go
```

</TabItem>
</Tabs>

Use your app for a minute so it runs its usual queries, for example by calling its API with `curl`. Then stop the recorder. The recording is in the `proxymock` directory: your app's inbound requests, and every PostgreSQL call it made.

**2. Run the mock.** Stop your local PostgreSQL server so nothing else is listening on 5432, then start the mock with your app:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Stop recording and run a proxymock mock server, then start my app against it."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock mock -- go run main.go
```

</TabItem>
</Tabs>

Your app now talks to proxymock on port 5432 as if it were the database.

**3. Check the mock with a replay.** Replay the recorded inbound requests against your app while the mock answers its queries:

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

Every recorded RRPair has a direction. Inbound traffic is what your app received, and outbound traffic is what your app sent, including every PostgreSQL query. By default a replay sends the inbound traffic to your app as tests and serves the outbound traffic as mocks.

To load or regression test the database itself, flip that for the PostgreSQL traffic with a **tests filter**: the recorded queries become the tests, and the database is the system under test. Everything the filter does not match is mocked, and the recorded direction never changes.

| Where you replay | How to choose the tests |
|---|---|
| proxymock CLI | `--tests-filter '(direction IS OUT) AND (tech IS Postgres)'` on `proxymock replay` |
| AI assistant (proxymock MCP) | Ask for it, or pass the `tests-filter` parameter of the `replay_traffic` tool |
| proxymock web | The **Tests filter** field on the Replay tab |
| Speedscale dashboard | **Choose replay tests** in the snapshot's actions menu, then pick the database under **Outbound dependencies** |

To keep your app's inbound tests too, use `(direction IS IN) OR (tech IS Postgres)`. [Choose What a Replay Tests](./choose-replay-tests.md) covers the filter syntax, saving a filter with the workspace, promoting a single file, and the removed **reverse services** setting that tests filters replace.

## Connect to the database {#credentials}

The replay connects to PostgreSQL with its own sessions, so it needs a user and password. Point the replay at the database with a `postgres://` address that includes the host, port and database name, but no credentials. Credentials in the address are rejected so they never end up in shell history or reports.

proxymock reads the user and password the same way `psql` does:

- The `PGUSER` and `PGPASSWORD` environment variables, or a `~/.pgpass` file. An AI assistant runs proxymock through the MCP server, which inherits the environment the assistant was started with, so `~/.pgpass` is the simplest option there.
- The `generator.postgres` section of a test config. It takes `username`, `password`, `database`, `tlsMode` and `connectTimeout`. Use a secret reference such as `${{secret:pg-creds/password}}` for the password, because a literal value is stored with the test config and the report.

```json
{
  "generator": {
    "postgres": {
      "username": "replay",
      "password": "${{secret:pg-creds/password}}",
      "database": "tasks_db",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

Before any load starts, the replay connects once to each database. A wrong password or a missing database stops the replay straight away with the server's error message, instead of failing every statement.

## Regression test the database {#regression}

Replay the recorded queries once against the new version of your database: a migrated schema, a new PostgreSQL major version, or a different instance type. Start from a copy with the same schema your app expects.

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Replay only the recorded Postgres traffic against postgres://localhost:5432/tasks_db once, and list every statement whose result differs from the recording, with the SQL error."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
PGUSER=<user> PGPASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS Postgres)' \
  --test-against postgres://localhost:5432/tasks_db \
  --fail-if "requests.result-match-pct < 100"
```

</TabItem>
</Tabs>

A statement that succeeded when it was recorded but returns an error now is reported under **RESULT MISMATCH** for its query. For example, after dropping a column that the app still writes, every `INSERT` and `UPDATE` that uses it is reported as a result mismatch. The replayed RRPair in the output directory holds the full PostgreSQL error, including its SQLSTATE code, such as `42703` for an undefined column.

The `--fail-if` condition makes the command exit with code 1 when any statement's result changed, which is what you want in CI.

## Load test the database {#load}

Replay the recorded queries with several concurrent sessions for a fixed time:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Load test my Postgres database at postgres://localhost:5432/tasks_db with the recorded Postgres traffic: 10 virtual users for one minute in load-test mode. Summarize latency and failures by query."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
PGUSER=<user> PGPASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS Postgres)' \
  --test-against postgres://localhost:5432/tasks_db \
  --vus 10 --for 1m --load-test
```

</TabItem>
</Tabs>

Each virtual user opens one database session, keeps it for the whole run, and replays the recorded statements in order, so prepared statements carry over from one statement to the next. When a pass through the recording ends inside a transaction, that transaction is rolled back so the next pass starts clean. `--load-test` skips response scoring, which keeps the replay itself light so the database is the bottleneck. The results table shows latency percentiles and throughput for every query, and the **FAILED** column shows how many statements failed, with their share of the total.

While the test runs, the replay's sessions appear in `pg_stat_activity` with `application_name` set to `speedscale-generator`:

```sql
SELECT state, count(*) FROM pg_stat_activity
WHERE application_name = 'speedscale-generator' GROUP BY state;
```

A handful of failures right at the end of a timed run are statements that were still running when the time ran out.

### Regenerate unique values {#regenerate}

To stop recorded unique keys from colliding, add a blueprint that regenerates them. The `postgres_param` extractor picks one parameter of a prepared statement by its placeholder number, so `3` selects `$3`, and a transform such as `rand_string` replaces it on every replay. Save this as `proxymock/blueprints/unique-users.json` in the workspace:

```json
{
  "id": "unique-users",
  "name": "Unique users",
  "tokenizeConfig": {
    "generator": [
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "postgres_param", "config": {"index": "3"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "[a-z0-9]{12}@load\\.test"}}]
      },
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "postgres_param", "config": {"index": "4"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "user-[a-z0-9]{12}"}}]
      }
    ]
  }
}
```

With it, the go-postgres demo's user `INSERT` went from every replayed statement failing with `23505 duplicate key value violates unique constraint` to no mismatches, and each pass wrote new users. You can build the same blueprint in the **Blueprints** editor of `proxymock web`, where the extractor is listed as **Postgres Statement Parameter**. See [postgres_param](/guides/transformation/extractors/postgres_param).

## Replay from the Speedscale dashboard {#dashboard}

For traffic recorded in Kubernetes, you can run the same regression and load tests from the dashboard. You can also upload a local recording with `proxymock cloud push snapshot`.

1. Open the snapshot and choose **Choose replay tests** from its actions menu. The action is available once the snapshot has finished analyzing and is not locked.
2. Select **Outbound dependencies** and check the PostgreSQL database, shown as its host and port with the detected technology. Check **Also keep inbound tests** if you want your app's inbound traffic replayed as well. The dialog previews the filter it will save.
3. Save. The snapshot is reanalyzed, the snapshot page shows the active selection as **Replay tests:** followed by the filter, and the database appears as a service you can replay against. To go back, choose **Inbound traffic (default)** and save.
   A selection that was set outside the dashboard is shown as read-only filter text with a **Reset to default** button.
4. Add the database credentials to the test config's `generator.postgres` section, with the password as a secret reference.
5. Start a replay and target the database's address.

Secrets referenced from `generator.postgres` are not mounted into the replay automatically yet. Add the secret to the replay's `secretRefs` until they are.

## What gets replayed {#what-gets-replayed}

- **Sent:** simple queries, named prepared statements, and executions of prepared or unnamed statements with their recorded parameters.
- **Folded into the execution that follows:** Bind, Describe and unnamed Parse messages.
- **Skipped:** connection startup, TLS negotiation, cancel and terminate messages, which the replay handles itself, plus COPY and function calls.
- **Recorded results:** each replayed statement keeps its command tag, such as `SELECT 13157`, and a sample of up to 20 rows.

## Tips and limits {#limits}

- **Use a disposable database.** Replays change data. Reset it between runs, for example with `TRUNCATE ... RESTART IDENTITY` or by restoring a snapshot.
- **Row ids come from the recording.** Recorded updates and deletes use the row ids from the original database, so on a fresh copy they may match no rows. Repeated inserts can hit unique constraints. These show up as SQL results, not replay failures, and a blueprint can [regenerate the unique values](#regenerate).
- **Transactions across connections.** Recorded traffic mixes statements from many app connections, and a replay does not yet regroup them by connection. A replay can therefore send a `COMMIT` without its `BEGIN`, and proxymock logs a warning when that happens. Workloads that depend on multi-statement transactions are not reproduced faithfully yet.
- **Queries that return a whole table** get slower as a load test inserts more rows. That is real behaviour of your query mix, but reset the data between runs you want to compare.

## Related {#related}

- [Choose What a Replay Tests](./choose-replay-tests.md)
- [PostgreSQL Mocking](./postgres.md)
- [Compare SQL between recordings](./sql-compare.md)
- [proxymock CLI reference](/reference/proxymock-cli-reference)
