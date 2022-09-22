---
sidebar_position: 3
---
# Troubleshooting

## Installation Permissions

No matter what deployment method you use, the following _create_ permissions are required to install Speedscale.

* Cluster-wide resources:
    * `CustomResourceDefinitions`
    * `ClusterRole`
    * `ClusterRoleBinding`
    * `MutatingWebhookConfiguration`
    * `ValidatingWebhookConfiguration`
* Namespaced resources
    * `ConfigMap`
    * `Deployment`
    * `Job`
    * `Role`
    * `Service`
    * `Secret`

You can verify you have permissions and other prerequisites by running `speedctl check operator --pre`.
This will not modify anything within your cluster.

## Operation Permissions

Once Speedscale is installed in your cluster, the `speedscale-operator` cluster role will have permissions to create, list, watch, and modify workload manifests.
Speedscale will use these permissions to add a sidecar container to the workload.
Workloads include `DaemonSet`, `Deployment`, `Job`, `ReplicaSet`, and `StatefulSet`.
Additionally, the `speedscale-operator` role can create, modify, and watch configuration such as Istio's `Sidecar`.

For a full list of permissions that Speedscale is using, you may use one of the following methods:

* Review the latest version of the Helm chart
* Run `speedctl deploy operator --dir output>` and inspect `rbac.yaml` to read the manifest
* Run `kubectl get -n speedscale clusterrole/speedscale-operator -o yaml` to see the installed manifest.

### Using Minikube <a href="#webhook-errors" id="webhook-errors"></a>

If you get webhook errors when running in minikube, it could be related to the network configuration. You need to add these 2 flags to your start command to ensure the network is properly configured:

```
minikube start \
    --cni=true --container-runtime=containerd \
    --ALL_YOUR_OTHER_FLAGS_HERE
```

#### Signature expired

If you see errors relating to an invalid signature involving timestamps (example below), this is because the VM your minikube instance is running on has fallen out of sync with the actual time. This is a [known problem with Hyperkit](https://github.com/kubernetes/minikube/issues/1378).

```
SignatureDoesNotMatch: Signature expired: 20220727T233601Z is now earlier than 20220727T234712Z (20220728T000212Z - 15 min.)
```

The time needs to be resynced on the VM and can be done via
```
ssh -i ~/.minikube/machines/minikube/id_rsa docker@$(minikube ip) "docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i date -u $(date -u +%m%d%H%M%Y)"
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

### Unable to edit TrafficReplays?

Manually deleting the `speedscale-operator` deployment will cause the validating webhook for `TrafficReplays` to fail.
This will prevent modifications such as removing any finalizers on the `TrafficReplay` manually.

If you experience this problem, you can fix your cluster by deleting the webhook manually:

```
kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io speedscale-operator
```

After the webhook has been deleted, re-run the full operator delete command to make sure that service roles and other items are properly cleaned up.
