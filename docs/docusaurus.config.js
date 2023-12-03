// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "ModelFusion",
  tagline:
    "Build AI applications, chatbots, and agents with JavaScript and TypeScript.",
  // favicon: "img/favicon.ico",
  url: "https://modelfusion.dev",
  baseUrl: "/",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
  },

  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "api",
          path: "docs",
          sidebarPath: require.resolve("./sidebars.js"),
          lastVersion: "current",
          onlyIncludeVersions: ["current"],
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        routeBasePath: "guide",
        id: "guide",
        path: "guide",
        sidebarCollapsible: false,
        editUrl: ({ docPath }) => {
          return `https://holocron.so/github/pr/lgrammel/modelfusion/main/editor/docs/guide/${docPath}`
        },
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        routeBasePath: "integration",
        id: "integration",
        path: "integration",
        sidebarCollapsible: false,
        editUrl: ({ docPath }) => {
          return `https://holocron.so/github/pr/lgrammel/modelfusion/main/editor/docs/integration/${docPath}`
        },
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        routeBasePath: "showcase",
        id: "showcase",
        path: "showcase",
        sidebarCollapsible: false,
        editUrl: ({ docPath }) => {
          return `https://holocron.so/github/pr/lgrammel/modelfusion/main/editor/docs/showcase/${docPath}`
        },
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        routeBasePath: "tutorial",
        id: "tutorial",
        path: "tutorial",
        sidebarCollapsible: false,
        editUrl: ({ docPath }) => {
          return `https://holocron.so/github/pr/lgrammel/modelfusion/main/editor/docs/tutorial/${docPath}`
        },
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      {
        // typedoc options:
        entryPoints: ["../src/index.ts"],
        tsconfig: "../tsconfig.json",
        groupOrder: ["Functions", "Variables", "*"],
        name: "modelfusion",
        plugin: ["typedoc-plugin-zod"],
        excludePrivate: true,
        excludeProtected: true,
        sourceLinkTemplate:
          "https://github.com/lgrammel/modelfusion/tree/main/{path}#L{line}",

        // docusaurus options:
        out: ".",
        sidebar: {
          categoryLabel: "API Reference",
          collapsed: false,
          fullNames: true,
        },
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "/img/social-card.jpg",
      navbar: {
        title: "ModelFusion",
        items: [
          {
            to: "/guide/",
            label: "Guide",
            activeBaseRegex: `/guide/`,
            sidebarId: "guide",
            position: "left",
          },
          {
            to: "/integration/model-provider/",
            label: "Integrations",
            activeBaseRegex: `/integration/model-provider/`,
            sidebarId: "integration",
            position: "left",
          },
          {
            to: "/tutorial/",
            label: "Examples & Tutorials",
            activeBaseRegex: `/tutorial/`,
            sidebarId: "tutorial",
            position: "left",
          },
          {
            to: "/showcase/",
            label: "Showcase",
            activeBaseRegex: `/showcase/`,
            sidebarId: "showcase",
            position: "left",
          },
          {
            to: "/api/modules/",
            label: "API Reference",
            activeBaseRegex: `/api/`,
            position: "right",
          },
          { to: "blog", label: "Blog", position: "right" },
          {
            href: "https://discord.gg/GqCwYZATem",
            label: "Discord",
            position: "right",
          },
          {
            href: "https://github.com/lgrammel/modelfusion",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Documentation",
            items: [
              {
                label: "Guide",
                to: "/guide/",
              },
              {
                label: "Integrations",
                to: "/integration/model-provider/",
              },
              {
                label: "API Reference",
                to: "/api/modules/",
              },
            ],
          },
          {
            title: "Learn",
            items: [
              {
                label: "Examples & Tutorials",
                to: "/tutorial/",
              },
              {
                href: "https://github.com/lgrammel/modelfusion/tree/main/examples",
                label: "Examples (GitHub)",
              },
              {
                label: "Showcase",
                to: "/showcase/",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "blog",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/lgrammel",
              },
              {
                label: "Discord",
                href: "https://discord.gg/GqCwYZATem",
              },
              {
                label: "GitHub",
                href: "https://github.com/lgrammel/modelfusion",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Lars Grammel.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
