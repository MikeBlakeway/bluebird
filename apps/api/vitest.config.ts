import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globalTeardown: './vitest.teardown.ts',
    deps: {
      inline: [/pino/],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/test/**',
        'prisma/**',
        'vitest.teardown.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@bluebird/types': path.resolve(__dirname, '../../packages/types/src'),
      '@bluebird/telemetry': path.resolve(__dirname, '../../packages/telemetry/src'),
      '@bluebird/client': path.resolve(__dirname, '../../packages/client/src'),
      '@bluebird/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@bluebird/config': path.resolve(__dirname, '../../packages/config'),
      '@bluebird/test-helpers': path.resolve(__dirname, '../../packages/test-helpers/src'),
    },
  },
})
