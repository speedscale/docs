
# FAQ

You've got questions, we've got answers.

### Does Speedscale work in my environment? <a href="#does-speedscale-work-in-my-environment" id="does-speedscale-work-in-my-environment"></a>

Check the [Technology Support](technology-support.md) page.

### Why am I missing CPU and Memory metrics in my test report? <a href="#why-am-i-missing-cpu-and-memory-metrics-in-my-test-report" id="why-am-i-missing-cpu-and-memory-metrics-in-my-test-report"></a>

Usually these metrics are missing because either the **metrics-server** is not installed or the generator does not have the correct permissions. Most cloud providers install the **metrics-server** by default, but you can find the full installation instructions in the [metrics-server github repo](https://github.com/kubernetes-sigs/metrics-server) if necessary.  You can verify if the metrics server API objects are installed with `kubectl get --raw "/apis/metrics.k8s.io"`, which will return an error if the API Group is not present. If the `metrics.k8s.io` API Group is installed and you still have issues, double check that the Deployment and associate pods are healthy with `kubectl describe -n kube-system deployment/metrics-server`.

The generator should be assigned the correct metrics collection permissions by the operator during the test run. However, if you are manually running the generator you may need to add metrics collections permissions to the generator's role like so:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
    metadata:
        name: metricrole
rules:
    - apiGroups: ["metrics.k8s.io"]
      resources: ["pods"]
      verbs: ["get", "list"]
```

For further troubleshooting, please refer to the [metrics-server docs](https://github.com/kubernetes-sigs/metrics-server/blob/master/KNOWN_ISSUES.md).

### What if my pod doesn't start? <a href="#what-if-my-pod-doesnt-start" id="what-if-my-pod-doesnt-start"></a>

Oftentimes a pod not starting is because some other dependency such as a secret, config map, service account, etc. was not fulfilled. However it may not be obvious when looking at the pods because it may just be stuck and say **0/2**. To double check this you can walk the stack like so:

```
kubectl -n <namespace> describe pod <pod-with-unique-id>
kubectl -n <namespace> describe deployment <deployment>
kubectl -n <namespace> describe relicaset <replicaset>
```

In case you are not sure the correct value to put into describe to use for any of those, you can run the get command first:

```
kubectl -n <namespace> get pods
kubectl -n <namespace> get deployments
kubectl -n <namespace> get relicasets
```

Note that you do not want to modify the replica set, but the error message in there may help you understand which component is missing.

### Not seeing traffic when using a port forward? <a href="#port-forward" id="port-forward"></a>

If you are using [**port forwarding**](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/) to call a service, then `goproxy` will not be able to detect the traffic. Enabling port forwarding will circumvent `goproxy` and prevent us from seeing any traffic.

### What if we use Pod Security Policy? <a href="#what-if-we-use-pod-security-policy" id="what-if-we-use-pod-security-policy"></a>

Speedscale can be configured to adhere to Pod Security Policy. With the exception of the init container, all other deployments and containers run as non-root with very basic permissions such as needing to access config maps and secrets.

The init container is part of the sidecar installation. It currently needs the following security permissions:
* _runAsNonRoot - _false **the init container must run as root to run the** iptables command.
* NET_RAW - needed to configure a transparent proxy
* NET_ADMIN - needed to bind an address for a transparent proxy

These are described in our own pod security policy which you can install through speedctl.

### What if we use custom CNI like Calico?

Calico and most custom networking setups should work by default with Speedscale as long as the Kubernetes control plane can communicate with the worker nodes. In specific cases where the mesh and control plane are using different networking, for eg. EKS with Calico, you can use the `hostNetwork=true` flag for the Helm chart so that the operator webhook is on the same network as the control plane.

### What if we use a security tool like TwistLock?

Twistlock and other security plugins may disable the Speedscale sidecar from capturing traffic using `iptables` rules. If this is the case, Speedscale can be configured to run in `dual` proxy mode as detailed [here](../guides/istio.md).

### How can I view JSON Request-Response pairs directly? <a href="#how-can-i-view-json-request-response-pairs-directly" id="how-can-i-view-json-request-response-pairs-directly"></a>

Sometimes when you're debugging your API or Snapshot, you want to see the raw request/response pairs in JSON format. This allows you to run **jq** or other mass conversion tools and understand what's happening better. Follow these quick steps to get at the Speedscale **raw** JSON RRPairs.

#### Create a Snapshot Report <a href="#create-a-scenario" id="create-a-scenario"></a>

First thing you need to do is create a snapshot that includes your desired RRPairs using the Create Snapshot process in the documentation. Once you've done this, copy the UUID of the Snapshot for pasting into future commands.

#### Download the "raw" file using speedctl <a href="#download-the-raw-file-using-speedctl" id="download-the-raw-file-using-speedctl"></a>

Make sure speedctl is installed as outlined in the documentation. Run the following command in the directory you would like the JSON raw file downloaded. Make sure to substitute **18f253d91c05-498a-b1d4-1cc091d5a2a1** with the UUID of your snapshot.

```
speedctl get raw 18f253d91c05-498a-b1d4-1cc091d5a2a1
```

You should now have a file with the filename **-raw.jsonl** in the current directory. It will look something like this:

```
{"msgType":"rrpair", "version":"0.0.1", "resource":"moto-api", "ts":"2020-11-23T17:00:37.120600459Z", "meta":{"clientType":"goproxy", "k8sAppLabel":"moto-api", "k8sAppPodName":"moto-api-f655b4b74-s2qn4", "k8sAppPodNamespace":"motoshop", "k8sClusterName":"aztest", "proxyId":"moto-api-f655b4b74-s2qn4", "proxyLocation":"in", "proxyType":"transparent", "proxyVersion":"v0.1.14-2-g8532110", "sequence":"141806", "targetHost":"localhost", "targetPort":"8079"}, "l7protocol":"http", "duration":383, "http":{"req":{"url":"/login", "uri":"/login", "version":"1.0", "method":"GET", "host":"moto-api", "headers":{"Accept-Encoding":["gzip, deflate, br"], "Authorization":["Basic RXZlX0JlcmdlcjpldmU="], "Connection":["close"], "User-Agent":["got (https://github.com/sindresorhus/got)"]}}, "res":{"contentType":"text/html; charset=utf-8", "statusCode":200, "statusMessage":"200 OK", "headers":{"Content-Length":["13"], "Content-Type":["text/html; charset=utf-8"], "Date":["Mon, 23 Nov 2020 17:00:37 GMT"], "Etag":["W/\"d-OaJpCA6TxxBt1wHxeVRVz2LhB2I\""], "Set-Cookie":["logged_in=vMHkNOXB9hWVc1e16PwyBMl80wGqvps9; Max-Age=3600; Path=/; Expires=Mon, 23 Nov 2020 18:00:37 GMT", "md.sid=s%3AvMHkNOXB9hWVc1e16PwyBMl80wGqvps9.CFsyvcDx5ha5MrjuXnmB4YtqhuyiyYrMwseetgirBL8; Path=/; HttpOnly"], "X-Powered-By":["Express"]}, "bodyBase64":"Q29va2llIGlzIHNldA=="}}}

{"msgType":"rrpair", "version":"0.0.1", "resource":"moto-api", "ts":"2020-11-23T17:00:37.863643670Z", "meta":{"clientType":"goproxy", "k8sAppLabel":"moto-api", "k8sAppPodName":"moto-api-f655b4b74-s2qn4", "k8sAppPodNamespace":"motoshop", "k8sClusterName":"aztest", "proxyId":"moto-api-f655b4b74-s2qn4", "proxyLocation":"in", "proxyType":"transparent", "proxyVersion":"v0.1.14-2-g8532110", "sequence":"141809", "targetHost":"localhost", "targetPort":"8079"}, "l7protocol":"http", "duration":191, "http":{"req":{"url":"/customers/57a98d98e4b00679b4a830af", "uri":"/customers/57a98d98e4b00679b4a830af", "version":"1.0", "method":"GET", "host":"moto-api", "headers":{"Accept":["application/json"], "Accept-Encoding":["gzip, deflate, br"], "Connection":["close"], "Cookie":["logged_in=vMHkNOXB9hWVc1e16PwyBMl80wGqvps9; md.sid=s%3AvMHkNOXB9hWVc1e16PwyBMl80wGqvps9.CFsyvcDx5ha5MrjuXnmB4YtqhuyiyYrMwseetgirBL8"], "User-Agent":["got (https://github.com/sindresorhus/got)"]}, "cookies":[{"name":"logged_in", "value":"vMHkNOXB9hWVc1e16PwyBMl80wGqvps9", "expires":"0001-01-01T00:00:00Z"}, {"name":"md.sid", "value":"s%3AvMHkNOXB9hWVc1e16PwyBMl80wGqvps9.CFsyvcDx5ha5MrjuXnmB4YtqhuyiyYrMwseetgirBL8", "expires":"0001-01-01T00:00:00Z"}]}, "res":{"statusCode":200, "statusMessage":"200 OK", "headers":{"Date":["Mon, 23 Nov 2020 17:00:38 GMT"], "X-Powered-By":["Express"]}, "bodyBase64":"eyJmaXJzdE5hbWUiOiJFdmUiLCJsYXN0TmFtZSI6IkJlcmdlciIsInVzZXJuYW1lIjoiRXZlX0JlcmdlciIsImlkIjoiNTdhOThkOThlNGIwMDY3OWI0YTgzMGFmIiwiX2xpbmtzIjp7ImFkZHJlc3NlcyI6eyJocmVmIjoiaHR0cDovL3VzZXIvY3VzdG9tZXJzLzU3YTk4ZDk4ZTRiMDA2NzliNGE4MzBhZi9hZGRyZXNzZXMifSwiY2FyZHMiOnsiaHJlZiI6Imh0dHA6Ly91c2VyL2N1c3RvbWVycy81N2E5OGQ5OGU0YjAwNjc5YjRhODMwYWYvY2FyZHMifSwiY3VzdG9tZXIiOnsiaHJlZiI6Imh0dHA6Ly91c2VyL2N1c3RvbWVycy81N2E5OGQ5OGU0YjAwNjc5YjRhODMwYWYifSwic2VsZiI6eyJocmVmIjoiaHR0cDovL3VzZXIvY3VzdG9tZXJzLzU3YTk4ZDk4ZTRiMDA2NzliNGE4MzBhZiJ9fX0K"}}}
...
```

The raw file is newline delimited with one JSON document per line. The format of the RRPairs may be different than what you see above but it should be fairly straightforward to decipher.

### What if I don't use namespaces? <a href="#what-if-i-dont-use-namespaces" id="what-if-i-dont-use-namespaces"></a>

Most of the instructions include **-n** for convenience. If you don't use namespaces you can either leave this out or use **default** which is the built-in namespace.

```
kubectl -n default get pods
```

Is equivalent to:

```
kubectl get pods
```
