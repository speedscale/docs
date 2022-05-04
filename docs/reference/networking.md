# Operator Networking Requirements

In order to operate properly, the Speedscale operator requires network access to the following services:

| host | protocol | direction |
| ---- | -------- | --------- |
| app.speedscale.com | HTTPS | Outbound |
| firehose.us-east-1.amazonaws.com | HTTPS | Outbound |
| sqs.us-east-1.amazonaws.com | HTTPS | Outbound |
| *.s3.us-east-1.amazonaws.com | HTTPS | Outbound |
| gcr.io | HTTPS | Outbound |

Note that these hosts may change and security via TLS is recommended as opposed to IP whitelisting. If you require a list of IPs, they can be programmatically accessed as shown [here for AWS](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html) and [here for GCR](https://www.gstatic.com/ipranges/cloud.json).
