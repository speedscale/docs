---
title: Get started
description: Run a local proxymock status-code regression and fix check with a synthetic TLS deposit fixture.
---

# Get started

Record a healthy deposit response, detect a faulty version and verify a repair. This is a **synthetic local TLS fixture with body comparison off**: `201` baseline, `503` faulty, `201` repaired. It does not demonstrate production banking logic or an autonomous coding agent.

The baseline enters through a local HTTP capture proxy. Replay targets the fixture over HTTPS. The fixture has no outbound dependencies, so the mock-server step establishes the setup but does not demonstrate dependency mocking coverage. For an application with outbound calls, follow the [CLI quickstart](/proxymock/getting-started/quickstart/quickstart-cli/).

## Before you begin

Install [proxymock](/proxymock/getting-started/installation/) and complete its initial authentication. Use a current release whose `replay --help` lists `--verify-fix` and `--fail-on-new-mismatch`. You also need Node.js, curl and OpenSSL with `-addext` support. Keep ports `8080`, `18444`, `4140` and `4143` free.

Run commands in a new application directory, not your workspace root. Download the [deposit fixture](/examples/quality-factory/deposit.cjs.txt) as `deposit.cjs` there. It binds to loopback and serves only the synthetic response.

Generate a short-lived localhost certificate:

```shell
openssl req -x509 -newkey rsa:2048 -nodes -days 2 \
  -subj '/CN=localhost' \
  -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' \
  -keyout localhost-key.pem -out localhost-cert.pem
chmod 600 localhost-key.pem
```

Build a trust bundle containing your normal trusted CAs and this test certificate. The following uses `/etc/ssl/cert.pem`; change that path if your system CA bundle lives elsewhere:

```shell
node -e "const fs=require('node:fs'); fs.writeFileSync('ca-bundle.pem', fs.readFileSync('/etc/ssl/cert.pem')+'\\n'+fs.readFileSync('localhost-cert.pem'))"
export SSL_CERT_FILE="$PWD/ca-bundle.pem"
```

Set `SSL_CERT_FILE` in each terminal that runs replay. Keep normal CAs in the bundle so authentication still works. Do not use this test trust configuration for production connections. Keep generated keys, recordings and reports out of Git.

## 1. Record the baseline

In terminal A:

```shell
node deposit.cjs baseline
```

In terminal B:

```shell
proxymock record --app-port 8080 --out ./proxymock/baseline
```

In terminal C, exercise the capture path:

```shell
curl --fail -X POST http://localhost:4143/api/transactions/deposit \
  -H 'Content-Type: application/json' \
  -d '{"accountId":1,"amount":3.33}'
```

Expect `{"status":"COMPLETED"}` and HTTP `201`. Stop the recorder in terminal B with Ctrl-C; leave the fixture running. Confirm `proxymock/baseline` contains an inbound deposit RRPair with recorded status `201`.

This fixture contains invented data. For real traffic, [configure DLP and review masking](./prepare-traffic.md) before capture/export. Keep raw payloads out of notifications and public artifacts.

## 2. Start dependency mocks and save the healthy result

In terminal B:

```shell
proxymock mock --in ./proxymock/baseline --no-passthrough \
  --out ./proxymock/mock-output
```

Leave it running. A real application must route its dependencies through the mock server; this fixture makes no outbound calls. `--no-passthrough` prevents unmatched calls routed through that server from reaching live dependencies.

In terminal C:

```shell
proxymock replay --in ./proxymock/baseline \
  --test-against https://localhost:18444 --ignore-body-changes \
  --out ./proxymock/results/baseline
```

Inspect `proxymock/results/baseline/replay-verdict.json`. Expect recorded `201`, observed `201`. Do not proceed with a mismatch or setup error.

## 3. Detect the regression

Stop terminal A's fixture and start the faulty version:

```shell
node deposit.cjs faulty
```

In terminal C, replay the unchanged healthy input:

```shell
proxymock replay --in ./proxymock/baseline \
  --test-against https://localhost:18444 --ignore-body-changes \
  --baseline ./proxymock/results/baseline --fail-on-new-mismatch \
  --out ./proxymock/results/candidate
```

Expect exit `3`, recorded `201`, observed `503`. Save the observed candidate output unchanged: it contains the error needed for fix verification. A healthy `201` recording cannot be used as `--verify-fix` input.

Confirm the affected version does not pass a fix check:

```shell
proxymock replay --in ./proxymock/results/candidate \
  --test-against https://localhost:18444 --ignore-body-changes \
  --verify-fix --expect '/api/transactions/deposit' \
  --out ./proxymock/results/still-faulty
```

Expect exit `2`: recorded `503`, observed `503`. Matching this failure is reproduction, not a repair.

## 4. Validate the repaired version

Stop terminal A's fixture and start:

```shell
node deposit.cjs repaired
```

In terminal C, use the **same error recording** as the preceding fix check:

```shell
proxymock replay --in ./proxymock/results/candidate \
  --test-against https://localhost:18444 --ignore-body-changes \
  --verify-fix --expect '/api/transactions/deposit' \
  --out ./proxymock/results/fixed
```

Expect exit `0`: recorded `503`, observed `201`. Finally check the repair against the original healthy baseline:

```shell
proxymock replay --in ./proxymock/baseline \
  --test-against https://localhost:18444 --ignore-body-changes \
  --baseline ./proxymock/results/baseline --fail-on-new-mismatch \
  --out ./proxymock/results/repaired-regression
```

Expect exit `0`: recorded `201`, observed `201`. Keep both inputs unchanged. Review intentional baseline updates separately and require passing evidence for the exact candidate before merge.

## What this proves

The fixture demonstrates capture, HTTPS replay and status-code gates. **Body comparison is off** throughout; a `201` with an incorrect body would not be caught. Add response and business assertions for your application. This controlled status switch is not evidence of a subtle defect escaping unit tests.

The [bounded result summary](/examples/quality-factory/results.json) records the five outcomes checked with proxymock `v2.5.1133` on October 15, 2026. It contains no request payloads or credentials.

Stop the fixture and mock server with Ctrl-C. For a rerun, use a fresh application directory so old reports cannot be mistaken for new results. Continue with [Validate code changes](./validate-code-changes.md) or [Reproduce production incidents](./reproduce-production-incidents.md).
