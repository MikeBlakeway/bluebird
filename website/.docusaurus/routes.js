import React from 'react'
import ComponentCreator from '@docusaurus/ComponentCreator'

export default [
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'b3a'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '3bb'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '38b'),
            routes: [
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', 'be8'),
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
                path: '/docs/architecture/overview',
                component: ComponentCreator('/docs/architecture/overview', '304'),
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
                path: '/docs/development/getting-started',
                component: ComponentCreator('/docs/development/getting-started', 'bd2'),
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
    path: '*',
    component: ComponentCreator('*'),
  },
]
