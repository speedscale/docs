
# Speedscale Sidecar

The sidecar is used to collect data from an existing application.

### Install Wizard <a href="#install-sidecar-with-wizard" id="install-sidecar-with-wizard"></a>

The easiest way to add the sidecar to your pod and start gaining visibility is through the [install wizard](../install/kubernetes-operator.md#install-wizard).
The additional steps here provide instructions for manually instrumenting your services, which is necessary when manifests are sourced
from version control for example.

### Add the Sidecar Annotation to Your Deployment

Please ensure the [Kubernetes Operator](../install/kubernetes-operator.md) is running in your cluster before moving on.

Select the workload (daemonset, deployment, statefulset, job or replicaset) you'd like to monitor and add the following annotation:

```
  annotations:
    sidecar.speedscale.com/inject: "true"
```

That's it. Next time you deploy you can check the pods with get pods.

```
kubectl -n <namespace> get pods
```

You should notice your container count increases by one and data should be flowing.

```
NAME                            READY   STATUS    RESTARTS   AGE
carts-xxxxxxxxxx-xxxxx          2/2     Running   0          38d
```

By default, the Speedscale init container starts after any existing init containers in the workload.

### Remove the Sidecar from Your Deployment

If you already have the sidecar installed, but you need for it to be removed, you may either set the `sidecare.speedscale.com/inject` annotation to `false`, or remove it:

```
  annotations:
    sidecar.speedscale.com/inject: "false"
```

After deploying or patching your deployment, you should notice your container count decrease by one and the sidecar is no longer attached.
