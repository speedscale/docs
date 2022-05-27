---
sidebar_position: 2
---

# Data Protection

## Authentication and Access Management

Speedscale maintains a custom authentication service developed in-house. Integration is also offered via "Sign-in with Google" OpenID service. A user's name and email address are shared with Speedscale by both systems. Multi-Factor Authentication is provided by Google's OpenID service.

API Keys are required to access all data in the Speedscale system. Data submission and access is protected by configurable API keys. No data can be sent to Speedscale without a current API Key. Individual API Keys can be rotated and disabled by administrators. API Keys are not shared between customers.

## Protection of Customer Data

Enterprise customers enjoy full data separation at rest and in transit. Data submitted to the Speedscale service is stored in an S3 bucket dedicated to that customer. Customer submitted data is not shared between data centers or data pipelines. All customer submitted data is currently stored in Amazon US data centers.

The data pipeline between the customer and Speedscale is also fully segmented from other customer pipelines to prevent cross-contamination.

Speedscale access to Customer Data is limited to functions with a business requirement. Speedscale has implemented access control for all employees with regular auditing and incident management processes.  Access to customer data by Speedscale employees is restricted using a variety of controls including Multi-Factor Authentication. Speedscale enforces the principle of least privilege and need-to-know for access to Customer Data. Adherence to this principle is audited continuously using 3rd party automated systems.

### Data Loss Prevention

Speedscale can redact sensitive and personally identifiable information found in captured traffic.
Redaction happens before traffic leaves the customer network, and the original data cannot be recreated.
View our [Data Loss Prevention](../configuration/dlp.md) page for more details.

## Encryption
Customer submitted data is encrypted when it leaves the customer premises and decrypted by Speedscale.

Data at rest is encrypted using Amazon's S3 default encryption. Backups of data are also encrypted at rest using Amazon's S3 default encryption.

## Monitoring

Speedscale monitors critical infrastructure for security related events using commercial technologies. A responsible disclosure policy is also employed and publicized on the corporate website.
