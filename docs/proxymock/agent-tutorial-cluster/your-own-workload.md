---
title: "Agent tutorial in your cluster 8: do it to your own workload"
description: "Your coding agent uses the quality-loop skill on a service it has not seen: it builds an image, deploys it, records it in the cluster, tunes the replay, and leaves a regression gate script that replays the recording in the cluster before every change."
sidebar_position: 9
sidebar_label: "8. Do it to your own workload"
---

# Chapter 8: Do it to your own workload

Your agent builds a second service into an image, deploys it, and runs the whole loop on it, standing in for your own workload.

Time: about 15 minutes.

## Prompt

This prompt uses the mock-lab Go demo app as a stand-in for your workload. To run it on your own, replace `mock-lab/languages/go` with your service's directory, and say how it is built and deployed if the repo does not.

```text
Now treat mock-lab/languages/go as my own service. Build it into an image, deploy it to the cluster, and use the quality-loop skill to record it there, tune the replay and the mocks, and leave me a regression test I can run in the cluster before every change.
```

## What the agent does

The `quality-loop` skill asks where the service runs, and the prompt says the cluster, so every step takes the cluster route:

- Runs the environment check (`quality-loop.sh doctor`) and reads the service: no database, calls to the CNCF projects API, and an `access_token` and an `order_id` minted on every run.
- Writes what the repo lacks for a cluster: a `Dockerfile` that keeps the binary's symbols, because eBPF reads Go's HTTPS through them, Kubernetes manifests for a Deployment and Service, and a traffic Job that covers every endpoint and its error paths.
- Builds the image into minikube and deploys it to its own namespace, `go-demo`.
- Records it as in chapter 3: turns capture on, restarts the workload, runs the Job, pulls the traffic into `proxymock/recorded-cluster-baseline`, and turns capture off.
- Replays the recording on your machine with the dependencies mocked. The service's committed blueprint already carries the fresh token and order id into later requests, so the replay is clean on the first try. Without the blueprint, the same replay scores about 81%.
- Writes the gate's test config the way chapter 4 did: the built-in `regression` config plus value-type checks.
- Writes `deploy/regression-gate.sh`, which builds your working tree, deploys it, and replays the recording at it in the cluster. It proves the gate: it passes on the current code, fails a deliberately broken build, and passes again once the code is restored.

## What you should see

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** your own service in cluster `speedscale-tutorial` → namespace `go-demo`. Read the repo and ran doctor → built and deployed → recorded in the cluster → replayed locally to tune tests and mocks (including the control without the blueprint) → created the cluster gate and tested it on clean, broken and restored code.
- **Outcome:** gate created; it passes on the current code and caught the deliberate break (exit 1).
- **Numbers:** 81 pairs recorded (51 inbound, 30 outbound); 100% accuracy and 100% measured mock match rate, with 0 passthrough; 80.88% without the blueprint; baseline gate passed (100%).
- **Artifacts:**
  - Recording: `mock-lab/languages/go/proxymock/recorded-cluster-baseline/`
  - Gate: `deploy/regression-gate.sh` with config `proxymock/testconfigs/go-demo.json`
  - Run logs: `proxymock/results/gate-*.log`
- **Next:** add a load tier: `load test go-demo in the cluster with the baseline recording` (proxymock-load-test, which runs it as a cluster load replay).
```

The broken build returned `expires_in` as a string instead of a number. The gate failed 3 of 204 checks, the 3 token responses, because its config checks value types, the lesson from chapter 6.

## If it goes wrong

- **The recording has no outbound HTTPS calls.** The workload was not restarted after capture turned on, or its Go binary was built with `-ldflags="-s -w"`, which strips the symbols eBPF needs. See [chapter 3](./record-traffic.md#if-it-goes-wrong).
- **Readiness probes fill the recording.** An HTTP probe on the app's port is recorded like any request. Use a TCP probe, or a probe on a separate port.
- **The gate passes a change it should catch.** Check its test config: the built-in `regression` config compares field paths, not types or values. Add `matchType` and body assertions as in chapters 4 and 6.
- **Your teammates do not get the recording.** mock-lab ignores most of `proxymock/` in git, so the agent listed the files to commit and left the `.gitignore` change to you. Check the recording for sensitive values before you commit it.

## Where to go next

- The [agent skills](../agent-skills.md) page lists every skill, including chaos, contract and verify-fix testing.
- [Gate CI on replay results](../guides/replay-verdicts.md) runs a gate like this one in a pipeline.
- The [version on your machine](../agent-tutorial/index.md) of this tutorial runs the same loop without a cluster.
