# Operator Networking Requirements

import ExternalServices from './_external-services.mdx'

In order to operate properly, the Speedscale operator requires network access to the following services:

<ExternalServices />

## Cluster Webhook Access

Within your Kubernetes cluster, the Speedscale Operator relies on using [Kubernetes webhooks](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) to interact with workloads.
Speedscale's webhooks run within the Operator's pod over TCP on port 9443.
Traffic must be able to reach the pod and port in order for the Speedscale Operator to capture traffic.

Some environments, such as Google Kubernetes Engine Private Clusters, block webhook traffic by default.
To allow webhook traffic within your GKE Private Cluster, please consult the [GKE Private Cluster documentation on firewall rules](https://cloud.google.com/kubernetes-engine/docs/how-to/private-clusters#add_firewall_rules).
