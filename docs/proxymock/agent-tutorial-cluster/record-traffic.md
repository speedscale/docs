---
title: "Agent tutorial in your cluster 3: record traffic"
description: "Your coding agent uses the record-traffic skill in cluster mode: it turns eBPF capture on for the tutorial-orders workload, runs the traffic Job, and pulls the inbound requests, CNCF API calls and Postgres queries into a recording named baseline."
sidebar_position: 4
sidebar_label: "3. Record traffic"
---

# Chapter 3: Record traffic

Your agent turns eBPF capture on for the workload, records everything it receives and sends while the traffic Job runs, and pulls the recording into the workspace. Every later chapter replays it.

Time: about 5 minutes, most of it waiting for the captured traffic to arrive.

## Prompt

```text
Use the record-traffic skill to record the tutorial-orders workload in the cluster while the tutorial's traffic Job runs, including its Postgres and CNCF API calls. Name the recording baseline.
```

## What the agent does

The `record-traffic` skill, in cluster mode:

- Checks the kube context and the data plane (`proxymock cluster status`), and lists the workload's dependencies: inbound HTTP on 8080, Postgres at `postgres:5432`, and HTTPS to `demo-api.trafficreplay.com`.
- Turns eBPF capture on with `proxymock cluster capture inject -n tutorial --workload tutorial-orders`, then restarts the workload. eBPF capture attaches without a restart, but the app still holds the HTTPS connection to the CNCF API it opened in chapter 2, and a connection opened before capture is not recorded.
- Notes the time in UTC and runs the traffic Job again.
- Counts what arrived with `proxymock cloud search tutorial-orders --from <time>` until the inbound requests, the CNCF API and Postgres are all there and the counts stop growing. Captured traffic reaches Speedscale cloud about a minute after it happens.
- Pulls it into the workspace with the MCP tool `pull_remote_recording`, filtered to the `speedscale-tutorial` cluster, into `proxymock/recorded-baseline`. The pull also creates a snapshot named `baseline` in your Speedscale account.
- Turns capture off with `proxymock cluster capture uninject` and summarizes the recording.

## What you should see

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** `speedscale-tutorial` cluster, namespace `tutorial`, workload `tutorial-orders` (Go), eBPF capture; traffic from the in-cluster Job `tutorial-traffic-cslwj` (135 sent, 0 unexpected)
- **Outcome:** complete
- **Numbers:**
  - inbound: 134 of 134 business requests (`/healthz` excluded); status codes 200×88, 201×40, 400×2, 404×2, 422×2, matching what the driver expects
  - outbound hosts: 1 of 1 (`demo-api.trafficreplay.com`, 70 pairs, including 2 expected 404s for unknown projects)
  - databases: 1 of 1 (Postgres `postgres.tutorial.svc.cluster.local:5432`, 1074 pairs)
  - error-status pairs: 8 in total, all expected (400×2, 404×4, 422×2)
- **Artifacts:** `proxymock/recorded-baseline/` (1278 RRPairs) and `proxymock/recording-brief-baseline.md`
- **Next:** `tune-snapshot-replay`: replay `proxymock/recorded-baseline` against `tutorial-orders` in the cluster with its dependencies mocked
```

The recording has the same shape as the one from the version on your machine: 134 inbound requests, 70 CNCF API calls and about 1,075 Postgres messages. The traffic Job sends 135 requests, and the first, `GET /healthz`, is a health check, which capture leaves out. The Postgres host is the in-cluster Service name, and the CNCF API calls are HTTPS, which eBPF reads from the app's TLS library without a proxy or certificates.

## If it goes wrong

- **The recording has inbound and Postgres but no CNCF API calls.** The workload was not restarted after capture turned on, so it kept using an HTTPS connection opened before. Restart it (`kubectl -n tutorial rollout restart deploy/tutorial-orders`) and run the Job again.
- **Nothing arrives after a few minutes, and the nettap log says `cgroup path for container ... not found`.** The cluster is kind, where eBPF capture does not find pods yet. Record with the sidecar instead: ask the agent to inject with `--sidecar --tls-out`. It restarts the workload, and `proxymock cluster capture uninject --sidecar` removes it afterwards.
- **Java records no CNCF API calls.** The JVM's TLS is not visible to eBPF. The skill adds `--java-agent` for a JVM, which restarts the workload with the Speedscale Java agent.
- **Go records no CNCF API calls even after a restart.** eBPF reads Go's HTTPS through the binary's symbols. The tutorial's Go image keeps them; your own image must not be built with `-ldflags="-s -w"`.

See [eBPF traffic collection](../../reference/ebpf-traffic-collection/README.md) for how capture works and the kernels it needs.

<details>
<summary>Manual equivalent</summary>

```bash
proxymock cluster capture inject -n tutorial --workload tutorial-orders
kubectl -n tutorial rollout restart deploy/tutorial-orders
kubectl -n tutorial rollout status deploy/tutorial-orders
date -u +%Y-%m-%dT%H:%M:%SZ        # note the start time
kubectl create -f mock-lab/tutorial/k8s/traffic/job.yaml
proxymock cloud search tutorial-orders --from <start time> --limit 0
speedctl create snapshot --name baseline --service tutorial-orders --start <start time> \
  --filter '(cluster IS "speedscale-tutorial")'
proxymock cloud pull snapshot <snapshot id>
proxymock cluster capture uninject -n tutorial --workload tutorial-orders
```

The pull lands in `proxymock/snapshot-<id>/`. Every proxymock command reads it as a recording.

</details>

## Next

[Chapter 4: Replay and tune the tests](./replay-the-tests.md)
