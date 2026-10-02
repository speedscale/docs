---
title: "Agent tutorial 3: record traffic"
description: "Your coding agent uses the record-traffic skill to record the tutorial app's inbound requests, its CNCF API calls and its Postgres queries into a recording named baseline."
sidebar_position: 4
sidebar_label: "3. Record traffic"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Chapter 3: Record traffic

Your agent records everything the app receives and sends while the traffic driver runs. Every later chapter replays this recording.

Time: 1 to 2 minutes.

## Prompt

<Tabs groupId="language">
<TabItem value="golang" label="Go">

```text
Use the record-traffic skill to record the tutorial app in mock-lab/tutorial/go while its traffic driver runs, including its Postgres and CNCF API calls. Name the recording baseline.
```

</TabItem>
<TabItem value="java" label="Java">

```text
Use the record-traffic skill to record the tutorial app in mock-lab/tutorial/java while its traffic driver runs, including its Postgres and CNCF API calls. Name the recording baseline.
```

</TabItem>
<TabItem value="python" label="Python">

```text
Use the record-traffic skill to record the tutorial app in mock-lab/tutorial/python while its traffic driver runs, including its Postgres and CNCF API calls. Name the recording baseline.
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

```text
Use the record-traffic skill to record the tutorial app in mock-lab/tutorial/node while its traffic driver runs, including its Postgres and CNCF API calls. Name the recording baseline.
```

</TabItem>
</Tabs>

## What the agent does

The `record-traffic` skill:

- Starts the app under `proxymock record` with `--map 15432=postgres://localhost:5432` and `DATABASE_URL` pointed at port 15432, so proxymock sits between the app and Postgres. Outbound HTTPS to the CNCF API goes through proxymock's proxy on port 4140.
- Waits for `/healthz` on port 4143, proxymock's inbound port, which forwards to the app on 8080.
- Runs the traffic driver against `http://localhost:4143` so proxymock sees every inbound request.
- Names the recording `proxymock/recorded-baseline`, following the skill's `recorded-<name>` convention.
- Counts what was captured per host and endpoint, then summarizes it with `proxymock report` (the `proxymock-summarize-recording` skill).
- Stops proxymock and the app and leaves Postgres running.

## What you should see

The capture, by directory, and the skill's `### Result` block. Trimmed:

```text
| Directory                    | What it holds                  | Pairs |
|------------------------------|--------------------------------|-------|
| localhost/                   | Inbound requests to the app    | 136   |
| demo-api.trafficreplay.com/  | CNCF API calls over HTTPS      | 70    |
| localhost-5432/              | Postgres messages              | 1,075 |

### Result
- **Ran:** `proxymock record --out proxymock/recorded-baseline --map 15432=postgres://localhost:5432 --app-port 8080 --app-health-endpoint /healthz -- go run .` in mock-lab/tutorial/go, traffic from `go run ./cmd/traffic http://localhost:4143`
- **Outcome:** complete
- **Numbers:** 136 inbound pairs across 6/6 endpoints; outbound hosts 1/1 (demo-api.trafficreplay.com, 70 pairs); databases 1/1 (Postgres, 1,075 pairs); 8 error-status pairs (6 inbound 4xx + 2 upstream 404, all expected)
- **Artifacts:** mock-lab/tutorial/go/proxymock/recorded-baseline/ (5.5 MB, includes proxymock.log)
- **Next:** proxymock-regression-test — "make a regression gate for the tutorial app from the baseline recording"
```

The inbound count is 136 because the skill's own readiness check is recorded with the driver's 135 requests. The error statuses are the driver's bad requests and two unknown projects, so they are expected. The `proxymock report` summary scores the recording for performance, reliability and security. Its security findings are the `Server` header from the CNCF API and the email addresses in the demo orders.

The counts differ a little by language. The Java recording, for example, holds 1,095 Postgres pairs instead of 1,075, because the JDBC driver sends its own session setup.

Follow the Result's **Next** line later. Chapters 4 and 5 tune the mocks and tests first, so the regression test in chapter 6 is trustworthy.

## If it goes wrong

- **The agent says `record-traffic` is not a loaded skill.** Your skills are an older copy. Install them again as in [Start here](./index.md), then restart the agent.
- **Java: every catalog call returns `502 catalog unavailable` and the app log shows `PKIX path validation failed`.** The Java truststore proxymock injects is older than its certificate. Rebuild it with `proxymock admin certs --jks`, with `JAVA_HOME` set to your JDK, then delete the partial recording and record again.
- **The database is on another port.** If you set `TUTORIAL_DB_PORT` in chapter 2, map to that port: `--map 15432=postgres://localhost:<port>`.

See [PostgreSQL](../guides/postgres.md) for how `--map` records a database, and [Java with proxymock](../guides/java.md) for JVM proxy and truststore settings.

<details>
<summary>Manual equivalent</summary>

Run proxymock with the app in one terminal and the traffic driver in another. Stop proxymock with ctrl-c when the driver finishes.

<Tabs groupId="language">
<TabItem value="golang" label="Go">

```bash
cd mock-lab/tutorial/go
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-baseline \
  --map 15432=postgres://localhost:5432 \
  --app-port 8080 --app-health-endpoint /healthz -- go run .
# second terminal
go run ./cmd/traffic http://localhost:4143
```

</TabItem>
<TabItem value="java" label="Java">

```bash
cd mock-lab/tutorial/java
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-baseline \
  --map 15432=postgres://localhost:5432 \
  --app-port 8080 --app-health-endpoint /healthz -- java -jar target/tutorial-orders.jar
# second terminal
./mvnw -q compile exec:java -Dexec.args="http://localhost:4143"
```

</TabItem>
<TabItem value="python" label="Python">

```bash
cd mock-lab/tutorial/python
source .venv/bin/activate
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-baseline \
  --map 15432=postgres://localhost:5432 \
  --app-port 8080 --app-health-endpoint /healthz -- python app.py
# second terminal
python traffic.py http://localhost:4143
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

```bash
cd mock-lab/tutorial/node
DATABASE_URL='postgres://tutorial:tutorial@localhost:15432/tutorial?sslmode=disable' \
  proxymock record --out proxymock/recorded-baseline \
  --map 15432=postgres://localhost:5432 \
  --app-port 8080 --app-health-endpoint /healthz -- node server.js
# second terminal
node traffic.mjs http://localhost:4143
```

</TabItem>
</Tabs>

Then summarize the recording:

```bash
proxymock report --in proxymock/recorded-baseline --format prompt
```

</details>

## Next

[Chapter 4: Tune the mocks](./tune-the-mocks.md)
