---
title: Load and Regression Test a Database
description: "Record your app's real PostgreSQL, MySQL, SQL Server, Oracle or MongoDB traffic once, then replay those exact statements to regression test a schema change or a database upgrade and to load test the database, from an AI coding assistant, the proxymock CLI or the Speedscale dashboard."
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Load and Regression Test a Database

This guide shows how to turn your app's real PostgreSQL, MySQL, SQL Server, Oracle or MongoDB traffic into three kinds of test:

- **A quick mock check.** Record once, run your app against a mocked database, and replay your app's own traffic to confirm it still works with no database running.
- **A database regression test.** Replay the recorded statements once against a new schema, a migration or a new database version, such as PostgreSQL 15 to 16, MySQL 8.0 to 8.4 LTS, SQL Server 2019 to 2022 or MongoDB 7.0 to 8.0, and see every statement that now fails.
- **A database load test.** Replay the recorded statements with many concurrent sessions to find out how the database holds up under your app's real statement mix.

Every step works two ways. You can ask an AI coding assistant that has the [proxymock MCP server](../how-it-works/mcp-tools.md) installed, or you can run the proxymock CLI yourself. The load and regression steps also work from the Speedscale dashboard for traffic recorded in Kubernetes.

Pick your database once in any of the tabs below and every section follows. The MySQL steps also work for MariaDB, which speaks the MySQL protocol. The MySQL replay has been tested against MySQL 8.0, MySQL 8.4 and MariaDB 11.4. The SQL Server replay has been tested against SQL Server 2022 with sessions recorded from mssql-jdbc and Microsoft.Data.SqlClient, and against SQL Server 2025 with TDS 8.0 strict encryption. The Oracle replay has been tested against Oracle AI Database 26ai Free with sessions recorded from JDBC thin, python-oracledb, node-oracledb, go-ora and the ODP.NET managed driver, over TCP and TCPS. The MongoDB replay has been tested against MongoDB 7.0 and 8.0; for MongoDB, "statement" on this page means a command such as `find` or `insert`.

[Watch database replay and testing on YouTube](https://www.youtube.com/watch?v=Q4sIn21pfQc).

<iframe title="Database replay and testing" src="https://www.youtube.com/embed/Q4sIn21pfQc?rel=0&modestbranding=1" width="640" height="360" style={{minHeight: 0}} frameBorder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>

## Before you start {#prerequisites}

- proxymock installed. See [installation](../getting-started/installation.md).
- An app that talks to your database. The examples use the `go-postgres` and `go-mysql` apps from the [speedscale/demo](https://github.com/speedscale/demo) repository; `go-mysql` uses server-side prepared statements and a checkout transaction. The demo repository has no SQL Server or Oracle app, so the SQL Server and Oracle tabs use your own. Any client works.
- For the regression and load tests, a database you can change freely. Replays run real inserts, updates and deletes, so never point them at production.

## Quick start: record, mock and check {#quick-start}

This is the shortest path: get some traffic, run the mock locally, and run a quick replay to check the mock.

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

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

</TabItem>
<TabItem value="mysql" label="MySQL">

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

</TabItem>
<TabItem value="mongodb" label="MongoDB">

**1. Record.** Start the recorder, then start your app with its MongoDB address pointed at the recorder:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Record my app's traffic with proxymock. My app listens on port 8080 and talks to MongoDB on localhost:27017, so map a local port to it and start my app pointed at that port."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock record --map 37017=localhost:27017 --app-port 8080
```

In a second terminal, start your app against the recorder:

```bash
MONGO_URL=mongodb://localhost:37017/app node app.js
```

</TabItem>
</Tabs>

Use your app for a minute so it runs its usual commands. Then stop the recorder. The recording is in the `proxymock` directory: your app's inbound requests, and every MongoDB command it sent. See [Record MongoDB](./record/mongodb.md) for other languages.

**2. Run the mock.** Stop your local MongoDB server so nothing else is listening on 27017, then start the mock with your app:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Stop recording and run a proxymock mock server, then start my app against it."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock mock -- node app.js
```

</TabItem>
</Tabs>

Your app now talks to proxymock on port 27017 as if it were the database.

</TabItem>

<TabItem value="mssql" label="SQL Server">

**1. Record.** Start the recorder, then start your app with its SQL Server connection pointed at the recorder:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Record my app's traffic with proxymock. My app listens on port 8080 and talks to SQL Server on localhost:1433, so map a local port to it and start my app pointed at that port."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock record --map 11433=localhost:1433 --app-port 8080
```

In a second terminal, start your app with its connection string pointed at port 11433, such as `Server=localhost,11433` for SqlClient or `jdbc:sqlserver://localhost:11433` for JDBC.

</TabItem>
</Tabs>

Use your app for a minute so it runs its usual statements, for example by calling its API through the recorder on port 4143 with `curl`. Then stop the recorder. The recording is in the `proxymock` directory: your app's inbound requests, and every SQL batch, RPC and transaction request it sent. [Record SQL Server](./record/sqlserver.md) covers encrypted connections.

**2. Run the mock.** Stop the recorder, then start the mock with your app:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Stop recording and run a proxymock mock server for SQL Server on port 11433, then start my app against it."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock mock --map 11433=mssql://localhost:1433 -- your-app
```

</TabItem>
</Tabs>

Your app now talks to proxymock on port 11433 as if it were the database.

</TabItem>

<TabItem value="oracle" label="Oracle">

**1. Record.** Start the recorder, then start your app with its Oracle connect string pointed at the recorder:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Record my app's traffic with proxymock. My app listens on port 8080 and talks to Oracle on localhost:1521, so map a local port to it and start my app pointed at that port."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock record --map 11521=localhost:1521 --app-port 8080
```

In a second terminal, start your app with its connect string pointed at port 11521 and the same service name, such as `localhost:11521/FREEPDB1` or `jdbc:oracle:thin:@//localhost:11521/FREEPDB1` for JDBC.

</TabItem>
</Tabs>

Use your app for a minute so it runs its usual statements, for example by calling its API through the recorder on port 4143 with `curl`. Then stop the recorder. The recording is in the `proxymock` directory: your app's inbound requests, and every Oracle call it made. [Record Oracle](./record/oracle.md) lists the tested drivers and covers TCPS.

**2. Run the mock.** The Oracle mock needs the password of the user your app logs in as, in the `responder.oracle` section of a test config; see [Record Oracle](./record/oracle.md#mock-password). Stop the recorder, then start the mock with your app:

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Stop recording and run a proxymock mock server for Oracle on port 11521 with my oracle-mock test config, then start my app against it."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock mock --map 11521=localhost:1521 --test-config oracle-mock -- your-app
```

</TabItem>
</Tabs>

Your app now talks to proxymock on port 11521 as if it were the database.

</TabItem>
</Tabs>

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

If every request matches, your app works end to end with no database at all. If some database calls miss their mocks, see [Improve Mock Match Rate with AI](../guides/mock-match-rate.md).

## How proxymock decides what to replay {#choosing-tests}

Every recorded RRPair has a direction. Inbound traffic is what your app received, and outbound traffic is what your app sent, including every database statement. By default a replay sends the inbound traffic to your app as tests and serves the outbound traffic as mocks.

To load or regression test the database itself, flip that for the database traffic with a **tests filter**: the recorded statements become the tests, and the database is the system under test. Everything the filter does not match is mocked, and the recorded direction never changes.

| Where you replay | How to choose the tests |
|---|---|
| proxymock CLI | `--tests-filter '(direction IS OUT) AND (tech IS Postgres)'`, `tech IS MySQL`, `tech IS MongoDB`, `tech IS "SQL Server"` or `tech IS Oracle`, on `proxymock replay` |
| AI assistant (proxymock MCP) | Ask for it, or pass the `tests-filter` parameter of the `replay_traffic` tool |
| proxymock web | The **Tests filter** field on the Replay tab |
| Speedscale dashboard | **Choose replay tests** on the snapshot's **Traffic** tab, then pick the database under **Outbound dependencies** |

To keep your app's inbound tests too, use `(direction IS IN) OR (tech IS Postgres)`, `tech IS MySQL`, `tech IS MongoDB`, `tech IS "SQL Server"` or `tech IS Oracle`. A technology name with a space is quoted. [Choose What a Replay Tests](../guides/choose-replay-tests.md) covers the filter syntax, saving a filter with the workspace, promoting a single file, and the removed **reverse services** setting that tests filters replace.

## Connect to the database {#credentials}

The replay connects to the database with its own sessions, so it needs a user and password. Point the replay at the database with a `postgres://` or `mysql://` address that includes the host, port and database name, a SQL Server address in the drivers' form, `sqlserver://host:port?database=name`, or an Oracle address that names the service, `oracle://host:port/SERVICE`, but no credentials. Credentials in the address are rejected so they never end up in shell history or reports.

For Oracle, use an `oracle://host:port/SERVICE` address. The port defaults to 1521 and the path is the service name; with no path, the replay uses the service the recording connected to. `?ssl=true` connects over TCPS; see [TLS](#tls).

For MongoDB, use a `mongodb://host:port/authdb` address. The path names the database that holds the replay user, as in any MongoDB connection string, and `admin` is used when it is empty. Each command still runs against the database it was recorded on. The address takes only the `tls` and `authSource` parameters, and names one host: `mongodb+srv://` addresses and host lists are rejected, because the replay connects straight to the one server you name.

There are three ways to give the replay its user and password. Pick one by where the replay runs and by how private the password is:

| Option | Works for | Where the password is kept | Use it for |
|---|---|---|---|
| [The database client's environment](#credentials-environment) | proxymock on your machine | On your machine only | Local regression and load tests |
| [A password typed into the test config](#credentials-typed) | proxymock and the Speedscale dashboard | In plain text, in the test config and in every replay report that uses it | A test database whose password is not sensitive |
| [A secret reference in the test config](#credentials-secret) | proxymock and the Speedscale dashboard | In a file in your proxymock workspace, or in a Kubernetes Secret in the cluster the replay runs in. The test config keeps only the reference. | Any password that must stay private |

When more than one is set, the database name and TLS mode in the address win over the test config, and the test config wins over the environment. A SQL Server replay with no database set anywhere connects to the database the recorded app signed in to, and an Oracle replay with no service set anywhere connects to the service the recorded app connected to. MongoDB clients share no standard environment variables, so for MongoDB use option 2 or 3.

### Option 1: the database client's environment {#credentials-environment}

For a replay you run on your own machine, proxymock reads the same settings as the database's command-line client, so nothing is saved with the test config or the report.

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

proxymock reads the user and password the same way `psql` does: the `PGUSER` and `PGPASSWORD` environment variables, or a `~/.pgpass` file. `PGDATABASE`, `PGSSLMODE` and `PGCONNECT_TIMEOUT` work too.

```bash
PGUSER=replay PGPASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS Postgres)' \
  --test-against postgres://localhost:5432/tasks_db
```

An AI assistant runs proxymock through the MCP server, which inherits the environment the assistant was started with, so `~/.pgpass` is the simplest option there.

</TabItem>
<TabItem value="mysql" label="MySQL">

proxymock looks for the user and password in the same places as the `mysql` client: the `MYSQL_USER` and `MYSQL_PWD` environment variables, or the `[client]` section of `~/.my.cnf`, which can also set `database`, `ssl-mode` and `ssl-ca`.

```ini
[client]
user = replay
password = "your-password"
```

An AI assistant runs proxymock through the MCP server, which inherits the environment the assistant was started with, so `~/.my.cnf` is the simplest option there.

</TabItem>
<TabItem value="mongodb" label="MongoDB">

MongoDB clients have no shared environment variables or option file, so proxymock reads MongoDB credentials only from the test config. Use [option 2](#credentials-typed) for a test database, or [option 3](#credentials-secret) to keep the password in a file in your workspace.

</TabItem>

<TabItem value="mssql" label="SQL Server">

proxymock reads the user and password from `MSSQL_USER` and `MSSQL_PASSWORD`, then from the `SQLCMDUSER` and `SQLCMDPASSWORD` variables `sqlcmd` reads. `MSSQL_DATABASE` or `SQLCMDDBNAME` sets the database.

```bash
MSSQL_USER=replay MSSQL_PASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS "SQL Server")' \
  --test-against 'sqlserver://localhost:1433?database=app'
```

To sign in with Microsoft Entra ID instead, as for Azure SQL Database, add `fedauth=ActiveDirectoryDefault` to the address. proxymock then gets a token the way the Azure SDK's default credential does: a service principal from `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_CLIENT_SECRET`, workload identity, a managed identity, or your Azure CLI sign-in.

To sign in with a Windows login, add `authenticator=ntlm` to the address and give the user as `DOMAIN\user` with the domain password, or add `authenticator=krb5` and give the user as the principal, `user@REALM`, with its password. For Kerberos, `krb5-configfile` names the krb5.conf that lists your realm's KDCs (by default `KRB5_CONFIG`, then `/etc/krb5.conf`), `krb5-keytabfile` or `krb5-credcachefile` replaces the password (a ticket from `kinit` in `KRB5CCNAME` works too), and `serverspn` names the server when its service principal is not `MSSQLSvc/<host>:<port>`.

An AI assistant runs proxymock through the MCP server, which inherits the environment the assistant was started with, so start the assistant with these variables set.

</TabItem>

<TabItem value="oracle" label="Oracle">

proxymock reads the user and password from `ORACLE_USER` and `ORACLE_PASSWORD`, and the service name from `ORACLE_SERVICE`.

```bash
ORACLE_USER=replay ORACLE_PASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS Oracle)' \
  --test-against oracle://localhost:1521/FREEPDB1
```

An AI assistant runs proxymock through the MCP server, which inherits the environment the assistant was started with, so start the assistant with these variables set.

</TabItem>
</Tabs>

A replay in a Kubernetes cluster does not read your machine's environment, so for a replay started from the Speedscale dashboard use option 2 or 3.

### Option 2: type the password into the test config {#credentials-typed}

If the database is a test database and its password is test data, you can type the password straight into the test config.

:::warning
A typed password is saved in plain text with the test config and with every replay report that uses it. Anyone in your Speedscale tenant who can open the test config or one of those reports can read it. Never type a production credential here, or a password that also opens any other system. Use [a secret reference](#credentials-secret) for those.
:::

In the Speedscale dashboard:

1. Open the test config you replay with, and select its **Traffic** tab.
2. Under **Database credentials**, select the **Postgres**, **MySQL**, **SQL Server** or **Oracle** tab. On the **SQL Server** tab, **Sign-in** chooses a **SQL Server login** or **Microsoft Entra ID**; with Entra ID there is no username or password to fill in. On the **Oracle** tab, **Database** is the **Service name**, and **CA certificate** and **Client certificate** are for TCPS.
3. Fill in **Username** and **Database**, and set **TLS mode** and **Connect timeout** if you need them. A field left empty falls back to the database client's own default.
4. Under **Password**, select **Constant** and type the password. The field is masked; select the eye icon to show it. A warning above the field reminds you that it is stored in plain text.
5. Save the test config.

When you open the test config again, the **Password** field starts on **Constant** because it holds a typed password. Switching between **Constant** and **Kubernetes secret** clears the field.

The same settings are the `generator.postgres`, `generator.mysql` or `generator.mssql` section of the test config's JSON, which is also how you set them for proxymock. Each section takes `username`, `password`, `database`, `tlsMode` and `connectTimeout`, and `generator.mssql` also takes `authMethod`.

Oracle uses the `generator.oracle` section, where `database` is the service name. It also takes `caCertificate` and `clientCertificate`; see [TLS](#tls). [Record Oracle](./record/oracle.md#replay-credentials) describes every field.

MongoDB uses the `generator.mongodb` section. The dashboard's **Database credentials** form does not show it yet, so in the dashboard edit it in the test config's JSON on the **Advanced** tab. Its `database` is the database that holds the user, `admin` when empty. It also takes `clientCertificate` and `caCertificate`; see [TLS](#tls).

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

```json
{
  "generator": {
    "postgres": {
      "username": "replay",
      "password": "test-only-password",
      "database": "tasks_db",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

</TabItem>
<TabItem value="mysql" label="MySQL">

```json
{
  "generator": {
    "mysql": {
      "username": "replay",
      "password": "test-only-password",
      "database": "app",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

</TabItem>
<TabItem value="mongodb" label="MongoDB">

```json
{
  "generator": {
    "mongodb": {
      "username": "replay",
      "password": "test-only-password",
      "database": "admin",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

</TabItem>

<TabItem value="mssql" label="SQL Server">

```json
{
  "generator": {
    "mssql": {
      "username": "replay",
      "password": "test-only-password",
      "database": "app",
      "tlsMode": "PROTOCOL_TLS_MODE_REQUIRE"
    }
  }
}
```

For Microsoft Entra ID, leave out `username` and `password` and set `"authMethod": "PROTOCOL_AUTH_METHOD_ENTRA_ID"`.

For a Windows login, set `"authMethod"` to `"PROTOCOL_AUTH_METHOD_NTLM"` with `username` as `DOMAIN\user` and the domain password, or to `"PROTOCOL_AUTH_METHOD_KERBEROS"` with `username` as `user@REALM` and its `password` or a `kerberosKeytab` secret holding the base64 keytab. `kerberosConfig` holds the krb5.conf that names the realm's KDCs, and `servicePrincipal` the server's service principal when it is not `MSSQLSvc/<host>:<port>`. The dashboard's test config editor offers both as the SQL Server Sign-in choice.

</TabItem>

<TabItem value="oracle" label="Oracle">

```json
{
  "generator": {
    "oracle": {
      "username": "replay",
      "password": "test-only-password",
      "database": "FREEPDB1",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

</TabItem>
</Tabs>

proxymock also logs a warning when a test config holds a typed password.

### Option 3: a secret reference in the test config {#credentials-secret}

To keep the password out of the test config and out of reports, store it as a secret and put a reference to it in the **Password** field, or in `password` in the JSON, such as `${{secret:pg-creds/password}}`. The reference names the secret and the key inside it. The username and database can be references too.

Where the reference is read from depends on where the replay runs:

| Where the replay runs | What `${{secret:pg-creds/password}}` reads |
|---|---|
| proxymock on your machine | The file `proxymock/secrets/pg-creds/password` in your workspace. See [Secrets](../guides/secrets.md). |
| A Kubernetes cluster: the Speedscale dashboard, `proxymock cloud replay` or `proxymock cluster replay` | The key `password` of the Kubernetes Secret `pg-creds`, in the namespace the replay runs in. Files in `proxymock/secrets` are not uploaded. |

Create the secret first. On your machine, write the password to a file, and keep `proxymock/secrets` out of version control:

```bash
mkdir -p proxymock/secrets/pg-creds
printf '%s' '<password>' > proxymock/secrets/pg-creds/password
```

For a replay in a cluster, create a Kubernetes Secret in the replay namespace:

```bash
kubectl create secret generic pg-creds --from-literal=password='<password>' -n <namespace>
```

In the Speedscale dashboard, select **Kubernetes secret** under **Password**, which is where an empty password starts. Then either type the reference or select **Pick secret** to choose the cluster, namespace, Secret and key from your cluster. The field then holds the reference, not the password. If the Secret does not exist yet, **No secret yet?** shows the `kubectl create secret` command to create it.

With Speedscale v2.5.1371 or later in the cluster, the operator mounts every Secret that `generator.postgres`, `generator.mysql`, `generator.mssql`, `generator.oracle` or `generator.mongodb` references into the replay. If the Secret or the key is missing, the replay stops before it sends any traffic with a message such as `Generator cannot start: Secret pg-creds is missing in namespace ...`. With an older operator, also add the Secret to the replay's `secretRefs`.

### TLS {#tls}

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

Set the TLS mode with `?sslmode=` on the address, with `tlsMode` in the test config, or with `PGSSLMODE`.

</TabItem>
<TabItem value="mysql" label="MySQL">

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

</TabItem>
<TabItem value="mongodb" label="MongoDB">

Turn TLS on with `?tls=true` on the address, which verifies the server's certificate and host name, or set `tlsMode` in the test config. MongoDB has no TLS negotiation, so a connection either uses TLS or it does not:

| Test config `tlsMode` | What it does |
|---|---|
| Unset | Connects without TLS, unless a client or CA certificate is set, which turns on `PROTOCOL_TLS_MODE_VERIFY_FULL` |
| `PROTOCOL_TLS_MODE_DISABLE`, `PROTOCOL_TLS_MODE_ALLOW` or `PROTOCOL_TLS_MODE_PREFER` | Connects without TLS |
| `PROTOCOL_TLS_MODE_REQUIRE` | Always encrypts, without checking the server's certificate |
| `PROTOCOL_TLS_MODE_VERIFY_CA` | Checks that a trusted CA signed the certificate |
| `PROTOCOL_TLS_MODE_VERIFY_FULL` | Also checks that the certificate names the host |

The verifying modes trust the system's certificate authorities, or the PEM certificate in `caCertificate`. MongoDB Atlas requires TLS.

With a `username` and `password`, the replay authenticates with SCRAM, and the server picks SCRAM-SHA-256 or SCRAM-SHA-1. To authenticate with an X.509 certificate instead, leave `password` empty and set `clientCertificate` to the PEM certificate followed by its private key. The user then comes from the certificate's subject, and `username` is optional. Keep the certificate in a secret, because it holds the private key:

```json
{
  "generator": {
    "mongodb": {
      "clientCertificate": "${{secret:mongo-replay/client.pem}}",
      "caCertificate": "${{secret:mongo-replay/ca.pem}}",
      "tlsMode": "PROTOCOL_TLS_MODE_VERIFY_FULL"
    }
  }
}
```

A typed `clientCertificate` is replaced with `REDACTED` in the replay's logs, as a typed password is, but it is still stored with the test config.

</TabItem>

<TabItem value="mssql" label="SQL Server">

Set encryption with `encrypt=` on the address, as in a driver's connection string, or with `tlsMode` in the test config:

| Address | Test config `tlsMode` | What it does |
|---|---|---|
| No `encrypt` (default) | `PROTOCOL_TLS_MODE_PREFER` | Encrypts the whole connection when the server can, without checking its certificate |
| `encrypt=disable` | `PROTOCOL_TLS_MODE_DISABLE` | Never encrypts; a server that requires encryption refuses the login |
| `encrypt=false` | `PROTOCOL_TLS_MODE_ALLOW` | Encrypts only the login, as drivers do with encryption off, unless the server requires more |
| `encrypt=true&trustservercertificate=true` | `PROTOCOL_TLS_MODE_REQUIRE` | Always encrypts, without checking the certificate |
| `encrypt=verify-ca` | `PROTOCOL_TLS_MODE_VERIFY_CA` | Checks that a trusted CA signed the certificate |
| `encrypt=true` | `PROTOCOL_TLS_MODE_VERIFY_FULL` | Also checks that the certificate names the host |

The two verifying modes trust the system's certificate authorities. A SQL Server with no certificate configured uses a self-signed one, which they refuse; use `trustservercertificate=true` for it. `encrypt=strict` opens the connection with TLS before anything else, the TDS 8.0 strict encryption of drivers that support it, and checks the certificate unless `trustservercertificate=true` is set too.

</TabItem>

<TabItem value="oracle" label="Oracle">

Turn on TCPS with `?ssl=true` on the address, as in a go-ora URL, or set `tlsMode` in the test config. `?sslmode=` also takes the libpq-style modes below. Credentials are never accepted in the address.

| Address | Test config `tlsMode` | What it does |
|---|---|---|
| No `ssl` (default), `ssl=false` or `sslmode=disable` | Unset or `PROTOCOL_TLS_MODE_DISABLE` | Connects over plain TCP |
| `ssl=true&ssl_verify=false` or `sslmode=require` | `PROTOCOL_TLS_MODE_REQUIRE`, or `PROTOCOL_TLS_MODE_ALLOW` and `PROTOCOL_TLS_MODE_PREFER`, which Oracle has no match for | Connects over TCPS without checking the server's certificate. go-ora's `SSL Verify=false` works too |
| `sslmode=verify-ca` | `PROTOCOL_TLS_MODE_VERIFY_CA` | Checks that a trusted CA signed the certificate |
| `ssl=true` or `sslmode=verify-full` | `PROTOCOL_TLS_MODE_VERIFY_FULL` | Also checks that the certificate names the host |

The verifying modes trust the system's certificate authorities, or the PEM certificates in `caCertificate`. For a server that asks for a client certificate, set `clientCertificate` to the PEM certificate followed by its private key, and keep it in a secret.

The replay cannot use Oracle Native Network Encryption or checksumming. A database that requires them refuses the replay with a clear error, so connect over TCPS instead.

</TabItem>
</Tabs>

Before any load starts, the replay connects once to each database. A wrong password or a missing database stops the replay straight away with the server's error message, such as `1045` for a MySQL access denied, `18456` for a SQL Server login failure, `ORA-01017` for an Oracle login failure or `AuthenticationFailed` for MongoDB, instead of failing every statement.

## Regression test the database {#regression}

Replay the recorded statements once against the new version of your database: a migrated schema, a new database release, or a different instance type. Start from a database in the state the recording expects, for example a copy with the same schema, or a copy restored from the dump you recorded against.

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

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

</TabItem>
<TabItem value="mysql" label="MySQL">

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

</TabItem>
<TabItem value="mongodb" label="MongoDB">

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Replay only the recorded MongoDB traffic against mongodb://localhost:27017/admin once, and list every command whose result differs from the recording, with the MongoDB error."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

Create a workspace test config with `proxymock test-config new mongo-replay`, add the `generator.mongodb` section from [Connect to the database](#credentials) to `proxymock/testconfigs/mongo-replay.json`, then pass that test config:

```bash
proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS MongoDB)' \
  --test-against mongodb://localhost:27017/admin \
  --test-config mongo-replay \
  --fail-if "requests.result-match-pct < 100"
```

</TabItem>
</Tabs>

A command that succeeded when it was recorded but fails now is reported under **RESULT MISMATCH** for its command and collection, such as `insert` on `shop.orders`. A MongoDB command counts as failed when its reply has `ok: 0`, or when a write was rejected with `writeErrors` or `writeConcernError`, even though the command itself ran. The replayed RRPair in the output directory holds the server's reply, including `code`, `codeName` and `errmsg`.

For example, a recording of an app that inserts 30 orders, pages through them with `find` and three `getMore`s, and then inserts and updates an order in a transaction replays against an empty MongoDB 8.0 replica set with every command matching. Replaying it a second time without restoring the database reports both inserts as result mismatches with code `11000` for a duplicate key, as [Regenerate unique values](#regenerate) explains. The transaction's insert fails, so the server aborts the transaction, and its update and `commitTransaction` fail with `251 NoSuchTransaction`.

</TabItem>

<TabItem value="mssql" label="SQL Server">

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Replay only the recorded SQL Server traffic against sqlserver://localhost:1433?database=app once, and list every statement whose result differs from the recording, with the SQL Server error."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
MSSQL_USER=<user> MSSQL_PASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS "SQL Server")' \
  --test-against 'sqlserver://localhost:1433?database=app&encrypt=true&trustservercertificate=true' \
  --fail-if "requests.result-match-pct < 100"
```

</TabItem>
</Tabs>

A statement that succeeded when it was recorded but returns an error now is reported under **RESULT MISMATCH** for its SQL. The replayed RRPair in the output directory holds the full SQL Server error with its number, state and severity, such as `207` for an invalid column name.

For example, sessions recorded from mssql-jdbc and Microsoft.Data.SqlClient, replayed against a fresh SQL Server 2022 with the same schema, returned the recorded rows, row counts and errors for every statement, including the `2627` duplicate key error the app expected, with encryption off, on the login only and on the whole connection.

</TabItem>

<TabItem value="oracle" label="Oracle">

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Replay only the recorded Oracle traffic against oracle://localhost:1521/FREEPDB1 once, and list every statement whose result differs from the recording, with the ORA- error."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
ORACLE_USER=<user> ORACLE_PASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS Oracle)' \
  --test-against oracle://localhost:1521/FREEPDB1 \
  --fail-if "requests.result-match-pct < 100"
```

To keep the password out of your shell, put it in `generator.oracle` as a secret reference instead and add `--test-config` with that test config; see [Connect to the database](#credentials).

</TabItem>
</Tabs>

A statement that succeeded when it was recorded but returns an error now is reported under **RESULT MISMATCH** for its SQL. The replayed RRPair in the output directory holds the Oracle error with its `ORA-` code, such as `ORA-00904` for an invalid identifier.

For example, sessions recorded from JDBC thin, python-oracledb, node-oracledb, go-ora and the ODP.NET managed driver against Oracle AI Database 26ai Free replayed against it with identical results, over TCP and over TCPS.

</TabItem>
</Tabs>

The `--fail-if` condition makes the command exit with code 1 when any statement's result changed, which is what you want in CI.

## Load test the database {#load}

Replay the recorded statements with several concurrent sessions for a fixed time:

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

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

</TabItem>
<TabItem value="mysql" label="MySQL">

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

</TabItem>
<TabItem value="mongodb" label="MongoDB">

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Load test my MongoDB server at mongodb://localhost:27017/admin with the recorded MongoDB traffic: 10 virtual users for one minute in load-test mode. Summarize latency and failures by command."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS MongoDB)' \
  --test-against mongodb://localhost:27017/admin \
  --test-config mongo-replay \
  --vus 10 --for 1m --load-test
```

</TabItem>
</Tabs>

</TabItem>

<TabItem value="mssql" label="SQL Server">

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Load test my SQL Server database at sqlserver://localhost:1433?database=app with the recorded SQL Server traffic: 10 virtual users for one minute in load-test mode. Summarize latency and failures by statement."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
MSSQL_USER=<user> MSSQL_PASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS "SQL Server")' \
  --test-against 'sqlserver://localhost:1433?database=app&encrypt=true&trustservercertificate=true' \
  --vus 10 --for 1m --load-test
```

</TabItem>
</Tabs>

</TabItem>

<TabItem value="oracle" label="Oracle">

<Tabs groupId="interface">
<TabItem value="ai" label="AI assistant">

> "Load test my Oracle database at oracle://localhost:1521/FREEPDB1 with the recorded Oracle traffic: 10 virtual users for one minute in load-test mode. Summarize latency and failures by statement."

</TabItem>
<TabItem value="cli" label="proxymock CLI">

```bash
ORACLE_USER=<user> ORACLE_PASSWORD=<password> proxymock replay \
  --tests-filter '(direction IS OUT) AND (tech IS Oracle)' \
  --test-against oracle://localhost:1521/FREEPDB1 \
  --vus 10 --for 1m --load-test
```

</TabItem>
</Tabs>

</TabItem>
</Tabs>

Each virtual user opens one database session, keeps it for the whole run, and replays the recorded statements in order, so prepared statements carry over from one statement to the next. A SQL Server session prepares each statement once, however many recorded connections prepared it. An Oracle virtual user opens one session for each driver in the recording, and connects it the way that driver connected. When a pass through the recording ends inside a transaction, that transaction is rolled back so the next pass starts clean. `--load-test` skips response scoring, which keeps the replay itself light so the database is the bottleneck. The results table shows latency percentiles and throughput for every statement, and the **FAILED** column shows how many statements failed, with their share of the total.

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

While the test runs, the replay's sessions appear in `pg_stat_activity` with `application_name` set to `speedscale-generator`:

```sql
SELECT state, count(*) FROM pg_stat_activity
WHERE application_name = 'speedscale-generator' GROUP BY state;
```

</TabItem>
<TabItem value="mysql" label="MySQL">

On a laptop, the demo's recording replayed by 5 virtual users for 15 seconds sent 61,800 statements, about 4,100 a second, with none failing to send. Two kinds of result mismatch showed up, and both are worth reading:

- **`1062` Duplicate entry** on the user `INSERT`. Every virtual user replays the same recorded usernames, so after the first one the rest collide. See [Regenerate unique values](#regenerate) to send a fresh value each time.
- **`1213` Deadlock found when trying to get lock** on the checkout's `UPDATE`. Concurrent checkouts for the same user insert an order, which takes a lock on the user row through the foreign key, and then update that row. Under load, MySQL resolves the deadlock by rolling one transaction back. That is a real finding about the app: its checkout needs a retry, or it should take the row lock first.

While the test runs, each virtual user holds one session, and the sessions carry the program name `speedscale-generator`. Count them as a user that can read `performance_schema`:

```sql
SELECT count(*) FROM performance_schema.session_connect_attrs
WHERE attr_name = 'program_name' AND attr_value = 'speedscale-generator';
```

</TabItem>
<TabItem value="mongodb" label="MongoDB">

For MongoDB, each virtual user opens its own client to the server, which holds one connection for commands and one for server monitoring. Every recorded logical session gets one live session of its own on that client. A cursor's `getMore` and a transaction's commands therefore run on the session that opened them, as the server requires, even when the recording interleaves many app sessions. When a pass ends, the replay aborts any transaction the pass left open and closes the cursors it left open.

On a laptop, the recording from the regression example replayed by 5 virtual users for 10 seconds sent about 51,500 commands, about 5,100 a second, with none failing to send. The inserts and the transaction failed after the first pass, for the duplicate `_id` reason above.

While the test runs, the replay's connections carry the app name `speedscale-generator`, two for each virtual user. Count them from `mongosh` as a user that can run `$currentOp`:

```javascript
db.getSiblingDB("admin").aggregate([
  { $currentOp: { allUsers: true, idleConnections: true } },
  { $match: { appName: "speedscale-generator" } },
  { $count: "connections" }
])
```

</TabItem>

<TabItem value="mssql" label="SQL Server">

On a laptop, the mssql-jdbc and SqlClient sessions replayed by 10 virtual users for 15 seconds in load-test mode sent 142,707 requests to SQL Server 2022 in Docker, about 9,500 a second, with none failing.

While the test runs, each virtual user holds one session, and the sessions carry the program name `speedscale-generator`:

```sql
SELECT status, count(*) FROM sys.dm_exec_sessions
WHERE program_name = 'speedscale-generator' GROUP BY status;
```

</TabItem>

<TabItem value="oracle" label="Oracle">

Sessions recorded from the five tested drivers, replayed by 4 virtual users for 30 seconds against Oracle AI Database 26ai Free, ran with 0 failed requests.

</TabItem>
</Tabs>

A handful of failures right at the end of a timed run are statements that were still running when the time ran out.

### Regenerate unique values {#regenerate}

To stop recorded unique keys from colliding, add a blueprint that regenerates them. An extractor picks one parameter of a prepared statement, and a transform such as `rand_string` replaces it on every replay. Save the blueprint as `proxymock/blueprints/unique-users.json` in the workspace.

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

The `postgres_param` extractor picks the parameter by its placeholder number, so `3` selects `$3`:

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

</TabItem>
<TabItem value="mysql" label="MySQL">

The `mysql_param` extractor picks the parameter by its position, counting the `?` placeholders from 1:

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

</TabItem>
<TabItem value="mongodb" label="MongoDB">

MongoDB drivers generate each document's `_id` in the app, so the recording holds the exact `_id`s the app inserted. Every pass, and every virtual user, sends those same `_id`s again, so after the first insert the rest fail with `E11000 duplicate key error`, code `11000`, unless a transform rewrites them. There is no MongoDB extractor like `postgres_param` or `mysql_param` yet, so for now replay a regression test once against a freshly restored database, and expect duplicate key failures on repeated inserts in a load test.

</TabItem>

<TabItem value="mssql" label="SQL Server">

The `mssql_param` extractor picks a value an RPC binds to its statement, by its position counting from 1, so `@P0` of an `sp_executesql` is 1, or by its name with `"name": "@email"`:

```json
{
  "id": "unique-users",
  "name": "Unique users",
  "tokenizeConfig": {
    "generator": [
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "mssql_param", "config": {"index": "3"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "[a-z0-9]{12}@load\\.test"}}]
      },
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "mssql_param", "config": {"index": "4"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "user-[a-z0-9]{12}"}}]
      }
    ]
  }
}
```

The new value keeps the parameter's type. With a blueprint like this, an `INSERT` that failed with `2627` on every replay because the recorded code was already in the table succeeded, from both JDBC and SqlClient recordings. See [mssql_param](/guides/transformation/extractors/mssql_param).

</TabItem>

<TabItem value="oracle" label="Oracle">

The `oracle_param` extractor picks a value an Oracle statement execution binds, by its position counting from 1, so `:1` is 1, or by its name with `"name": ":email"`:

```json
{
  "id": "unique-users",
  "name": "Unique users",
  "tokenizeConfig": {
    "generator": [
      {
        "filters": {"filters": [{"include": true, "detectedLocation": "INSERT INTO users", "operator": "CONTAINS"}]},
        "extractor": {"type": "oracle_param", "config": {"name": ":email"}},
        "transforms": [{"type": "rand_string", "config": {"pattern": "[a-z0-9]{12}@load\\.test"}}]
      }
    ]
  }
}
```

The new value keeps the bind's type. See [oracle_param](/guides/transformation/extractors/oracle_param).

</TabItem>
</Tabs>

## Replay from the Speedscale dashboard {#dashboard}

For traffic recorded in Kubernetes, you can run the same regression and load tests from the dashboard. You can also upload a local recording with `proxymock cloud push snapshot`.

1. Open the snapshot's **Traffic** tab and select **Choose replay tests**. The action is available once the snapshot has finished analyzing and is not locked.
2. Select **Outbound dependencies** and check the database, shown as its host and port with the detected technology. Check **Also keep inbound tests** if you want your app's inbound traffic replayed as well. The dialog previews the filter it will save.
3. Save. The snapshot is reanalyzed, the snapshot page shows the active selection as **Replay tests:** followed by the filter, and the database appears as a service you can replay against. To go back, choose **Inbound traffic (default)** and save. A selection that was set outside the dashboard is shown as read-only filter text with a **Reset to default** button.
4. Give the replay the database user and password in the test config's **Database credentials** section, on its **Traffic** tab. For a test database whose password is test data you can type the password there; otherwise pick a Kubernetes Secret. See [Connect to the database](#credentials) for both options.
5. Start a replay and target the database's address.

## What gets replayed {#what-gets-replayed}

<Tabs groupId="engine">
<TabItem value="postgres" label="PostgreSQL">

- **Sent:** simple queries, named prepared statements, and executions of prepared or unnamed statements with their recorded parameters.
- **Folded into the execution that follows:** Bind, Describe and unnamed Parse messages.
- **Skipped:** connection startup, TLS negotiation, cancel and terminate messages, which the replay handles itself, plus COPY and function calls.
- **Recorded results:** each replayed statement keeps its command tag, such as `SELECT 13157`, and a sample of up to 20 rows.

</TabItem>
<TabItem value="mysql" label="MySQL">

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

</TabItem>
<TabItem value="mongodb" label="MongoDB">

| Recorded command | What the replay does |
|---|---|
| Any OP_MSG command, such as `find`, `insert`, `update`, `delete`, `aggregate` or `findAndModify` | Sends the recorded command against its recorded `$db`, without the recorded `lsid`, `$clusterTime`, `txnNumber` and `$readPreference`, which the replay's own driver supplies |
| Commands sent as an OP_MSG document sequence, such as the documents of an `insert` | Sends them as one command |
| `getMore` and `killCursors` | Sends them with the live cursor id that the replayed `find` or `aggregate` returned. Skipped when the replay holds no live cursor for them, for example after the live cursor returned everything in its first batch |
| A transaction: `startTransaction`, the commands with `autocommit: false`, `commitTransaction` and `abortTransaction` | Runs the transaction on the live session that stands in for the recorded one. A transaction command whose start was not replayed is skipped |
| `hello`, `isMaster`, `saslStart`, `saslContinue`, `ping`, `buildInfo`, `getLastError`, `endSessions` and other handshake, authentication and monitoring commands | Skipped: the replay manages its own connections and sessions |
| Change streams (`$changeStream`) and tailable or `awaitData` cursors | Skipped, and counted apart in the `streams_skipped` metric. proxymock logs one warning per virtual user when a recording holds them |
| Legacy OP_QUERY commands | Skipped |

Each replayed command keeps the server's reply, with cursor batches cut to the first 20 documents. The fields a server fills in for every reply, such as `$clusterTime`, `operationTime` and `electionId`, are left out, and a cursor id shows the recorded id that the live cursor stands in for.

</TabItem>

<TabItem value="mssql" label="SQL Server">

| Recorded request | What the replay does |
|---|---|
| SQL batch | Sends it in the session's transaction and reads every result |
| `sp_executesql`, and a stored procedure called by name | Sends the call with its recorded parameters |
| `sp_prepare`, `sp_prepexec` | Prepares the statement once per session; a later `sp_prepexec` of the same SQL runs as `sp_execute` of the session's handle |
| `sp_execute` | Runs the statement with the session's handle and the recorded values; if the session has no handle for it, runs the same SQL as `sp_executesql` |
| `sp_unprepare` | Skipped: the session keeps its handles until it closes |
| Transaction begin, commit, rollback and savepoint requests | Sends them |
| PRELOGIN and login | Skipped: the replay manages its own connections |
| A request the app cancelled, and its attention | Sends the attention after as long as the request ran in the recording, so a query timeout or a cancel happens again |
| Server cursors: `sp_cursoropen`, `sp_cursorprepare`, `sp_cursorexecute`, `sp_cursorprepexec`, `sp_cursorfetch` and `sp_cursorclose` | Sends them with the live cursor and prepared handles that the replayed open or prepare returned |
| Bulk load, from BCP or SqlBulkCopy | Sends the recorded rows |
| Table-valued parameters | Sends them with their recorded rows |
| A MARS session | Replays each session's requests in that session's order, with its own statement handles, cursors and transaction |
| Always Encrypted parameters | Sends the recorded ciphertext. The session asks for column encryption as the recorded app did, and an encrypted parameter names the live server's column encryption key, learned from the replayed `sp_describe_parameter_encryption` calls |

Each replayed request keeps its row counts, return status and output parameters, messages and errors, and a sample of up to 20 rows per result set.

</TabItem>

<TabItem value="oracle" label="Oracle">

| Recorded call | What the replay does |
|---|---|
| Statement executions, including array binds | Sends them with the recorded bind values |
| PL/SQL calls with OUT binds, REF CURSORs and implicit results | Sends them, and maps each cursor the server returns to the recorded one |
| Fetches and LOB reads | Sends them on the replay session's own cursor or LOB locator in place of the recorded one |
| Commits and rollbacks | Sends them |
| The connection's handshake and login | Replays each recorded driver's own handshake, one session per driver. A recording with no login connects as go-ora does |
| A call on a cursor or LOB opened before recording started | Skipped, except an execute that names its SQL, which is parsed again and run |

Each replayed call's result is compared with its recording as for the other databases: the result code, the row count and the rows.

</TabItem>
</Tabs>

## Tips and limits {#limits}

- **Use a disposable database.** Replays change data. Reset it between runs, for example with `TRUNCATE ... RESTART IDENTITY` in PostgreSQL, by restoring a dump with `mongorestore --drop` for MongoDB, or by restoring a snapshot.
- **Row ids come from the recording.** Recorded updates and deletes use the row ids from the original database, so on a fresh copy they may match no rows, and repeated inserts can hit unique constraints. In MySQL, auto-increment ids can also differ once concurrent inserts fail and use up ids, so recorded foreign keys may point at rows that do not exist and fail with `1452`. These show up as SQL results, not replay failures. Start regression tests from a copy of the recorded database, and a blueprint can [regenerate the unique values](#regenerate).
- **Transactions across connections.** Recorded traffic mixes statements from many app connections, and a replay does not yet regroup them by connection. A replay can therefore send a `COMMIT` without its `BEGIN` or `START TRANSACTION`, and proxymock logs a warning when that happens. Workloads that depend on multi-statement transactions are not reproduced faithfully yet.
- **Always Encrypted replays need the same keys.** The replay sends the ciphertext the app sent, so the database must hold the same column encryption keys, such as a restored copy of the recorded one. A key created again with the same value works when the recording holds the `sp_describe_parameter_encryption` calls the app made, because the replay learns the new key's identity from them. An app that cached its parameter descriptions before the recording started sends no such calls.
- **MySQL and SQL Server statements prepared before recording started** are skipped, because the recording does not hold their SQL. Oracle calls on a cursor or LOB opened before recording started are skipped too, except an execute that names its SQL. Start recording before your app opens its connections.
- **Insert ids and timestamps differ from the recording** on every run. They do not count as mismatches: a statement's result is scored by whether it succeeded, not by the values it returned.
- **MongoDB replies compare without server bookkeeping.** Cluster time, operation time, election ids and the other fields a server fills in for every reply differ on every run, so they are left out when a recorded reply is compared with a replayed one, and live cursor ids are compared as the recorded ids they stand in for. A command whose result did not change therefore matches its recording with no assertion config. The raw recorded reply still holds those fields.
- **MongoDB replays connect to one server.** The replay talks straight to the host in the recording or in the address, without discovering the rest of a replica set, so point it at the primary for writes and transactions. Transactions need a replica set or a sharded cluster, not a standalone server.
- **Queries that return a whole table** get slower as a load test inserts more rows. That is real behaviour of your query mix, but reset the data between runs you want to compare.

## Related {#related}

- [Choose What a Replay Tests](../guides/choose-replay-tests.md)
- [Record PostgreSQL](./record/postgresql.md), [Record MySQL](./record/mysql.md), [Record SQL Server](./record/sqlserver.md), [Record Oracle](./record/oracle.md) and [Record MongoDB](./record/mongodb.md)
- [Compare SQL between runs](./sql-compare.md)
- [proxymock CLI reference](/reference/proxymock-cli-reference)
