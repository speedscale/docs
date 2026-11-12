---
title: Security Findings from Captured Traffic
description: "Find credential leaks, injection candidates, weak JWTs, risky headers and sensitive data in the traffic Speedscale and proxymock already captured, with the evidence and an AI fix prompt for each finding."
---

# Security Findings from Captured Traffic

Every snapshot and replay report is scanned for security problems in the traffic itself: credentials sent without TLS, JWTs that never expire, CORS that trusts everyone, card numbers in response bodies, inputs that look like SQL or path traversal, and more. There is nothing to install or configure. The traffic you captured for testing is the input, so you get findings for the endpoints your service really serves and calls.

The scanners read traffic; they do not attack your service. A finding means the traffic shows the problem or a pattern that often comes with it, so treat each one as a lead to confirm in code.

## Where to find them

**In the dashboard**, open a replay report and click its **Recommendations** tab, or open a snapshot and click **Recommendations**, then **Traffic Recommendations**. Security findings are listed with the other [traffic recommendations](./recommendations.md) under the **Security** category; pick it in the **Category** filter to see only those. Snapshots are scanned when they are analyzed, and reports are scanned again on the replayed traffic.

**In proxymock**, the same scanners run on local recordings:

- `proxymock report --in <recording>` writes a report whose security section lists the findings. `--format html --out report.html` writes a self-contained page (without `--out` the HTML goes to stdout), `--format prompt` writes a digest for an AI agent, and `--format dir --out <dir>` writes `security.json` and one fix prompt per finding under `fix-prompts/`.
- In `proxymock web`, open **Requests**, switch the view to **Report**, and scroll to **Findings, auth posture, and transport hygiene**.
- The `generate_report` MCP tool gives an agent the same report.

## Read a finding

Each finding names the problem and its severity: **Critical**, **High**, **Medium** or **Low**. In the dashboard, a finding card shows:

- **AI Coding Prompt to Resolve**: a prompt you can paste into Claude Code, Cursor or another coding agent. It describes the problem, the security context and a summary of the request and response that triggered it: the method and URL, the header names, and the start of each body.
- **Evidence**: what was seen, such as how many requests sent credentials over plain HTTP and to which endpoint. When the evidence has a link, **Investigate** opens the report or snapshot tab it points to in a new browser tab.
- **Affected Services**: the endpoints involved.
- **Related RRPairs**: the requests that triggered the finding.

proxymock also shows each finding's confidence and its CWE and OWASP Top 10 references, and can filter findings by any of them and group them by severity, scanner or endpoint. Confidence is **certain** when the traffic proves the problem, such as a JWT with `alg=none`. It is **firm** when the pattern is strong, and **tentative** when it is a candidate that often has an innocent explanation. Severity in proxymock is high, medium or low, with critical counted as high.

There is no dismiss button. A finding is fixed in your code, and it goes away when traffic captured after the fix no longer shows it.

## What is checked

### Credentials and tokens

| Finding | Flags when | Severity | CWE |
|---|---|---|---|
| Credentials transmitted over plaintext HTTP | A request carries a password, API key, bearer token, session cookie or Basic auth over `http://` | High | 319 |
| JWT-shaped token exposed in URL query string | A JWT appears in a query string, where logs and proxies keep it | High | 598 |
| JWT presented with alg=none | A JWT's header says `alg=none` | Critical | 347 |
| JWT with empty signature segment | A JWT has no signature | High | 347 |
| JWT kid header contains a path traversal sequence | A JWT `kid` contains `..` or starts with a slash | High | 22 |
| Symmetric-key JWT (HSxxx) presented over plaintext | An HS256-style JWT travels without TLS | Medium | 327 |
| JWT has no expiration claim | A JWT has no `exp` | Medium | 613 |
| JWT Token with Long Expiration | A JWT is valid for more than three days | Medium | |
| Expired JWT Token Accepted | A request with an expired JWT gets a successful response | High | |
| JWT payload contains PII claim | A JWT carries email, phone, SSN, address, national ID or date of birth | Low | 359 |
| Cookie value contains JWT / base64-encoded JSON | A cookie value is readable data rather than an opaque id | Medium | 200 |
| Authenticated response is cacheable | A response to an authenticated request can be cached by a browser or proxy | Low | 525 |

JWTs are decoded without checking their signature, to read the claims.

### Injection and request input

| Finding | Flags when | Severity | CWE |
|---|---|---|---|
| Potential SQL Injection Detected | A query parameter or body value contains SQL keywords with injection patterns such as `' OR '1'='1` or `UNION SELECT` | Critical | |
| NoSQL query operator in request body | A JSON body key is a MongoDB operator such as `$ne`, `$gt` or `$where` | High | 943 |
| Path traversal sequence in request | The URL or an input contains `../` or an encoded form of it | High | 22 |
| Serialized-object payload accepted | A request body starts with a Java, Python pickle `posix` gadget, .NET or PHP serialized-object marker | High | 502 |
| Request carries both Transfer-Encoding and Content-Length headers | A request could be read two ways by a proxy and a server, the setup for request smuggling | High | 444 |
| Open-redirect candidate | A redirect's `Location` contains a value from the request | Medium | 601 |
| URL-shaped value in request input (SSRF candidate) | An input is a URL, such as `http://`, `file://` or `gopher://` | Medium | 918 |
| Template-engine syntax in request input (SSTI candidate) | An input contains template syntax such as `{{...}}` or `${...}` | Medium | 1336 |
| LDAP filter syntax in request input | An input looks like an LDAP filter | Medium | 90 |
| Privilege-related field in request body (mass-assignment risk) | A body sets a field such as `isAdmin`, `role`, `tenant_id` or `__proto__`, outside admin endpoints | Medium | 915 |
| Request input reflected verbatim in response body | A query value comes back unchanged in the response, a reflected XSS candidate | Low | 79 |

### Responses, headers and cookies

| Finding | Flags when | Severity | CWE |
|---|---|---|---|
| CORS Access-Control-Allow-Origin: * with credentials | A credentialed request gets `Access-Control-Allow-Origin: *` | Medium | 942 |
| Set-Cookie missing flag | A cookie is set without `HttpOnly`, `SameSite`, or `Secure` over TLS | Medium | 1004 |
| Content-Security-Policy uses permissive directive | The CSP allows `unsafe-inline`, `unsafe-eval`, `data:` or `*` | Medium | 1021 |
| HSTS explicitly disabled / below recommended minimum | A TLS response sets HSTS with `max-age` under six months | High | 319 |
| TLS page references http:// resource (mixed content) | An HTML page served over TLS loads something over `http://` | Medium | 319 |
| Developer / debug surface exposed | A path such as `/swagger`, `/.env`, `/.git/config`, `/actuator/env` or `/debug/pprof` answers successfully | Medium | 200 |
| 5xx response leaks stack trace, SQL fragment or server file path | An error response includes internal details | Low | 209 |
| Server header reveals software version | The `Server` header includes a version | Low | 200 |
| Technology fingerprint header exposed | A header such as `X-Powered-By` or `X-AspNet-Version` names the stack | Low | 200 |
| Deprecated security header in response | A response sets `X-XSS-Protection` or HTTP public key pinning | Low | 757 |

### Sensitive data in bodies

Request and response bodies are searched for a possible payment card number (High), a possible US Social Security number (High), an AWS access key id (High), a PEM private key block (High) and email addresses (Low). For JSON, the finding names the field path where the value was found.

Values that [DLP](./dlp/index.md) redacted before storage are not matched, since the scanners only see the redacted placeholder.

### Behavior across many requests

These look at patterns over many requests. Most need at least ten observations of an endpoint; the IDOR, admin and session checks need fewer. Most are tentative:

| Finding | Flags when | Severity | CWE |
|---|---|---|---|
| Same auth token accesses multiple records (IDOR candidate) | One token successfully reads three or more different numeric ids on the same route | High | 639 |
| Session cookie value unchanged across login (fixation risk) | A client keeps the same session cookie before and after logging in | High | 384 |
| Single auth token hits both admin and regular endpoints | One token succeeds on `/admin/` paths and on ordinary ones | Medium | 269 |
| No rate-limiting on auth endpoint | Ten or more failed logins within a minute and never a `429` | Medium | 307 |
| Login response varies measurably by username (enumeration risk) | Response sizes from one login endpoint vary by 30% or more across ten or more attempts | Medium | 204 |
| Identifiers on this endpoint look predictable | Ids on a route are sequential or look like timestamps | Low | 340 |
| Endpoint response time has wide variance (timing side-channel) | p95 latency is five or more times p50 | Low | 208 |

## Keep in mind

- **Both directions are scanned.** Calls your service makes to its dependencies are scanned too, so a finding can be about a third party, such as a vendor's `Server` header. The endpoint on the finding tells you which side it is.
- **Tentative findings need a look.** A search box that echoes its query, a webhook field that takes a URL, or an admin API that accepts `role` will all show up as candidates. The confirmation is in your code.
- **Findings follow the traffic.** An endpoint that was not exercised in the captured traffic is not checked, and a header that appears only on some responses is judged on those.
- **One finding per check and endpoint.** Repeated hits add to a finding's count and related requests instead of creating new findings, and endpoints that differ only by an id in the path are merged. Header and exposed-path findings group every endpoint that shares the same value, the session fixation and admin token findings cover the whole capture, and some checks report one endpoint more than once, such as one finding per missing cookie flag set or per Content-Security-Policy directive.

## Check that a fix worked

Capture the traffic again after the fix and compare it with the old recording:

```shell
proxymock report --in ./proxymock/recorded-after --baseline ./proxymock/recorded-before --format html --out compare.html
```

The comparison sorts each finding into new, persistent or resolved, so you can see the fix land and catch anything it introduced.

## proxymock: auth posture and transport hygiene

Beyond findings, the proxymock report summarizes two things worth a glance, as context for the findings:

- **Auth posture by endpoint**: the authentication scheme each endpoint receives (none, Basic, bearer, JWT, API key, AWS SigV4, session or form) and, on endpoints that receive more than one scheme, how many calls carried no credentials.
- **Transport & header hygiene**: how many responses came over plain HTTP, and how many TLS responses lacked HSTS, a Content-Security-Policy, `X-Frame-Options`, `Referrer-Policy` or `X-Content-Type-Options`. A missing HSTS header is counted here rather than reported as a finding.

## Related

- [Traffic Recommendations](./recommendations.md)
- [DLP](./dlp/index.md)
- [AI Chat Assistant](./ai-assistant.md)
