# FAQ

You've got questions, we've got answers.

### Does Speedscale work in my environment? <a href="#does-speedscale-work-in-my-environment" id="does-speedscale-work-in-my-environment"></a>

Check the [Technology Support](technology-support.md) page.

### Why am I missing CPU and memory metrics in my test report? <a href="#why-am-i-missing-cpu-and-memory-metrics-in-my-test-report" id="why-am-i-missing-cpu-and-memory-metrics-in-my-test-report"></a>

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

### Why are some CPU and memory metrics missing in my test report?

Often CPU and memory metrics have a gap in the data and metrics are not shows for the full [replay](/reference/glossary.md#replay) length.  The [collector](/reference/glossary.md#collector) starts up with the replay and there is a delay between when services start and when the Kubernetes API starts reporting their usage data.  Speedscale chooses to get your replay running as fast as possible at the risk of missing early usage data.

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

### Communication with the generator was lost during replay?

Under normal circumstances the [generator](./glossary.md#generator) runs for as long as it takes to make requests according to the [snapshot](./glossary.md#snapshot) and [test config](./glossary.md#test-config), sends replay details to the Speedscale cloud and exits cleanly, but things can go sideways with this critical component in a number of ways.

The most common failure scenario happens when the generator runs out of memory. The generator needs to store information about requests while they are being sent to the Speedscale cloud and sending too many requests at one time can cause an [OOM](https://en.wikipedia.org/wiki/Out_of_memory) event.  Try increasing the generator's resource requirements or enabling generator [low data mode](./glossary.md#low-data-mode) in the test config.

### Why is the generator being CPU throttled?

CPU throttling is a mechanism where the operating system intentionally slows down a process.  This can happen because there isn't enough CPU for all the processes asking for it, or when CPU quotas are exceeded and enforced.  In Kubernetes this most often happens when a container [exceeds its predefined CPU resource limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#how-pods-with-resource-limits-are-run).

The maximum throughput of the [generator](./glossary.md#generator) is limited by the CPU available to it, among [other factors](./generator-sizing-guide.md#factors-affecting-throughput). The CPU required is directly related to the number of [vUsers](./glossary.md#vuser) defined in the [test config](./glossary.md#test-config).  When the generator tries to use more CPU than is allowed or available it will be CPU throttled.

:::warning
Latency calculation is no longer reliable once the generator is being CPU throttled.
:::

CPU throttling will limit the maximum throughput the generator can achieve, but it also affects how latency for the [SUT](./glossary.md#sut) is calculated.  If the generator is denied access to the CPU it cannot accurately measure time, meaning a request that took 10ms in real time could look like it took 5000ms!

See the [sizing guide](./generator-sizing-guide.md) for general recommendations on generator sizing.

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

Twistlock and other security plugins may disable the Speedscale sidecar from capturing traffic using `iptables` rules. If this is the case, Speedscale can be configured to run in `dual` proxy mode as detailed [here](../setup/install/istio.md).

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

### What if I need to manually uninstall Speedscale?

Sometimes `helm` misbehaves and crashes. Sometimes `speedctl uninstall` doesn't have the permissions to completely uninstall all components. Here's how you manually uninstall Speedscale completely.

Uninstalling Speedscale requires three steps:

1. Delete the operator webhooks

Manually deleting the `speedscale` namespace will cause your cluster to stop accepting deployments due to a dangling mutating webhook. The error may look something like this:

```
Internal error occurred: failed calling webhook "operator.speedscale.com":
Post "https://speedscale-operator.speedscale.svc:443/mutate?timeout=30s":dial tcp xx.xx.xx.xx:443: connect: connection refused
```

For that reason, we need to delete the webhooks manually before deleting the operator/namespace. Run the following commands:

```bash
kubectl delete mutatingwebhookconfigurations.admissionregistration.k8s.io speedscale-operator speedscale-operator-replay
kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io speedscale-operator-replay
```

2. Delete the speedscale namespace

Now it's ok to delete speedscale components like so:

```bash
kubectl delete ns speedscale
```

This will clean up the Speedscale control plane.

3. Remove the sidecar from you workloads

Deleting the control plane does not automatically delete sidecars already attached to your workloads. You'll need to manually identify workloads with the sidecar and delete the sidecar. Here's a helpful command that will identify sidecars:

```bash
kubectl get pods --selector=sidecar.speedscale.com/injected=true
```

Remember to insert your namespace qualifier if necessary. The easiest way to remove the sidecar is simply to redeploy from your source yaml.

However, if you simply must remove the sidecar manually then delete both `goproxy` containers. Let's take an example workload extracted with `kubectl get deployment <name> -o yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    operator.speedscale.com/managed-by: k8s-1-27-4-do-0-nyc3-1691800765671-117b0b47-6533-4e39-aeac-484bc8894f14
    operator.speedscale.com/namespace: speedscale
    sidecar.speedscale.com/inject: "true"
  labels:
    app.kubernetes.io/instance: demo-java
    operator.speedscale.com/sut: "true"
    sidecar.speedscale.com/injected: "true"
  name: java-server
  namespace: default
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: java-server
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: java-server
        sidecar.speedscale.com/injected: "true"
    spec:
      containers:
      - env:
        - name: REQUEST_TAG
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: metadata.name
        image: gcr.io/speedscale-demos/java-server:1.0.1
        imagePullPolicy: Always
        name: java-server
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
      - env:
        - name: APP_LABEL
          value: java-server
        - name: APP_POD_NAME
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: metadata.name
        - name: APP_POD_NAMESPACE
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
        - name: CAPTURE_MODE
          value: proxy
        - name: FORWARDER_ADDR
          value: speedscale-forwarder.speedscale.svc:80
        - name: LOG_LEVEL
          value: info
        - name: PROXY_IN_PORT
          value: "4143"
        - name: PROXY_OUT_PORT
          value: "4140"
        - name: PROXY_TYPE
          value: transparent
        - name: SPEC_NODENAME
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: spec.nodeName
        - name: SPEC_SERVICEACCOUNTNAME
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: spec.serviceAccountName
        - name: STATUS_HOST_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.hostIP
        - name: STATUS_POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
        - name: TLS_CERT_DIR
          value: /etc/ssl/speedscale
        - name: TLS_AUTODISCOVERY
          value: "false"
        image: gcr.io/speedscale/goproxy:v2.3.586
        imagePullPolicy: Always
        name: speedscale-goproxy
        ports:
        - containerPort: 4143
          name: proxy-in
          protocol: TCP
        resources: {}
        securityContext:
          capabilities:
            add:
            - NET_RAW
          readOnlyRootFilesystem: false
          runAsGroup: 2102
          runAsUser: 2102
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      initContainers:
      - command:
        - init-iptables.sh
        env:
        - name: PROXY_IN_PORT
          value: "4143"
        - name: PROXY_OUT_PORT
          value: "4140"
        - name: PROXY_UID
          value: "2102"
        - name: CAPTURE_MODE
          value: proxy
        - name: PROXY_TYPE
          value: transparent
        - name: PROXY_PROTOCOL
        - name: STATUS_POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
        - name: STATUS_HOST_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.hostIP
        image: gcr.io/speedscale/goproxy:v2.3.586
        imagePullPolicy: Always
        name: speedscale-initproxy-iptables
        resources:
          limits:
            cpu: 100m
            memory: 50Mi
          requests:
            cpu: 10m
            memory: 32Mi
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_RAW
            - NET_ADMIN
          privileged: false
          readOnlyRootFilesystem: false
          runAsNonRoot: false
          runAsUser: 0
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: FallbackToLogsOnError
      - command:
        - sh
        - -c
        - init-smartdns.sh || true
        env:
        - name: PROXY_IN_PORT
          value: "4143"
        - name: PROXY_OUT_PORT
          value: "4140"
        - name: PROXY_UID
          value: "2102"
        - name: CAPTURE_MODE
          value: proxy
        - name: PROXY_TYPE
          value: transparent
        - name: PROXY_PROTOCOL
        - name: STATUS_POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
        - name: STATUS_HOST_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.hostIP
        image: gcr.io/speedscale/goproxy:v2.3.586
        imagePullPolicy: Always
        name: speedscale-initproxy-smartdns
        resources:
          limits:
            cpu: 100m
            memory: 50Mi
          requests:
            cpu: 10m
            memory: 32Mi
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_RAW
            - NET_ADMIN
          privileged: false
          readOnlyRootFilesystem: false
          runAsNonRoot: false
          runAsUser: 0
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: FallbackToLogsOnError
      restartPolicy: Always
      schedulerName: default-scheduler
      terminationGracePeriodSeconds: 30
```

You must delete these two sections:
```yaml
        image: gcr.io/speedscale/goproxy:v2.3.586
        imagePullPolicy: Always
        name: speedscale-goproxy
        ports:
        - containerPort: 4143
          name: proxy-in
          protocol: TCP
        resources: {}
        securityContext:
          capabilities:
            add:
            - NET_RAW
          readOnlyRootFilesystem: false
          runAsGroup: 2102
          runAsUser: 2102
```

```yaml
      initContainers:
      - command:
        - init-iptables.sh
        env:
        - name: PROXY_IN_PORT
          value: "4143"
        - name: PROXY_OUT_PORT
          value: "4140"
        - name: PROXY_UID
          value: "2102"
        - name: CAPTURE_MODE
          value: proxy
        - name: PROXY_TYPE
          value: transparent
        - name: PROXY_PROTOCOL
        - name: STATUS_POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
        - name: STATUS_HOST_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.hostIP
        image: gcr.io/speedscale/goproxy:v2.3.586
        imagePullPolicy: Always
        name: speedscale-initproxy-iptables
        resources:
          limits:
            cpu: 100m
            memory: 50Mi
          requests:
            cpu: 10m
            memory: 32Mi
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_RAW
            - NET_ADMIN
          privileged: false
          readOnlyRootFilesystem: false
          runAsNonRoot: false
          runAsUser: 0
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: FallbackToLogsOnError
      - command:
        - sh
        - -c
        - init-smartdns.sh || true
        env:
        - name: PROXY_IN_PORT
          value: "4143"
        - name: PROXY_OUT_PORT
          value: "4140"
        - name: PROXY_UID
          value: "2102"
        - name: CAPTURE_MODE
          value: proxy
        - name: PROXY_TYPE
          value: transparent
        - name: PROXY_PROTOCOL
        - name: STATUS_POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
        - name: STATUS_HOST_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.hostIP
        image: gcr.io/speedscale/goproxy:v2.3.586
        imagePullPolicy: Always
        name: speedscale-initproxy-smartdns
        resources:
          limits:
            cpu: 100m
            memory: 50Mi
          requests:
            cpu: 10m
            memory: 32Mi
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            add:
            - NET_RAW
            - NET_ADMIN
          privileged: false
          readOnlyRootFilesystem: false
          runAsNonRoot: false
          runAsUser: 0
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: FallbackToLogsOnError
```