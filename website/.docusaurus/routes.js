import React from 'react'
import ComponentCreator from '@docusaurus/ComponentCreator'

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true,
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true,
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'ae6'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '8d4'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'f32'),
            routes: [
              {
                path: '/docs/api',
                component: ComponentCreator('/docs/api', '044'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/api/overview',
                component: ComponentCreator('/docs/api/overview', 'e45'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/architecture',
                component: ComponentCreator('/docs/architecture', 'f89'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/architecture/overview',
                component: ComponentCreator('/docs/architecture/overview', '304'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development',
                component: ComponentCreator('/docs/development', '19c'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/branching-strategy',
                component: ComponentCreator('/docs/development/branching-strategy', 'ae3'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/ci-cd',
                component: ComponentCreator('/docs/development/ci-cd', 'dbf'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/deployment',
                component: ComponentCreator('/docs/development/deployment', '95f'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/getting-started',
                component: ComponentCreator('/docs/development/getting-started', 'bd2'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/nextjs',
                component: ComponentCreator('/docs/development/nextjs', '8de'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/performance',
                component: ComponentCreator('/docs/development/performance', '169'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/development/typescript',
                component: ComponentCreator('/docs/development/typescript', '999'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', 'a6e'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/project',
                component: ComponentCreator('/docs/project', '8a7'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/project/features',
                component: ComponentCreator('/docs/project/features', '567'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/project/overview',
                component: ComponentCreator('/docs/project/overview', '1e1'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/project/requirements',
                component: ComponentCreator('/docs/project/requirements', '645'),
                exact: true,
                sidebar: 'docs',
              },
              {
                path: '/docs/project/vision',
                component: ComponentCreator('/docs/project/vision', 'a45'),
                exact: true,
                sidebar: 'docs',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true,
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
]
