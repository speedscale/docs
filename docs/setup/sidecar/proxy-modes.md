---
title: Proxy Modes
sidebar_position: 3
---

The default proxy mode of the sidecar in a Kubernetes environment is known as a `transparent` proxy, meaning
it is transparent to the workload and requires no additional proxy configuration. This is done with `iptables`
routing for both inbound and outbound traffic. While this is the preferred traffic capture mode, there are
instances when this approach cannot be used. This might include workloads utilizing Kubernetes host
networking, or workloads that perform their own `iptables` modifications.

In these instances, the Speedscale sidecar must be run as an inline proxy that explicitly recieves requests to
proxy rather than transparently intercepting them. There are two halves to this inline proxy operation: a
reverse proxy for handling inbound traffic, and a forward proxy for handling outbound traffic.

:::tip Remember
When using the annotation examples below, be sure to _add_ them to any existing annotations on your workload.
:::

## Proxy Configuration

Configuration for this operation mode is managed with workload annotations. You must specify the type of proxy
the sidecar should operate as: reverse, forward, or dual (both reverse and forward):

- `sidecar.speedscale.com/proxy-type: "reverse"`
- `sidecar.speedscale.com/proxy-type: "forward"`
- `sidecar.speedscale.com/proxy-type: "dual"`

Sidecar reverse and forward proxies support the following proxy protocols: `http`, `socks4`, and `socks5`.
Authentication is not required.

Reverse proxies can be configured to require no specific proxy protocol, but instead operate as a simple TCP
proxy. When operating in this mode, the sidecar treats incoming requests are treated as opaque TCP connections
but must also be aware of their destination. This is managed with the following annotations:

- `sidecar.speedscale.com/proxy-host: "localhost"`
- `sidecar.speedscale.com/proxy-port: "80"`

These values default to `localhost` and `80` if the annotations are omitted from the workload.

Forward proxies must always utilize a proxy protocol and do not support simple TCP passthrough since they
could support any number of destinations.

The underlying protocol either the reverse, forward, or both proxies use is configured with the following
annotation:

- `sidecar.speedscale.com/proxy-protocol: "socks"`

This annotation supports the following values:

- `tcp`: applies only to reverse (inbound) proxies
- `http`: operate all proxies (reverse, forward, or dual) as an http proxy
- `socks`: operate all proxies (reverse, forward, or dual) as a socks4/socks5 compatible proxy
- `tcp:http`: dual mode only, operate a tcp reverse proxy and an http forward proxy
- `tcp:socks`: dual mode only, operate a tcp reverse proxy and a socks4/socks5 forward proxy

### Additional Customization

By default, the Speedscale sidecar listens on port `4143` for all inbound reverse proxy requests. This value
can be modified if desired with the annotation:

- `sidecar.speedscale.com/proxy-in-port: "10000"`

For outbound forward proxy requests, the sidecar will listen on port `4140`, which can also be configured with
an annotation:

- `sidecar.speedscale.com/proxy-out-port: "11000"`

### Examples

Run a reverse (tcp) and forward (http) proxy and send any inbound requests to local port `8080`:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/proxy-type: "dual"
  sidecar.speedscale.com/proxy-protocol: "tcp:http"
  sidecar.speedscale.com/proxy-port: "8080"
```

Run an outbound forward (socks) proxy only:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/proxy-type: "forward"
  sidecar.speedscale.com/proxy-protocol: "socks"
```

Run an inbound reverse (http) proxy only and send requests to local port `8888`:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/proxy-type: "reverse"
  sidecar.speedscale.com/proxy-protocol: "http"
  sidecar.speedscale.com/proxy-port: "8888"
```

Run both a reverse (tcp) and forward (http) proxy, but change the sidecar ports to 10000 for inbound requests and 10001
for outbound requests:

```yaml
annotations:
  sidecar.speedscale.com/inject: "true"
  sidecar.speedscale.com/proxy-type: "dual"
  sidecar.speedscale.com/proxy-protocol: "tcp:http"
  sidecar.speedscale.com/proxy-port: "8080"
  sidecar.speedscale.com/proxy-in-port: "10000"
  sidecar.speedscale.com/proxy-out-port: "10001"
```

## Configuring Your Application Proxy Server

Every language has it's own nuances for how it works with a forward proxy server for outbound traffic. Here
are some well-known patterns that can be used to configure your application to use the Speedscale proxy. Many
languages and systems support environment variables `HTTP_PROXY` and `HTTPS_PROXY` or the lowercase
alternative `http_proxy` and `https_proxy`.

### Golang

Golang supports `HTTP_PROXY` and `HTTPS_PROXY` environment variables to configure outbound http or https
requests. For example, when the sidecar is configured as a socks forward proxy:

```bash
export HTTP_PROXY='socks5://127.0.0.1:4140'
export HTTPS_PROXY='socks5://127.0.0.1:4140'
```

Or alternatively as an http forward proxy:

```bash
export HTTP_PROXY='http://127.0.0.1:4140'
export HTTPS_PROXY='http://127.0.0.1:4140'
```

See: https://pkg.go.dev/net/http#ProxyFromEnvironment

### Python

Python supports `HTTP_PROXY` and `HTTPS_PROXY` as well as the lowercase alternatives `http_proxy` and
`https_proxy`. This is true if you are using either the standard library `urllib.request` module or the
popular `requests` module. These two options can also support specifying proxies directly with a dictionary:

```python
urllib.request.urlopen(
    'http://example.com',
    proxies={
        'http': 'http://localhost:4140',
        'https': 'http://localhost:4140',
    },
)
```

Socks proxies may require additional dependencies. For example, with the `requests` module:
https://requests.readthedocs.io/en/latest/user/advanced/?highlight=proxy#socks

### NodeJS

When using NodeJS, you need to set `proxy-protocol` to `http` or `tcp:http`. In addition, the NodeJS app needs
to be configured with global-agent:

```bash
npm install --save global-agent
```

Then add [global-agent](https://github.com/gajus/global-agent) to your code:

```javascript
import 'global-agent/bootstrap';
```

Set these environment variables in the NodeJS runtime environment to configure the global-agent proxy:

```bash
export GLOBAL_AGENT_HTTP_PROXY='http://127.0.0.1:4140'
export GLOBAL_AGENT_HTTPS_PROXY='http://127.0.0.1:4140'
export GLOBAL_AGENT_NO_PROXY='*127.0.0.1:12557'
export NODE_EXTRA_CA_CERTS=${HOME}/.speedscale/certs/tls.crt
```

### Java

When using Java, you need to set `proxy-protocol` to `socks` or `tcp:socks`. Java has built-in system
properties for configuring the socks proxy server, add the following `-D` system property flags:

```
-DsocksProxyHost=127.0.0.1
-DsocksProxyPort=4140
```
