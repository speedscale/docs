
# Trusting TLS Certificates

Now that TLS outbound calls are intercepted by goproxy, you must configure
your application to trust the ss-certs from your cluster. If you skip this
step you will get errors in your application.

Speedscale will attempt to use the Root CA Cert in the `ss-certs` secret. Intercepted TLS calls will have a new cert that is generated from this Root CA. So your application needs to trust this Root CA for TLS calls to be handled automatically.

:::danger
Configuring TLS trust is language specific. Every runtime language has different characteristics and if you do not configure this correctly you will get TLS/SSL errors. Always configure this in a controlled environment first
:::

### TLS Trust for golang

Go applications honor the environment variable `SSL_CERT_FILE` which is automatically injected by the operator. This will point to the location where the speedscale cert volume mount is placed.

### TLS Trust for NodeJS

NodeJS applications newer than v7.3.0 can be customized with an environment variable `NODE_EXTRA_CA_CERTS` which is automatically injected by the operator. This will point to the location where the speedscale cert volume mount is placed.

### TLS Trust for Ruby

Ruby applications honor the environment variable `SSL_CERT_FILE` which is automatically injected by the operator. This will point to the location where the speedscale cert volume mount is placed.

### TLS Trust for Java

Java applications utilize a truststore to determine which certificates will be trusted. The CA Cert inside the **ss-certs** secret needs to be added to your truststore. First download the certs from your cluster. Note that there are 2 files, **tls.key** and **tls.crt**. Both of these files are base64 encoded. This command will get the certificate and decode it all at once.

```
kubectl -n dasboot get secret ss-certs -o=jsonpath='{.data.tls\.crt}' | base64 --decode > speedscale-cert.pem
kubectl -n dasboot get secret ss-certs -o=jsonpath='{.data.tls\.key}' | base64 --decode > speedscale-key.pem
```

The certificate file should start with this line:

```
-----BEGIN CERTIFICATE-----
```

And of course the key should start with this line:

```
-----BEGIN RSA PRIVATE KEY-----
```

Now that we have them in PEM format we can convert them into PKCS12 and then JKS. Then convert them into K8S secret and add to our patch. This is the same steps we used above in the Kubernetes Secrets section.

```
openssl pkcs12 -export -in speedscale-cert.pem -inkey speedscale-key.pem -name speedscale -out speedscale.p12
keytool -importkeystore -deststorepass changeit -destkeystore speedscale.jks -srckeystore speedscale.p12 -srcstoretype PKCS12
```

Lastly you need to make sure that your Java container uses this updated truststore. It is possible to do so by:

* Storing the truststore in a Kubernetes secret or configmap
* Mounting the truststore as a volume mount
* Configuring your JVM to use the truststore with **-Djavax.net.ssl.trustStore=** and **-Djavax.net.ssl.trustStorePassword**

Here is an example of a patch file that configures TLS Out and mounts the **speedscale-keystore** secret which contains the JKS file. You will likely have to customize this for your environment.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sprint-boot-app
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls: "all"
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
