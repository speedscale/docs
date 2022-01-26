---
description: >-
  Use this option if you need to add some very special configuration or if you
  run into problems.
---

# Manually Installing Sidecar

{% hint style="danger" %}
Manual sidecar injection is not the preferred deployment method. Please deploy using the Operator if possible.&#x20;
{% endhint %}

### Pre-Requisite: secrets

The sidecar containers need additional secrets to be downloaded. Add the secrets to your namespace with:

```
$ speedctl deploy creds | kubectl -n <NS> apply -f -

secret/gcrcred created
secret/awscreds created
secret/ss-certs created
```

### Install Sidecar

To install a sidecar you need two pieces of information \* The application namespace: \* The service deployment name:

Insert these values into the following statement:

```
$ kubectl -n <NS> get deployment <DEP> -o yaml | speedctl inject -f - | kubectl apply -f -

deployment/<DEP> configured
```

Verify that the sidecar was properly injected by checking the pod status. Because there is now a sidecar running alongside your application container, you will see the pod container count increase by one. For example:

```
$ kubectl -n <NS> get pods

NAME                         READY   STATUS    RESTARTS   AGE
front-end-xxxxxxxxxx-xxxxx   2/2     Running   0          2m11s
```

Note that you may see a "young" age because the pod was restarted, and you should see **2/2** indicating that both the application container and the sidecar container have been started.

### Uninstall Sidecar

To install a sidecar you can use the **uninject** command. It is configured the same way as **inject**. Here is an example:

```
$ kubectl -n <NS> get deployment <DEP> -o yaml | speedctl uninject -f - | kubectl apply -f -

deployment/<DEP> configured
```

Just like before you can verify that the uninject worked by running get pods and looking at the output. However this time you would expect to see **1/1** because the sidecar has been removed.

```
$ kubectl -n <NS> get pods

NAME                         READY   STATUS    RESTARTS   AGE
front-end-xxxxxxxxxx-xxxxx   1/1     Running   0          2m48s
```
