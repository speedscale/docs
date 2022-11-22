# GCP

Speedscale is compatible with Google Cloud Platform editions of Kubernetes.

### Operator Support

The Speedscale operator is compatible with GCP GKE (Google Kubernetes Engine) Autopilot and Standard, versions v1.16 and newer.

### GKE Autopilot

Because GKE Autopilot is configured with strict security policies, it is not possible to run privileged containers. The sidecar container can capture traffic in multiple modes:

* **Transparent Proxy** - this requires a privileged container
* **Dual Proxy** - this does not require privileges, but you must reconfigure your port
* **Istio** - this requires a privileged container (for the istio sidecar)

Because of the security restrictions for Autopilot, you must configure the [proxy mode](/setup/sidecar/proxy-modes/) mode for the sidecar to capture traffic.
