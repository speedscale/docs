---
title: "Agent tutorial in your cluster 1: install the operator"
description: "Your coding agent uses the install-speedscale skill to install proxymock and the Speedscale operator, creating a local minikube cluster when you have none."
sidebar_position: 2
sidebar_label: "1. Install the operator"
---

# Chapter 1: Install the operator

Your agent installs proxymock on your machine and the Speedscale operator in a Kubernetes cluster. With no cluster, it creates a local minikube cluster for the tutorial.

Time: about 6 minutes, most of it starting the cluster.

## Prompt

```text
Use the install-speedscale skill to install proxymock on this machine and the Speedscale operator in a Kubernetes cluster. I have no cluster yet, so create a local one for it.
```

If you have a cluster you want to use, name its kube context instead of asking for a new one. The skill never installs into a context you did not choose. Prefer minikube or a cloud cluster to kind: on kind, eBPF capture does not find pods yet, and the agent has to record with a sidecar that restarts the workload.

## What the agent does

The `install-speedscale` skill:

- Runs its preflight check, which finds no reachable cluster, so it takes the "cluster, but no cluster yet" path.
- Starts a minikube cluster in Docker while it works on the rest: `minikube start -p speedscale-tutorial --driver=docker --memory=4g`. minikube points kubectl's current context at the new cluster.
- Installs proxymock if it is missing, connects the proxymock MCP server to your agent and installs the Speedscale skills (`proxymock mcp install --yes`). It also adds the MCP server to the other coding agents it finds on your machine and says which.
- Proves proxymock works on your machine: records one call to example.com and answers it from a mock (`match=HIT`).
- Checks your Speedscale tenant with `speedctl check` and repeats the tenant name back to you.
- Stores your API key in the cluster as the Secret `speedscale/speedscale-apikey`, piped straight from your proxymock config, so it never appears in the output or in Helm values.
- Installs the operator with Helm, with `clusterName: speedscale-tutorial`, eBPF capture on, and no demo app, since the next chapter deploys the tutorial's own.
- Runs the skill's verification script against the cluster.

## What you should see

The skill's `### Result` block. Trimmed:

```text
### Result
- **Ran:** both paths on macOS arm64: local install, then cluster install into `KUBE_CONTEXT=speedscale-tutorial` → cluster `speedscale-tutorial`, tenant `external`.
- **Outcome:** pass.
- **Numbers:** 11 of 11 cluster checks passed and the local record → mock test returned `match=HIT`; 15 of 15 Speedscale skills installed.
- **Artifacts:**
  - Skills in `~/.claude/skills/`.
  - In this directory: `speedscale-values.yaml` (reuse it for upgrades), `minikube-start.log` and `local-proof/proxymock/`.
  - Helm release `speedscale-operator` in namespace `speedscale`, with the Secret `speedscale-apikey`.
- **Next:** restart your coding agent to load the MCP server and skills, then try the prompt `record my service in the cluster with proxymock and replay it` (the record-traffic skill).
```

Your tenant name, versions and paths differ. The cluster also shows up under your Speedscale account's clusters, registered as `speedscale-tutorial`.

The **Next** line is generic. Follow this tutorial instead: chapter 2 deploys the app to record.

## If it goes wrong

- **The agent created a kind cluster.** eBPF capture does not find pods on kind yet, so chapter 3 would have to record with a sidecar. Delete it (`kind delete cluster --name speedscale-tutorial`) and ask for minikube.
- **minikube fails to start with a memory error.** Docker Desktop needs at least 6 GB of memory for a 4 GB cluster. Raise it in Docker Desktop's settings, then ask the agent to start the cluster again.
- **The cluster check fails on a webhook or a pending pod.** The operator's images are still downloading on a first install. Ask the agent to run the verification again in a minute.
- **The MCP server is not available yet.** Restart your agent in the same directory to load it (`claude --continue` keeps the conversation). The chapters that follow work either way, because the skills also run proxymock from the command line.

<details>
<summary>Manual equivalent</summary>

See [Install the operator](/getting-started/installation/install/kubernetes-operator/) for the full guide. In short:

```bash
minikube start -p speedscale-tutorial --driver=docker --memory=4g
helm repo add speedscale https://speedscale.github.io/operator-helm/
kubectl create namespace speedscale
kubectl -n speedscale create secret generic speedscale-apikey \
  --from-literal=SPEEDSCALE_API_KEY=<your API key> \
  --from-literal=SPEEDSCALE_APP_URL=app.speedscale.com
helm install speedscale-operator speedscale/speedscale-operator -n speedscale \
  --set apiKeySecret=speedscale-apikey --set clusterName=speedscale-tutorial \
  --set deployDemo="" --set ebpf.enabled=true
```

</details>

## Next

[Chapter 2: Deploy the demo app](./deploy-the-demo-app.md)
