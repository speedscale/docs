---
title: "GCP"
sidebar_position: 4
---

# GCP

Speedscale is compatible with Google Cloud Platform editions of Kubernetes.

### Operator Support

The Speedscale operator is compatible with GCP GKE (Google Kubernetes Engine) Autopilot and Standard, versions v1.16 and newer.

### GKE Autopilot

Autopilot is an operational mode for GKE in which the entire cluster configuration, nodes, scaling, etc. are
all managed by Google. Because it functions more as a managed service, Google also applies strict security
policies for deployed applications. Most notably, Autopilot does not allow pods with privileged containers.
Because of this, the Speedscale sidecar is unable to make the necessary networking changes needed to function
as a transparent proxy. Applications running in GKE Autopilot must configure the [proxy mode](/setup/sidecar/proxy-modes/)
of the sidecar to operate as a standard forward and reverse proxy (i.e. the "dual" proxy operation mode).

In addition to this limitation, Autopilot also enforces rules for container resource requests and limits.
Without any resource requests or limits set for a container, Autopilot will apply a default value. However,
for those that do specify resources, the value for both the request and the limit must be the same. Without
additional configuration, the Speedscale operator will configure injected sidecars with default resource
settings for CPU and memory in order to ensure that clusters utilitizing horizontal pod autoscaling work as
designed. Ephemeral storage requests/limits must also be specified. Additional workload annotations are necessary to ensure that these values are equivalent.

A complete example of the settings necessary to inject the Speedscale sidecar into an application workload
that listens for connections on port 8080 may look like the following in the helm `values.yaml`:

```
sidecar:
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
      ephemeral-storage: 100Mi
    requests:
      cpu: 500m
      memory: 512Mi
      ephemeral-storage: 100Mi
```

or via annotations:

```
sidecar.speedscale.com/inject: "true"
sidecar.speedscale.com/proxy-type: "dual"
sidecar.speedscale.com/proxy-protocol: "tcp:http"
sidecar.speedscale.com/proxy-port: "8080"
sidecar.speedscale.com/cpu-request: 500m
sidecar.speedscale.com/cpu-limit: 500m
sidecar.speedscale.com/memory-request: 1Gi
sidecar.speedscale.com/memory-limit: 1Gi
sidecar.speedscale.com/ephemeral-storage-request: 100Mi
sidecar.speedscale.com/ephemeral-storage-limit: 100Mi
```
