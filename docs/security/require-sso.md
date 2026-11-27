---
description: Require every person in your Speedscale organization to sign in through its SSO connection, so password, Google, and GitHub sign-ins and keys issued outside SSO stop working.
sidebar_position: 8
---

# Require SSO

Setting up [SSO](./sso.md) still allows other ways to sign in to your Speedscale organization. Requiring SSO closes that path: every person in the organization must sign in through your SSO connection, and their personal API keys must have been issued after an SSO sign-in.

The requirement is off by default. An Admin turns it on for the organization, and it applies to everyone in it, Admins included.

## What changes

| Credential | While SSO is required |
| --- | --- |
| Session from an SSO sign-in | Works |
| Session from a password, Google, or GitHub sign-in | Refused |
| Personal API key created or regenerated after an SSO sign-in | Works |
| Any other personal API key, including keys issued with an invitation | Refused |
| [Service account](../quick-start.md) API key | Works |
| New account with an email on your company domain, created with a password, Google, or GitHub | Not created; the person is told to sign in through SSO |

A refused person sees this message on the sign-in page and in the API response:

> This Speedscale organization requires signing in through its single sign-on (SSO). Sign in with SSO from your company's identity provider.

The requirement takes effect within five minutes. A credential that was in use just before it was turned on can keep working until earlier authorization results expire.

Service account keys keep working because no person signs in with them. Use them for Kubernetes clusters and CI, and review who can create them under **Tenant Settings**.

## Before you turn it on

1. Confirm that the SSO connection is active and that [Test sign-in](./sso.md#test-sign-in) succeeds for a user assigned to the provider application.
2. Confirm that the right people have access to the SSO application and that sign-in takes them to the expected Speedscale organization.
3. Move clusters and CI pipelines that use a personal API key to a service account key.
4. Sign in to Speedscale through SSO yourself. Speedscale refuses the change from a session that did not come through the SSO connection, so you cannot lock yourself out.

## Turn it on

1. Open **Tenant Settings** and select the **SSO** tab. The **Require SSO for everyone** panel appears for Admins once the connection is active.
2. Select **Require SSO** and read the list of what stops working.
3. Enter a **Reason**, such as a ticket or change request. Speedscale records it in its audit log with your name, the sign-in method you used, and the time.
4. Select **Require SSO** in the dialog.

The panel then shows **Required**. To turn the requirement off, select **Stop requiring SSO**. Password, Google, and GitHub sign-ins work again, and personal API keys work however they were created.

If the dialog says to sign in through single sign-on before requiring it, sign out, sign in through SSO, and try again. If it says to set up single sign-on first, the connection is not active yet; see [Single Sign-On (SSO) Integration](./sso.md).

## Restore CLI access

Each person whose personal API key is refused can replace it after signing in through SSO:

1. Sign in to Speedscale through SSO.
2. Open the [Profile page](https://app.speedscale.com/profile) and select **Regenerate** next to the personal API key. The new key is tied to the SSO sign-in. The old key value stops working.
3. Put the new key in the configuration file your CLI reads by following [Replace an existing configuration](../proxymock/guides/initialize.md#replace-credentials). Newer clients read `config.json` before `config.yaml`, so replacing only one file can leave the refused key in use. To check which file each client reads, see [Credentials](../getting-started/command-line-tools.md#credentials).

To skip the Profile page, run `proxymock init`, choose browser sign-in, sign in through SSO, and accept the prompt to back up and overwrite the configuration.

## Replacing the SSO connection

When Speedscale activates a replacement connection for your organization, such as one for a new identity provider, the requirement moves to the replacement. Personal API keys issued through the previous connection keep working. Sessions from the previous connection stop working, so people sign in again through the replacement.

## Get help

If an Admin cannot sign in through SSO to turn the requirement off, or the identity provider is unavailable, contact [Speedscale support](mailto:support@speedscale.com). Support can change the requirement for your organization and records the change and its reason in the same audit log.
