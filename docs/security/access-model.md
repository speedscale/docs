---
sidebar_position: 2
---

# Access Model

Speedscale currently offers full SSO integration with limited role based permissions. There are currently two roles pre-defined in Speedscale: Administrator and User. Administrators can be set using the account management console. Administrators enjoy the same privileges as regular Users plus additional capabilities.

## Administrator

The Administrator enables special permissions that a normal User does not. These permissions generally keep non-Administrators from causing unintended consequences in a remote environment. If users are running sidecars or desktop replays on their local machine they do not require Administrator access.

The Administrator role is authorized to accomplish the following tasks:

| Activity | Notes |
| -------- | ----------- |
| Install Sidecar from UI | Sidecars can still be installed using CRs or the local CLI. This only prevents users from remotely applying a sidecar to a workload without direct access to the cluster.|
| Add/Modify DLP Rules | |
| Add/Modify Traffic Filters | |
| Add/Modify Users | |
| Add/Modify Schedules | |

## User

Users are able to perform all other activities in Speedscale including running replays.

:::note
Generative AI features are enabled or disabled for all users by the tenant owner. Contact support@speedscale.com to change your tenant's settings.
:::