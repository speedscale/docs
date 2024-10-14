---
title: Troubleshooting Broken Pods
sidebar_position: 20
---

Kubernetes provides a powerful system for managing containerized applications, but like all powerful systems, it can sometimes be difficult to diagnose when things go wrong. One of the common issues developers face is when a pod never reaches the “Ready” state. If you encounter this situation, use the following checklist to troubleshoot and resolve the issue. Keep in mind that replays oftentimes fail due to underlying Kubernetes issues. These types of errors typically show up as pod not ready errors in the replay warnings.

```
Unable to start the replay because target workload is not ready
```

If you see these types of messages at the top of your replay then the problem with your replay is that your service cannot start and not necessarily something to do with the Speedscale components. This guide will help figure out what is wrong with your Kubernetes pod, which will help resolve your replay issues.

## Introduction

When a pod in Kubernetes remains stuck and never becomes “Ready,” it can disrupt workflows, affect deployments, and most importantly, prevent Speedscale from running replays. Diagnosing and solving this problem requires a structured approach to examine various parts of the system, such as configuration, resource availability, pod lifecycle, and more.

Here is a detailed step-by-step checklist to guide you through the process of diagnosing and fixing this issue.

# Step 1: Check Pod Status

Begin by inspecting the pod’s status to get a general idea of what might be going wrong.

```bash
kubectl get pod <pod-name> -n <namespace> -o wide
```

Check the STATUS column. If the pod is not “Running” or stuck in a different state (like Pending, CrashLoopBackOff, or Error), it provides an initial clue about the nature of the problem.

:::tip
Speedscale optionally provides remote administration capabilities. Almost all of the `kubectl` commands outlined in this document can be accessed from the Speedscale UI in the Infrastructure section. For example, to example the workload manifest or view events you can click on Infrastructure \> your cluster name \> your workload \> events.
:::

# Step 2: Inspect Pod Events

Events can provide valuable information about why a pod is not reaching the “Ready” state. To view events related to a pod, run:

```bash
kubectl describe pod <pod-name> -n <namespace>
```
Scroll down to the Events section to see detailed logs about the pod’s lifecycle. Look for errors related to resource limits, networking, image pulling, or readiness/liveness probes.

# Step 3: Check Container Logs

If the events do not provide enough information, the next step is to check the container logs. This can help you understand if the application within the container is failing to start.

```bash
kubectl logs <pod-name> -n <namespace> -c <container-name>
```

If your pod has multiple containers, use the `-c <container-name>` flag to specify which container’s logs you want to see.

Common Errors to Look For in Logs:

* Application configuration issues
* Failed dependency connections (e.g., databases, APIs)
* Permission or security errors
* Missing files or incorrect environment variables

:::tip
The Speedscale sidecar (aka goproxy) has its own logs that are separate from the SUT's container logs. Make sure you inspect both your SUT and goproxy, if applicable. For example, to check goproxy you would use a command like this `kubectl logs <pod-name> -n <namespace> -c goproxy-914443a`
:::

# Step 4: Check Readiness and Liveness Probes

If the logs don’t provide an obvious cause, the problem may lie in the pod’s readiness or liveness probes. These are health checks Kubernetes uses to determine if a container is ready to receive traffic.

Inspect the readiness and liveness probe configurations in the pod’s YAML file or via kubectl describe:

```bash
kubectl describe pod <pod-name> -n <namespace>
```

Scroll down to the Containers section and review the readinessProbe and livenessProbe settings. Check if:

* The probe is correctly configured.
* The probe endpoints (for HTTP) are responding with the expected status code.
* The timeouts and thresholds are set appropriately.

Misconfigured probes are a common reason for pods not becoming ready. Keep in mind that if your SUT's readiness probe does not become active within a reasonable amount of time (like 5 minutes), ***Speedscale will assume the replay will not complete***. Some apps with large internal caches or large Java GC limits may take time to full start. In that case you can adjust the 

# Step 5: Check Image Pulling and Compatibility

Ensure that the image for your container is being pulled correctly and that there are no issues with compatibility.

```bash
kubectl describe pod <pod-name> -n <namespace>
```

In the Events section, look for any errors related to image pulling. Common issues include:

* Incorrect image tags or repository URLs
* Authentication errors when pulling private images
* Image architecture mismatches (e.g., trying to run an ARM image on an x86 node)

You can also use the kubectl get events command to see more detailed image-related events.

Some highly secure environments will mirror images to a local container registry to limit change. Speedscale supports this type of mirroring but keep in mind that image names must be updated during an upgrade. For instance, if you modify your Speedscale manifests to point at a custom image then when you upgrade you must manually upgrade to newer versions and make sure they are present in your custom registry. If you don't, your pod may not start because your artifact registry does not contain the newest versions and it will show up as a broken replay.

# Step 6: Examine Node Resource Limits

A pod may remain in a pending or non-ready state due to insufficient resources on the node (CPU, memory, storage). To check if resource limits are causing the issue:

```bash
kubectl describe node <node-name>
```

Look for conditions like OutOfMemory, DiskPressure, or OutOfCpu under the Conditions section.

If resource constraints are the problem, consider:

* Rescheduling the pod to a different node.
* Adjusting resource requests and limits for the pod.
* Scaling the cluster horizontally (adding more nodes).

:::tip
The Speedscale Generator and Responder consume resources that scale based on the size of the snapshot and volume of replay traffic. If you think you might have a resource issue be sure to check the size of the Generator and Responder pods as well. It is possible they are misconfigured and could be consuming resources needed by the service being tested.
:::

# Step 7: Validate Network Connectivity

Sometimes a pod remains non-ready due to network issues. This could involve the pod not being able to communicate with critical services like databases or other APIs. To diagnose this:

* Check the service that the pod is attempting to reach.
* Verify that network policies (if applied) are not blocking traffic.
* Use kubectl exec to open a shell into the pod and test connectivity to external services:

```bash
kubectl exec -it <pod-name> -- /bin/sh
```

* Use tools like curl or ping within the pod to verify the connectivity.

# Step 8: Investigate Resource Quotas and Limits

Kubernetes namespaces may have resource quotas applied that restrict how many resources a pod can use. Check the resource quotas in the namespace to ensure your pod is not hitting any limits:

```bash
kubectl get quota -n <namespace>
kubectl describe quota <quota-name> -n <namespace>
```

Ensure that the pod’s resource requests and limits align with the available resources.

# Step 9: Check for Node and Cluster-Wide Issues

Sometimes the problem isn’t the pod but the node or the entire cluster. Investigate if the node the pod is scheduled on is under pressure or if there are any cluster-wide issues:

```bash
kubectl get nodes
```

Look for nodes in NotReady or SchedulingDisabled status. If nodes are under stress, it may affect all pods scheduled on that node.

# Step 10: Review Security Context and Pod Policies

Misconfigured security settings can also prevent a pod from becoming ready. Review the pod’s security context and pod security policies:

```bash
kubectl describe pod <pod-name> -n <namespace>
```

Look for issues such as:

* PodSecurityPolicies preventing the pod from running with certain privileges.
* Incorrect or missing service account bindings.
* NetworkPolicy configurations blocking traffic.

# Step 11: (optional) Check Istio/Envoy Configuration

Istio/Envoy are deeply embedded into Kubernetes networking and may need to be configured to allow replay. The following situations are common reasons why pods fail to start with Istio:

1. Firewall rules blocking cloud services. For example, if your app (or Speedscale) cannot reach AWS or GCP the pod may never start.
2. Istio CNI Agent may require a specific annotation to allow Speedscale to run.

You can find more information about how to resolve these issues in this [guide](../setup/install/istio.md).

# Step 12: Check for Network Security Tools

Some teams install 3rd party security systems to add an extra layer of security to their Kubernetes deployment. Unfortunately, some of these tools modify the network in ways that are not directly supported by Kubernetes and thus can be hard to diagnose. Typically, these tools will modify `iptables` rules silently which will cause proxy systems (like goproxy) to break. Most tools can be easily configured to allow the Speedscale sidecar to work properly but figuring out the issue can be challenging. One quick way to check is to scan the list of namespaces in the cluster to look for security tools. For example, you might see a namespace called `twistlock` or see CNI rules. Modifying these security tools is outside the scope of this guide but typically the team that owns it will know how to make exceptions.

# Conclusion

Diagnosing a pod that never becomes ready requires a systematic approach. By following this checklist, you can work through common causes step-by-step, identifying the root issue and applying the correct fix. Kubernetes provides a rich set of tools and detailed information through events, logs, and status descriptions, making it possible to troubleshoot even complex issues effectively.

Quick Summary of Steps:

1.	Check Pod Status
2.	Inspect Pod Events
3.	Check Container Logs
4.	Review Readiness/Liveness Probes
5.	Check Image Pulling and Compatibility
6.	Examine Node Resource Limits
7.	Validate Network Connectivity
8.	Investigate Resource Quotas and Limits
9.	Check for Node and Cluster-Wide Issues
10.	Review Security Context and Pod Policies
11. Check Istio Configuration
12. Check for Network Security Tools

By following these steps, you can quickly diagnose and resolve most issues preventing a pod from becoming ready. Happy troubleshooting!

Do you have any specific Kubernetes troubleshooting experiences you’d like to share? Let us know in the comments below!