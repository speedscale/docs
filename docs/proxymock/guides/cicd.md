---
title: CI/CD
description: "Integrate proxymock into your CI/CD pipeline to enhance deployment confidence with automated traffic replay and testing before production release."
sidebar_position: 2
---

import useBaseUrl from '@docusaurus/useBaseUrl';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# CI/CD

Use proxymock to validate AI-assisted code changes with recorded traffic. Run replay checks in CI after the build and unit tests, and validate the deployed application in its delivery environment before promoting it to production.

<div className="docs-diagram-scroll" style={{'--docs-diagram-width': '1100px'}} tabIndex={0} role="region" aria-label="AI-assisted SDLC">

![AI code, AI code review, CI validation, continuous delivery with validation in place, then production](/img/diagrams/ai-sdlc-pipeline.svg)

</div>

<a href={useBaseUrl('/img/diagrams/ai-sdlc-pipeline.svg')}>Open diagram full size</a>

Adding anything to your CI/CD pipeline generally involves the same 3 steps:

1. Adding a step to your **pipeline** (see [#1. The Pipeline](#1-the-pipeline))
1. Executing the right **script** to perform a desired action (see [#2. The Script](#2-the-script))
1. Authentication (see [#3. The API Key](#3-the-api-key))

## Prerequisites

In order to integrate **proxymock** into your CI/CD you will need:

- Access to modify your CI/CD pipeline
- A **proxymock** API key. A [free account](https://app.speedscale.com/proxymock/signup) provides one.
- Pre-recorded traffic files (see [recording](/proxymock/getting-started/quickstart/quickstart-cli.md#recording) to record from your app)

## Let proxymock write the pipeline

For GitHub Actions and GitLab CI, `proxymock ci init` writes the pipeline for you. Run it from the repository root with the command that starts your application and the port it listens on:

<Tabs>

<TabItem value="github" label="GitHub">

```bash
proxymock ci init github --app-command "npm start" --app-port 3000
```

This writes `.github/workflows/proxymock.yml`.

</TabItem>

<TabItem value="gitlab" label="GitLab">

```bash
proxymock ci init gitlab --app-command "npm start" --app-port 3000
```

This writes `.gitlab/proxymock.gitlab-ci.yml`. A project with no pipeline yet also gets a `.gitlab-ci.yml` with the line that includes it. A project that has one is given the `include:` line to add.

</TabItem>

</Tabs>

The pipeline runs on every pull request or merge request. It installs proxymock, starts `proxymock mock` to answer the application's dependencies from the recording, replays the recorded requests against the application, and [reports the result](#report-the-result-on-the-pull-request) on the request.

On GitHub the workflow runs the [`speedscale/proxymock-action`](https://github.com/speedscale/proxymock-action) action, and on GitLab it includes the [`proxymock/ci`](https://gitlab.com/proxymock/ci) CI/CD catalog component, which do those steps. Change the pipeline through their inputs, such as `fail-if` to fail on a changed response body too:

<Tabs>

<TabItem value="github" label="GitHub">

```yaml
      - uses: speedscale/proxymock-action@v1
        with:
          api-key: ${{ secrets.SPEEDSCALE_API_KEY }}
          app-command: npm start
          app-port: 3000
          fail-if: |
            requests.response-match-pct < 100
```

</TabItem>

<TabItem value="gitlab" label="GitLab">

```yaml
include:
  - component: gitlab.com/proxymock/ci/replay@1
    inputs:
      image: node:22
      app-command: npm start
      app-port: "3000"
      fail-if: requests.response-match-pct < 100
```

</TabItem>

</Tabs>

Each README lists every input, such as the proxymock `version` to pin and, on GitHub, a `webhook-url` to post failures to Slack.

Build the application before the replay starts, because the replay gives `app-command` 30 seconds to start listening. On GitHub, build in an earlier step. On GitLab, set the component's `build-command`.

Most database drivers ignore proxy environment variables, so record and mock a database on a mapped port. Record with `proxymock record --map 65432=postgres://localhost:5432`, point the application at port 65432, and pass the same map to the mock with `mock-args: --map 65432=postgres://localhost:5432`.

The replay also grades the run on the [readiness scorecard](../../guides/readiness/index.md#local-replays): Regression, Performance, Security, Mock fidelity and Data layer from a local run, plus Resilience with chaos rules and Spec adherence with an OpenAPI document. The verdict is in the replay summary and in `replay-verdict.json` under `goals.readiness`.

Store your API key as the `SPEEDSCALE_API_KEY` repository secret on GitHub or as a masked CI/CD variable on GitLab. Add any build steps your application needs. For GitHub pull request comments, grant the workflow `pull-requests: write`. For GitLab merge request comments, add `PROXYMOCK_GITLAB_TOKEN` as a masked CI/CD variable using a project access token with the `api` scope.

| Flag | Use it to |
| --- | --- |
| `--in <dir>` | Name the directory of recorded traffic. The default is `proxymock`. |
| `--app-command <command>` | Say how the application starts. Without it the pipeline holds a placeholder to replace. |
| `--app-port <port>` | Say which port the application listens on. The default is `8080`. |
| `--no-mock` | Leave out the mock server, so the application calls its real dependencies. |
| `--dry-run` | Print the files instead of writing them. |
| `--force` | Replace a pipeline file that already exists. |

Both packages use the built-in `regression` test config by default. The job fails when a request's status code changes or the replay misses a goal set by the config. Use `fail-if` to gate on response body changes or latency. Give each GitHub condition its own line and separate GitLab conditions with semicolons. Open the [failure bundle](./replay-verdicts.md#failure-bundles) in the replay artifact to compare the exchanges, see dependency calls, and read the likely cause. See [Test configs](./test-configs.md) to define your own goals.

For any other CI system, or to build the pipeline yourself, follow the three steps below.

## 1. The Pipeline

These pipeline examples contain the minimal configuration needed to run
**proxymock** with your application.

Examples build a Go binary using `go build` using the golang container image.
Your image can be anything you choose as long as **proxymock** has access to
your application.

<Tabs>

<TabItem value="github" label="GitHub">

```yaml
name: CI with proxymock
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    container: golang:1.25
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build and test with proxymock
        run: |
          go build -o myapp .
          ./proxymock.sh # <--- proxymock script - see below
```

</TabItem>

<TabItem value="gitlab" label="GitLab">

```yaml
stages:
  - build

# build Go application and test with proxymock
build:
  stage: build
  image: golang:1.25
  script:
    - go build -o myapp .
    - ./proxymock.sh # <--- proxymock script - see below
```

</TabItem>

<TabItem value="jenkins" label="Jenkins">

```groovy
#!groovy

pipeline {
  agent {
    docker { image 'golang:1.25' }
  }
  stages {
    stage('Build and Test') {
      steps {
        sh 'go build -o myapp .'
        sh './proxymock.sh' // <--- proxymock script - see below
      }
    }
  }
  post{
    success{
      echo "======== pipeline executed successfully ========"
    }
    failure{
      echo "======== pipeline execution failed ========"
    }
  }
}
```

</TabItem>

<TabItem value="azure" label="Azure DevOps">

```yaml
trigger:
  - main

pool:
  vmImage: "ubuntu-latest"

container: golang:1.25

steps:
  - script: |
      go build -o myapp .
      ./proxymock.sh # <--- proxymock script - see below
    displayName: 'Build and test with proxymock'
```

</TabItem>

<TabItem value="skaffold" label="Google Cloud Deploy with Skaffold">

Add the verify block to your existing Skaffold deploy.

```yaml
apiVersion: skaffold/v4beta13
kind: Config
manifests:
  rawYaml:
    - k8s-deploy.yaml
deploy:
  kubectl: {}
build:
  artifacts:
  - image: myapp
    docker:
      dockerfile: Dockerfile
verify:
  - name: speedscale
    container:
      name: speedscale
      image: golang:1.25
      command: ["/bin/bash"]
      args: ["-c", "go build -o myapp . && ./proxymock.sh"] # <--- proxymock script - see below
```

See https://skaffold.dev/docs/references/yaml/ for spec details.

</TabItem>

<TabItem value="aws" label="AWS CodeBuild">

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      golang: 1.25
  build:
    commands:
      - go build -o myapp .
      - ./proxymock.sh # <--- proxymock script - see below

artifacts:
  files:
    - myapp
```

</TabItem>

<TabItem value="bitbucket" label="Bitbucket Pipelines">

```yaml
image: golang:1.25

pipelines:
  default:
    - step:
        name: Build and test with proxymock
        script:
          - go build -o myapp .
          - ./proxymock.sh # <--- proxymock script - see below
```

</TabItem>

<TabItem value="teamcity" label="TeamCity">

```kotlin
import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.script

object Build : BuildType({
    name = "Build and Test"
    
    requirements {
        contains("docker.server.version")
    }
    
    steps {
        script {
            name = "Build and test with proxymock"
            dockerImage = "golang:1.25"
            scriptContent = """
                go build -o myapp .
                ./proxymock.sh # <--- proxymock script - see below
            """.trimIndent()
        }
    }
})
```

</TabItem>

<TabItem value="circleci" label="CircleCI">

```yaml
version: 2.1

jobs:
  speedscale:
    docker:
      - image: "golang:1.25"
    steps:
      - checkout
      - run:
          name: Build Go application
          command: go build -o myapp .
      - run:
          name: Run proxymock tests
          command: ./proxymock.sh # <--- proxymock script - see below
```

See a full
[config.yml](https://github.com/kenahrens/spd-replay/blob/main/.circleci/config.yml)
for more context.

</TabItem>

</Tabs>

## 2. The Script

Let's fill in the **proxymock.sh** script shown above.  Be sure to customize the
user settings at the top of the script.

:::warning
The script expects the `SPEEDSCALE_API_KEY` environment variable to be set
(securely) for authentication. See [The API Key](#3-the-api-key).
:::


```sh
#!/usr/bin/env bash

# set the port your application will listen on, where traffic will be replayed
APP_PORT=8080
# set the command to run your application.  ensure this command has all of the
# correct flags and that the environment has all of the configuration needed to
# run your application properly
APP_COMMAND="./my-example-app --log-level debug" # CHANGE ME!

# the path to pre-recorded proxymock traffic
PROXYMOCK_IN_DIR="proxymock"
# optionally, run mock server
RUN_MOCK_SERVER=true

###########################
### USER SETTINGS ABOVE ###
###    SCRIPT BELOW     ###
###########################

# log file paths
REPLAY_LOG_FILE="proxymock_replay.log"
APP_LOG_FILE="proxymock_app.log"
MOCK_LOG_FILE="proxymock_mock.log"

set -e
set -o pipefail 2>/dev/null || true

validate() {
  if [ -z "$SPEEDSCALE_API_KEY" ]; then
  	echo "ERROR: SPEEDSCALE_API_KEY environment variable is not set"
  	exit 1
  fi

  if [ ! -d "$PROXYMOCK_IN_DIR" ]; then
  	echo "ERROR: $PROXYMOCK_IN_DIR does not exist - make sure you have pre-recorded traffic to mock / replay"
  	exit 1
  fi
}

install_proxymock() {
  echo "Installing proxymock..."

  sh -c "$(curl -Lfs https://downloads.speedscale.com/proxymock/install-proxymock)"
  export PATH=${PATH}:${HOME}/.speedscale

  # initialize with API key
  proxymock init --api-key "$SPEEDSCALE_API_KEY"
}

run_mock_server() {
  echo "Starting mock server..."

  proxymock mock \
    --verbose \
    --in "$PROXYMOCK_IN_DIR/" \
    --log-to "$MOCK_LOG_FILE" &
}

run_replay() {
  print_logs() {
    if [ -f "$MOCK_LOG_FILE" ]; then
      echo "=== proxymock mock server logs ==="
      cat $MOCK_LOG_FILE
    fi
    echo "=== proxymock replay logs ==="
    cat $REPLAY_LOG_FILE
    if [ -f "$APP_LOG_FILE" ]; then
      echo "=== application logs ==="
      cat $APP_LOG_FILE
    fi
  }
  trap print_logs EXIT

  # start proxymock replay, with your app, to run your app and replay test traffic
  # against it
  proxymock replay \
    --in "$PROXYMOCK_IN_DIR" \
    --test-against localhost:$APP_PORT \
    --log-to $REPLAY_LOG_FILE \
    --app-log-to $APP_LOG_FILE \
    --fail-if "latency.max > 1500" \
    -- $APP_COMMAND
}

main() {
  validate
  install_proxymock

  if [ "$RUN_MOCK_SERVER" = "true" ]; then
    run_mock_server
  fi

  run_replay
}

main
```

## 3. The API Key

**proxymock** requires a valid API key to run.  Your API key is created when you
first run `proxymock init` and is stored in a config file, at
`$HOME/.speedscale/config.yaml` by default.

To make it easy, once [registered](/proxymock/guides/initialize.md) you can get your API key directly with some command line magic:

```sh
SPEEDSCALE_CONFIG_FILE=$(proxymock version | grep 'Config File' | awk '{print $3}')
SPEEDSCALE_API_KEY=$(cat $SPEEDSCALE_CONFIG_FILE | grep apikey | awk '{print $2}')
echo $SPEEDSCALE_API_KEY
```

:::info
If this does not produce an API key make sure you are registered first with `proxymock init`.
:::

Make `SPEEDSCALE_API_KEY` available to your pipeline as an environment variable
so **proxymock** can be initialized when the pipeline runs.

## Need Help?

Let us know on the [community Slack](https://slack.speedscale.com) if
instructions for your deploy system are not included here.

## Drive proxymock over REST

To script the steps with HTTP and JSON instead of CLI flags, run `proxymock mcp run --http` in the job and call its [REST API](./rest-api.md). Each operation answers with a structured result, and a replay answers with its exit code and score, so a step can fail the build with one `jq` check.

## Gate on application results

Use [replay verdicts](./replay-verdicts.md) to distinguish request completion from correct application behavior. Save a baseline replay, then use `--baseline <directory> --fail-on-new-mismatch` to fail on new per-request regressions. For incident recordings, `--verify-fix` checks that recorded failures are fixed without collateral regressions.

Preserve the replay output directory as a CI artifact. It holds `replay-verdict.json`, `replay-summary.md` and, when something failed, the [failure bundles](./replay-verdicts.md#failure-bundles) under `replay-failures/`. These modes need response output and cannot be combined with `--no-out` or `--load-test`. Require essential [blueprints](./blueprints.md) with `--require-blueprint <name>`.

## Report the result on the pull request

A replay in a pipeline reports itself three ways. The pipeline that `proxymock ci init` writes uses all three.

### JUnit report

Add `--junit <file>` to write the replay as a JUnit XML report:

```bash
proxymock replay \
  --in proxymock \
  --test-against localhost:8080 \
  --test-config regression \
  --out proxymock/results/ci \
  --junit proxymock-junit.xml \
  -- ./my-app
```

The report has a test case for every replayed request, every [browser journey](../../guides/browser-journeys/index.md), and every gate: test config goals, report assertions, the readiness verdict and `--fail-if` conditions. GitHub, GitLab, Jenkins, Azure DevOps and CircleCI all read JUnit into their own test views. In GitLab, name the file under `artifacts: reports: junit` and the merge request shows the results.

| Replay result | JUnit test case |
| --- | --- |
| A response that matched its recording, or a journey that passed | Passed |
| A response that did not match, or a journey that failed | Failed, with the changed fields, the likely cause and the path of the [fix prompt](./replay-verdicts.md#failure-bundles) |
| A mismatch that fails the same way in `--baseline` | Skipped, as a known mismatch |
| A request whose recording has no response to compare with | Skipped |
| A goal that was not evaluated locally | Skipped, with the reason |

A request the recording holds more than once keeps its test case name unique by carrying the first characters of its id.

### Summary

Every replay that scored a request or a journey writes `replay-summary.md` in its output directory. It holds the result, the counts behind it, and a table of the failures with the likely cause and the next step for each.

Beside it, `replay-summary.json` holds the same result for programs: `result` (`passed`, `passed-with-failures` or `failed`), the exit code, the counts, and each failure with its likely cause, request and the paths of its bundle and fix prompt. Each failure has a `key` that stays the same on later runs when the same request fails again, whatever it answered, and `checked` lists the keys of everything the run judged. [`ci notify`](#post-to-slack-or-a-webhook) and [`ci tickets`](#file-tickets-for-regressions) read this file.

Inside GitHub Actions the replay also adds the summary to the run's summary page. It appends to the file named by `GITHUB_STEP_SUMMARY`, so what earlier steps wrote there stays.

### Pull request comment

`proxymock ci comment` posts the summary on the pull request or merge request the pipeline is running for:

```bash
proxymock ci comment proxymock/results/ci
```

The argument is the replay's output directory, the one given to `--out`. A later run replaces the comment instead of adding another, so the request shows the latest result once.

The request and the credentials come from the job's environment:

| CI system | What the job needs |
| --- | --- |
| GitHub Actions | `GITHUB_TOKEN` passed to the step, and `permissions: pull-requests: write` on the job |
| GitLab CI | A project access token with the `api` scope in the masked variable `PROXYMOCK_GITLAB_TOKEN`. `GITLAB_TOKEN` is read when that is not set. GitLab's own job token cannot write comments. |

The command exits `0` only when the comment was posted. Run it as a step that may fail without failing the job: a pull request from a fork gets a read-only token and cannot be commented on. In GitHub Actions that is `continue-on-error: true` with `if: always()`, so a failed replay is still commented on.

Add `--dry-run` to print the comment without posting it. Add `--provider github` or `--provider gitlab` when the job runs somewhere that does not set `GITHUB_ACTIONS` or `GITLAB_CI`.

## Post to Slack or a webhook

`proxymock ci notify` posts a replay's result to a webhook:

```bash
proxymock ci notify proxymock/results/ci
```

The webhook URL comes from `--webhook` or, better in a pipeline where the URL is a secret, from `PROXYMOCK_WEBHOOK_URL`. The format follows the URL:

| `--format` | Sends | Default for |
| --- | --- | --- |
| `slack` | A message for a Slack incoming webhook: the result, its counts, and the first five failures with their likely cause, linked to the pipeline run | `hooks.slack.com` URLs |
| `json` | `replay-summary.json` with `event` (`proxymock.replay.finished`), `runUrl` and `ref`, for a receiver of your own such as Teams, PagerDuty or a script | Every other URL |

Set `PROXYMOCK_WEBHOOK_SECRET` to sign a `json` body. The `X-Proxymock-Signature-256` header then carries `sha256=` and the HMAC-SHA256 of the body, the way GitHub signs its webhooks.

By default only a run with failures is posted. Add `--on always` to post every run. `--dry-run` prints the body instead of posting it. An error names only the webhook's host, since the URL of most chat webhooks is the credential.

## File tickets for regressions

`proxymock ci tickets` files a Linear or Jira ticket for each new regression a replay found:

```bash
proxymock ci tickets proxymock/results/ci --tracker linear --team ENG
proxymock ci tickets proxymock/results/ci --tracker jira --project SHOP
```

Each ticket carries the failure's likely cause, next step, request and pipeline run, and the [fix prompt](./replay-verdicts.md#failure-bundles) for a coding agent. The prompt quotes the recorded and replayed requests and responses; add `--no-prompt` to leave it out. Paths in the prompt are made relative to the directory the job runs in, so they point into the repository.

A failure with an open ticket never gets a second one, because tickets are matched by the failure's `key`. On later runs proxymock comments on the ticket when its failure passes, and again if it fails after that. It never closes a ticket: whoever fixes it decides it is done. A ticket whose failure the run did not exercise gets no comment.

| Flag | Default | What it does |
| --- | --- | --- |
| `--bucket` | `sut-regression` | The likely causes that get tickets. A mock gap, volatile data or test configuration is the test's to fix, not the code's. |
| `--max` | `5` | The most new tickets filed in one run. A broken deploy fails everything at once, and that is one incident. |
| `--dry-run` | | Lists what would be filed and commented without changing anything. |
| `--issue-type` | `Bug` | The Jira issue type. |

The credentials come from the job's environment:

| Tracker | What the job needs |
| --- | --- |
| Linear | A personal API key in `LINEAR_API_KEY`, and `--team` with the team key. Tickets carry `proxymock-failure:<key>` in the description. |
| Jira Cloud | `JIRA_BASE_URL` (`https://<site>.atlassian.net`), `JIRA_EMAIL` and an API token in `JIRA_API_TOKEN`, and `--project` with the project key. Tickets are labelled `proxymock` and `proxymock-<key>`. |

Run it on the default branch, after a merge or nightly, not on every pull request. A pull request's failures belong on the pull request, in its [comment](#pull-request-comment).

## Gate on a cloud replay

To run the replay in a Kubernetes cluster through Speedscale cloud instead of on the CI runner, start it and then wait on its report. The status command's exit code is the result:

```bash
REPORT_ID=$(proxymock cloud replay \
  --cluster "$CLUSTER" \
  --namespace "$NAMESPACE" \
  --workload "$WORKLOAD" \
  --snapshot-id "$SNAPSHOT_ID" \
  --output json | jq -r '.reportID')

proxymock cloud replay status "$REPORT_ID" --wait --timeout 30m
```

While it waits, the status command prints each status change and each replay event as it appears, including the operator's suggested fixes, then the goals with expected and actual values. Add `--output json` to get one JSON document on stdout instead.

Decide what each code means for your pipeline. A missed goal is a test result and should fail the build. A replay that could not produce a verdict is an environment problem you may want to retry or alert on instead:

```bash
proxymock cloud replay status "$REPORT_ID" --wait --timeout 30m
case $? in
  0) echo "replay passed" ;;
  1) echo "replay missed its goals"; exit 1 ;;
  4 | 5 | 124) echo "replay produced no verdict, see the report"; exit 1 ;;
  *) echo "proxymock failed"; exit 1 ;;
esac
```

## Exit codes

Exit codes are defined per command, so the same number can mean different things in different commands. Any code not listed for a command means a configuration or operational failure.

### `proxymock replay`

| Exit | Meaning |
| --- | --- |
| `0` | The replay ran and every gate passed |
| `1` | A test config goal missed, or a `--fail-if` condition was true |
| `2` | With `--verify-fix`: the fix was not confirmed |
| `3` | With `--fail-on-new-mismatch`: a pair failed differently than in `--baseline`. With `--verify-fix`: a collateral regression |

See [Replay Verdicts](./replay-verdicts.md) for how each gate decides.

### `proxymock cloud replay status`

| Exit | Meaning |
| --- | --- |
| `0` | The replay passed. Without `--wait`, also a replay that is still running |
| `1` | Missed Goals: the replay ran and failed its goals |
| `2` | Usage error: bad flags or arguments |
| `4` | The replay ended in Error or was Canceled, so there is no verdict |
| `5` | The report could not be read: not signed in, a network failure, an unknown report ID, or proxymock could not start because its config could not be loaded or it could not connect to Speedscale cloud |
| `124` | `--wait` stopped at `--timeout` while the replay was still running |

Code `3` is not used here. It stays reserved for the replay gates above, so a script that checks for `3` never mistakes a cloud replay result for a new mismatch.

### Always exit zero

The global `--exit-zero` flag makes any proxymock command exit `0`. Use it for informational steps only, never in a job that gates on the exit code.
