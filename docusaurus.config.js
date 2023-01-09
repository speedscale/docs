// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Speedscale",
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
    // [
    //     '@docusaurus/plugin-google-gtag',
    //     {
    //         trackingID: 'G-0QE379GMML',
    //         anonymizeIP: true,
    //     },
    // ],
    [
      "docusaurus-plugin-segment",
      {
        apiKey: "GdKpBTA5Bb5u7fUJcMgWS8dHMPwM92wo",
        // Add other options here.
      },
    ],
    "docusaurus-plugin-hubspot",
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
        },
        gtag: {
          trackingID: "UA-161164697-1",
          anonymizeIP: true,
        },
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
            href: "https://speedscale.com/free-trial",
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
