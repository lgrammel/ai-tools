// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const prismReactRenderer = require("prism-react-renderer");

const lightCodeTheme = prismReactRenderer.themes.github;
const darkCodeTheme = prismReactRenderer.themes.dracula;

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

  scripts: [
    {
      src: "https://plausible.io/js/script.js",
      defer: true,
      "data-domain": "modelfusion.dev",
    },
  ],

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
        blog: {
          blogSidebarTitle: "All posts",
          blogSidebarCount: "ALL",
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
        sidebarCollapsible: true,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        routeBasePath: "integration",
        id: "integration",
        path: "integration",
        sidebarCollapsible: true,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        routeBasePath: "tutorial",
        id: "tutorial",
        path: "tutorial",
        sidebarCollapsible: true,
      },
    ],
    [
      "docusaurus-plugin-typedoc",
      {
        // typedoc options:
        entryPoints: ["../packages/modelfusion/src/index.ts"],
        tsconfig: "../packages/modelfusion/tsconfig.json",
        groupOrder: ["Functions", "Variables", "*"],
        name: "modelfusion",
        plugin: ["typedoc-plugin-zod"],
        excludePrivate: true,
        excludeProtected: true,
        sourceLinkTemplate:
          "https://github.com/lgrammel/modelfusion/tree/main/{path}#L{line}",

        // docusaurus options:
        out: ".",
        includeExtension: false, // fixes error with Docusaurus 3
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
      image: "/img/social-card.png",
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
            to: "/api/modules",
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
                to: "/tutorial/showcase/",
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
                href: "https://twitter.com/modelfusionjs",
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
        additionalLanguages: ["bash", "diff", "json"],
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        magicComments: [
          {
            className: "code-block-highlight-line",
            block: { start: "highlight-start", end: "highlight-end" },
          },
        ],
      },
    }),
};

module.exports = config;
