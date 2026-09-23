---
description: Configure Microsoft Entra ID or Okta SSO with account-specific settings, submit connection credentials, and verify Speedscale sign-in.
sidebar_position: 7
---

# Single Sign-On (SSO) Integration

Use the **SSO** section of your Speedscale account to configure Microsoft Entra ID or Okta Workforce Identity. It shows the callback and sign-in values for your account. SSO requires an eligible license; contact Speedscale support if setup is unavailable.

## Set up the identity provider

Select your provider and follow its **Setup guide** instructions. Copy the callback URL from Speedscale instead of substituting a URL from another environment.

### Microsoft Entra ID

Register an application in the directory your employees use. For employees in that directory only, choose the single-tenant account type. Configure a **Web** redirect URI using the value shown by Speedscale. Microsoft documents the [redirect URI setup](https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri).

Collect the application's client ID, directory identifier, and a client secret **value**. The secret ID is not the credential. Record its expiration and arrange replacement before it expires. Follow the account-specific guide for permissions, consent, and test-user assignment.

### Okta Workforce Identity

Create an **OIDC Web Application** using Authorization Code and client-secret authentication. Enter the callback shown by Speedscale, assign a test user, and copy the generated client ID and secret. Use your Okta organization domain. See [Okta's OIDC integration instructions](https://help.okta.com/en-us/Content/Topics/Apps/Apps_App_Integration_Wizard_OIDC.htm) for the application settings.

## Submit connection settings

Open **Connection settings** for the selected provider:

| Field | Value |
| --- | --- |
| Company email domain | A domain registered to your Speedscale account, such as `example.com` |
| Microsoft directory | The directory's primary domain, such as `example.onmicrosoft.com` |
| Okta organization domain | Your Okta organization domain |
| Application/client ID | The ID of the app registered with the provider |
| Client secret value | The provider's secret value, entered in the settings form |

The company email domain controls account routing and can differ from the Microsoft directory domain. Do not substitute an Object ID for an Application (client) ID.

Saving submits settings for Speedscale to review and activate. It replaces a pending submission; it does not immediately switch your active connection. A save confirmation is not proof of a successful login. Active settings can show the domain and client ID, but do not expose the stored secret. Enter a replacement secret when resubmitting.

## Test sign-in

After activation, refresh the page and open **Test sign-in**. Use the account-specific Speedscale login URL and a user assigned to the provider application. Confirm that sign-in returns to the correct Speedscale account.

If it fails, check the callback URI, user assignment, consent, company email domain, and credentials. A pending connection's login URL works only after activation. Keep an alternate login available until the test succeeds.

To rotate a secret, submit its replacement under **Connection settings** and coordinate activation before the old value expires. For providers outside the setup choices, or a missing domain mapping, contact [Speedscale support](mailto:support@speedscale.com).
