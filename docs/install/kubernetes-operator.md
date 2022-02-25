
# Kubernetes Operator

The operator acts like a SRE inside your own cluster, properly deploying and
configuring the various Speedscale components.

The Speedscale Kubernetes Operator works similarly to a service mesh controller like Istio or Linkerd. It waits for deployments to be applied to the cluster that contain specific annotations. It then automatically stands up an isolation test environment around the deployment. The operator itself is a deployment that will be always present on the cluster.

### Install Wizard

The easiest way to install the Speedscale Operator is through the [install wizard](./install-wizard.md).
The additional steps here provode instructions for manually generating Speedscale Operator manifests, which.
is necessary when manifests are sourced from version control for example.

### Install Operator <a href="#install-operator" id="install-operator"></a>

The Speedscale Operator is compatible with Kubernetes 1.16 and newer releases. To deploy the operator, run:

```
speedctl deploy operator -e $(kubectl config current-context) | kubectl apply -f -
```

If you'd like to review the yaml beforehand then remove the call to `kubectl` and inspect. The output should look something like this:

```
namespace/speedscale created
secret/gcrcred created
secret/awscreds created
secret/ss-certs created
secret/operator-cert created
configmap/speedscale-controller created
role.rbac.authorization.k8s.io/speed-operator-leader-election-role created
clusterrole.rbac.authorization.k8s.io/speed-operator-manager-role created
clusterrole.rbac.authorization.k8s.io/speed-operator-proxy-role created
clusterrole.rbac.authorization.k8s.io/speed-operator-metrics-reader created
rolebinding.rbac.authorization.k8s.io/speed-operator-leader-election-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/speed-operator-manager-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/speed-operator-proxy-rolebinding created
service/speed-operator-controller-manager-metrics-service created
service/speed-operator-webhook-service created
deployment.apps/speed-operator-controller-manager created
mutatingwebhookconfiguration.admissionregistration.k8s.io/speed-operator-mutating-webhook-configuration created
```

Once you're done, go ahead and make sure the operator pods are running properly:

```
kubectl -n speedscale get pods
```

Note: The operator will start 2 other pods (forwarder and redis) after it starts. On your cluster the ids of the pods will be different.

```
NAME                                                 READY   STATUS    RESTARTS   AGE
speed-operator-controller-manager-xxxxxxxxxx-xxxxx   2/2     Running   0          16s
speedscale-forwarder-xxxxxxxxx-xxxxx                 1/1     Running   0          10s
speedscale-redis-xxxxxxxxxx-xxxxx                    1/1     Running   0          10s
```

### Uninstall Operator <a href="#uninstall-operator" id="uninstall-operator"></a>

Before you uninstall the operator, make sure that you have uninjected the sidecar from your pods.

To uninstall the Speedscale Operator, run the following command:

```
speedctl deploy operator | kubectl delete -f -
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

Manually deleting the speedscale namespace will cause your cluster to stop accepting deployments due to a dangling mutating webhook. The error may look something like this:

```
Internal error occurred: failed calling webhook "operator.speedscale.com":
Post "https://speed-operator-webhook-service.speedscale.svc:443/mutate-speedscale-speedscale-com-v1-isotest?timeout=30s":
dial tcp xx.xx.xx.xx:443: connect: connection refused
```

If you experience this problem, you can fix your cluster by deleting the webhook manually:

```
kubectl delete mutatingwebhookconfigurations.admissionregistration.k8s.io speed-operator-mutating-webhook-configuration
```

After the webhook has been deleted, re-run the full operator delete command to make sure that service roles and other items are properly cleaned up.
