---
title: Istio
sidebar_position: 11
---

import ExternalServices from '../../reference/\_external-services.mdx'

:::info
Please make sure the [Speedscale Operator](../../quick-start.md) is installed before configuring Istio support.
:::

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
    - downloads.speedscale.com
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

Istio makes use of a transparent proxy known as [Envoy](https://www.envoyproxy.io), which is added as a
sidecar to workloads that reside within the mesh. This sidecar, much like Speedscale's, also modified iptables
rules in order to intercept traffic without any modification to a user's application.

No additional configuration is required to add the Speedscale sidecar to workloads that reside within an Istio
mesh.

The Speedscale operator intelligently determines when Istio is present and configures workloads accordingly so
that both transparent proxies operate in tandem. In addition, the Speedscale operator and sidecar are
configured in such a way that they preserve the ability to use Istio mesh features such as mTLS.

:::danger Important
If your Istio installation is configured to use the [Istio CNI Agent](https://istio.io/latest/docs/setup/additional-setup/cni/),
you _must_ annotate your workloads with the following annotation to maintain compatibility:

```
sidecar.speedscale.com/istio-cni: "true"
```

:::

Follow the [installation guide](../sidecar/install.md) to install the Speedscale sidecar on your Istio workloads.

## Allow Egress Speedscale Traffic (Optional)

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

### Istio debug logs

Apart from taking the usual debugging steps mentioned [here](../../guides/troubleshooting.md) you can also increase the log level on the Istio sidecar by running the following command.

```sh
kubectl -n {YOUR NAMESPACE} exec -it {POD NAME}-c istio-proxy  -- sh -c "curl -X POST  localhost:15000/logging?level=debug"
```

## Get In Touch

Istio allows for numerous different networking configuration options that can become difficult to
navigate. Please be sure to consult the Istio [documentation](https://istio.io/latest/docs/) or
reach out to Speedscale directly for more information or assistance.
