---
title: "Agent tutorial 2: run the demo app"
description: "Your coding agent clones mock-lab, starts the tutorial app's Postgres with tutorial-db (no Docker), runs the app, and sends it the tutorial traffic once."
sidebar_position: 3
sidebar_label: "2. Run the demo app"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Chapter 2: Run the demo app

Your agent clones mock-lab, starts the app and its database, and checks that the app answers all of the tutorial traffic.

Time: about 1 to 2 minutes.

## Prompt

Pick your language. The prompt is the same except for the directory.

<Tabs groupId="language">
<TabItem value="golang" label="Go">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/go. Start its database with tutorial-db as the README describes, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave the database running.
```

</TabItem>
<TabItem value="java" label="Java">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/java. Start its database with tutorial-db as the README describes, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave the database running.
```

</TabItem>
<TabItem value="python" label="Python">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/python. Start its database with tutorial-db as the README describes, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave the database running.
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/node. Start its database with tutorial-db as the README describes, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave the database running.
```

</TabItem>
</Tabs>

## What the agent does

This chapter uses no skill. The agent reads the app's README and follows it:

- Clones mock-lab and reads `tutorial/README.md` and `tutorial/<language>/README.md`.
- Starts `tutorial-db` in the background from `tutorial/`: `go -C db run .` when Go is installed, otherwise the prebuilt binary for your OS, downloaded once from the mock-lab release. It runs a real Postgres 16 as an ordinary process, with no Docker, on port 54329 with the schema from `contract/schema.sql`. The first start downloads about 30 MB of Postgres into `tutorial/.tutorial-db/`.
- Builds and starts the app on port 8080, then runs the language's traffic driver, which sends 135 requests: health checks, catalog lookups, 40 orders with their reads, order lists, and a few bad requests that expect 400, 404 and 422.
- Stops the app and leaves the database running for the next chapters.

## What you should see

The agent's summary reports three things. The database started:

```text
tutorial-db: ready on localhost:54329
DATABASE_URL=postgres://tutorial:tutorial@localhost:54329/tutorial?sslmode=disable
```

The app started and logged `tutorial-orders (go) listening on :8080 version=v1 slow=false`, with your language in place of `go`.

The traffic driver finished:

```text
sent 135 requests, 0 unexpected
```

That last line is the one that matters. The traffic driver prints one line for each response with an unexpected status. Afterwards the `orders` table holds 40 rows.

## If it goes wrong

- **`port 54329 is in use ... already running`.** A `tutorial-db` from an earlier attempt is still running. Use it, or stop it with `tutorial-db -stop`.
- **`port 54329 is in use` for another reason.** Start `tutorial-db -port <free port>` and point `DATABASE_URL` at that port. In later chapters, use the same port wherever a command maps to `localhost:54329`.
- **The first start is slow or fails to download.** It fetches about 30 MB of Postgres binaries from Maven Central once. Check your network or proxy, then start it again.

<details>
<summary>Manual equivalent</summary>

```bash
git clone https://github.com/speedscale/mock-lab
cd mock-lab/tutorial
go -C db run .           # terminal 1: runs until ctrl-c
```

Without Go, download `tutorial-db` once instead, as `tutorial/README.md` shows for each OS, and run `./tutorial-db` (or `.\tutorial-db.exe` on Windows).

Then run the app and, in a second terminal, the traffic driver:

<Tabs groupId="language">
<TabItem value="golang" label="Go">

```bash
cd go
go run .                 # terminal 1
go run ./cmd/traffic     # terminal 2
```

</TabItem>
<TabItem value="java" label="Java">

```bash
cd java
./mvnw -q package
java -jar target/tutorial-orders.jar                                 # terminal 1
./mvnw -q compile exec:java -Dexec.args="http://localhost:8080"      # terminal 2
```

</TabItem>
<TabItem value="python" label="Python">

```bash
cd python
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
source .venv/bin/activate
python app.py            # terminal 1
python traffic.py        # terminal 2
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

```bash
cd node
npm ci
node server.js           # terminal 1
node traffic.mjs         # terminal 2
```

</TabItem>
</Tabs>

Stop the app with ctrl-c and leave the database running.

</details>

## Next

[Chapter 3: Record traffic](./record-traffic.md)
