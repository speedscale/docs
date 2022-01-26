---
description: >-
  Simply use a few annotations to replay your traffic snapshot using the
  Kubernetes operator.
---

# Start Replay (Kubernetes)

### Key Ingredients

Once you have created a snapshot report, you can replay it at any time in your own environment.

![Test environment with all components deployed](<../../.gitbook/assets/image (3).png>)

When you replay these are the key ingredients that you will use:

| Ingredient               | Description                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot                 | A recording of inbound and outbound traffic. You should have created this in the Create Snapshot step.                                                     |
| Configuration            | Use this to customize how traffic will be replayed. There are some built-in configurations, the `standard` one should replay the same way it was captured. |
| Service Under Test (SUT) | This is your application that you want to test, it should be described in a manifest already, such as a deployment yaml.                                   |
| Generator                | This is a job that will be replay the traffic into the Service Under Test.                                                                                 |
| Forwarder                | This container forwards test results to the Speedscale datastore.                                                                                          |
| _(optional)_ Responder   | This is an optional container that can simulate the downstream dependencies behind the SUT.                                                                |
| _(optional)_ Collector   | This is an optional container that will collect logs and other telemetry from the SUT. This container only works in Kubernetes environments.               |
| _(optional)_ Operator    | This is an optional container that will orchestrate your replay in a Kubernetes environment. You can also manually deploy components without the Operator. |

For the rest of these instructions it is assumed that the operator and forwarder are deployed per the installation instructions.

{% hint style="info" %}
Readiness Probe: Your deployment should have a [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) configured in Kubernetes, this lets the operator know exactly when the pod is ready to receive traffic.
{% endhint %}

### Starting a Replay <a href="#running-an-isolation-test" id="running-an-isolation-test"></a>

Add these annotations to your deployment (or job or stateful set or daemon set) to tell the operator to take action:

```
test.speedscale.com/scenarioid: <scenarioID>
test.speedscale.com/testconfigid: <test config ID>
```

### Deployment Modes

When deploying a snapshot, the default behavior is to deploy the Speedscale traffic generator, but not the responder. This will mean that all external requests and services will still be accessible as they normally would be during traffic record time. In order to enable the Speedscale responder for external service mocking, the following annotation may be added:

```
test.speedscale.com/deployResponder: "true"
```

Some instances may not require the use of the Speedscale traffic generator, which is different the default deployment behavior where the traffic generator is deployed automatically. To disable deploying the generator, use the following annotation:

```
test.speedscale.com/deployGenerator: "false"
```

There are additional options that can be toggled depending on your specific needs for snapshot replay.

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
    test.speedscale.com/scenarioid: "a08532d90041-4e0f-bc69-d88103aef564"
    test.speedscale.com/testconfigid: "standard"
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

