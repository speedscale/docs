
# Optional Sidecar Annotations

How to customize your sidecar configuration with annotations.

Here are additional annotation values for the sidecar:

| Annotation                                  | Description |
| ------------------------------------------- | ----------- |
| `sidecar.speedscale.com/inject`             | Add the sidecar to your: deployment, job, stateful set or daemon set. |
| `sidecar.speedscale.com/remove`             | Remove the sidecar. |
| `sidecar.speedscale.com/status`             | This will be set to "true" by the operator after a successful inject. |
| `sidecar.speedscale.com/debug`              | Put the sidecar into debug mode with additional logging capabilities. |
| `sidecar.speedscale.com/captureMode`        | Sidecar capture mode. Supported values are `proxy` (default), `wasm` or `istio` |
| `sidecar.speedscale.com/captureNodeTraffic` | Configure inbound traffic originating from underlying Kubernetes node on which a pod is running to be routed through the proxy. The default behavior is to ignore inbound Kubernetes node traffic (e.g. readiness and liveness checks).Boolean string `"true"` or `"false"` (default). Only valid if `captureMode` is `proxy` and `proxyType` is `transparent`, ignored otherwise. |
| `sidecar.speedscale.com/proxyType`          | Type of proxy the sidecar should operate as, either `transparent` (default) or `dual`. Only valid if `captureMode` is `proxy`, ignored otherwise. |
| `sidecar.speedscale.com/proxyHost`          | Set the host where you want to forward traffic. Only valid if `captureMode` is `proxy` and `proxyType` is `dual`, ignored otherwise. |
| `sidecar.speedscale.com/proxyPort`          | Set the port where you want to forward traffic. Only valid if `captureMode` is `proxy` and `proxyType` is `dual`, ignored otherwise. |
| `sidecar.speedscale.com/proxyProtocol`      | Set the protocol for the outbound proxy server. Supported values are `tcp:socks5` or `tcp:http`. Only valid if `captureMode` is `proxy` and `proxyType` is `dual`, ignored otherwise. |
| `sidecar.speedscale.com/tls`                | Set to "all" to configure TLS interception (see more details below). |
| `sidecar.speedscale.com/tlsinsecret`        | Kubernetes secret with the TLS keys to use for inbound traffic, these keys will be exposed to API clients. |
| `sidecar.speedscale.com/tlsinprivate`       | Filename of the TLS Inbound Private key (default tls.key). |
| `sidecar.speedscale.com/tlsinpublic`        | Filename of the TLS Inbound Public cert (default tls.crt). |
| `sidecar.speedscale.com/tlsmutualsecret`    | Kubernetes secret with the TLS keys to use for outbound Mutual TLS traffic. |
| `sidecar.speedscale.com/tlsmutualprivate`   | Filename of the Mutual TLS Private Key (default tls.key). |
| `sidecar.speedscale.com/tlsmutualpublic`    | Filename of the Mutual TLS Public cert (default tls.crt). |
| `sidecar.speedscale.com/ignoreSrcIPs`       | Comma separated list of source IPv4 addresses or IPv4 CIDR blocks for inbound traffic that should <strong>not</strong> be routed through the proxy. Only valid if `captureMode` is `proxy` and `proxyType` is `transparent`, ignored otherwise. |
| `sidecar.speedscale.com/ignoreSrcHosts`     | Comma separated list of source hostnames for inbound traffic that should <strong>not</strong> be routed through the proxy. Only valid if `captureMode` is `proxy` and `proxyType` is `transparent`, ignored otherwise. |
| `sidecar.speedscale.com/ignoreDstIPs`       | Comma separated list of destination IPv4 addresses or IPv4 CIDR blocks for outbound traffic that should <strong>not</strong> be routed through the proxy. Only valid if `captureMode` is `proxy` and `proxyType` is `transparent`, ignored otherwise.                                                                                                                                                                  |
| `sidecar.speedscale.com/ignoreDstHosts`     | Comma separated list of destination hostnames for outbound traffic that should <strong>not</strong> be routed through the proxy. Only valid if `captureMode` is `proxy` and `proxyType` is `transparent`, ignored otherwise.                    |
|                                             |             |

### Capture Mode

Depending upon your environment you may want to customize the capture mode being used:

* `proxy` is the default and should be used if there is no other sidecar.
* `wasm` is what should be used if you have an istio sidecar already.

### TLS Inbound Interception

The sidecar will be listening for incoming transactions, and must present to the client the correct certificate. Because you already have TLS configured, the cert files you are using must be provided to the sidecar. There are the fields:

* &#x20;**tlsinsecret** (required) is the name of the Kubernetes secret
* &#x20;**tlsinprivate** (optional) is the filename of the private key inside the secret (default: tls.key)
* &#x20;**tlsinpublic** (optional) is the filename of the public cert inside the secret (default: tls.crt)

When your deployment is injected, the sidecar will have an extra environment variable **TLS\_IN\_UNWRAP=true**, **TLS\_IN\_PUBLIC\_KEY**, **TLS\_IN\_PRIVATE\_KEY** and a volume mount to access the files from the provided secret.

```
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls: "all"
    sidecar.speedscale.com/tlsinsecret: "my-tls-secret"
    sidecar.speedscale.com/tlsinprivate: "tls.key"
    sidecar.speedscale.com/tlsinpublic: "tls.crt"
```

### TLS Outbound Interception

To unwrap outbound TLS calls there are multiple steps required:

* Configure the sidecar to the TLS "all" setting.
* Configure your application to trust the new TLS Certificates

When your deployment is injected, the sidecar will have an extra environment variable **TLS\_OUT\_UNWRAP=true** and a volume mount to access the files from the **ss-certs** secret. The operator will automatically create a secret named **ss-certs** and put into the namespace. All that is required is to add this annotation to your deployment:

```
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls: "all"
```

### Mutual Authentication for Outbound Calls

If your backend system requires [**Mutual Authentication**](https://tools.ietf. Org/html/rfc8120) (aka Mutual TLS or 2-Way TLS), this requires configuring the sidecar with an additional X509 key pair. During the TLS handshake, the backend system will request a Client Certificate. This is the certificate that goproxy will present. There are the fields:

* &#x20;**tlsmutualsecret** (required) is the name of the Kubernetes secret
* &#x20;**tlsmutualprivate** (optional) is the filename of the private key inside the secret (default: tls.key)
* &#x20;**tlsmutualpublic** (optional) is the filename of the public cert inside the secret (default: tls.crt)

When your deployment is injected, the sidecar will have extra environment variables **TLS\_MUTUAL\_PUBLIC\_KEY** and **TLS\_MUTUAL\_PRIVATE\_KEY** and a volume mount to access the files from the provided secret. You must provide a Kubernetes secret that has the TLS private key and public cert. The name of the secret and the names of the files can be provided to **operator** to inject automatically.

```
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/tls: "all"
    sidecar.speedscale.com/tlsmutualsecret: "my-tls-secret"
    sidecar.speedscale.com/tlsmutualprivate: "tls.key"
    sidecar.speedscale.com/tlsmutualpublic: "tls.crt"
```

####
