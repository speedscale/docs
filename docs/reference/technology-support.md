---
sidebar_position: 1
---

# Technology Support

Protocol Support

Speedscale is a 3 part process: **Observe**, **Analyze**, and **Playback**. That means that protocol and technology support can be viewed through these steps separately.

### Supported <a href="#supported" id="supported"></a>

<table><thead><tr><th>Technology</th><th data-type="select">Type</th><th data-type="select">Support</th><th>Notes</th></tr></thead><tbody><tr><td>Auth0</td><td>API</td><td>Full</td><td></td></tr><tr><td>Basic Auth</td><td>Auth</td><td>Full</td><td></td></tr><tr><td>Bearer JWT</td><td>Auth</td><td>Full</td><td>See <a href="../configuration/tokenizers-1/httpauthorization">JWT Tokenizer</a></td></tr><tr><td>Cookies</td><td>Auth</td><td>Full</td><td>See <a href="../configuration/tokenizers-1/http-cookie-tokenizer">Cookie Tokenizer</a></td></tr><tr><td>Desktop</td><td>Environment</td><td>Full</td><td>See <a href="../install/cli-speedctl">CLI: speedctl</a></td></tr><tr><td>Docker (non-K8S)</td><td>Environment</td><td>Full</td><td>See <a href="../manual-sequences/reverse-proxy-sidecar">Reverse Proxy</a></td></tr><tr><td>DynamoDB</td><td>DBMS</td><td>Full</td><td></td></tr><tr><td>Elasticsearch</td><td>DBMS</td><td>Full</td><td></td></tr><tr><td>Kubernetes (1.16+)</td><td>Environment</td><td>Full</td><td></td></tr><tr><td>Gmail</td><td>API</td><td>Full</td><td></td></tr><tr><td>GraphQL</td><td>Protocol</td><td>Full</td><td></td></tr><tr><td>gRPC</td><td>Protocol</td><td>Full</td><td></td></tr><tr><td>HTTP 1.1 / 2.0</td><td>Protocol</td><td>Full</td><td></td></tr><tr><td>HTTP/S inbound</td><td>Protocol</td><td>Full</td><td>See <a href="../install/kubernetes-sidecar/sidecar-annotations">TLS</a></td></tr><tr><td>JSON</td><td>Protocol</td><td>Full</td><td></td></tr><tr><td>IMAP</td><td>Protocol</td><td>Observe Only</td><td></td></tr><tr><td>MongoDB</td><td>DBMS</td><td>Partial</td><td></td></tr><tr><td>Mutual TLS (mTLS)</td><td>Protocol</td><td>Partial</td><td>See <a href="../install/kubernetes-sidecar/sidecar-annotations">TLS</a> (for outbound only)</td></tr><tr><td>Outlook 365</td><td>API</td><td>Full</td><td></td></tr><tr><td>Postgres</td><td>DBMS</td><td>Partial</td><td>Full Observe, most playback</td></tr><tr><td>S3 / minio</td><td>API</td><td>Full</td><td></td></tr><tr><td>Stripe</td><td>API</td><td>Full</td><td></td></tr><tr><td>Twilio</td><td>API</td><td>Full</td><td></td></tr><tr><td>XML</td><td>Protocol</td><td>Full</td><td></td></tr><tr><td>Zapier</td><td>API</td><td>Full</td><td></td></tr><tr><td>Google Autopilot</td><td>Environment</td><td>Full</td><td>Requires reverse proxy</td></tr></tbody></table>





If there are other protocols that are integral to your organization, please let us know at [support@speedscale.com](mailto:support@speedscale.com) or join our [slack community](http://slack.speedscale.com).
