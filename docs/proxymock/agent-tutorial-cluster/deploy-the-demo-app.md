---
title: "Agent tutorial in your cluster 2: deploy the demo app"
description: "Your coding agent clones mock-lab, deploys the tutorial orders service and its Postgres into the cluster with kubectl apply -k, and checks it with the traffic Job."
sidebar_position: 3
sidebar_label: "2. Deploy the demo app"
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Chapter 2: Deploy the demo app

Your agent clones mock-lab and deploys the tutorial orders service and its Postgres into the cluster, then runs the traffic Job once to check every request gets the answer it expects.

Time: about a minute.

## Prompt

<Tabs groupId="language">
<TabItem value="golang" label="Go">

```text
Clone https://github.com/speedscale/mock-lab and deploy the tutorial app from mock-lab/tutorial/k8s to the cluster with the go overlay. Run its traffic Job once and tell me whether every request got the answer it expected.
```

</TabItem>
<TabItem value="java" label="Java">

```text
Clone https://github.com/speedscale/mock-lab and deploy the tutorial app from mock-lab/tutorial/k8s to the cluster with the java overlay. Run its traffic Job once and tell me whether every request got the answer it expected.
```

</TabItem>
<TabItem value="python" label="Python">

```text
Clone https://github.com/speedscale/mock-lab and deploy the tutorial app from mock-lab/tutorial/k8s to the cluster with the python overlay. Run its traffic Job once and tell me whether every request got the answer it expected.
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

```text
Clone https://github.com/speedscale/mock-lab and deploy the tutorial app from mock-lab/tutorial/k8s to the cluster with the node overlay. Run its traffic Job once and tell me whether every request got the answer it expected.
```

</TabItem>
</Tabs>

## What the agent does

- Clones mock-lab into the current directory and reads `tutorial/k8s/README.md`.
- Applies the language overlay with `kubectl apply -k tutorial/k8s/overlays/<language>`. It creates the `tutorial` namespace with the `tutorial-orders` Deployment and Service, running the published image `ghcr.io/speedscale/mock-lab-tutorial-<language>:latest`, and a Postgres Deployment loaded with the schema.
- Waits for the rollout, then runs the traffic Job with `kubectl create -f tutorial/k8s/traffic/job.yaml` and reads its log.

## What you should see

```text
Yes, every request got the answer it expected. The traffic Job ran once and ended with `sent 135 requests, 0 unexpected`, which is the result the tutorial README says a clean run should give.
```

The Job is the same traffic driver the version on your machine runs. It sends 135 requests covering every endpoint, including a few bad requests and two unknown projects whose 4xx answers are expected. Each `kubectl create` makes a new Job with a generated name, so you can run it again any time, and every finished Job deletes itself after an hour.

This chapter runs no skill, so the answer has no `### Result` block.

## If it goes wrong

- **The Job's log says the app is not reachable.** The Job waits for the `tutorial-orders` Service before it sends anything. If it still fails, check `kubectl -n tutorial get pods` and the app's log with `kubectl -n tutorial logs deploy/tutorial-orders`.
- **The image cannot be pulled.** The images are public on GitHub's container registry. A cluster without internet access needs them pushed to a registry it can reach, or loaded with `minikube -p speedscale-tutorial image load`.
- **Postgres was restarted and the orders are gone.** Postgres keeps its data in an `emptyDir`, so a restarted pod starts with empty tables. That is fine for the tutorial: the next traffic Job creates new orders.

<details>
<summary>Manual equivalent</summary>

```bash
git clone https://github.com/speedscale/mock-lab
kubectl apply -k mock-lab/tutorial/k8s/overlays/go   # or java, python, node
kubectl -n tutorial rollout status deploy/tutorial-orders
kubectl create -f mock-lab/tutorial/k8s/traffic/job.yaml
kubectl -n tutorial logs -l job-name -c traffic --tail 1
```

</details>

## Next

[Chapter 3: Record traffic](./record-traffic.md)
