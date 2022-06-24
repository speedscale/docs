
# Kubernetes Operator

The operator acts like a SRE inside your own cluster, properly deploying and
configuring the various Speedscale components.

The Speedscale Kubernetes Operator works similarly to a service mesh controller like Istio or Linkerd. It waits for deployments to be applied to the cluster that contain specific annotations. It then automatically stands up an isolation test environment around the deployment. The operator itself is a deployment that will be always present on the cluster.

### Install Wizard

The easiest way to install the Speedscale Operator is through the [install wizard](./install-wizard.md).
The additional steps here provode instructions for manually generating Speedscale Operator manifests, which
is necessary when manifests are sourced from version control for example.

### Install Operator <a href="#install-operator" id="install-operator"></a>

Check the [Technology Support](../reference/technology-support.md) page to find if your Kubernetes and Istio versions are supported, if applicable. To deploy the operator, run:

```
kubectl create namespace speedscale
speedctl deploy operator -e $(kubectl config current-context) | kubectl apply -f -
```

If you'd like to review the yaml beforehand then remove the call to `kubectl` and inspect before applying.

Once you're done, go ahead and make sure the operator pods are running properly:

```
kubectl -n speedscale get pods
```

Note: The Operator will start 2 pods (the operator itself and the Speedscale Forwarder) after it starts. On your cluster the ids of the pods will be different.

```
NAME                                    READY   STATUS    RESTARTS   AGE
speedscale-forwarder-xxxxxxxxxx-xxxxx   1/1     Running   0          5s
speedscale-operator-xxxxxxxxxx-xxxxx    1/1     Running   0          15s
```

#### Adding Image Pull Secrets <a href="#add-img-pull-secrets" id="add-img-pull-secrets"></a>

If you need custom image pull secrets (for example, if you're rehosting Speedscale images in a dedicated registry), you may provide one or more secret names with the `--imgpullsecrets` argument, and the secrets will be attached to the service account.

```
speectl deploy operator --imgpullsecrets my-secret1,my-secret2 -e $(kubectl config current-context)
```

### Uninstall Operator <a href="#uninstall-operator" id="uninstall-operator"></a>

Before you uninstall the operator, make sure that you have uninjected the sidecar from your pods.

To uninstall the Speedscale Operator, run the following command:

```
speedctl deploy operator | kubectl delete -f -
kubectl delete namespace/speedscale
```

This command must be run to properly delete the Operator.

### Using Minikube <a href="#webhook-errors" id="webhook-errors"></a>

If you get webhook errors when running in minikube, it could be related to the network configuration. You need to add these 2 flags to your start command to ensure the network is properly configured:

```
minikube start \
    --cni=true --container-runtime=containerd \
    --ALL_YOUR_OTHER_FLAGS_HERE
```

### Using microk8s <a href="#webhook-errors" id="webhook-errors"></a>

If you get webhook errors when running in microk8s, it could be related to the network configuration. You need to enable the [dns add-on](https://microk8s.io/docs/addon-dns) to ensure the network is properly configured:

```
microk8s enable dns
```

### Seeing Webhook Errors? <a href="#webhook-errors" id="webhook-errors"></a>

Manually deleting the `speedscale` namespace will cause your cluster to stop accepting deployments due to a dangling mutating webhook. The error may look something like this:

```
Internal error occurred: failed calling webhook "operator.speedscale.com":
Post "https://speedscale-operator.speedscale.svc:443/mutate?timeout=30s":dial tcp xx.xx.xx.xx:443: connect: connection refused
```

If you experience this problem, you can fix your cluster by deleting the webhook manually:

```
kubectl delete mutatingwebhookconfigurations.admissionregistration.k8s.io speedscale-operator
```

After the webhook has been deleted, re-run the full operator delete command to make sure that service roles and other items are properly cleaned up.

### Unable to edit TrafficReplays? <a href="edit-replays" id="edit-replays"></a>

Manually deleting the `speedscale-operator` deployment will cause the validating webhook for `TrafficReplays` to fail.
This will prevent modifications such as removing any finalizers on the `TrafficReplay` manually.

If you experience this problem, you can fix your cluster by deleting the webhook manually:

```
kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io speedscale-operator
```

After the webhook has been deleted, re-run the full operator delete command to make sure that service roles and other items are properly cleaned up.
