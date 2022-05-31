---
sidebar_position: 1
---

# Preparing the Environment

Speedscale collects detailed information about the service under test during replay. To achieve maximum fidelity, make sure every data source is enabled.

### Metrics Server

The Kubernetes metrics server provides CPU and Memory usage through the replay. Speedscale will collect these metrics if they are available and collate them into the test report.

#### Check if it's already installed

Run the following command:

```
kubectl get pods --all-namespaces | grep metrics-server
```

If no results are found, install the metrics-server with the following command:

```
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

The following output indicates a successful installation:

```
serviceaccount/metrics-server created
clusterrole.rbac.authorization.k8s.io/system:aggregated-metrics-reader created
clusterrole.rbac.authorization.k8s.io/system:metrics-server created
rolebinding.rbac.authorization.k8s.io/metrics-server-auth-reader created
clusterrolebinding.rbac.authorization.k8s.io/metrics-server:system:auth-delegator created
clusterrolebinding.rbac.authorization.k8s.io/system:metrics-server created
service/metrics-server created
deployment.apps/metrics-server created
apiservice.apiregistration.k8s.io/v1beta1.metrics.k8s.io created
```
