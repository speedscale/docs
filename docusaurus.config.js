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
  onBrokenMarkdownLinks: "throw",
  favicon: "img/favicon.ico",
  organizationName: "speedscale", // Usually your GitHub org/user name.
  projectName: "docs", // Usually your repo name.
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  plugins: [
    "docusaurus-plugin-hubspot",
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
            from: "/proxymock/getting-started/",
            to: "/proxymock/",
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
            to: "/reference/transform-traffic/",
          },
          {
            from: "/analyze/traffic-viewer/view-snapshot/",
            to: "/guides/creating-a-snapshot/",
          },
          { from: "/cli/speedscale/", to: "/guides/cli/" },
          {
            from: "/cli/speedscale/guides/docker-observability/",
            to: "/setup/install/docker/",
          },
          {
            from: "/cli/speedscale/guides/docker-observability/demo-app/",
            to: "/setup/install/docker/",
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
            to: "/reference/transform-traffic/extractors/http_req_cookie/",
          },
          {
            from: "/configuration/tokenizers-1/http-match-request-body/",
            to: "/reference/transform-traffic/extractors/req_body/",
          },
          {
            from: "/configuration/tokenizers-1/http-match-request-xpath",
            to: "/reference/transform-traffic/transforms/xml_path/",
          },
          {
            from: "/configuration/tokenizers-1/http-regex/",
            to: "/transform/transforms/regex",
          },
          {
            from: "/configuration/tokenizers-1/httpauthorization/",
            to: "/reference/transform-traffic/extractors/http_req_header/",
          },
          {
            from: "/configuration/transform-traffic/common-patterns/",
            to: "/reference/transform-traffic/common-patterns/",
          },
          {
            from: "/configuration/transform-traffic/common-patterns/timestamp-shift/",
            to: "/reference/transform-traffic/common-patterns/timestamp-shift/",
          },
          {
            from: "/configuration/transform-traffic/extractors/",
            to: "/reference/transform-traffic/extractors/",
          },
          {
            from: "/configuration/transform-traffic/extractors/general-purpose/",
            to: "/reference/transform-traffic/extractors/",
          },
          {
            from: "/configuration/transform-traffic/extractors/http/",
            to: "/reference/transform-traffic/extractors/http_url/",
          },
          {
            from: "/configuration/transform-traffic/extractors/http/http_req_header/",
            to: "/reference/transform-traffic/extractors/http_req_header/",
          },
          {
            from: "/configuration/transform-traffic/extractors/http/http_res_body/",
            to: "/reference/transform-traffic/extractors/res_body/",
          },
          {
            from: "/configuration/transform-traffic/local-testing-tokenconfigs/",
            to: "/reference/transform-traffic/local-testing-tokenconfigs/",
          },
          {
            from: "/configuration/transform-traffic/transforms/",
            to: "/reference/transform-traffic/transforms/",
          },
          {
            from: "/configuration/transform-traffic/transforms/common-patterns/",
            to: "/reference/transform-traffic/common-patterns/",
          },
          {
            from: "/configuration/transform-traffic/transforms/constant/",
            to: "/reference/transform-traffic/transforms/constant/",
          },
          {
            from: "/configuration/transform-traffic/transforms/http_auth/",
            to: "/reference/transform-traffic/transforms/",
          },
          {
            from: "/configuration/transform-traffic/transforms/json_path/",
            to: "/transform/transforms/json_path/",
          },
          {
            from: "/configuration/transform-traffic/transforms/variable_load/",
            to: "/reference/transform-traffic/transforms/variable_load/",
          },
          {
            from: "/configuration/transform-traffic/transforms/xml_path/",
            to: "/reference/transform-traffic/transforms/xml_path/",
          },
          { from: "/guides/from-file/", to: "/guides/replay/mocks/from-file/" },
          {
            from: "/guides/mock-scratch/",
            to: "/guides/replay/mocks/from-scratch/",
          },
          {
            from: "/guides/replace_txn_ids/",
            to: "/reference/transform-traffic/common-patterns/",
          },
          {
            from: "/guides/replay/mocks/replace-txn-ids/",
            to: "/reference/transform-traffic/common-patterns/",
          },
          {
            from: "/guides/replay/optional-replay-annotations/",
            to: "/guides/replay/config/",
          },
          {
            from: "/guides/resign_jwt_mocks/",
            to: "/guides/replay/mocks/resign-jwt-mocks/",
          },
          {
            from: "/guides/import-charles/",
            to: "/integration/import/import-charles/",
          },
          { from: "/guides/smart_replace", to: "/transform/smart-replace/" },
          { from: "/guides/triggers/", to: "/mocks/triggers/" },
          {
            from: "/reference/integrations/goreplay/",
            to: "/integration/import/goreplay/",
          },
          {
            from: "/reference/integrations/http_wire/",
            to: "/integration/import/http_wire/",
          },
          {
            from: "/guides/import-postman/",
            to: "/integration/import/import-postman/",
          },
          {
            from: "/guides/import-har/",
            to: "/integration/import/import-har/",
          },
          {
            from: "/reference/integrations/wiremock/",
            to: "/integration/import/wiremock/",
          },
          {
            from: "/reference/integrations/postman/",
            to: "/integration/export/postman/",
          },
          {
            from: "/reference/integrations/jmeter/",
            to: "/integration/import/jmeter/",
          },
          {
            from: "/guides/review-services/",
            to: "/guides/creating-a-snapshot/",
          },
          { from: "/install/cli-speedctl/", to: "/setup/install/cli/" },
          {
            from: "/install/kubernetes-operator/",
            to: "/setup/install/kubernetes-operator/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-annotations/",
            to: "/reference/kubernetes-annotations/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-dual-proxy/",
            to: "/setup/sidecar/proxy-modes/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-http-proxy/",
            to: "/setup/sidecar/proxy-modes/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-perf/",
            to: "/setup/sidecar/performance/",
          },
          {
            from: "/install/kubernetes-sidecar/sidecar-trust/",
            to: "/setup/sidecar/tls/",
          },
          {
            from: "/install/kubernetes-sidecar/using-with-istio/",
            to: "/setup/install/istio/",
          },
          { from: "/install/networking/", to: "/reference/networking/" },
          { from: "/install/overview/", to: "/quick-start" },
          {
            from: "/manual-sequences/manually-installing-sidecar/",
            to: "/setup/sidecar/install/",
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
            to: "/setup/sidecar/proxy-modes/",
          },
          {
            from: "/reference/configuration/tokenizers-1/httpauthorization/",
            to: "/reference/transform-traffic/extractors/http_req_header/",
          },
          { from: "/reference/dlp/", to: "/guides/dlp/" },
          {
            from: "/reference/install/cli-speedctl/",
            to: "/setup/upgrade/operator/",
          },
          { from: "/guides/cicd/", to: "/integration/cicd/" },
          {
            from: "/reference/transform-traffic/transforms/csv",
            to: "/transform/transforms/csv/",
          },
          { from: "/reference/integrations/gcp/", to: "/integration/gcp/" },
          { from: "/reference/integrations/aws/", to: "/integration/aws/" },
          {
            from: "/reference/integrations/rancher-labs/",
            to: "/integration/rancher-labs/",
          },
          {
            from: "/reference/integrations/datadog/",
            to: "/integration/export/datadog/",
          },
          {
            from: "/reference/integrations/grafana/",
            to: "/integration/export/grafana/",
          },
          {
            from: "/reference/integrations/new-relic/",
            to: "/integration/export/new-relic/",
          },
          {
            from: "/reference/integration-with-cicd/azure-devops/",
            to: "/integration/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/circleci/",
            to: "/integration/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/github/",
            to: "/integration/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/gitlab-cicd/",
            to: "/integration/cicd/",
          },
          {
            from: "/reference/integration-with-cicd/jenkins/",
            to: "/integration/cicd/",
          },
          {
            from: "/reference/manual-sequences/reverse-proxy-sidecar/",
            to: "/setup/sidecar/proxy-modes/",
          },
          {
            from: "/reference/tokenizers-1/",
            to: "/reference/transform-traffic/",
          },
          {
            from: "/reference/tokenizers-1/http-match-request-body/",
            to: "/reference/transform-traffic/extractors/req_body/",
          },
          {
            from: "/reference/tokenizers-1/http-match-request-xpath/",
            to: "/reference/transform-traffic/transforms/xml_path/",
          },
          {
            from: "/reference/tokenizers-1/http-match-soap-operation/",
            to: "/reference/transform-traffic/transforms/xml_path/",
          },
          {
            from: "/reference/tokenizers-1/http-query-param/",
            to: "/reference/transform-traffic/extractors/http_queryparam/",
          },
          {
            from: "/reference/tokenizers-1/http-regex/",
            to: "/transform/transforms/regex",
          },
          {
            from: "/reference/tokenizers-1/httpauthorization/",
            to: "/reference/transform-traffic/extractors/http_req_header/",
          },
          {
            from: "/reference/tokenizers-1/tokenizers/",
            to: "/reference/transform-traffic/",
          },
          {
            from: "/reference/transform-traffic/transforms/date/",
            to: "/transform/transforms/date/",
          },
          {
            from: "/reference/transform-traffic/extractors/general-purpose/variable/",
            to: "/reference/transform-traffic/extractors/variable/",
          },
          {
            from: "/reference/transform-traffic/extractors/http_req_body/",
            to: "/reference/transform-traffic/extractors/req_body/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_queryparam/",
            to: "/reference/transform-traffic/extractors/http_queryparam/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_req_body/",
            to: "/reference/transform-traffic/extractors/req_body/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_req_header/",
            to: "/reference/transform-traffic/extractors/http_req_header/",
          },
          {
            from: "/reference/transform-traffic/extractors/http/http_res_body/",
            to: "/reference/transform-traffic/extractors/res_body/",
          },
          {
            from: "/reference/transform-traffic/transforms/tag_session",
            to: "/transform/transforms/tag_session/",
          },
          {
            from: "/reference/transform-traffic/transforms/store_sig/",
            to: "/transform/transforms/store_sig/",
          },
          {
            from: "/reference/transform-traffic/transforms/grpc_field/",
            to: "/transform/extractors/json_path/",
          },

          {
            from: "/reference/transform-traffic/transforms/json_selector/",
            to: "/transform/transforms/json_selector/",
          },
          {
            from: "/reference/transform-traffic/transforms/jwt_resign/",
            to: "/transform/transforms/jwt_resign/",
          },
          {
            from: "/reference/transform-traffic/transforms/http_auth/",
            to: "/reference/transform-traffic/extractors/http_req_header/",
          },
          {
            from: "/reference/transform-traffic/transforms/one_of/",
            to: "/transform/transforms/one_of/",
          },
          {
            from: "/reference/transform-traffic/transforms/regex/",
            to: "/transform/transforms/regex",
          },
          {
            from: "/reference/transform-traffic/transforms/train/",
            to: "/transform/transforms/smart_replace",
          },
          {
            from: "/reference/transform-traffic/transforms/smart_replace",
            to: "/transform/transforms/smart_replace",
          },
          {
            from: "/reference/transform-traffic/transforms/dataframe",
            to: "/transform/transforms/dataframe",
          },
          {
            from: "/reference/transform-traffic/transforms/train_csv/",
            to: "/transform/transforms/smart_replace_csv/",
          },
          {
            from: "/reference/transform-traffic/transforms/smart_replace_csv/",
            to: "/transform/transforms/smart_replace_csv/",
          },
          {
            from: "/reference/transform-traffic/transforms/train_actual/",
            to: "/transform/transforms/smart_replace_recorded/",
          },
          {
            from: "/reference/transform-traffic/transforms/smart_replace_recorded/",
            to: "/transform/transforms/smart_replace_recorded/",
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
            to: "/guides/reports/errors/",
          },
          { from: "/setup/sidecar/", to: "/setup/sidecar/install/" },
          { from: "/setup/sidecar/sidecar-trust/", to: "/setup/sidecar/tls/" },
          {
            from: "/setup/sidecar/using-with-istio/",
            to: "/setup/install/istio/",
          },
          {
            from: "/setup/upgrade/changed-annotations/",
            to: "/setup/sidecar/annotations/",
          },
          { from: "/upgrade/operator/", to: "/setup/upgrade/operator/" },
          { from: "/guides/istio/", to: "/setup/install/istio/" },
          { from: "/guides/openshift/", to: "/setup/install/openshift/" },
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
            to: "/mocks/",
          },
          {
            from: "/setup/",
            to: "/setup/install/",
          },
          {
            from: "/transform/",
            to: "/transform/transforms/",
          },
        ],
      },
    ],
  ],

  clientModules: [require.resolve("./plugins/koala.js")],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
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
      hubspot: {
        accountId: 7910857,
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
        additionalLanguages: ['bash', 'powershell'],
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
