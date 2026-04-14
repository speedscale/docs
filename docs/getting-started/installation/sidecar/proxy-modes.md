---
title: Proxy Modes
description: "Explore Proxy Modes in Speedscale to learn about default and inline proxy configurations for Kubernetes, including reverse and forward proxy setups."
sidebar_position: 3
---

import ConfiguringProxy from '../../../reference/proxy_config.mdx'

The default proxy mode of the sidecar in a Kubernetes environment is known as a `transparent` proxy, meaning
it is transparent to the workload and requires no additional proxy configuration. This is done with `iptables`
routing for both inbound and outbound traffic. While this is the preferred traffic capture mode, there are
instances when this approach cannot be used. This might include workloads utilizing Kubernetes host
networking, or workloads that perform their own `iptables` modifications.

In these instances, the Speedscale sidecar must be run as an inline proxy that explicitly recieves requests to
proxy rather than transparently intercepting them. There are two halves to this inline proxy operation: a
reverse proxy for handling inbound traffic, and a forward proxy for handling outbound traffic.

:::warning
`forward` and `dual` modes do not automatically reconfigure your application. Sidecar injection can succeed
while outbound capture stays empty if the workload runtime does not send traffic to the forward proxy on
`127.0.0.1:4140` or your configured `proxy-out-port`.
:::

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

## Operator And Runtime Responsibilities

Switching away from `transparent` mode introduces two separate pieces of configuration:

- `reverse`: the operator configures the sidecar to accept inbound traffic and forward it to your app.
- `forward`: your workload runtime must explicitly use the sidecar as its outbound proxy.
- `dual`: both of the above apply. Inbound traffic reaches the sidecar, and outbound traffic must still be
  configured in the application runtime.

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

## Runtime Configuration For Outbound Traffic

For `forward` and `dual` modes, the workload must be configured to use the sidecar's forward proxy.

Common patterns:

- `HTTP_PROXY=http://127.0.0.1:4140`
- `HTTPS_PROXY=http://127.0.0.1:4140`
- `JAVA_TOOL_OPTIONS=-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=4140 -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=4140`

If you changed `sidecar.speedscale.com/proxy-out-port`, use that port in the runtime configuration too.

Language-specific notes:

- Java: [Java reference](/reference/languages/java.md)
- Node.js: [Node.js reference](/reference/languages/nodejs.md)
- Python: [Python reference](/reference/languages/python.md)
- Go: [Go reference](/reference/languages/golang.md)
- .NET: [.NET reference](/reference/languages/dotnet.md)

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

After applying the workload annotations above, the application still needs matching runtime settings. For
example, if the forward proxy remains on `4140`, many workloads will need either:

```bash
export HTTP_PROXY=http://127.0.0.1:4140
export HTTPS_PROXY=http://127.0.0.1:4140
```

or for Java:

```bash
export JAVA_TOOL_OPTIONS="-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=4140 -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=4140"
```

<ConfiguringProxy />
