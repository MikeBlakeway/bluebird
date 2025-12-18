module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm dev',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/workspace',
        'http://localhost:3000/studio/test-project/test-take',
      ],
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 120000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Specific metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Bundle size
        'total-byte-weight': ['warn', { maxNumericValue: 512000 }], // 500KB
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
