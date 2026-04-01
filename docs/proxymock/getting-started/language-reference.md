---
sidebar_position: 3
title: Language Configuration
description: "Configure language-specific settings for ProxyMock to route traffic effectively without modifying application code, ensuring seamless API testing and traffic replay."
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageSpecificTLSConfiguration from '../../getting-started/installation/sidecar/_language_specific_tls_config.mdx';
import ProxymockLanguageLinks from '@site/src/components/ProxymockLanguageLinks';

Some language-specific environment configuration may be necessary but you should not need to modify your application code to use **proxymock**.

If you want the full language-specific first-success path, start here:

<ProxymockLanguageLinks className="space-y-1 mt-3" />

### Configuring the Proxy

As the name implies, **proxymock** is a proxy which works by routing traffic from your application through **proxymock** before it goes to the final destination.

:::warning
99% of the time proxy configuration does not require a code change, but some HTTP client libraries have their own proxy configuration that may override or ignore environment variables.  Check the documentation for your specific library.
:::

Record inbound traffic by setting the `--app-port` flag and making requests to port `4143` instead of your application's port.

### When to use `--map` {#map}

Use `--map` when your client ignores proxy environment variables or when it is easier to point the client at a different host and port than configure proxy support.

Pick your recording mode like this:

- HTTP, HTTPS, or gRPC clients that honor proxy environment variables: set `HTTP_PROXY`, `HTTPS_PROXY`, and `grpc_proxy`
- Clients that support SOCKS: set `ALL_PROXY`
- Clients that ignore proxy environment variables or use raw TCP protocols such as Redis: use `proxymock record --map`

Examples on this page follow the casing conventions commonly used by each runtime. The [CLI reference](../how-it-works/cli.md) uses lowercase shell examples, and many proxy-aware clients accept uppercase and lowercase variants.

`--map` tells **proxymock** to listen on a local port and forward traffic to the real backend. Then point your application at the mapped port instead of the real service.

For example, to record Redis traffic, start **proxymock** with a port mapping and point your app at that mapped port:

```shell
proxymock record --out ./proxymock --map 56379=127.0.0.1:6379
export REDIS_ADDR=127.0.0.1:56379
./my-app
```

If the backend protocol matters, you can also include it explicitly:

```shell
proxymock record --map 65432=postgres://localhost:5432
proxymock record --map 1443=https://httpbin.org:443
```

For more database examples, see the [MySQL guide](../guides/mysql.md) and [PostgreSQL guide](../guides/postgres.md).

<Tabs groupId="language">
<TabItem value="golang" label="Go">

Go respects proxy environment variables.

```shell
export HTTP_PROXY=http://localhost:4140
export HTTPS_PROXY=http://localhost:4140
export NO_PROXY=localhost,127.0.0.1
```

Use the SOCKS proxy to capture database traffic:
```shell
export ALL_PROXY=socks5://localhost:4140
```

</TabItem>
<TabItem value="java" label="Java">

Java supports `-D` flags to set system properties, which can be set in an environment variable.

```shell
export JAVA_TOOL_OPTIONS="-Dhttp.proxyHost=localhost -Dhttp.proxyPort=4140 -Dhttps.proxyHost=localhost -Dhttps.proxyPort=4140"
```

Use the SOCKS proxy to capture database traffic:
```shell
export JAVA_TOOL_OPTIONS="-DsocksProxyHost=localhost -DsocksProxyPort=4140"
```

With authentication and TLS certificates:
```shell
export JAVA_TOOL_OPTIONS="-Dhttp.proxyHost=localhost -Dhttp.proxyPort=4140 -Dhttps.proxyHost=localhost -Dhttps.proxyPort=4140 -Djavax.net.ssl.trustStore=$HOME/.speedscale/certs/cacerts.jks -Djavax.net.ssl.trustStorePassword=changeit"
```

Bypass proxy for specific hosts:
```shell
-Dhttp.nonProxyHosts="localhost|127.0.0.1|*.internal.domain"
```

:::warning
Support across runtimes or libraries may vary.  For example,
[Maven](https://maven.apache.org/) requires that `-D` flags are set through
`-Dspring-boot.run.jvmArguments`.
:::

:::note
These options include the `-D` flags for TLS. See the Decrypting-TLS section below.
:::

</TabItem>
<TabItem value="python" label="Python">

Python respects proxy environment variables.

```shell
export HTTP_PROXY=http://localhost:4140
export HTTPS_PROXY=http://localhost:4140
export NO_PROXY=localhost,127.0.0.1
```


Use the SOCKS proxy to capture database traffic (requires `PySocks` package):
```shell
export ALL_PROXY=socks5://localhost:4140
```

</TabItem>
<TabItem value="nodejs" label="Node.js">

Node.js HTTP libraries handle proxies differently. Environment variables are NOT automatically used by most libraries.

For axios (requires explicit configuration or `https-proxy-agent`):
```javascript
const axios = require('axios');

// Option 1: Direct configuration
axios.get('https://example.com', {
  proxy: {
    protocol: 'http',
    host: 'localhost',
    port: 4140
  }
});

// Option 2: Using https-proxy-agent
const HttpsProxyAgent = require('https-proxy-agent');
const agent = new HttpsProxyAgent('http://localhost:4140');

axios.get('https://example.com', {
  httpsAgent: agent
});
```

To respect environment variables with axios:
```shell
export HTTP_PROXY=http://localhost:4140
export HTTPS_PROXY=http://localhost:4140
```

Then use a library like `https-proxy-agent` to read them.

Use the SOCKS proxy to capture database traffic (requires `socks-proxy-agent`):
```javascript
const SocksProxyAgent = require('socks-proxy-agent');
const agent = new SocksProxyAgent('socks5://localhost:4140');
```

</TabItem>
<TabItem value="ruby" label="Ruby">

Ruby's `Net::HTTP` does not automatically use proxy environment variables by default, but `:ENV` can be passed to `Net::HTTP.new`:

```shell
export http_proxy=http://localhost:4140
export https_proxy=http://localhost:4140
export no_proxy=localhost,127.0.0.1
```

```ruby
require 'net/http'

# This will use environment variables
Net::HTTP.new('example.com', nil, :ENV).start do |http|
  # Uses proxy from env vars if set
end

# Or with URI
uri = URI('https://example.com')
Net::HTTP.start(uri.host, uri.port, :p_addr => :ENV) do |http|
  # Uses proxy from env vars if set
end
```

</TabItem>
<TabItem value="php" label="PHP">

PHP does not automatically use environment variables so it must be set explicitly. There multiple ways to configure proxies depending on the method used.

Using cURL:
```php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://example.com");
curl_setopt($ch, CURLOPT_PROXY, "http://localhost:4140");
// For SOCKS proxy
// curl_setopt($ch, CURLOPT_PROXY, "socks5://localhost:4140");

// With authentication
curl_setopt($ch, CURLOPT_PROXYUSERPWD, "username:password");

$response = curl_exec($ch);
curl_close($ch);
```

Using stream context:
```php
$context = stream_context_create([
    'http' => [
        'proxy' => 'tcp://localhost:4140',
        'request_fulluri' => true,
    ],
    'ssl' => [
        'verify_peer' => false,  // Only for testing
    ]
]);

$response = file_get_contents('https://example.com', false, $context);
```

Set default proxy for all stream operations:
```php
stream_context_set_default([
    'http' => ['proxy' => 'tcp://localhost:4140']
]);
```

</TabItem>
<TabItem value="csharp" label="C#/.NET">


.NET Core/5+ respects proxy environment variables:

```shell
export HTTP_PROXY=http://localhost:4140
export HTTPS_PROXY=http://localhost:4140
export NO_PROXY=localhost,127.0.0.1
```

</TabItem>
<TabItem value="rust" label="Rust">

Rust with the `reqwest` crate respects proxy environment variables by default:

```shell
export HTTP_PROXY=http://localhost:4140
export HTTPS_PROXY=http://localhost:4140
export NO_PROXY=localhost,127.0.0.1
```

Use the SOCKS proxy to capture database traffic (requires socks feature in Cargo.toml):
```shell
export ALL_PROXY=socks5://localhost:4140
```

Then modify Cargo.toml to:
```toml
reqwest = { version = "your_version_here", features = ["socks"] }
```

</TabItem>
</Tabs>

### Decrypting TLS {#tls-trust}

**proxymock** attempts to automatically configure TLS on the desktop so manual configuration is only necessary in special environments like CI/CD or when TLS decryption does not work out of the box.

Commands and flags should be run in the environment where your application is running.

<LanguageSpecificTLSConfiguration />
