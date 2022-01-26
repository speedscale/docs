# Table of contents

* [Introduction](README.md)

## Install

* [CLI speedctl](install/cli-speedctl.md)
* [Kubernetes Operator](install/kubernetes-operator.md)
* [Speedscale Sidecar](install/kubernetes-sidecar/README.md)
  * [Optional Sidecar Annotations](install/kubernetes-sidecar/sidecar-annotations.md)
  * [Trusting TLS Certificates](install/kubernetes-sidecar/sidecar-trust.md)
  * [Using with Istio](install/kubernetes-sidecar/using-with-istio.md)

## CLI

* [speedctl](cli/speedctl.md)
* [speedscale](cli/speedscale/README.md)
  * [Guides](cli/speedscale/guides/README.md)
    * [Explore Sample Data](cli/speedscale/guides/explore-sample-data.md)
    * [Docker Observability](cli/speedscale/guides/docker-observability/README.md)
      * [Demo App](cli/speedscale/guides/docker-observability/demo-app.md)
      * [My Container](cli/speedscale/guides/docker-observability/my-container.md)
    * [Local Observability](cli/speedscale/guides/local-observability/README.md)
      * [Python Demo App](cli/speedscale/guides/local-observability/python-demo-app.md)
      * [My Local App](cli/speedscale/guides/local-observability/my-local-app.md)

## Analyze

* [Review Services](analyze/review-services.md)
* [Traffic Viewer](analyze/traffic-viewer/README.md)
  * [Create Snapshot](analyze/traffic-viewer/create-snapshot.md)
  * [View Snapshot](analyze/traffic-viewer/view-snapshot.md)
* [Transform Snapshot](analyze/transform-snapshot.md)

## Replay

* [Preparing the Environment](replay/preparing-the-environment.md)
* [Start Replay (Kubernetes)](replay/replay-snapshot/README.md)
  * [Optional Replay Annotations](replay/replay-snapshot/optional-replay-annotations.md)
  * [Lifecycle and Troubleshooting](replay/replay-snapshot/lifecycle-and-troubleshooting.md)
* [Viewing Reports](replay/viewing-reports-1/README.md)
  * [Report Summary](replay/viewing-reports-1/summary.md)
  * [Performance Details](replay/viewing-reports-1/performance-details.md)
  * [Success Rate](replay/viewing-reports-1/errors.md)
  * [Logs](replay/viewing-reports-1/logs.md)

## Configuration

* [Filters](configuration/filters/README.md)
  * [Structure](configuration/filters/structure.md)
  * [Simple Example](configuration/filters/simple-example.md)
  * [Complex Example](configuration/filters/complex-example.md)
* [Transform Traffic](configuration/transform-traffic/README.md)
  * [Extractors](configuration/transform-traffic/extractors/README.md)
    * [HTTP](configuration/transform-traffic/extractors/http/README.md)
      * [http\_queryparam](configuration/transform-traffic/extractors/http/http\_queryparam.md)
      * [http\_req\_body](configuration/transform-traffic/extractors/http/http\_req\_body.md)
      * [http\_req\_header](configuration/transform-traffic/extractors/http/http\_req\_header.md)
      * [http\_res\_body](configuration/transform-traffic/extractors/http/http\_res\_body.md)
      * [http\_res\_header](configuration/transform-traffic/extractors/http/http\_res\_header.md)
      * [http\_url](configuration/transform-traffic/extractors/http/http\_url.md)
    * [General Purpose](configuration/transform-traffic/extractors/general-purpose/README.md)
      * [File](configuration/transform-traffic/extractors/general-purpose/file.md)
      * [Variable](configuration/transform-traffic/extractors/general-purpose/variable.md)
  * [Transforms](configuration/transform-traffic/transforms/README.md)
    * [base64](configuration/transform-traffic/transforms/base64.md)
    * [constant](configuration/transform-traffic/transforms/constant.md)
    * [date](configuration/transform-traffic/transforms/date.md)
    * [gzip](configuration/transform-traffic/transforms/gzip.md)
    * [http\_auth](configuration/transform-traffic/transforms/http\_auth.md)
    * [json\_path](configuration/transform-traffic/transforms/json\_path.md)
    * [regex](configuration/transform-traffic/transforms/regex.md)
    * [xml\_path](configuration/transform-traffic/transforms/xml\_path.md)
  * [Local Testing (tokenconfigs)](configuration/transform-traffic/local-testing-tokenconfigs.md)
  * [Common Patterns](configuration/transform-traffic/common-patterns/README.md)
    * [Timestamp Shift](configuration/transform-traffic/common-patterns/timestamp-shift.md)
* [Snapshot Configuration](configuration/tokenizers-1/README.md)
  * [HTTP Regex](configuration/tokenizers-1/http-regex.md)
  * [HTTP Cookie Tokenizer](configuration/tokenizers-1/http-cookie-tokenizer.md)
  * [HTTP Query Param](configuration/tokenizers-1/http-query-param.md)
  * [HTTP JWT Tokenizer](configuration/tokenizers-1/httpauthorization.md)
  * [HTTP OAuth2 Tokenizer](configuration/tokenizers-1/tokenizers.md)
  * [HTTP Match Request Body](configuration/tokenizers-1/http-match-request-body.md)
  * [HTTP Match Request XPath](configuration/tokenizers-1/http-match-request-xpath.md)
  * [HTTP Match SOAP Operation](configuration/tokenizers-1/http-match-soap-operation.md)
* [Replay Configuration](configuration/configuration/README.md)
  * [Asserters](configuration/configuration/asserters/README.md)
    * [HTTP Response Body](configuration/configuration/asserters/httpresponsebody.md)
    * [HTTP Response Schema](configuration/configuration/asserters/httpresponseschema.md)
    * [HTTP Status Code](configuration/configuration/asserters/httpstatuscode.md)
    * [HTTP Headers](configuration/configuration/asserters/assert-http-headers.md)
    * [HTTP Cookies](configuration/configuration/asserters/httpresponsecookies.md)
  * [Chaos](configuration/configuration/chaos.md)
  * [Generator](configuration/configuration/generator.md)
  * [Rules](configuration/configuration/rules.md)

## Reference

* [Technology Support](reference/technology-support.md)
* [Release Notes](reference/release-notes.md)
* [CICD Overview](reference/integration-with-cicd/README.md)
  * [Jenkins](reference/integration-with-cicd/jenkins.md)
  * [GitLab CICD](reference/integration-with-cicd/gitlab-cicd.md)
* [Integrations](reference/integrations/README.md)
  * [New Relic](reference/integrations/new-relic.md)
  * [Rancher Labs](reference/integrations/rancher-labs.md)
* [FAQ](reference/faq.md)

## Manual Sequences

* [Manually Installing Sidecar](manual-sequences/manually-installing-sidecar.md)
* [Manually Running Reverse Proxy Sidecar](manual-sequences/reverse-proxy-sidecar.md)
* [Manually Running a Replay in Kubernetes](manual-sequences/replay-with-speedctl/README.md)
  * [Generator and Responder Combo](manual-sequences/replay-with-speedctl/generator-and-responder.md)
  * [Generator only](manual-sequences/replay-with-speedctl/generator-only.md)
  * [Cleanup](manual-sequences/replay-with-speedctl/cleanup.md)
