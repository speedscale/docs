
# Sidecar Dual Proxy Mode

The default proxy mode of the sidecar in a Kubernetes environment is known as a `transparent` proxy, meaning it is transparent to the workload. However, there are times when that cannot be used, for example if you use host networking in Kubernetes, then you must configure the `dual` proxy mode. The `dual` mode indicates there is a proxy to capture inbound traffic and another proxy to capture outbound traffic.

## Configure Dual Proxy

When using the `dual` proxy there are additional annotations that can be used to customize the behavior:
* proxyProtocol - set to either `tcp:http` or `tcp:socks` depending on the kind of proxy used by your app
* proxyHost - host where your app is running (likely localhost in a kubernetes pod)
* proxyPort - port where your app is listening
* proxyInPort - port where you want Speedscale to listen

One strategy you can use is to put the Speedscale proxy in front of your application port. Change your application port to another value and set `proxyInPort` to where your application normally listens. You can usually do this with a combination of an environment variable for your app and an annotation for the Speedscale sidecar. Here is an example for a NodeJS app that listens on `3000`, we have reconfigured the NodeJS app to listen on `3001` and the sidecar will now listen for the inbound transactions instead.

```
  annotations:
    sidecar.speedscale.com/inject: "true"
    sidecar.speedscale.com/proxyType: "dual"
    sidecar.speedscale.com/proxyProtocol: "tcp:http"
    sidecar.speedscale.com/proxyHost: "127.0.0.1"
    sidecar.speedscale.com/proxyPort: "3001"
    sidecar.speedscale.com/proxyInPort: "3000"
```

## Configuring Your Application Proxy Server

Every language has it's own nuances for how it works with a proxy server. Here are some well-known patterns that can be used to configure your application to use the Speedscale proxy.

### Configuring golang

When using golang, you need to set `proxyProtocol` to `tcp:socks`. In addition, the golang app needs to have an environment variable set for `HTTP_PROXY`:
```
export HTTP_PROXY='socks5://127.0.0.1:4140'
```

### Configuring NodeJS

When using NodeJS, you need to set `proxyProtocol` to `tcp:http`. In addition, the NodeJS app needs to be configured with global-agent:
```
npm install --save global-agent
```

Then add [global-agent](https://github.com/gajus/global-agent) to your code:
```
import 'global-agent/bootstrap';
```

Set these environment variables in the NodeJS runtime environment to configure the global-agent proxy:
```
export GLOBAL_AGENT_HTTP_PROXY='http://127.0.0.1:4140'
export GLOBAL_AGENT_HTTPS_PROXY='http://127.0.0.1:4140'
export GLOBAL_AGENT_NO_PROXY='*127.0.0.1:12557'
export NODE_EXTRA_CA_CERTS=${HOME}/.speedscale/certs/tls.crt
```

### Configuring Java

When using Java, you need to set `proxyProtocol` to `tcp:socks`. Java has built-in system properties for configuring the socks proxy server, add the following `-D` system property flags:
```
-DsocksProxyHost=127.0.0.1
-DsocksProxyPort=4140
```
