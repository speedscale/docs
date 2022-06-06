---
sidebar_position: 2
---

# Lifecycle and Troubleshooting

Pull cord in case of emergency

When a new Service-Under-Test (SUT) workload is applied to the cluster, the operator manages a complex automated workflow. These workflow events happen independently of the Speedscale cloud service. If no report is appearing in Speedscale cloud, the problem may be in the test cluster.

## How to check if your replay is running

Here are a few quick things that will help you understand if your replay is running:
1. Check the operator logs, you should this message `traffic replay initiated`
2. Check for `replay` objects in the namespace `kubectl get replay -n NAMESPACE`
2. Check the [reports interface](https://app.speedscale.com/reports) to see if a new report has been generated
3. Check your Service Under Test (SUT)'s namespace to see if a Speedscale generator or responder pod have been created

If you don't see one or all of these items, double check your operator installation and your annotations. Reminder: make sure you are running the [latest operator](https://docs.speedscale.com/upgrade/operator/).

As a reminder, you can view the operator logs using this kubectl command:

```
kubectl -n speedscale logs deployment/speedscale-operator
```

Now, let's walk through more detail with the sequence of events and show some troubleshooting steps to help you determine if everything is working properly in your cluster.&#x20;

## 1. Operator receives [mutating admission webhook](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/)

The following log message will indicate that the operator is aware of the new workload.&#x20;

```
{"L":"INFO","T":"...","M":"Processing mutate","kind":"apps/v1, Kind=Deployment","name":"speedy-service"}
```

If a log message like this is not present, it probably means that the `MutatingAdmissionWebhook` is misconfigured in your cluster and the operator is not being notified of new SUT workloads. The yaml for the `MutatingAdmissionWebhook` is created by `speedctl deploy operator`.

## 2. Operator modifies SUT workload

If the speedscale annotations are present, then the operator will modify the workload accordingly. To begin an isolation test, the following annotations are required:

```
replay.speedscale.com/snapshot-id: <snapshot ID>
replay.speedscale.com/testconfig-id: <test config ID>
```

The operator will pull the snapshot/scenario from Speedscale Cloud before proceeding. If the cloud service is unavailable, the operator will not allow the SUT workload to proceed. If the snapshot is not found, the operator will print an error message similar to this:

```
{"L":"ERROR","T":"...","M":"failed to retrieve snapshot", ... }
```

Assuming the snapshot is available, the SUT workload will proceed.

The following operator log message indicates that the operator is making changes before allowing the SUT workload to proceed:

```
{"L":"INFO","T":"...","M":"MUTATE", ...}
```

The exact format and content of this message will vary. However, you will be able to see a variety of patches representing the modifications being made. They should match your annotations.

### 2a. (optional) Operator creates envoy filter

If you see this log message, the Envoy filters were deployed properly:

```
{"L":"INFO","T":"...","M","Capture mode Istio/WASM, creating EnvoyFilter resource", ...}
```

### 2b. (optional) Operator adds responder (test.speedscale.com/mode)

If the responder annotation is present, the operator will:

* Add an init container to the SUT pod. This init container will stop the pod from continuing until the Speedscale responder responds to a readiness probe.
* Add HostAlias entries to the SUT container to route traffic to the responder

### 2c. (optional) Operator adds sidecar (sidecar.speedscale.com/inject)

If the sidecar annotation is present, the operator will:

* Add the init container sidecar to the SUT workoad
* Add the proxy sidecar to the SUT workload

### 2d. (optional) Operator adds TLS configuration (sidecar.speedscale.com/tls-out)

If the TLS out annotation is present, the operator will:

* volume mount the user-provided outbound certificates to the SUT workload
* modify the TLS environment variables or trust store in the SUT workload

In order to add the TLS inbound configuration, supply the name of your TLS secret in the `sidecar.speedscale.com/tls-secret` annotation.

At this point, the operator will return the patch list to the Kubernetes API and the workload will continue.

## 3. Operator prepares the test environment

Now that the SUT workload has been mutated, the operator starts the process of standing up the test environment.
The following steps will occur asynchronously.
In other words, Kubernetes will be allowed to continue SUT workload while Speedscale continues working in the background.

A `TrafficReplay` for the workload will be generated to track the status of your replay.
The name of the specific `TrafficReplay` can be found by retrieving the `test.speedscale.com/env-id` annotation from the SUT.

```
kubectl get deploy <NAME> -o jsonpath='{.metadata.annotations.replay\.speedscale\.com/env-id}'
kubectl get statefulsets <NAME> -o jsonpath='{.metadata.annotations.replay\.speedscale\.com/env-id}'
kubectl get daemonsets <NAME> -o jsonpath='{.metadata.annotations.replay\.speedscale\.com/env-id}'
kubectl get jobs <NAME> -o jsonpath='{.metadata.annotations.replay\.speedscale\.com/env-id}'
```

### 3a. Operator adds Speedscale credentials to test namespace

### 3b. (optional) Operator starts telemetry collector

If the collector feature flag is set, the container logs are collected using a pod called `collector`. If logs are not appearing in your report, can check for errors in the collector container logs.

### 3c. (optional) Operator waits for responder to start (`test.speedscale.com/mode: full`)

When the responder is present, an init container will stop the SUT workload from starting until the Speedscale responder responds to a readiness probe. The responder failing to start will cause the SUT startup to appear frozen. Check the logs of the init container to see if it can reach the responder:

```
<insert kubectl logs command>
```

Also, make sure the responder services are present. If they are not, the SUT will not be able to reach the responder. They will be named `responder-http`, `responder-https`, etc



The operator will wait for these steps to complete. The log message indicating it is in a wait state begins with `WAIT SUT`.  When complete, you will see a log starting with `SUT ready, updating config map`.

## 4. Operator begins test

Once the environment is prepared, the operator will run a generator job to start the test. If the generator annotation has been manually set to false (which is rare) then the operator will simply wait for a while before cleaning up the environment. The operator logs will tell you this is happening.

One additional edge case occurs if there are no inbound transactions in the snapshot. This will prevent the generator from running and you will see this log message:

```
{"L":"ERROR","T":"...","M":"no inbound transactions in this scenario, no test report will be generated", ... }
```

#### 3b. (optional) Operator deploys generator (`test.speedscale.com/mode: full`)

The generator will start and you will see this log message:

```
{"L":"INFO","T":"...","M":"START generator"
```

## 5. Operator cleans up environment

By default, the operator will clean up all Speedscale components from the namespace. The operator log will contain the following message is this is taking place:

```
{"L":"INFO","T":"...","M":"START namespace cleanup",...}
```

If you want to collect debug logs, you can set the following annotation to prevent the operator from cleaning up:

```
replay.speedscale.com/cleanup: "none"
```

You may also clean up the Speedscale replay inventory, but leave the workload running:

```
replay.speedscale.com/cleanup: "inventory"
```

# Viewing Results

## Summaries

To see a summary of whether the replay was successful or failed, you can inspect the `Reason` and `Message` fields.

```shell
RESULT=$(kubectl get replay <REPLAY-NAME> -o jsonpath='{.status.conditions[?(@.type=="Ready")].reason}')
MESSAGE=$(kubectl get replay <REPLAY-NAME> -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}'
```

Possible values for `RESULT` are:

* `TestFailed` indicates that the test is failed for some reason
  (failed to initialize, failed to start, timed out, goals are not met etc.)
* `TestSucceeded` indicates that the replay has finished, analyzed and all the goals are met.

`MESSAGE` can provide more information about why the replay has failed.

## Detailed reports

To view detailed reports of your test, you can query the `TrafficReplay` for your report ID and report URL.

```shell
kubectl get replay <REPLAY-NAME> -o jsonpath='{.status.reportID}'
kubectl get replay <REPLAY-NAME> -o jsonpath='{.status.reportURL}'
```

You can navigate to the report URL in your browser.
To see JSON representation of your report, you can fetch the report by ID.

```shell
speedctl get report <report ID>
```
