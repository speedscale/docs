---
description: >-
  Running Speedscale in a cluster with Istio installed requires a few extra
  steps
---

# Using with Istio

The Istio Service Mesh modifies a cluster and manages traffic routing. Istio is supported by Speedscale but requires a few extra steps. When running alongside Istio, the Speedscale sidecar adds an additional component called an [Envoy Filter](https://www.solo.io/blog/the-state-of-webassembly-in-envoy-proxy/). Running as an Envoy Filter has a number of advantages including lower overhead and configurability through Envoy.

## Configuration Sidecar for Recording

### 1. Set sidecar captureMode=istio

On your Kubernetes workload, add the following annotation

```
sidecar.speedscale.com/captureMode: "istio"
```

This will let the Speedscale operator know to patch the sidecar including a WebAssembly Envoy filter.

### 2. Add speedscale sidecar egress

If the istio sidecar has a custom configuration, ensure that the `speedscale` namespace is on the egress list. This step is not necessary if you do not have a custom sidecar configuration. Here is an example from the Istio [docs](https://istio.io/latest/docs/reference/config/networking/sidecar/):

```
apiVersion: networking.istio.io/v1alpha3
kind: Sidecar
metadata:
  name: default
  namespace: prod-us1
spec:
  egress:
  - hosts:
    - "speedscale/*"
```

### 3. Ensure VirtualService contains host

If your service is accessible both outside and inside the cluster, make sure the Istio `VirtualService` contains the same host. Take a look at the Istio [documentation](https://istio.io/latest/docs/reference/config/networking/virtual-service/) for more information.



Istio allows for numerous different networking configuration options. Please take a look at the Istio documentation or reach out to Speedscale directly for more information.
