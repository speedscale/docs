---
sidebar_position: 1
---

# Via Kubernetes

For those who cannot start a replay from the dashboard, Kubernetes resource annotations may be modified directly to achieve the same result.

The Speedscale Kubernetes Operator **must** be installed.

### Key Ingredients

Once you have created a snapshot report, you can replay it at any time in your own environment.

![Test environment with all components deployed](./test-architecture.png)

When you replay these are the key ingredients that you will use:

| Ingredient               | Description                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot                 | A recording of inbound and outbound traffic. You should have created this in the Create Snapshot step.                                                     |
| Configuration            | Use this to customize how traffic will be replayed. There are some built-in configurations, the `standard` one should replay the same way it was captured. |
| Service Under Test (SUT) | This is your application that you want to test, it should be described in a manifest already, such as a deployment yaml.                                   |
| Generator                | This is a job that will be replay the traffic into the Service Under Test.                                                                                 |
| Forwarder                | This container forwards test results to the Speedscale datastore.                                                                                          |
| TrafficReplay            | A Kubernetes Custom Resource that tracks the state of a running replay.
| _(optional)_ Responder   | This is an optional container that can simulate the downstream dependencies behind the SUT.                                                                |
| _(optional)_ Collector   | This is an optional container that will collect logs and other telemetry from the SUT. This container only works in Kubernetes environments.               |
| _(optional)_ Operator    | This is an optional container that will orchestrate your replay in a Kubernetes environment. You can also manually deploy components without the Operator. |

For the rest of these instructions it is assumed that the operator and forwarder are deployed per the installation instructions.

:::info
Readiness Probe: Your deployment should have a [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) configured in Kubernetes, this lets the operator know exactly when the pod is ready to receive traffic.
:::

### Starting a Replay <a href="#running-an-isolation-test" id="running-an-isolation-test"></a>

Add these annotations to your deployment (or job or stateful set or daemon set) to tell the operator to take action:

```
replay.speedscale.com/snapshot-id: <snapshot ID>
replay.speedscale.com/testconfig-id: <test config ID>
```

If this is the first time you are running a replay, you should start with the `standard` test config ID. Running this test config usually works. If it doesn't the report will give you an idea of how to configuration the data transformation. For more information about test configs see the [docs](../../reference/configuration/README.md).

### Deployment Modes

When running a snapshot, the default behavior is to deploy both a Responder and a Generator. This is represented by the following annotation:

```
replay.speedscale.com/mode: full-replay
```

In this mode, traffic will be generated that matches traffic observed in your capture.
Additionally, the Responder will reply for calls to external services.

You may only want a Generator or a Responder for a given test. In that case, you may deploy one or the other with the following annotations on your workload.

```
replay.speedscale.com/mode: responder-only
replay.speedscale.com/mode: generator-only
```

There are additional options that can be toggled depending on your specific needs for snapshot replay.
See the full list of [Replay annotations](./optional-replay-annotations.mdx) for options.

### Extra info <a href="#extra-info" id="extra-info"></a>

* The operator currently only watches for deployments, stateful sets, jobs and daemon sets
* The operator technically will watch for updates as well as new deployments, but you need to make sure the rest of the test environment is prepared

### Example deployment yaml <a href="#example-deployment-yaml" id="example-deployment-yaml"></a>

Here is a full example of a test deployment yaml for reference:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: moto-api
  annotations:
    replay.speedscale.com/snapshot-id: "a08532d90041-4e0f-bc69-d88103aef564"
    replay.speedscale.com/testconfig-id: "standard"
  labels:
    app: moto-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: moto-api
  template:
    metadata:
      labels:
        app: moto-api
    spec:
      containers:
        - name: moto-api
          image: gcr.io/speedscale-demos/moto-api:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8079
          env:
            - name: DEBUG
              value: express-session
          securityContext:
            runAsNonRoot: true
            runAsUser: 10001
            capabilities:
              drop:
                - all
            readOnlyRootFilesystem: true
      nodeSelector:
        beta.kubernetes.io/os: linux
```
