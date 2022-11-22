---
title: TLS Support
sidebar_position: 2
---

TLS interception and unwrapping is not enabled by default, but can be done so with annotations to your workload.

## TLS Inbound Interception

The sidecar will be listening for incoming transactions, and must present to the client the correct
certificate. Because you already have TLS configured, the cert files you are using must be provided to the
sidecar. There are the fields:

* &#x20;**tlsinsecret** (required) is the name of the Kubernetes secret
* &#x20;**tlsinprivate** (optional) is the filename of the private key inside the secret (default: tls.key)
* &#x20;**tlsinpublic** (optional) is the filename of the public cert inside the secret (default: tls.crt)

When your deployment is injected, the sidecar will have an extra environment variable **TLS_IN_UNWRAP=true**,
**TLS_IN_PUBLIC_KEY**, **TLS_IN_PRIVATE_KEY** and a volume mount to access the files from the provided secret.

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

* Configure the sidecar to enable outbound TLS interception
* Configure your application to trust the new TLS Certificates

When your deployment is injected, the sidecar will have an extra environment variable **TLS_OUT_UNWRAP=true**
and a volume mount to access the files from the **speedscale-certs** secret. The operator will automatically
create a secret named **speedscale-certs** and put into the namespace. All that is required is to add this
annotation to your deployment:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/tls-out: "true"
```

## Mutual Authentication for Outbound Calls

If your backend system requires [**Mutual Authentication**](https://tools.ietf. Org/html/rfc8120) (aka Mutual
TLS or 2-Way TLS), this requires configuring the sidecar with an additional X509 key pair. During the TLS
handshake, the backend system will request a Client Certificate. This is the certificate that goproxy will
present. There are the fields:

* &#x20;**tlsmutualsecret** (required) is the name of the Kubernetes secret
* &#x20;**tlsmutualprivate** (optional) is the filename of the private key inside the secret (default: tls.key)
* &#x20;**tlsmutualpublic** (optional) is the filename of the public cert inside the secret (default: tls.crt)

When your deployment is injected, the sidecar will have extra environment variables **TLS_MUTUAL_PUBLIC_KEY**
and **TLS_MUTUAL_PRIVATE_KEY** and a volume mount to access the files from the provided secret. You must
provide a Kubernetes secret that has the TLS private key and public cert. The name of the secret and the names
of the files can be provided to **operator** to inject automatically.

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
Configuring TLS trust is language specific. Every runtime language has different characteristics and if you do
not configure this correctly you will get TLS/SSL errors. Always configure this in a controlled environment
first
:::

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

### TLS Trust for Java

Java applications utilize a truststore to determine which certificates will be trusted. During Operator
installation a secret called **speedscale-jks** will be created that contains the `speedscale-certs` root CA
along with a standard set of CA certs used by `openjdk`. This secret is automatically mounted when the
`tls-out` setting is configured as shown below. The Java app itself needs to be configured to use this secret
as well which requires configuring your JVM to use the truststore with
**-Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks and
**-Djavax.net.ssl.trustStorePassword=changeit**

Here is an example of a patch file that configures TLS Out and configures the Java app to use the mounted
trust store. You will likely have to customize this for your environment.

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
              value: "-Djavax.net.ssl.trustStore=/etc/ssl/speedscale/jks/cacerts.jks -Djavax.net.ssl.trustStorePassword=changeit"
```

#### Mutual TLS in Java

If you are using mutual TLS or want to use a custom Java trust store, you will have to add the speedscale
certs to the trust store.

The CA Cert inside the **speedscale-certs** secret needs to be added to your truststore. First download the
certs from your cluster. Note that there are 2 files, **tls.key** and **tls.crt**. Both of these files are
base64 encoded. This command will get the certificate and decode it all at once.

```bash
kubectl -n dasboot get secret speedscale-certs -o=jsonpath='{.data.tls\.crt}' | base64 --decode > speedscale-cert.pem
kubectl -n dasboot get secret speedscale-certs -o=jsonpath='{.data.tls\.key}' | base64 --decode > speedscale-key.pem
```

The certificate file should start with this line:

```
-----BEGIN CERTIFICATE-----
```

And of course the key should start with this line:

```
-----BEGIN RSA PRIVATE KEY-----
```

Now that we have them in PEM format we can convert them into PKCS12 and then JKS. Then convert them into K8S
secret and add to our patch. This is the same steps we used above in the Kubernetes Secrets section.

```bash
openssl pkcs12 -export -in speedscale-cert.pem -inkey speedscale-key.pem -name speedscale -out speedscale.p12
keytool -importkeystore -deststorepass changeit -destkeystore speedscale.jks -srckeystore speedscale.p12 -srcstoretype PKCS12
```

Lastly you need to make sure that your Java container uses this updated truststore. It is possible to do so
by:

* Storing the truststore in a Kubernetes secret or configmap
* Mounting the truststore as a volume mount
* Configuring your JVM to use the truststore with **-Djavax.net.ssl.trustStores** and **-Djavax.net.ssl.trustStorePassword**

Here is an example of using the trust store created in the previous steps.

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
             value: "-Djavax.net.ssl.trustStore=/mnt/keystores/speedscale.jks -Djavax.net.ssl.trustStorePassword=changeit"
         volumeMounts:
           - name: speedscale-keystore
             mountPath: /mnt/keystores
     volumes:
       - name: speedscale-keystore
         secret:
           defaultMode: 420
           secretName: speedscale-keystore
```
