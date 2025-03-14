# Single Sign-On (SSO) Integration

## Overview

Speedscale’s enterprise software supports seamless Single Sign-On (SSO) integration, enabling secure, centralized access management for your organization. By utilizing Auth0, a leading third-party authentication platform, Speedscale ensures compatibility with a wide range of Enterprise Identity Providers (IdPs). This integration allows enterprises to enforce consistent security policies and streamline the user authentication process.

## Key Features

- Enterprise Identity Provider Compatibility
Speedscale integrates with all major Identity Providers, including but not limited to:
    - Microsoft Azure AD
    - Google Workspace
    - Okta
    - Ping Identity
    - Active Directory Federation Services (ADFS)
A full list of supported Identity Providers can be found [here]https://auth0.com/docs/authenticate/identity-providers/enterprise-identity-providers.
- Enhanced Security
    - By leveraging your organization’s existing IdP, Speedscale reduces the risk of compromised credentials and ensures compliance with security standards like SAML, OAuth, and OpenID Connect.

## Configuring SSO for Your Speedscale Enterprise Account

To integrate SSO with Speedscale, follow these steps:

1. Verify Your Enterprise License

SSO integration is available for Enterprise-tier customers. If you are unsure about your current license or need to upgrade, contact Speedscale Sales.

2. Initiate a Support Request

Email support@speedscale.com with the following information:

- Your Speedscale account email
- Your Speedscale account name
- Your Speedscale account ID
- Your Auth0 domain
- Your Auth0 client ID

Speedscale support will then create a new Auth0 application and configure SSO for your account. Speedscale support will provide a connection_id that will be used in the next step.

3. Configure SSO

Your organization will need to create an OIDC application in your Identity Provider. The following is a guide for creating an OIDC application in Okta as an example. If you are not using Okta, please refer to the documentation for your Identity Provider.

Follow this [section](https://auth0.com/docs/connections/oidc/oidc-enterprise-connections) of the Okta guide for creating an OIDC application on the Okta side. Stop at `Enable the Okta Enterprise Connection in Auth0`.
Stop at `Enable the Okta Enterprise Connection in Auth0`.

To summarize the settings for the app created in Okta:
```
Sign On Method: OIDC
Application Type: Web Application
App integration name: Speedscale
Sign in redirect URI:
https://auth.speedscale.com/login/callback
Initiate Login URI:
https://app.speedscale.com/authorize?connection=<connection_id>
```

* Skip any other optional parameters
* Make sure to assign users to the newly created app.

Now that the app is created, grab the following parameters and provide them to
Speedscale. The Okta domain is not app specific and instructions on finding it are
[here](https://developer.okta.com/docs/guides/find-your-domain/main/).

```
Client ID
Client Secret
Okta Domain
```

## Next Steps

- Log out and attempt to log in via your Identity Provider.
- Verify that users can authenticate successfully and are assigned the correct permissions within Speedscale.
- Check for any errors in the authentication flow and refer to your Identity Provider's Troubleshooting Guide if needed.

## Support

For assistance with SSO setup or troubleshooting, contact Speedscale Support:
- Email: support@speedscale.com

By integrating Single Sign-On, Speedscale helps your team maintain secure, centralized, and efficient access management, ensuring a smooth user experience while meeting enterprise security standards.