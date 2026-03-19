---
title: Bringing Your Own TLS Certs
---

# Bringing Your Own TLS Certs

By default the Speedscale operator Helm chart generates and manages its own TLS certificates. If your organization uses an existing PKI or a tool like [cert-manager](https://cert-manager.io), you can disable the built-in cert generation and supply the secrets yourself.

## Prerequisites

- The Speedscale operator is installed or you are about to install it for the first time.
- You have a way to provision the two required secrets before the operator starts (e.g. cert-manager, Vault, or manual creation).

## Required secrets

The operator expects two `kubernetes.io/tls` secrets in the same namespace as the operator (default: `speedscale`):

| Secret name                | Purpose                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `speedscale-webhook-certs` | TLS for the admission webhook server. Must include `ca.crt`, `tls.crt`, and `tls.key`.        |
| `speedscale-certs`         | CA cert used for TLS interception by the sidecar proxy. Must include `tls.crt` and `tls.key`. |

## Example: cert-manager

The following manifest creates a self-signed issuer and provisions both secrets via cert-manager. Apply it **before** installing or upgrading the operator.

:::warning

The secret names must be exactly as shown below

:::

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: speedscale
  namespace: speedscale
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: speedscale-operator-ca
  namespace: speedscale
spec:
  isCA: true
  commonName: speedscale-operator
  secretName: speedscale-webhook-certs
  dnsNames:
    - speedscale-operator.speedscale.svc
  privateKey:
    algorithm: RSA
    size: 2048
  issuerRef:
    name: speedscale
    kind: Issuer
    group: cert-manager.io
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: speedscale-ca
  namespace: speedscale
spec:
  isCA: true
  commonName: Speedscale
  secretName: speedscale-certs
  privateKey:
    algorithm: RSA
    size: 2048
  issuerRef:
    name: speedscale
    kind: Issuer
    group: cert-manager.io
```

## Helm values

Set `createTLSCerts: false` so the chart does not create or overwrite the secrets you just provisioned and set `webhookAnnotations` so cert-manager (or equivalent) keeps the CA bundle in the webhook configurations up to date automatically. The relevant section of `values.yaml` looks like this:

::: warning

Your cert provider must be able to inject a CA into the webhook configurations directly using an annotation. Validating and mutating webhook objects in Kubernetes have their CA bundle specified inline and can not reference external values.

:::

```yaml
createTLSCerts: false
webhookAnnotations:
  cert-manager.io/inject-ca-from-secret: speedscale-webhook-certs
```
