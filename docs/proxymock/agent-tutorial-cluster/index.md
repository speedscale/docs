---
title: "Agent tutorial in your cluster: start here"
description: "A hands-on tutorial where your coding agent installs the Speedscale operator, records a demo workload in a Kubernetes cluster, and replays it there as a regression test and a load test, one pasted prompt per chapter."
sidebar_position: 1
sidebar_label: "Start here"
---

# Agent tutorial in your cluster: start here

This is the Kubernetes version of the [agent tutorial](../agent-tutorial/index.md). Your coding agent does every step: you paste one prompt per chapter, the agent runs it with the Speedscale [agent skills](../agent-skills.md), proxymock and the Speedscale operator, and you read what it found.

Time: about 50 minutes of agent work for all nine chapters, most of it waiting on the cluster. This chapter takes under a minute.

## What changes from the version on your machine

The app, its planted problems and the skills are the same. Where things run is different:

| | On your machine | In your cluster |
| --- | --- | --- |
| The app | runs as a process, with Postgres from `tutorial-db` | runs as the `tutorial-orders` Deployment, with Postgres in the same namespace |
| Recording | `proxymock record` wraps the app | eBPF capture records the workload, and the agent pulls the traffic into the workspace |
| Replays | `proxymock mock` and `proxymock replay` on your machine | the Speedscale operator replays the workload in the cluster, with its dependencies mocked by a responder |
| Tests | a test config and a baseline replay | a test config whose goals decide the verdict |

The replays run without Speedscale cloud: proxymock stages the recording in the cluster, and the result stays there. Recording does go through Speedscale cloud, which is why you need an account.

## What you build

The demo app is the tutorial orders service in [speedscale/mock-lab](https://github.com/speedscale/mock-lab/tree/main/tutorial), deployed from the manifests in `tutorial/k8s`. It prices orders by looking up CNCF projects on a hosted API and stores them in Postgres, in Go, Java, Python or Node.js.

By the end you have:

- A recording of the workload's inbound requests, its calls to the CNCF API and its Postgres queries, captured in the cluster.
- A regression test that replays the recording in the cluster and catches a changed response type.
- Mocks that answer every outbound call during a replay.
- A load test with latency and throughput goals that finds an N+1 query.
- The same loop on a second workload, standing in for your own.

| Chapter | What the agent finds |
| --- | --- |
| [4. Replay and tune the tests](./replay-the-tests.md) | The `regression` config compares each response's field paths, not values or types, so it would miss a number that becomes a string |
| [5. Tune the mocks](./tune-the-mocks.md) | A `ts` query parameter that changes on every CNCF API call, so the replay reaches the real API instead of the mock, and SQL reads that only get their own row in recorded order |
| [6. Run a regression test](./regression-test.md) | `APP_VERSION=v2` returns `total_cents` as a string instead of a number |
| [7. Run a performance test](./performance-test.md) | `APP_SLOW=1` makes `GET /orders` run one query per order |

## Prerequisites

- **Docker**, for a local [minikube](https://minikube.sigs.k8s.io/) cluster with 4 GB of memory. If you already have a cluster you want to use, name it in chapter 1: the agent asks before touching a cluster and never switches your kube context on its own.
- **Your language's toolchain**, for chapters 4 and 5, which check the test config and measure the mocks with the app on your machine: Go 1.25 or newer, JDK 21 or newer, Python 3.11 or newer, or Node.js 22.21 or newer.
- **A coding agent** that can run shell commands, such as Claude Code or Cursor.
- **A free Speedscale account**, for the API key the operator and proxymock need. Sign up at [app.speedscale.com/proxymock/signup](https://app.speedscale.com/proxymock/signup).
- **Windows**: use WSL2 and run your agent inside it.

The agent installs `kubectl`, `helm`, `minikube` and proxymock if they are missing.

Start your agent in an empty directory and paste the prompts in order, in one conversation. The agent clones mock-lab into that directory and writes everything under it.

## Prompt: install the skills

If you did the version on your machine and the skills are installed, skip to chapter 1.

```text
Install the Speedscale agent skills from https://github.com/speedscale/skills. If you are Claude Code, run `/plugin marketplace add speedscale/skills` and then `/plugin install speedscale@speedscale-skills`. Otherwise run `npx skills add speedscale/skills`. If neither works, download every folder under skills/ in that repo into your skills directory. Then list the skills you installed and what each is for.
```

## What the agent does

The same as in [Start here](../agent-tutorial/index.md#what-the-agent-does) on your machine: it installs the 15 skills and lists what each is for.

## Next

[Chapter 1: Install the operator](./install-the-operator.md)
