---
title: Replay a Speedscale Cloud Snapshot Locally
sidebar_position: 1.5
description: "Pull an existing Speedscale Cloud snapshot with proxymock, mock its dependencies, and replay its requests against an app on your laptop."
keywords: [CLI, proxymock, cloud snapshot, local replay, pull snapshot, speedctl]
---

# Replay a Speedscale Cloud Snapshot Locally

Use this path when the traffic is already in a Speedscale Cloud snapshot and you want to test a version of your app on your laptop. proxymock pulls the snapshot into your application repository, serves its dependency responses as mocks, and sends its recorded requests to your local app.

## Before you begin

- [Install proxymock CLI](../getting-started/installation.md). If speedctl already uses your enterprise tenant's credentials, [reuse the shared configuration](/getting-started/command-line-tools/#credentials); a second initialization is unnecessary.
- Have access to the tenant that owns the snapshot. Free local activation alone does not grant that access. If needed, [initialize with your enterprise account](./initialize.md#enterprise-account). If you already activated proxymock with another account, follow the [configuration replacement steps](./initialize.md#replace-credentials); `proxymock init --api-key` alone keeps an existing configuration.
- Copy the snapshot ID from the Speedscale dashboard. Open the snapshot's actions menu to copy its ID.
- Prepare a local version of the app and know its listening port. The example below uses `8080`; replace it with your port.

Run these commands from your application repository so the downloaded recordings and replay results stay with that app.

## 1. Pull the snapshot {#pull}

In your first terminal, replace `your-snapshot-id` with the ID you copied:

```bash
SNAPSHOT_ID="your-snapshot-id"
proxymock cloud pull snapshot "$SNAPSHOT_ID"
```

The default output directory is `./proxymock/snapshot-<snapshot-id>`. The pull converts the snapshot's traffic into local RRPair files for mocking and replaying. Keep that directory as the input for both commands below so you test this snapshot rather than another recording in the workspace.

To explore the imported requests, run `proxymock web` and select the snapshot run in the Requests tab. This is optional; you can continue entirely from the CLI.

## 2. Start mocks and your local app {#mock}

In the same terminal, start the mock server with that snapshot and let proxymock launch your app. Replace `./your-app` with your actual startup command, such as `npm start` or `go run .`:

```bash
proxymock mock --in "./proxymock/snapshot-$SNAPSHOT_ID" -- ./your-app
```

Leave this terminal running. proxymock serves recorded outbound dependency responses while your app handles inbound requests. Clients that need SOCKS or explicit port mapping need the setup described in [language configuration](../getting-started/language-reference.md).

Unmatched dependency requests pass through to the real destination by default. Add `--no-passthrough` to the mock command to return a failure instead. See [proxy behavior](../how-it-works/cli.md#proxy-behavior-and-caveats) and [mock match-rate tuning](./mock-match-rate.md) if calls do not match the recording.

## 3. Replay the snapshot against the app {#replay}

Open a second terminal in the same repository. Set the same snapshot ID again because terminal variables are separate, and replace `8080` with your app's port:

```bash
SNAPSHOT_ID="your-snapshot-id"
proxymock replay --in "./proxymock/snapshot-$SNAPSHOT_ID" \
  --test-against http://localhost:8080
```

The target is your app's listening address. The replay sends recorded requests to that app, and the app's dependency calls go to the mock server from step 2. Check the replay summary for failures and compare responses to the recording. Stop the mock/app terminal with Ctrl-C when finished.

By default, inbound traffic becomes tests and outbound traffic becomes mocks. A snapshot can carry a saved replay selection that changes this split; see [Choose What a Replay Tests](./choose-replay-tests.md). Downloading a snapshot and running these commands locally does not start a cloud-managed cluster replay.

## Next steps

- [Debug a replay](./replay-debugger.md) when a request fails.
- [Configure replay test configs](./test-configs.md) and [blueprints](./blueprints.md) to adjust a run.
- [Run in CI/CD](./cicd.md) to check recorded traffic after each build.
- [Choose a cluster or cloud replay path](./replay-paths.md) when you want to run beyond your laptop.

For an existing script that calls `speedctl replay <snapshot-id>`, use the [speedctl replay walkthrough](/guides/cli/#run-a-replay). It remains a supported route for that workflow; the commands on this page use proxymock.
