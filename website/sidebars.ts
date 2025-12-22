import type { SidebarsConfig } from '@docusaurus/types'

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Project',
      items: [
        {
          type: 'doc',
          id: 'project/vision',
          label: 'Vision',
        },
        {
          type: 'doc',
          id: 'project/overview',
          label: 'Overview',
        },
        {
          type: 'doc',
          id: 'project/features',
          label: 'Features',
        },
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        {
          type: 'doc',
          id: 'development/getting-started',
          label: 'Getting Started',
        },
        {
          type: 'doc',
          id: 'development/branching-strategy',
          label: 'Branching Strategy',
        },
        {
          type: 'doc',
          id: 'development/ci-cd',
          label: 'CI/CD Pipeline',
        },
        {
          type: 'doc',
          id: 'development/performance',
          label: 'Performance & Optimization',
        },
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        {
          type: 'doc',
          id: 'architecture/overview',
          label: 'Overview',
        },
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        {
          type: 'doc',
          id: 'api/overview',
          label: 'Overview',
        },
      ],
    },
  ],
}

export default sidebars
