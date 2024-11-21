/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    "intro",
    "quick-start",
    "tutorial",
    {
      type: "category",
      label: "SETUP",
      items: [{ type: "autogenerated", dirName: "setup" }],
      collapsed: false,
    },
    {
      type: "category",
      label: "OBSERVABILITY",
      items: [{ type: "autogenerated", dirName: "observe" }],
      collapsed: false,
    },
    {
      type: "category",
      label: "CONCEPTS",
      items: [{ type: "autogenerated", dirName: "concepts" }],
      collapsed: false,
    },
    {
      type: "category",
      label: "GUIDES",
      items: [
        // if you have a directory with a single file, autogeneration won't pick it up
        // unless you specify that directory as the root for generation
        { type: "autogenerated", dirName: "guides/creating-filters" },
        { type: "autogenerated", dirName: "guides" },
        {
          type: "link",
          href: "/setup/sidecar/performance",
          label: "Sidecar Performance and Diagnostics"
        }
      ],
      collapsed: false,
    },
    {
      type: "category",
      label: "MOCKS/VIRTUALIZATION",
      items: [
        { type: "autogenerated", dirName: "mocks" }
      ],
      collapsed: false,
    },
    {
      type: "category",
      label: "INTEGRATION",
      items: [
        { type: "autogenerated", dirName: "integration" }
      ],
      collapsed: false,
    },
    {
      type: "category",
      label: "REFERENCE",
      items: [{ type: "autogenerated", dirName: "reference" }],
      collapsed: false,
    },
    {
      type: "category",
      label: "SECURITY",
      items: [{ type: "autogenerated", dirName: "security" }],
      collapsed: false,
    },
  ],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Tutorial',
      items: ['hello'],
    },
  ],
   */
};

module.exports = sidebars;
