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
      link: { type: 'generated-index', slug: '/project', title: 'Project' },
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
        {
          type: 'doc',
          id: 'project/requirements',
          label: 'Requirements & Specifications',
        },
      ],
    },
    {
      type: 'category',
      label: 'Development',
      link: { type: 'generated-index', slug: '/development', title: 'Development' },
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
        {
          type: 'doc',
          id: 'development/typescript',
          label: 'TypeScript Configuration',
        },
        {
          type: 'doc',
          id: 'development/nextjs',
          label: 'Next.js Best Practices',
        },
        {
          type: 'doc',
          id: 'development/deployment',
          label: 'Deployment Checklist',
        },
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: { type: 'generated-index', slug: '/architecture', title: 'Architecture' },
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
      link: { type: 'generated-index', slug: '/api', title: 'API Reference' },
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
