import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'

const config: Config = {
  title: 'Bluebird',
  tagline: 'AI Music Composition Platform',
  favicon: 'img/favicon.ico',
  url: 'https://docs.bluebird.app',
  baseUrl: '/',
  organizationName: 'bluebird',
  projectName: 'bluebird',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/MikeBlakeway/bluebird/tree/develop/website/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/bluebird-social-card.jpg',
    navbar: {
      title: 'Bluebird',
      logo: {
        alt: 'Bluebird Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/MikeBlakeway/bluebird',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/MikeBlakeway/bluebird',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Project Vision',
              to: '/docs/project/vision',
            },
            {
              label: 'Development',
              to: '/docs/development',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Bluebird. Built with Docusaurus.`,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
