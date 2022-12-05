# Operator Networking Requirements

In order to operate properly, the Speedscale operator requires network access to the following services:

| host | protocol | direction |
| ---- | -------- | --------- |
| app.speedscale.com | HTTPS | Outbound |
| firehose.us-east-1.amazonaws.com | HTTPS | Outbound |
| sqs.us-east-1.amazonaws.com | HTTPS | Outbound |
| s3.us-east-1.amazonaws.com | HTTPS | Outbound |
| *.s3.us-east-1.amazonaws.com | HTTPS | Outbound |
| sts.amazonaws.com | HTTPS | Outbound |
| sts.us-east-1.amazonaws.com | HTTPS | Outbound |
| gcr.io | HTTPS | Outbound |

Note that these hosts may change and security via TLS is recommended as opposed to IP whitelisting. If you require a list of IPs, they can be programmatically accessed as shown [here for AWS](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html) and [here for GCR](https://www.gstatic.com/ipranges/cloud.json).

## Cluster Webhook Access

Within your Kubernetes cluster, the Speedscale Operator relies on using [Kubernetes webhooks](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) to interact with workloads.
Speedscale's webhooks run within the Operator's pod over TCP on port 9443.
Traffic must be able to reach the pod and port in order for the Speedscale Operator to capture traffic.

Some environments, such as Google Kubernetes Engine Private Clusters, block webhook traffic by default.
To allow webhook traffic within your GKE Private Cluster, please consult the [GKE Private Cluster documentation on firewall rules](https://cloud.google.com/kubernetes-engine/docs/how-to/private-clusters#add_firewall_rules).
