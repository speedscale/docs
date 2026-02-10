// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { themes } from "prism-react-renderer";

const lightCodeTheme = themes.vsDark;
const darkCodeTheme = themes.vsDark;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Speedscale Docs",
  tagline: "Stress test your APIs with real world scenarios",
  url: "https://docs.speedscale.com",
  baseUrl: "/",
  trailingSlash: true,
  onBrokenLinks: "throw",
  favicon: "img/favicon.ico",
  organizationName: "speedscale", // Usually your GitHub org/user name.
  projectName: "docs", // Usually your repo name.
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },
  themes: ["@docusaurus/theme-mermaid"],

  plugins: [
    [
      "@docusaurus/plugin-google-tag-manager",
      {
        containerId: "GTM-TV35HML",
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          {
            from: "/getting-started/introduction/",
            to: "/",
          },
          {
            from: "/end-to-end/",
            to: "/guides/end-to-end/",
          },
          {
            from: "/reference/transform-traffic/common-patterns/guide-jwt/",
            to: "/guides/replay/resign-jwt/",
          },
          {
            from: "/proxymock/getting-started/",
            to: "/proxymock/",
          },
          {
            from: "/proxymock/getting-started/quickstart-cli/",
            to: "/proxymock/getting-started/quickstart/quickstart-cli/",
          },
          {
            from: "/proxymock/getting-started/api-key/",
            to: "/proxymock/getting-started/installation/",
          },
          {
            from: "/analyze/create-snapshot/",
            to: "/guides/creating-a-snapshot/",
          },
          { from: "/analyze/traffic-viewer/", to: "/guides/tls/" },
          {
            from: "/analyze/traffic-viewer/transform-snapshot/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/analyze/traffic-viewer/view-snapshot/",
            to: "/guides/creating-a-snapshot/",
          },
          { from: "/cli/speedscale/", to: "/guides/cli/" },
          {
            from: "/dlp/api-reference/",
            to: "/guides/dlp/cli-reference",
          },
          {
            from: "/dlp/security-compliance/",
            to: "/security/data_protection/",
          },
          {
            from: "/dlp/examples/",
            to: "/guides/dlp",
          },
          {
            from: "/dlp/glossary/",
            to: "/guides/dlp",
          },
          {
            from: "/dlp/appendix/",
            to: "/guides/dlp",
          },
          {
            from: "/cli/speedscale/guides/docker-observability/",
            to: "/getting-started/installation/install/docker",
          },
          {
            from: "/cli/speedscale/guides/docker-observability/demo-app/",
            to: "/getting-started/installation/install/docker",
          },
          {
            from: "/cli/speedscale/guides/local-observability/",
            to: "/guides/cli/",
          },
          {
            from: "/cli/speedscale/guides/local-observability/python-demo-app/",
            to: "/guides/cli/",
          },
          {
            from: "/configuration/configuration/",
            to: "/reference/configuration/",
          },
          {
            from: "/configuration/configuration/asserters/",
            to: "/reference/configuration/assertions/",
          },
          {
            from: "/configuration/configuration/asserters/assert-http-headers/",
            to: "/reference/configuration/assertions/assert-http-headers/",
          },
          {
            from: "/configuration/configuration/asserters/httpresponsebody/",
            to: "/reference/configuration/assertions/httpresponsebody/",
          },
          {
            from: "/configuration/configuration/asserters/httpstatuscode/",
            to: "/reference/configuration/assertions/httpstatuscode/",
          },
          {
            from: "/configuration/configuration/chaos/",
            to: "/concepts/chaos/",
          },
          {
            from: "/configuration/configuration/rules/",
            to: "/reference/configuration/goals/",
          },
          { from: "/configuration/dlp/", to: "/guides/dlp/" },
          { from: "/configuration/filters/", to: "/guides/creating-filters/" },
          {
            from: "/configuration/filters/from-traffic-viewer/",
            to: "/guides/creating-a-snapshot/",
          },
          {
            from: "/configuration/filters/simple-example/",
            to: "/reference/filters/simple-example/",
          },
          {
            from: "/configuration/filters/structure/",
            to: "/reference/filters/structure/",
          },
          {
            from: "/configuration/tokenizers-1/http-cookie-tokenizer",
            to: "/guides/transformation/extractors/http_req_cookie/",
          },
          {
            from: "/configuration/tokenizers-1/http-match-request-body/",
            to: "/guides/transformation/extractors/req_body/",
          },
          {
            from: "/configuration/tokenizers-1/http-match-request-xpath",
            to: "/guides/transformation/transforms/xml_path/",
          },
          {
            from: "/configuration/tokenizers-1/http-regex/",
            to: "/guides/transformation/transforms/regex",
          },
          {
            from: "/configuration/tokenizers-1/httpauthorization/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          {
            from: "/configuration/transform-traffic/common-patterns/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/configuration/transform-traffic/common-patterns/timestamp-shift/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/configuration/transform-traffic/extractors/",
            to: "/guides/transformation/extractors/",
          },
          {
            from: "/configuration/transform-traffic/extractors/general-purpose/",
            to: "/guides/transformation/extractors/",
          },
          {
            from: "/configuration/transform-traffic/extractors/http/",
            to: "/guides/transformation/extractors/http_url/",
          },
          {
            from: "/configuration/transform-traffic/extractors/http/http_req_header/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          {
            from: "/configuration/transform-traffic/extractors/http/http_res_body/",
            to: "/guides/transformation/extractors/res_body/",
          },
          {
            from: "/configuration/transform-traffic/local-testing-tokenconfigs/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/configuration/transform-traffic/transforms/",
            to: "/guides/transformation/transforms/",
          },
          {
            from: "/configuration/transform-traffic/transforms/common-patterns/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/configuration/transform-traffic/transforms/constant/",
            to: "/guides/transformation/transforms/constant/",
          },
          {
            from: "/configuration/transform-traffic/transforms/http_auth/",
            to: "/guides/transformation/transforms/",
          },
          {
            from: "/configuration/transform-traffic/transforms/json_path/",
            to: "/guides/transformation/transforms/json_path/",
          },
          {
            from: "/configuration/transform-traffic/transforms/variable_load/",
            to: "/guides/transformation/transforms/variable_load/",
          },
          {
            from: "/configuration/transform-traffic/transforms/xml_path/",
            to: "/guides/transformation/transforms/xml_path/",
          },
          { from: "/guides/from-file/", to: "/guides/replay/mocks/from-file/" },
          {
            from: "/guides/mock-scratch/",
            to: "/guides/replay/mocks/from-scratch/",
          },
          {
            from: "/guides/replace_txn_ids/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/guides/replay/mocks/replace-txn-ids/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/guides/replay/optional-replay-annotations/",
            to: "/guides/replay/config/",
          },
          {
            from: "/guides/resign_jwt_mocks/",
            to: "/guides/replay/resign-jwt/",
          },
          {
            from: "/guides/import-charles/",
            to: "/guides/integrations/import/import-charles/",
          },
          { from: "/guides/smart_replace", to: "/guides/transformation/smart-replace/" },
          { from: "/guides/triggers/", to: "/guides/mocking/triggers/" },
          { from: "/guides/kafka/", to: "/guides/message-brokers/kafka/" },
          { from: "/guides/rabbitmq/", to: "/guides/message-brokers/rabbitmq/" },
          {
            from: "/reference/integrations/goreplay/",
            to: "/guides/integrations/import/goreplay/",
          },
          {
            from: "/reference/integrations/http_wire/",
            to: "/guides/integrations/import/http_wire/",
          },
          {
            from: "/guides/import-postman/",
            to: "/guides/integrations/import/import-postman/",
          },
          {
            from: "/guides/import-har/",
            to: "/guides/integrations/import/import-har/",
          },
          {
            from: "/reference/integrations/wiremock/",
            to: "/guides/integrations/import/wiremock/",
          },
          {
            from: "/reference/integrations/postman/",
            to: "/guides/integrations/export/postman/",
          },
          {
            from: "/reference/integrations/jmeter/",
            to: "/guides/integrations/import/jmeter/",
          },
          {
            from: "/guides/review-services/",
            to: "/guides/creating-a-snapshot/",
          },
          { from: "/install/cli-speedctl/", to: "/getting-started/installation/install/cli/" },
          {
            from: "/install/kubernetes-operator/",
            to: "/getting-started/installation/install/kubernetes-operator/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-annotations/",
            to: "/reference/kubernetes-annotations/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-dual-proxy/",
            to: "/getting-started/installation/sidecar/proxy-modes/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-http-proxy/",
            to: "/getting-started/installation/sidecar/proxy-modes/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-perf/",
            to: "/getting-started/installation/sidecar/performance/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-trust/",
            to: "/getting-started/installation/sidecar/tls/",
          },
          {
            from: "/install/kubernetes-sidecar/using-with-istio/",
            to: "/getting-started/installation/install/istio/",
          },
          { from: "/install/networking/", to: "/reference/networking/" },
          { from: "/install/overview/", to: "/quick-start" },
          {
            from: "/manual-sequences/manually-installing-sidecar/",
            to: "/getting-started/installation/sidecar/install/",
          },
          {
            from: "/manual-sequences/replay-with-speedctl/",
            to: "/guides/cli/",
          },
          {
            from: "/manual-sequences/replay-with-speedctl/generator-and-responder/",
            to: "/guides/cli/",
          },
          {
            from: "/manual-sequences/replay-with-speedctl/generator-only/",
            to: "/guides/cli/",
          },
          {
            from: "/manual-sequences/reverse-proxy-sidecar/",
            to: "/getting-started/installation/sidecar/proxy-modes/",
          },
          {
            from: "/reference/configuration/tokenizers-1/httpauthorization/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          { from: "/reference/dlp/", to: "/guides/dlp/" },
          {
            from: "/reference/install/cli-speedctl/",
            to: "/getting-started/upgrade/operator/",
          },
          { from: "/guides/cicd/", to: "/guides/integrations/cicd/" },
          {
            from: "/reference/transform-traffic/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/reference/transform-traffic/transforms/csv",
            to: "/guides/transformation/transforms/csv/",
          },
          { from: "/reference/integrations/gcp/", to: "/guides/integrations/gcp/" },
          { from: "/reference/integrations/aws/", to: "/guides/integrations/aws/" },
          {
            from: "/reference/integrations/rancher-labs/",
            to: "/guides/integrations/rancher-labs/",
          },
          {
            from: "/reference/integrations/datadog/",
            to: "/guides/integrations/export/datadog/",
          },
          {
            from: "/reference/integrations/grafana/",
            to: "/guides/integrations/export/grafana/",
          },
          {
            from: "/reference/integrations/new-relic/",
            to: "/guides/integrations/export/new-relic/",
          },
          {
            from: "/reference/integration-with-cicd/azure-devops/",
            to: "/guides/integrations/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/circleci/",
            to: "/guides/integrations/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/github/",
            to: "/guides/integrations/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/gitlab-cicd/",
            to: "/guides/integrations/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/jenkins/",
            to: "/guides/integrations/cicd/",
          },
          {
            from: "/reference/manual-sequences/reverse-proxy-sidecar/",
            to: "/getting-started/installation/sidecar/proxy-modes/",
          },
          {
            from: "/reference/tokenizers-1/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/reference/tokenizers-1/http-match-request-body/",
            to: "/guides/transformation/extractors/req_body/",
          },
          {
            from: "/reference/tokenizers-1/http-match-request-xpath/",
            to: "/guides/transformation/transforms/xml_path/",
          },
          {
            from: "/reference/tokenizers-1/http-match-soap-operation/",
            to: "/guides/transformation/transforms/xml_path/",
          },
          {
            from: "/reference/tokenizers-1/http-query-param/",
            to: "/guides/transformation/extractors/http_queryparam/",
          },
          {
            from: "/reference/tokenizers-1/http-regex/",
            to: "/guides/transformation/transforms/regex",
          },
          {
            from: "/reference/tokenizers-1/httpauthorization/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          {
            from: "/reference/tokenizers-1/tokenizers/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/reference/transform-traffic/transforms/date/",
            to: "/guides/transformation/transforms/date/",
          },
          {
            from: "/reference/transform-traffic/extractors/general-purpose/variable/",
            to: "/guides/transformation/extractors/variable/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_req_body/",
            to: "/guides/transformation/extractors/req_body/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_queryparam/",
            to: "/guides/transformation/extractors/http_queryparam/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_req_body/",
            to: "/guides/transformation/extractors/req_body/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_req_header/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_res_body/",
            to: "/guides/transformation/extractors/res_body/",
          },
          {
            from: "/reference/transform-traffic/transforms/tag_session",
            to: "/guides/transformation/transforms/tag_session/",
          },
          {
            from: "/reference/transform-traffic/transforms/store_sig/",
            to: "/guides/transformation/transforms/store_sig/",
          },
          {
            from: "/reference/transform-traffic/transforms/grpc_field/",
            to: "/guides/transformation/extractors/json_path/",
          },

          {
            from: "/reference/transform-traffic/transforms/json_selector/",
            to: "/guides/transformation/transforms/json_selector/",
          },
          {
            from: "/reference/transform-traffic/transforms/jwt_resign/",
            to: "/guides/transformation/transforms/jwt_resign/",
          },
          {
            from: "/reference/transform-traffic/transforms/http_auth/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          {
            from: "/reference/transform-traffic/transforms/one_of/",
            to: "/guides/transformation/transforms/one_of/",
          },
          {
            from: "/reference/transform-traffic/transforms/regex/",
            to: "/guides/transformation/transforms/regex",
          },
          {
            from: "/reference/transform-traffic/transforms/train/",
            to: "/guides/transformation/transforms/smart_replace",
          },
          {
            from: "/reference/transform-traffic/transforms/smart_replace",
            to: "/guides/transformation/transforms/smart_replace",
          },
          {
            from: "/reference/transform-traffic/transforms/dataframe",
            to: "/guides/transformation/transforms/dataframe",
          },
          {
            from: "/reference/transform-traffic/transforms/train_csv/",
            to: "/guides/transformation/transforms/smart_replace_csv/",
          },
          {
            from: "/reference/transform-traffic/transforms/smart_replace_csv/",
            to: "/guides/transformation/transforms/smart_replace_csv/",
          },
          {
            from: "/reference/transform-traffic/transforms/train_actual/",
            to: "/guides/transformation/transforms/smart_replace_recorded/",
          },
          {
            from: "/reference/transform-traffic/transforms/smart_replace_recorded/",
            to: "/guides/transformation/transforms/smart_replace_recorded/",
          },
          {
            from: "/reference/transform-traffic/common-patterns/change-login/",
            to: "/guides/replay/change-login/",
          },
          { from: "/replay/preparing-the-environment/", to: "/guides/replay/" },
          { from: "/replay/replay-snapshot", to: "/guides/replay/" },
          {
            from: "/replay/replay-snapshot/lifecycle-and-troubleshooting/",
            to: "/guides/replay/lifecycle-and-troubleshooting/",
          },
          {
            from: "/replay/replay-snapshot/optional-replay-annotations/",
            to: "/guides/replay/",
          },
          { from: "/replay/reports/logs/", to: "/guides/reports/logs/" },
          { from: "/replay/start-replay/", to: "/guides/replay/" },
          { from: "/replay/viewing-reports-1/", to: "/guides/reports/" },
          {
            from: "/replay/viewing-reports-1/errors/",
            to: "/guides/reports/errors",
          },
          { from: "/setup/sidecar/", to: "/getting-started/installation/sidecar/install/" },
          { from: "/setup/sidecar/sidecar-trust/", to: "/getting-started/installation/sidecar/tls/" },
          {
            from: "/setup/sidecar/using-with-istio/",
            to: "/getting-started/installation/install/istio/",
          },
          {
            from: "/setup/upgrade/changed-annotations/",
            to: "/getting-started/installation/sidecar/annotations/",
          },
          { from: "/upgrade/operator/", to: "/getting-started/upgrade/operator/" },
          { from: "/guides/istio/", to: "/getting-started/installation/install/istio/" },
          { from: "/guides/openshift/", to: "/getting-started/installation/install/openshift/" },
          {
            from: "/proxymock/reference/architecture/",
            to: "/proxymock/how-it-works/architecture/",
          },
          {
            from: "/proxymock/reference/repo.md",
            to: "/proxymock/",
          },
          {
            from: "/guides/reduce-ingest/",
            to: "/reference/pricing-faq/",
          },
          {
            from: "/proxymock/reference/mcp/",
            to: "/proxymock/how-it-works/mcp/",
          },
          {
            from: "/proxymock/reference/rrpair-format/",
            to: "/proxymock/how-it-works/rrpair-format/",
          },
          {
            from: "/proxymock/reference/signature/",
            to: "/proxymock/how-it-works/signature/",
          },
          {
            from: "/proxymock/reference/",
            to: "/proxymock/how-it-works/",
          },
          {
            from: "/proxymock/reference/lifecycle/",
            to: "/proxymock/how-it-works/lifecycle/",
          },
          {
            from: "/mocks/mocks/",
            to: "/guides/mocking/mocks",
          },
          {
            from: "/setup/",
            to: "/getting-started/installation/install/",
          },
          {
            from: "/transform/",
            to: "/guides/transformation/transforms/",
          },
          {
            from: "/transform/overview-llm/",
            to: "/guides/transformation/overview",
          },
          {
            from: "/reference/transform-traffic/extractors/",
            to: "/guides/transformation/extractors/",
          },
          {
            from: "/reference/transform-traffic/extractors/README/",
            to: "/guides/transformation/extractors/",
          },
          {
            from: "/reference/transform-traffic/extractors/empty/",
            to: "/guides/transformation/extractors/empty/",
          },
          {
            from: "/reference/transform-traffic/extractors/file/",
            to: "/guides/transformation/extractors/file/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_queryparam/",
            to: "/guides/transformation/extractors/http_queryparam/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_req_cookie/",
            to: "/guides/transformation/extractors/http_req_cookie/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_req_header/",
            to: "/guides/transformation/extractors/http_req_header/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_req_trailer/",
            to: "/guides/transformation/extractors/http_req_trailer/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_res_cookie/",
            to: "/guides/transformation/extractors/http_res_cookie/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_res_header/",
            to: "/guides/transformation/extractors/http_res_header/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_res_trailer/",
            to: "/guides/transformation/extractors/http_res_trailer/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_status_code/",
            to: "/guides/transformation/extractors/http_status_code/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_url/",
            to: "/guides/transformation/extractors/http_url/",
          },
          {
            from: "/reference/transform-traffic/extractors/json_path/",
            to: "/guides/transformation/extractors/json_path/",
          },
          {
            from: "/reference/transform-traffic/extractors/latency/",
            to: "/guides/transformation/extractors/latency/",
          },
          {
            from: "/reference/transform-traffic/extractors/req_body/",
            to: "/guides/transformation/extractors/req_body/",
          },
          {
            from: "/reference/transform-traffic/extractors/res_body/",
            to: "/guides/transformation/extractors/res_body/",
          },
          {
            from: "/reference/transform-traffic/extractors/session/",
            to: "/guides/transformation/extractors/session/",
          },
          {
            from: "/reference/transform-traffic/extractors/target_hostname/",
            to: "/guides/transformation/extractors/target_hostname/",
          },
          {
            from: "/reference/transform-traffic/extractors/target_port/",
            to: "/guides/transformation/extractors/target_port/",
          },
          {
            from: "/reference/transform-traffic/extractors/variable/",
            to: "/guides/transformation/extractors/variable/",
          },
        ],
      },
    ],
  ],

  headTags: [
    {
      tagName: "script",
      attributes: {
        type: "text/javascript",
      },
      innerHTML: `(function(h,o,u,n,d) {
    h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
    d=o.createElement(u);d.async=1;d.src=n
    n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
  })(window,document,'script','https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js','DD_RUM')
  window.DD_RUM.onReady(function() {
    window.DD_RUM.init({
      clientToken: 'pub2019c1346c7ab4080cf258cb4d94d3c9',
      applicationId: '41389bb5-58c1-4216-b37d-b0cf3f004bb9',
      site: 'datadoghq.com',
      service: 'docs.speedscale.com',
      env: 'production',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 0,
      trackBfcacheViews: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
  })`,
    },
  ],

  clientModules: [],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          exclude: ["dlp/**", "dlp-old-backup/**"], // Exclude old dlp directories to prevent duplicate routes (redirects handle old URLs)
          editUrl: ({ versionDocsDirPath, docPath }) =>
            `https://github.com/speedscale/docs/edit/main/${versionDocsDirPath}/${docPath}`,
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        // The application ID provided by Algolia
        appId: "G1CYU179LN",
        // Public API key: it is safe to commit it
        apiKey: "96ea3a26c0551c1f0e9729366ef87cd5",
        indexName: "speedscale",
      },
      colorMode: {
        disableSwitch: true,
      },
      navbar: {
        title: "",
        logo: {
          alt: "Speedscale Logo",
          src: "img/speedscale.svg",
          width: 220,
          height: 72,
        },
        items: [
          {
            href: "https://speedscale.com",
            position: "right",
            label: "Home",
          },
          {
            href: "https://speedscale.com/blog",
            label: "Blog",
            position: "right",
          },
          {
            href: "https://slack.speedscale.com",
            label: "Community Slack",
            position: "right",
          },
          {
            href: "https://app.speedscale.com",
            label: "Login",
            position: "right",
          },
          {
            href: "https://app.speedscale.com/signup",
            label: "Free Trial",
            position: "right",
            // id: 'test',
            // class: 'free-trial',
            className: "free-trial",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Tutorial",
                to: "/",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/docusaurus",
              },
              {
                label: "Discord",
                href: "https://discordapp.com/invite/docusaurus",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/docusaurus",
              },
            ],
          },
          {
            title: "More",
            items: [
              // {
              //     label: 'Blog',
              //     to: '/blog',
              // },
              {
                label: "GitHub",
                href: "https://github.com/facebook/docusaurus",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Speedscale, Inc.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ["bash", "powershell"],
      },
    }),
};

export default {
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],
};

module.exports = config;
