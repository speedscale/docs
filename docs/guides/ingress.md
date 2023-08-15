---
title: Capture Cluster Ingress Traffic
---

In some instances, it may be desirable to capture cluster ingress traffic. Doing so allows you the ability
create snapshots consisting of traffic that potentially span multiple backend services and replay them with
the intent of testing the environment as a whole (as compared to a per-service basis). The guide below will
demonstrate how to do this specifically for clusters using
[`ingress-nginx`](https://kubernetes.github.io/ingress-nginx/) as their ingress controller.

## Prerequisites

1. A cluster with the Speedscale operator installed and with `ingress-nginx` configured as its ingress controller
1. TLS connections are terminated at the `ingress-nginx` controller

## Install the Speedscale Sidecar

To begin, the Speedscale sidecar must be installed on the ingress controller deployment
`ingress-nginx-controller` in the `ingress-nginx` namespace. Begin by creating a patch YAML file for the
deployment with the following content:

```yaml
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  annotations:
    sidecar.speedscale.com/inject: "true"
```

If the ingress controller makes requests to target workloads with an additional TLS connection, and you wish
to have visibility into these requests, add the `tls-out` annotation to the patch:

```yaml
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls-out: "true"
```

During its normal operation, the `ingress-nginx` controller issues HTTP requests to itself via a request to
`localhost` to perform status checks, obtain state information or configuration, and other actions via its own
API. It will also make requests to the kubernetes API when `Ingress` resources are created, modified, or
deleted. Both of these sets of traffic are generally not useful and can be excluded from capture:

```yaml
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls-out: "true"
    sidecar.speedscale.com/ignore-dst-hosts: "kubernetes.default.svc"
    sidecar.speedscale.com/ignore-loopback: "true"
```

With `nginx` handling ingress TLS termination, the Speedscale sidecar must be further configured to support
inbound TLS decryption, which requires specifying a certificate and key to use. Installations should have an
existing secret named `ingress-nginx-admission` in the `ingress-nginx` namespace containing data in keys named
`ca`, `cert`, and `key`. Modify the patch to add the `tls-in` annotations:

```yaml
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls-out: "true"
    sidecar.speedscale.com/ignore-dst-hosts: "kubernetes.default.svc"
    sidecar.speedscale.com/ignore-loopback: "true"
    sidecar.speedscale.com/tls-in-secret: "ingress-nginx-admission"
    sidecar.speedscale.com/tls-in-private: "key"
    sidecar.speedscale.com/tls-in-public: "cert"
```

:::tip

If the above secret is missing, one can easily be created with `speedctl` and `kubectl`:

```shell
speedctl create certs -o .
kubectl create -n ingress-nginx secret ingress-nginx-admission \
    --from-file=key=tls.key \
    --from-file=cert=tls.crt
```

:::

We now have our complete patch. Save this to a file `patch-deployment.yaml` and apply it:

```shell
kubectl patch deployment -n ingress-nginx ingress-nginx-controller --patch-file patch-deployment.yaml
```

Note though that the deployment `ingress-nginx-controller` performs two different tasks. First, it performs
`nginx` reverse proxying to targeted cluster resources based on `Ingress` definition rules (this operation
contains the traffic that we are primarily interested in). Second, it serves as the target of a
validating admission webhook named `ingress-nginx-admission` which is configured to be invoked for `CREATE`
and `UPDATE` operations on `Ingress` reources. This means if we stopped after applying the patch, calls to the
webhook would fail as it is being presented a certificate it is not configured to trust.

To prevent this, we need to patch the validating admission webhook to specify a `caBundle` value that contains
the certificate the sidecar uses and presents to clients. First, get the base64 encoded value:

```shell
kubectl get -n ingress-nginx secret ingress-nginx-admission -o json | jq -r '.data["cert"]'
```

Then, copy this value and include in the following patch. Note, because the data we are patching is a list, we
need to use a different patch format (replace `CERT_VALUE` with the base64 encoded certificate above):

```json
{
  "op": "add",
  "path": "/webhooks/0/clientConfig/caBundle",
  "value": "CERT_VALUE"
}
```

Save this to a file `patch-webhook.json` and apply it:

```shell
kubectl patch validatingwebhookconfiguration -n ingress-nginx-admission -type='json' -p="$(cat patch-webhook.json)"
```

With both patches applied, log in to the Speedscale UI and confirm the visibility of traffic rot the
`ingress-nginx-controller` service that appears. You may need to manually issue a request to your cluster to
observe any data.
