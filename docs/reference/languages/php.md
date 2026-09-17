---
title: PHP
description: "PHP guidance for Speedscale and proxymock, including eBPF support, proxy setup, TLS trust, and a first-success workflow."
sidebar_position: 8
---

import ProxymockLanguageWorkflow from '@site/src/components/ProxymockLanguageWorkflow';

# PHP

PHP is supported by Speedscale for Kubernetes capture and local development. The TLS path depends on how PHP and its HTTP client were built.

- Support matrix: [Technology Support](/reference/technology-support)
- eBPF TLS matrix: [TLS Traffic Visibility](/reference/ebpf-traffic-collection#tls-traffic-visibility)
- Shared proxymock proxy reference: [Language Configuration](/proxymock/getting-started/language-reference)

## eBPF Capture {#ebpf-capture}

The eBPF collector captures plaintext TCP traffic from PHP applications without language-specific setup. For HTTPS, PHP must use an OpenSSL 3.x-backed client. This commonly means PHP cURL linked through libcurl to OpenSSL 3.x.

Check the TLS backend used by PHP and cURL:

```shell
php -r 'echo OPENSSL_VERSION_TEXT, PHP_EOL; print_r(curl_version()["ssl_version"]); echo PHP_EOL;'
```

Both values should report OpenSSL 3.x for the eBPF OpenSSL probe path. PHP builds that use LibreSSL, BoringSSL, or an older OpenSSL release still have plaintext TCP captured, but HTTPS payloads remain encrypted.

No Speedscale certificate or application change is required for passive eBPF capture. Enable the collector and target the PHP workload as described in [eBPF Traffic Collection](/reference/ebpf-traffic-collection#installation).

## Kubernetes Sidecar

When PHP runs with the Speedscale sidecar in `forward` or `dual` mode, the HTTP client must send outbound traffic to `http://127.0.0.1:4140` unless you changed `proxy-out-port`. PHP cURL behavior varies by build, so configure `CURLOPT_PROXY` explicitly when proxy environment variables are not honored.

If `tls-out` is enabled, configure both routing and trust:

```php
$proxy = getenv('HTTPS_PROXY') ?: getenv('HTTP_PROXY');
$ca = getenv('SSL_CERT_FILE');

curl_setopt($ch, CURLOPT_PROXY, $proxy);
curl_setopt($ch, CURLOPT_CAINFO, $ca);
```

See [Proxy Modes](/getting-started/installation/sidecar/proxy-modes.md) and [TLS Support](/getting-started/installation/sidecar/tls.md) for shared sidecar behavior.

## Demo App

- Public demo: [speedscale/mock-lab](https://github.com/speedscale/mock-lab) (`languages/php` directory)
- Requirements: PHP 8.1 or newer with the cURL extension
- Stack: PHP HTTP service using cURL to call the CNCF projects API at `https://demo-api.trafficreplay.com`
- Local run: `php app.php`
- Quick validation: `./lab/tests/run_tests.sh --recording`

The demo reads the proxy environment variables supplied by proxymock and passes `SSL_CERT_FILE` to cURL as `CURLOPT_CAINFO`.

## proxymock {#proxymock}

<ProxymockLanguageWorkflow
  intro="Use this path for the fastest PHP first success on a developer workstation."
  steps={[
    {
      title: 'Install and initialize proxymock',
      command: `brew install speedscale/tap/proxymock
proxymock init`,
      note: 'Use browser sign-in by default. Use `proxymock init --api-key <your key>` only for CI or other headless environments.',
    },
    {
      title: 'Start recording',
      command: `git clone https://github.com/speedscale/mock-lab
cd mock-lab/languages/php
proxymock record -- php app.php`,
      note: 'proxymock supplies proxy and certificate environment variables. The demo applies them to PHP cURL explicitly.',
    },
    {
      title: 'Generate one real workflow',
      command: `./lab/tests/run_tests.sh --recording`,
      note: 'Run the test driver from the repo root. It drives the requests that become the exported production-style trace.',
    },
    {
      title: 'Stop the recording, then run with mocks',
      command: `cd mock-lab/languages/php
proxymock mock -- php app.php`,
      note: 'The mocked run should no longer need live outbound dependencies.',
    },
    {
      title: 'Replay the same traffic against a change',
      command: `cd mock-lab/languages/php
proxymock replay --test-against http://localhost:8080`,
      note: 'Use replay as the regression check before shipping PHP changes.',
    },
  ]}
/>

## TLS Trust {#tls-trust}

PHP cURL uses libcurl's configured CA bundle and does not consistently read `SSL_CERT_FILE`. For HTTPS recording and mocking, pass the proxymock CA to cURL with `CURLOPT_CAINFO`, as the demo does:

```php
$ca = getenv('SSL_CERT_FILE');
if ($ca) {
    curl_setopt($ch, CURLOPT_CAINFO, $ca);
}
```

Do not disable peer verification. See [Language Configuration](/proxymock/getting-started/language-reference#tls-trust) for the certificate location and shared guidance.
