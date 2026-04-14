---
title: "GCP"
description: "Integrate Speedscale with Google Cloud Platform's GKE to optimize API testing and traffic replay while adhering to Autopilot's strict security policies"
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
as a transparent proxy. Applications running in GKE Autopilot must configure the [proxy mode](/getting-started/installation/sidecar/proxy-modes.md)
of the sidecar to operate as a standard forward and reverse proxy (i.e. the "dual" proxy operation mode).

`transparent` proxy mode is not supported in GKE Autopilot.

Autopilot also blocks the sidecar's smart reverse DNS behavior because it requires the `NET_ADMIN`
capability. When installing the Speedscale operator with Helm, set
`disableSidecarSmartReverseDNS: true` in your operator values. See the [Helm reference](/reference/helm.md)
for details.

`dual` mode changes how the sidecar operates, but it does not reconfigure your application runtime to send
outbound requests to the sidecar's forward proxy. Your workload must still use runtime-specific proxy
settings such as `HTTP_PROXY` and `HTTPS_PROXY` or Java `JAVA_TOOL_OPTIONS` flags. See
[Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md), [TLS Support](/getting-started/installation/sidecar/tls.md),
and the [Java reference](/reference/languages/java.md) for the combined in-cluster Java example.

In addition to this limitation, Autopilot also enforces rules for container resource requests and limits.
Without any resource requests or limits set for a container, Autopilot will apply a default value. However,
for those that do specify resources, the value for both the request and the limit must be the same. Without
additional configuration, the Speedscale operator will configure injected sidecars with default resource
settings for CPU and memory in order to ensure that clusters utilitizing horizontal pod autoscaling work as
designed. Ephemeral storage requests/limits must also be specified. Additional workload annotations are necessary to ensure that these values are equivalent.

A complete example of the operator-level settings necessary for GKE Autopilot may look like the following in
the Helm `values.yaml`:

```
disableSidecarSmartReverseDNS: true

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

Then configure the workload for inline proxy mode with annotations such as:

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

### What You Must Still Configure In The App

After the sidecar is injected, the application runtime must still send outbound traffic to the sidecar's
forward proxy on `127.0.0.1:4140` unless you changed `proxy-out-port`.

- Java: add `-Dhttp.proxyHost`, `-Dhttp.proxyPort`, `-Dhttps.proxyHost`, and `-Dhttps.proxyPort` in
  `JAVA_TOOL_OPTIONS`. If you also enable `tls-out`, add the truststore flags documented on the
  [Java reference](/reference/languages/java.md).
- Languages that honor proxy environment variables: set `HTTP_PROXY` and `HTTPS_PROXY` to
  `http://127.0.0.1:4140`.
- Languages or client libraries with custom proxy behavior: configure the library directly so outbound
  traffic actually uses the sidecar.
