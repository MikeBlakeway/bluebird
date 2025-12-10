import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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
