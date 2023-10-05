// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

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

  // plugins: [require.resolve('@cmfcmf/docusaurus-search-local')],
  plugins: [
    [require.resolve("@cmfcmf/docusaurus-search-local"), { indexBlog: false }],
    [
      "docusaurus-plugin-segment",
      {
        apiKey: "GdKpBTA5Bb5u7fUJcMgWS8dHMPwM92wo",
        // Add other options here.
      },
    ],
    "docusaurus-plugin-hubspot",
    [
      '@docusaurus/plugin-google-tag-manager',
      {
        containerId: 'GTM-TV35HML',
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          { from: '/analyze/create-snapshot/', to: '/guides/creating-a-snapshot/'},
          { from: '/analyze/traffic-viewer/', to: '/guides/tls/'},
          { from: '/analyze/traffic-viewer/transform-snapshot/', to: '/reference/transform-traffic/'},
          { from: '/analyze/traffic-viewer/view-snapshot/', to: '/guides/creating-a-snapshot/'},
          { from: '/cli/speedscale/', to: '/guides/cli/'},
          { from: '/cli/speedscale/guides/docker-observability/', to: '/setup/install/docker/'},
          { from: '/cli/speedscale/guides/docker-observability/demo-app/', to: '/setup/install/docker/'},
          { from: '/cli/speedscale/guides/local-observability/', to: '/guides/cli/'},
          { from: '/cli/speedscale/guides/local-observability/python-demo-app/', to: '/guides/cli/'},
          { from: '/configuration/configuration/', to: '/reference/configuration/'},
          { from: '/configuration/configuration/asserters/', to: '/reference/configuration/assertions/'},
          { from: '/configuration/configuration/asserters/assert-http-headers/', to: '/reference/configuration/assertions/assert-http-headers/'},
          { from: '/configuration/configuration/asserters/httpresponsebody/', to: '/reference/configuration/assertions/httpresponsebody/'},
          { from: '/configuration/configuration/asserters/httpstatuscode/', to: '/reference/configuration/assertions/httpstatuscode/'},
          { from: '/configuration/configuration/chaos/', to: '/concepts/chaos/'},
          { from: '/configuration/configuration/rules/', to: '/reference/configuration/goals/'},
          { from: '/configuration/dlp/', to: '/guides/dlp/'},
          { from: '/configuration/filters/', to: '/guides/creating-filters/'},
          { from: '/configuration/filters/from-traffic-viewer/', to: '/guides/creating-a-snapshot/'},
          { from: '/configuration/filters/simple-example/', to: '/reference/filters/simple-example/'},
          { from: '/configuration/filters/structure/', to: '/reference/filters/structure/'},
          { from: '/configuration/tokenizers-1/http-cookie-tokenizer', to: '/reference/transform-traffic/extractors/http_req_cookie/'},
          { from: '/configuration/tokenizers-1/http-match-request-body/', to: '/reference/transform-traffic/extractors/req_body/'},
          { from: '/configuration/tokenizers-1/http-match-request-xpath', to: '/reference/transform-traffic/transforms/xml_path/'},
          { from: '/configuration/tokenizers-1/http-regex/', to: '/reference/transform-traffic/transforms/regex/'},
          { from: '/configuration/tokenizers-1/httpauthorization/', to: '/reference/transform-traffic/extractors/http_req_header/'},
          { from: '/configuration/transform-traffic/common-patterns/', to: '/reference/transform-traffic/common-patterns/'},
          { from: '/configuration/transform-traffic/common-patterns/timestamp-shift/', to: '/reference/transform-traffic/common-patterns/timestamp-shift/'},
          { from: '/configuration/transform-traffic/extractors/', to: '/reference/transform-traffic/extractors/'},
          { from: '/configuration/transform-traffic/extractors/general-purpose/', to: '/reference/transform-traffic/extractors/'},
          { from: '/configuration/transform-traffic/extractors/http/', to: '/reference/transform-traffic/extractors/http_url/'},
          { from: '/configuration/transform-traffic/extractors/http/http_req_header/', to: '/reference/transform-traffic/extractors/http_req_header/'},
          { from: '/configuration/transform-traffic/extractors/http/http_res_body/', to: '/reference/transform-traffic/extractors/res_body/'},
          { from: '/configuration/transform-traffic/local-testing-tokenconfigs/', to: '/reference/transform-traffic/local-testing-tokenconfigs/'},
          { from: '/configuration/transform-traffic/transforms/', to: '/reference/transform-traffic/transforms/'},
          { from: '/configuration/transform-traffic/transforms/common-patterns/', to: '/reference/transform-traffic/common-patterns/'},
          { from: '/configuration/transform-traffic/transforms/constant/', to: '/reference/transform-traffic/transforms/constant/'},
          { from: '/configuration/transform-traffic/transforms/http_auth/', to: '/reference/transform-traffic/transforms/'},
          { from: '/configuration/transform-traffic/transforms/json_path/', to: '/reference/transform-traffic/transforms/json_path/'},
          { from: '/configuration/transform-traffic/transforms/variable_load/', to: '/reference/transform-traffic/transforms/variable_load/'},
          { from: '/configuration/transform-traffic/transforms/xml_path/', to: '/reference/transform-traffic/transforms/xml_path/'},
          { from: '/guides/from-file/', to: '/guides/replay/mocks/from-file/'},
          { from: '/guides/mock-scratch/', to: '/guides/replay/mocks/from-scratch/'},
          { from: '/guides/replace_txn_ids/', to: '/guides/replay/mocks/replace-txn-ids/'},
          { from: '/guides/replay/optional-replay-annotations/', to: '/guides/replay/config/'},
          { from: '/guides/resign_jwt_mocks/', to: '/guides/replay/mocks/resign-jwt-mocks/'},
          { from: '/guides/review-services/', to:	'/guides/creating-a-snapshot/'},
          { from: '/install/cli-speedctl/', to: '/setup/install/cli/'},
          { from: '/install/kubernetes-operator/', to: '/setup/install/kubernetes-operator/'},
          { from: '/install/kubernetes-sidecar/sidecar-annotations/', to: '/reference/kubernetes-annotations/'},
          { from: '/install/kubernetes-sidecar/sidecar-dual-proxy/', to: '/setup/sidecar/proxy-modes/'},
          { from: '/install/kubernetes-sidecar/sidecar-http-proxy/', to: '/setup/sidecar/proxy-modes/'},
          { from: '/install/kubernetes-sidecar/sidecar-perf/', to: '/setup/sidecar/performance/'},
          { from: '/install/kubernetes-sidecar/sidecar-trust/', to: '/setup/sidecar/tls/'},
          { from: '/install/kubernetes-sidecar/using-with-istio/', to: '/setup/install/istio/'},
          { from: '/install/networking/', to: '/reference/networking/'},
          { from: '/install/overview/', to: '/quick-start'},
          { from: '/manual-sequences/manually-installing-sidecar/', to: '/setup/sidecar/install/'},
          { from: '/manual-sequences/replay-with-speedctl/', to: '/guides/cli/'},
          { from: '/manual-sequences/replay-with-speedctl/generator-and-responder/', to: '/guides/cli/'},
          { from: '/manual-sequences/replay-with-speedctl/generator-only/', to: '/guides/cli/'},
          { from: '/manual-sequences/reverse-proxy-sidecar/', to: '/setup/sidecar/proxy-modes/'},
          { from: '/reference/configuration/tokenizers-1/httpauthorization/', to: '/reference/transform-traffic/extractors/http_req_header/'},
          { from: '/reference/dlp/', to: '/guides/dlp/'},
          { from: '/reference/install/cli-speedctl/', to: '/setup/upgrade/operator/'},
          { from: '/reference/integration-with-cicd/azure-devops/', to: '/guides/cicd/'},
          { from: '/reference/integration-with-cicd/circleci/', to: '/guides/cicd/'},
          { from: '/reference/integration-with-cicd/github/', to: '/guides/cicd/'},
          { from: '/reference/integration-with-cicd/gitlab-cicd/', to: '/guides/cicd/'},
          { from: '/reference/integration-with-cicd/jenkins/', to: '/guides/cicd/'},
          { from: '/reference/manual-sequences/reverse-proxy-sidecar/', to: '/setup/sidecar/proxy-modes/'},
          { from: '/reference/tokenizers-1/', to: '/reference/transform-traffic/'},
          { from: '/reference/tokenizers-1/http-match-request-body/', to: '/reference/transform-traffic/extractors/req_body/'},
          { from: '/reference/tokenizers-1/http-match-request-xpath/', to: '/reference/transform-traffic/transforms/xml_path/'},
          { from: '/reference/tokenizers-1/http-match-soap-operation/', to: '/reference/transform-traffic/transforms/xml_path/'},
          { from: '/reference/tokenizers-1/http-query-param/', to: '/reference/transform-traffic/extractors/http_queryparam/'},
          { from: '/reference/tokenizers-1/http-regex/', to: '/reference/transform-traffic/transforms/regex/'},
          { from: '/reference/tokenizers-1/httpauthorization/', to: '/reference/transform-traffic/extractors/http_req_header/'},
          { from: '/reference/tokenizers-1/tokenizers/', to: '/reference/transform-traffic/'},
          { from: '/reference/transform-traffic/extractors/general-purpose/variable/', to: '/reference/transform-traffic/extractors/variable/'},
          { from: '/reference/transform-traffic/extractors/http_req_body/', to: '/reference/transform-traffic/extractors/req_body/'},
          { from: '/reference/transform-traffic/extractors/http/http_queryparam/', to: '/reference/transform-traffic/extractors/http_queryparam/'},
          { from: '/reference/transform-traffic/extractors/http/http_req_body/', to: '/reference/transform-traffic/extractors/req_body/'},
          { from: '/reference/transform-traffic/extractors/http/http_req_header/', to: '/reference/transform-traffic/extractors/http_req_header/'},
          { from: '/reference/transform-traffic/extractors/http/http_res_body/', to: '/reference/transform-traffic/extractors/res_body/'},
          { from: '/reference/transform-traffic/transforms/grpc_field/', to: '/reference/transform-traffic/transforms/json_path/'},
          { from: '/reference/transform-traffic/transforms/http_auth/', to:  '/reference/transform-traffic/extractors/http_req_header/'},
          { from: '/reference/transform-traffic/common-patterns/change-login/', to: '/guides/replay/change-login/'},
          { from: '/replay/preparing-the-environment/', to: '/guides/replay/'},
          { from: '/replay/replay-snapshot', to: '/guides/replay/'},
          { from: '/replay/replay-snapshot/lifecycle-and-troubleshooting/', to: '/guides/replay/lifecycle-and-troubleshooting/'},
          { from: '/replay/replay-snapshot/optional-replay-annotations/', to: '/guides/replay/'},
          { from: '/replay/reports/logs/', to: '/guides/reports/logs/'},
          { from: '/replay/start-replay/', to: '/guides/replay/'},
          { from: '/replay/viewing-reports-1/', to: '/guides/reports/'},
          { from: '/replay/viewing-reports-1/errors/', to: '/guides/reports/errors/'},
          { from: '/setup/sidecar/', to: '/setup/sidecar/install/'},
          { from: '/setup/sidecar/sidecar-trust/', to: '/setup/sidecar/tls/'},
          { from: '/setup/sidecar/using-with-istio/', to: '/setup/install/istio/'},
          { from: '/setup/upgrade/changed-annotations/', to: '/setup/sidecar/annotations/'},
          { from: '/upgrade/operator/', to: '/setup/upgrade/operator/'},
          { from: '/guides/istio/', to: '/setup/install/istio/'},
          { from: '/guides/openshift/', to: '/setup/install/openshift/'}
        ]
      }
    ]
  ],

  clientModules: [require.resolve('./plugins/koala.js')],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        }
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
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
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
