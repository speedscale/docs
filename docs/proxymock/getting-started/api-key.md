---
sidebar_position: 3
---
# API Key

Using **proxymock** requires generating an API key. Enterprise customers should skip ahead to [Enterprise Customers](#enterprise-customers).

Run this command:
```bash
proxymock init --email <your-email>
```

That's all you need to do. You can view or modify your API key by editing the `~/.speedscale/config.yaml` file.

Speedscale does not share or sell your email address, although we might send you updates or announcements if we can ever figure out this marketing thing. Engineering is more our wheelhouse.

:::warning
* Don't put your API key in source control. Use a secret manager.
* Don't share your API Key.
* Non-interactive mode (like as part of a CI pipeline) requires Speedscale Enterprise. 
* If your API key is compromised, you can rotate it using the proxymock `rotate` command (run `proxymock rotate -h` for instructions)
:::

:::tip
proxymock does not send your recorded data to any third party. All data is stored on your local desktop unless you connect to Speedscale Enterprise. Don't worry, that won't happen unless you explicitly start a trial or buy a license.
:::

## Enterprise Customers

Does your organization already have a Speedscale tenant? If so, you can skip ahead to [Automatic Tenant Assignment](#automatic-tenant-assignment).

If you want to sign up for Speedscale Enterprise and your organization does not already have a Speedscale tenant, you can create one by visiting [Speedscale Enterprise](https://speedscale.com) and clicking "Free Trial".

### Automatic Tenant Assignment

For most tenants, you can automatically join the tenant by following these steps:

1. Log into https://app.speedscale.com using your corporate email address. You will automatically be added to the tenant after some validation.
1. Click "Settings" in the left hand navigation (near the bottom).
1. Click the "Components"
1. Download your personalized *config.yaml* file to your local machine at `~/.speedscale/config.yaml`

That's all you need.

### Manual Tenant Assignment

The easiest way to manually join a tenant is to dial a friend. Have your friend click the "Invite" button in the Speedscale UI and enter your email address. Check your email and then download your *config.yaml* file to your local machine at `~/.speedscale/config.yaml`. It can be downloaded under Settings->Components->Config.

