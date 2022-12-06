---
title: Working with Istio
---

import ExternalServices from '../reference/_external-services.mdx'

[Istio](https://istio.io) is a service mesh offering that modifies a cluster to provide, among
other things, traffic and network management.

## External Networking Requirements

Speedscale pods in the the `speedscale` namespace, as well as the `generator` and `responder` pods that are
deployed during traffic replays require external internet access. If your istio installation is configured
with an outbound traffic policy of `REGISTRY_ONLY` rather than `ALLOW_ANY`, meaning that only whitelisted
services can be accessed from within the cluster (see
[OutboundTrafficPolicy](https://istio.io/latest/docs/reference/config/istio.mesh.v1alpha1/#MeshConfig-OutboundTrafficPolicy)),
you will to configure [ServiceEntry](https://istio.io/latest/docs/reference/config/networking/service-entry/)
resources that allow the following `MESH_EXTERNAL` access:

<ExternalServices />

For example:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: speedscale-external-svc-https
  namespace: speedscale
spec:
  hosts:
  - app.speedscale.com
  - firehose.us-east-1.amazonaws.com
  - sqs.us-east-1.amazonaws.com
  - sns.us-east-1.amazonaws.com
  - s3.us-east-1.amazonaws.com
  - "*.s3.us-east-1.amazonaws.com"
  - sts.amazonaws.com
  - sts.us-east-1.amazonaws.com
  location: MESH_EXTERNAL
  ports:
  - name: https
    number: 443
    protocol: TLS
  resolution: NONE
```

## Speedscale Sidecar Configuration
Istio makes use of a proxy known as [Envoy](https://www.envoyproxy.io), which it adds as a sidecar to
workloads that reside within the mesh. Both the Istio and Speedscale sidecars act as transparent proxies: each
must modify `iptables` routing rules in order to intercept both ingress and egress traffic. Unfortunately,
they cannot coexist when operating in this mode since both are attempting to intercept and manage workload
traffic.

Istio **is** supported by Speedscale despite this conflict, but requires a few extra steps.

Within an Istio mesh, the Speedscale sidecar must operate as a non-transparent proxy; a reverse
proxy for inbound traffic and a forward proxy for outbound traffic. This requires two things:

1. Envoy must be configured to send ingress traffic to the Speedscale reverse proxy, which is done
   automatically by the Speedscale Operator via an Istio
   [Sidecar](https://istio.io/latest/docs/reference/config/networking/sidecar) resource.
2. Your application must be configured to use an outbound proxy

### Add Workload Annotations

Begin by adding the following annotations to your Kubernetes workload along with any other
[sidecar annotations](/setup/sidecar/annotations/):

```yaml
sidecar.speedscale.com/inject: "true"
sidecar.speedscale.com/capture-mode: proxy
sidecar.speedscale.com/proxy-type: dual
sidecar.speedscale.com/proxy-protocol: tcp:http
```

Note: the `proxy-protocol` annotation shown above will operate the outbound, forward proxy as an
HTTP proxy. If your application needs so use a SOCKS4 or SOCKS5 proxy, use `tcp:socks`. See
[proxy modes](/setup/sidecar/proxy-modes/) for more information.

Also, add annotations to inform the Speedscale sidecar on what host and port your application
container is listening. For example, if your application listens to localhost port 8080:

```yaml
sidecar.speedscale.com/proxy-host: "localhost"
sidecar.speedscale.com/proxy-port: "8080"
```

### Configure Outbound Proxy Settings

In many instances, configuring your application to use an HTTP or SOCKS proxy for outbound traffic
can be done simply by setting environment variables. Typically these environment variables are
`HTTP_PROXY` for unencrypted HTTP requests and `HTTPS_PROXY` for TLS HTTP requests. See the
[Configuring Your Application Proxy Server](/setup/sidecar/proxy-modes/#configuring-your-application-proxy-server)
documentation more detail and some language specific examples.

Modify your workload to add the necessary proxy configuration to your application container's
environment variables. For example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - env:
        - name: HTTP_PROXY
          value: http://localhost:4140
        - name: HTTPS_PROXY
          value: http://localhost:4140
```

Note, if you configured the Speedscale proxy to use SOCKS4/5 instead of HTTP for outbound traffic,
change the URL above to `socks5://localhost:4140`.

### Configure Outbound TLS Support

Outbound TLS support for the Speedscale sidecar can be enabled with the annotation
`sidecar.speedscale.com/tls-out: "true"`. You may be required to perform additional steps if your
application and not Envoy is originating TLS requests. See
[Trusting TLS Certificates](../tls/#trusting-tls-certificates) for more information.

### Allow Egress Speedscale Traffic (Optional)

If your Istio installation and sidecar control which subset of egress traffic is allowable, you may
need to add the `speedscale` namespace to the sidecar's egress configuration. This step is not
necessary if you do not have custom sidecar configuration. Here is an example from the Istio
[docs](https://istio.io/latest/docs/reference/config/networking/sidecar/):

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: prod-us1
spec:
  egress:
  - hosts:
    - "speedscale/*"
```

### Ensure VirtualService Contains Host (Optional)

If your service is accessible both outside and inside the cluster, make sure the Istio
`VirtualService` contains the same host. See the Istio
[documentation](https://istio.io/latest/docs/reference/config/networking/virtual-service/) for more
information.

## Get In Touch

Istio allows for numerous different networking configuration options that can become difficult to
navigate. Please be sure to consult the Istio [documentation](https://istio.io/latest/docs/) or
reach out to Speedscale directly for more information or assistance.
