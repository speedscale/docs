---
title: "Agent tutorial 2: run the demo app"
description: "Your coding agent clones mock-lab, starts the tutorial app's Postgres with Docker Compose, runs the app, and sends it the tutorial traffic once."
sidebar_position: 3
unlisted: true
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
Clone https://github.com/speedscale/mock-lab and open tutorial/go. Start its Postgres with docker compose, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave Postgres running.
```

</TabItem>
<TabItem value="java" label="Java">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/java. Start its Postgres with docker compose, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave Postgres running.
```

</TabItem>
<TabItem value="python" label="Python">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/python. Start its Postgres with docker compose, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave Postgres running.
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

```text
Clone https://github.com/speedscale/mock-lab and open tutorial/node. Start its Postgres with docker compose, run the app, and send it the tutorial traffic once to check it works. Then stop the app and leave Postgres running.
```

</TabItem>
</Tabs>

## What the agent does

This chapter uses no skill. The agent reads the app's README and follows it:

- Clones mock-lab and reads `tutorial/<language>/README.md` and `tutorial/compose.yaml`.
- Checks that Docker is running and that ports 5432 and 8080 are free. If Docker Desktop is stopped, it starts it.
- Runs `docker compose up -d --wait` from `tutorial/`. Postgres 16 starts on port 5432 with the schema from `contract/schema.sql`.
- Builds and starts the app on port 8080, then runs the language's traffic driver, which sends 135 requests: health checks, catalog lookups, 40 orders with their reads, order lists, and a few bad requests that expect 400, 404 and 422.
- Stops the app and leaves Postgres running for the next chapters.

## What you should see

The agent's summary. Trimmed:

```text
The Go tutorial app works: the tutorial traffic sent 135 requests and got 0 unexpected responses. The app is now stopped and Postgres is still running.

- Postgres: I ran `docker compose up -d --wait` from `tutorial/`. The container `tutorial-postgres-1` (image `postgres:16`) is healthy on the default port 5432 ...
- App: ... It logged `tutorial-orders (go) listening on :8080 version=v1 slow=false`, and `/healthz` answered.
- Traffic: `go run ./cmd/traffic` printed `sent 135 requests, 0 unexpected`. The `orders` table now holds 40 rows. ...
- Stopped the app: I killed the process, and nothing is listening on port 8080 now.
```

The line that matters is `sent 135 requests, 0 unexpected`. The traffic driver prints one line for each response with an unexpected status.

## If it goes wrong

- **Docker is not running.** Start Docker Desktop, or ask the agent to start it, and run the prompt again.
- **Port 5432 is already in use.** Set `TUTORIAL_DB_PORT` to a free port before `docker compose up -d`, and point `DATABASE_URL` at that port, for example `postgres://tutorial:tutorial@localhost:5433/tutorial?sslmode=disable`. In later chapters, use the same port wherever a command maps to `localhost:5432`.

<details>
<summary>Manual equivalent</summary>

```bash
git clone https://github.com/speedscale/mock-lab
cd mock-lab/tutorial
docker compose up -d --wait
```

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

Stop the app with ctrl-c and leave Postgres running.

</details>

## Next

[Chapter 3: Record traffic](./record-traffic.md)
