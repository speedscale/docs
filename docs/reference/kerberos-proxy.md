---
title: Kerberos Proxy Authentication
description: "Configure Kerberos credentials for Speedscale cloud connections through an HTTP CONNECT proxy, using a FILE cache or keytab."
sidebar_position: 12.5
---

# Kerberos Proxy Authentication

When your outbound proxy responds with `407 Proxy-Authenticate: Negotiate`, enable Kerberos authentication for Speedscale cloud connections. The client authenticates to the proxy before establishing TLS to the cloud. The Speedscale API key still authorizes the tenant inside that TLS connection.

This configuration covers external REST calls, including API-key validation, and cloud gRPC connections used by forwarder and inspector. It also applies to cloud calls from `speedctl` and `proxymock`. Application traffic captured through a local proxy uses the separate [application proxy configuration](./proxy_config.mdx).

## Requirements

Use `speedctl`, `proxymock` and the operator-managed forwarder/inspector images at version **v2.5.1136 or later**. Upgrade the [CLI](/getting-started/installation/install/cli) and [operator](/getting-started/upgrade/operator) before enabling this setting. If your installation channel does not provide a supported version, contact Support for an available build.

Ask your network or identity administrator for:

- An HTTP or HTTPS CONNECT proxy URL that offers Negotiate authentication.
- A realm configuration in `krb5.conf` and either a FILE credential cache or a keytab with its client principal.
- The proxy's service principal name (SPN), normally `HTTP/<proxy hostname>`.
- Direct access to the realm's Key Distribution Centers (KDCs) and any DNS discovery they require.
- A proxy policy that permits the cloud destination, HTTP/2 and long-lived gRPC tunnels.

KDC and Kerberos DNS requests bypass the HTTP proxy. Configure an explicit KDC in `krb5.conf` when DNS discovery is unavailable. Keep the client and KDC clocks synchronized.

## Configuration reference

Set these variables in the process making the cloud connection. For the classic Kubernetes operator install, use the [override ConfigMap and credential mount](#kubernetes-operator-setup) below.

| Variable | Behavior |
| --- | --- |
| `HTTPS_PROXY` | HTTP or HTTPS proxy URL for TLS cloud destinations, such as `http://proxy.example.com:8080`. |
| `NO_PROXY` | Hosts and domains that should connect directly. Keep local and in-cluster destinations in this list. |
| `SPEEDSCALE_KERBEROS_PROXY` | Set to `true` to enable Kerberos CONNECT authentication. Unset or `false` keeps the existing proxy behavior. |
| `KRB5_CONFIG` | Path to a readable `krb5.conf`. Defaults to `/etc/krb5.conf`. |
| `KRB5CCNAME` | FILE credential cache, such as `FILE:/path/to/cache`. Takes precedence over a keytab when both are set. |
| `KRB5_CLIENT_KTNAME` | FILE keytab, such as `FILE:/path/to/client.keytab`. Used when `KRB5CCNAME` is unset. |
| `SPEEDSCALE_KERBEROS_PRINCIPAL` | Client principal in `user@REALM` form. Required for keytab mode. |
| `SPEEDSCALE_KERBEROS_PROXY_SPN` | Override the default `HTTP/<proxy hostname>` SPN, for example when a load balancer uses a different registered name. |
| `SPEEDSCALE_KERBEROS_DISABLE_FAST` | Set to `true` to disable Kerberos FAST preauthentication when required by the realm administrator. Defaults to `false`. |
| `SPEEDSCALE_KERBEROS_SECRET` | Kubernetes Secret name that the operator mounts on forwarder and inspector at `/etc/speedscale/kerberos`. The operator itself needs the mount patch below. |

Credentials in `HTTPS_PROXY`, such as `http://user:password@proxy.example.com:8080`, explicitly select Basic authentication. A rejected Basic attempt reports Basic and does not fall back to Kerberos. Remove the URL credentials to negotiate Kerberos.

## Local CLI setup

Set the proxy and realm configuration before running `speedctl` or `proxymock` cloud commands. Replace the example paths and realm with values supplied by your administrator.

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1,.svc,.cluster.local
export SPEEDSCALE_KERBEROS_PROXY=true
export KRB5_CONFIG=/path/to/krb5.conf
```

### Option A: FILE credential cache

Create a FILE cache with [kinit](https://web.mit.edu/kerberos/krb5-latest/doc/user/user_commands/kinit.html):

```bash
unset KRB5_CLIENT_KTNAME
export KRB5CCNAME=FILE:/path/to/cache
kinit -c "$KRB5CCNAME" user@EXAMPLE.COM
```

The cache must contain a valid ticket-granting ticket (TGT), even when a service ticket is already cached. Renew or replace the cache before expiry using your external credential provider. The client does not manage cache renewal.

### Option B: Keytab

For noninteractive login, unset the cache variable and supply a keytab and principal:

```bash
unset KRB5CCNAME
export KRB5_CLIENT_KTNAME=FILE:/path/to/client.keytab
export SPEEDSCALE_KERBEROS_PRINCIPAL=user@EXAMPLE.COM
```

The client obtains a fresh TGT from the keytab when opening an authenticated tunnel. An existing `KRB5CCNAME` value selects cache mode even when the keytab settings are present.

### File paths and rotation

Bare file paths and `FILE:` prefixes are supported. Windows drive-letter paths work with either form, for example `FILE:C:\Speedscale\cache` or `C:\Speedscale\client.keytab`. Native macOS API caches and Linux KEYRING/KCM caches are unsupported; create a FILE cache explicitly.

The process user must be able to read the configuration and credential files. Each new authenticated tunnel reloads them. Existing REST keepalive connections and gRPC streams continue through their established tunnels after a file update.

## Kubernetes operator setup

This example uses the classic operator install in the `speedscale` namespace. Adjust the namespace to match your installation. The current operator Helm chart has no Kerberos credential-mount value; keep the operator patch in your Helm post-renderer or GitOps configuration so upgrades retain it.

### 1. Provision the credential Secret

Create a Secret containing `krb5.conf` and the keytab:

```bash
kubectl -n speedscale create secret generic speedscale-kerberos \
  --from-file=krb5.conf=/path/to/krb5.conf \
  --from-file=client.keytab=/path/to/client.keytab
```

Use your existing Secret provisioning system for ongoing credential management. Restrict access to the administrators and workloads that need these credentials. Keep credential contents in the Secret; the ConfigMap below contains file paths and settings.

### 2. Configure the operator

Add these entries to `speedscale-operator-override` in the same namespace. Preserve any other override entries you already use. If the ConfigMap does not exist, create it with this manifest:

```yaml title="kerberos-override.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: speedscale-operator-override
  namespace: speedscale
data:
  HTTPS_PROXY: http://proxy.example.com:8080
  NO_PROXY: localhost,127.0.0.1,.svc,.cluster.local
  SPEEDSCALE_KERBEROS_PROXY: "true"
  SPEEDSCALE_KERBEROS_SECRET: speedscale-kerberos
  KRB5_CONFIG: /etc/speedscale/kerberos/krb5.conf
  KRB5_CLIENT_KTNAME: FILE:/etc/speedscale/kerberos/client.keytab
  SPEEDSCALE_KERBEROS_PRINCIPAL: user@EXAMPLE.COM
```

```bash
kubectl apply -f kerberos-override.yaml
```

For cache mode, provision a Secret file named `cache`, remove `KRB5_CLIENT_KTNAME` and `SPEEDSCALE_KERBEROS_PRINCIPAL` from the override, and set `KRB5CCNAME: FILE:/etc/speedscale/kerberos/cache`. An external process must refresh the cache and update the Secret before expiry.

### 3. Mount the Secret on the operator

Apply this strategic merge patch to the operator Deployment through your deployment tooling:

```yaml title="kerberos-operator-patch.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: speedscale-operator
  namespace: speedscale
spec:
  template:
    spec:
      containers:
        - name: operator
          volumeMounts:
            - name: kerberos-proxy
              mountPath: /etc/speedscale/kerberos
              readOnly: true
      volumes:
        - name: kerberos-proxy
          secret:
            secretName: speedscale-kerberos
```

For an existing installation, apply the same patch and restart the operator after updating the ConfigMap:

```bash
kubectl -n speedscale patch deployment speedscale-operator \
  --type=strategic --patch-file=kerberos-operator-patch.yaml
kubectl -n speedscale rollout restart deployment/speedscale-operator
kubectl -n speedscale rollout status deployment/speedscale-operator
```

The operator propagates its Kerberos environment settings and read-only Secret mount to the forwarder and inspector Deployments it reconciles. Captured application sidecars do not receive these credentials. The files must be readable by each workload's configured user.

Mount the entire Secret directory to receive credential rotations. Kubernetes [updates mounted Secret files](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod) after a delay; `subPath` mounts do not receive those updates. Allow for that delay when refreshing a cache before expiry. Environment-setting changes require an operator restart, while updated mounted files take effect on new authenticated tunnels.

## Validate the connection

Test the actual proxy and realm in your dev environment before rollout. A local Kerberos fixture or isolated MIT KDC test does not establish compatibility with a customer's proxy or identity policy.

- Confirm a REST API-key check succeeds through the proxy with the normal Speedscale API key.
- Confirm the inspector can establish and keep its gRPC control stream open through the proxy.
- Check proxy-side identity and access policy, direct connections covered by `NO_PROXY`, and a reconnect after credential rotation.

The supported exchange is an initial `407 Negotiate` challenge followed by one Kerberos SPNEGO client token on the next CONNECT. Additional negotiation rounds, NTLM and Kerberos authentication at the cloud origin are unsupported. Plain HTTP requests keep their existing transport behavior.

This setting covers the Speedscale cloud connection path. It does not add Kerberos authentication to OTEL exporters or S3-compatible storage connections.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Proxy Authentication Required` with no Kerberos attempt | Check the client/image version and set `SPEEDSCALE_KERBEROS_PROXY=true` in the process making the request. |
| `cannot load KRB5_CONFIG` | Check the configuration path, mount and process-user read permissions. |
| `cannot load KRB5CCNAME` or `only FILE credential storage is supported` | Select a readable FILE cache and verify its format and path. |
| `credential cache has no valid TGT` | Refresh the cache with `kinit` or your external provider before retrying. |
| `cannot load KRB5_CLIENT_KTNAME` | Check the keytab path, Secret key and read permissions; unset `KRB5CCNAME` to select keytab mode. |
| `cannot acquire Kerberos credentials` | Check ticket expiry, principal/realm, clock synchronization and direct KDC access. |
| `cannot obtain Kerberos service ticket` or authenticated CONNECT returns 407 | Confirm the registered proxy SPN, client authorization and supported challenge sequence with the proxy administrator. |
| `Basic authentication (HTTP 407)` | Correct the proxy URL credentials, or remove them if Kerberos is required. |
| REST succeeds but gRPC disconnects | Verify HTTP/2 and long-lived CONNECT tunnels are permitted by the proxy policy. |

Share sanitized error text, component versions and the challenge scheme when asking for help. Keep keytabs, credential-cache contents, API keys and `Proxy-Authorization` tokens out of logs and support messages.
