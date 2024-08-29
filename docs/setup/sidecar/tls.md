---
title: TLS Support
sidebar_position: 2
---

TLS interception and unwrapping is not enabled by default, but can be done so with annotations to your workload.

:::tip Remember
When using the annotation examples below, be sure to _add_ them to any existing annotations on your workload.
:::

## TLS Inbound Interception

The sidecar will be listening for incoming requests, and must present to the client the correct
certificate. Because you already have TLS configured, the cert files you are using must be provided to the
sidecar. There are three available settings:

- `tls-in-secret` (required) is the name of the Kubernetes secret
- `tls-in-private` (optional) is the filename of the private key inside the secret (default: `tls.key`)
- `tls-in-public` (optional) is the filename of the public cert inside the secret (default: `tls.crt`)

When your deployment is injected, the sidecar will have an extra environment variable `TLS_IN_UNWRAP=true`,
`TLS_IN_PUBLIC_KEY`, `TLS_IN_PRIVATE_KEY` and a volume mount to access the files from the provided secret.

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/tls-out: "true"
  sidecar.speedscale.com/tls-in-secret: "my-tls-secret"
  sidecar.speedscale.com/tls-in-private: "tls.key"
  sidecar.speedscale.com/tls-in-public: "tls.crt"
```

## TLS Outbound Interception

To unwrap outbound TLS calls there are multiple steps required:

- Configure the sidecar to enable outbound TLS interception
- Configure your application to trust the new TLS Certificates

When your deployment is injected, the sidecar will have an extra environment variable `TLS_OUT_UNWRAP=true`
and a volume mount to access the files from the `speedscale-certs` secret. The operator will automatically
create a secret named `speedscale-certs` and put into the namespace. All that is required is to add this
annotation to your deployment:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/tls-out: "true"
```

## Mutual Authentication for Outbound Calls

If your backend system requires [Mutual Authentication](https://tools.ietf. Org/html/rfc8120) (aka Mutual
TLS or 2-Way TLS), this requires configuring the sidecar with an additional X509 key pair. During the TLS
handshake, the backend system will request a Client Certificate. This is the certificate that goproxy will
present. There are three available settings:

- `tls-mutual-secret` (required) is the name of the Kubernetes secret
- `tls-mutual-private` (optional) is the filename of the private key inside the secret (default: `tls.key`)
- `tls-mutual-public` (optional) is the filename of the public cert inside the secret (default: `tls.crt`)

When your deployment is injected, the sidecar will have extra environment variables `TLS_MUTUAL_PUBLIC_KEY`
and `TLS_MUTUAL_PRIVATE_KEY` and a volume mount to access the files from the provided secret. You must
provide a Kubernetes secret that has the TLS private key and public cert. The name of the secret and the names
of the files can be provided to `operator` to inject automatically.

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/tls-out: "true"
  sidecar.speedscale.com/tls-mutual-secret: "my-tls-secret"
  sidecar.speedscale.com/tls-mutual-private: "tls.key"
  sidecar.speedscale.com/tls-mutual-public: "tls.crt"
```

## Trusting TLS Certificates

Now that TLS outbound calls are intercepted by goproxy, you must configure your application to trust the
speedscale-certs from your cluster. If you skip this step you will get errors in your application.

Speedscale will attempt to use the Root CA Cert in the `speedscale-certs` secret. Intercepted TLS calls will
have a new cert that is generated from this Root CA. So your application needs to trust this Root CA for TLS
calls to be handled automatically.

:::danger
Configuring TLS trust is, in most cases, language specific. Every runtime language has different characteristics and if you do
not configure this correctly you will get TLS/SSL errors. Always configure this in a controlled environment
first.
:::

### TLS Trust for macOS

For desktop capture and replay add the Speedscale TLS certificate to your
macOS keychain to allow your applications to make TLS requests to Speedscale
components.

After using [speedctl](/reference/glossary.md#speedctl) certificates will be
created in your home directory. Use [this Apple user
guide](https://support.apple.com/guide/keychain-access/add-certificates-to-a-keychain-kyca2431/mac)
to add the certificate located at `~/.speedscale/certs/tls.crt` to your
keychain.

Once added double click the **Speedscale** certificate, expand the **Trust** section,
and set **When using this certificate:** to **Always Trust**.

### TLS Trust for golang

Go applications honor the environment variable `SSL_CERT_FILE` which is automatically injected by the
operator. This will point to the location where the speedscale cert volume mount is placed.

### TLS Trust for NodeJS

NodeJS applications newer than v7.3.0 can be customized with an environment variable `NODE_EXTRA_CA_CERTS`
which is automatically injected by the operator. This will point to the location where the speedscale cert
volume mount is placed.

### TLS Trust for Ruby

Ruby applications honor the environment variable `SSL_CERT_FILE` which is automatically injected by the
operator. This will point to the location where the speedscale cert volume mount is placed.

### TLS Trust for .NET

.NET applications honor the environment variable `SSL_CERT_FILE` which is automatically injected by the
operator. This will point to the location where the speedscale cert volume mount is placed.

:::info
.NET Core uses OpenSSL on Linux and Mac which respects these default settings. The default Microsoft .NET Docker base images are Linux based which means these settings apply, however running Windows based workloads may require additional configuration
:::

### TLS Trust for Java

Java applications utilize a truststore to determine which certificates will be trusted. During Operator
installation a secret called `speedscale-jks` will be created that contains the `speedscale-certs` root CA
along with a standard set of CA certs used by `openjdk`. This secret is automatically mounted when the
`tls-out` setting is configured as shown below. The Java app itself needs to be configured to use this secret
as well which requires configuring your JVM to use the truststore with these settings:

- `-Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks`
- `-Djavax.net.ssl.trustStorePassword=changeit`

Here is an example of a patch file that configures TLS Out and configures the Java app to use the mounted
trust store. You will likely have to customize this for your environment.

:::caution
Applying patches that set `JAVA_OPTS`, like the ones below, are **not** additive. If your workload already has
`JAVA_OPTS` environment settings, be sure to include those as well or they will be overwritten.
:::

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sprint-boot-app
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls-out: "true"
spec:
  template:
    spec:
      containers:
        - name: sprint-boot-app
          env:
            - name: JAVA_OPTS
              value: >-
                -Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks
                -Djavax.net.ssl.trustStorePassword=changeit
```
