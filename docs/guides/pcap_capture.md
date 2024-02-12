---
title: Capture a PCAP via the Sidecar
sidebar_position: 40
---

### Instructions

The Speedscale sidecar has a built in “diagnostics mode” that does a couple of useful things:

1. Enables `TRACE` level logging
2. Configures `goproxy` to create packet captures for all known interfaces in the container

To enable diagnostics mode, add the following annotation to the `speedscale-goproxy container`:

```
sidecar.speedscale.com/diagnostics: "true"
```

When the workload restarts, you will see `speedscale-goproxy` logging messages that say something like `starting diagnostic packet capture`. There are also periodic log messages that show counts of the number of packets captured on each interface.

### Obtaining PCAPs

PCAPs are all written into the `/tmp` directory in the `speedscale-goproxy` container. Each PCAP is named with the format `goproxy-capture.<IFACE>.pcap` where `<IFACE>` is the name of the network interface captured. Most installations will have the following captures:

- `goproxy-capture.eth0.pcap` - all inbound/outbound pod traffic
- `goproxy-capture.lo.pcap` - all traffic observed on the pod’s loopback interface
- `goproxy-capture.dns0.pcap` - all DNS A record responses observed by the “smartdns” feature

Use `kubectl cp` in order to get the capture you need:

```jsx
kubectl cp -n <NAMESPACE> -c speedscale-goproxy <POD_NAME>:/tmp/goproxy-capture.eth0.pcap goproxy-capture.eth0.pcap
```

### Manually Enabling Capture Mode

If you need to turn on packet captures manually without the use of the above annotation, there are a few things that need to be updated for the `speedscale-goproxy` container:

- add environment variable `CAPTURE_PCAP=true`
- add sys capability `NET_ADMIN`
- k8s only: add `allowPrivilegeEscalation: true` to `goproxy` container’s `securityContext`