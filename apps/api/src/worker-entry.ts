/**
 * Worker process entry point.
 * Run this separately from the API server to process queued jobs.
 * Usage: pnpm -F @bluebird/api worker
 */

import './lib/worker.js'
import './lib/workers/music-worker.js'

// eslint-disable-next-line no-console
console.log('[WORKER] BullMQ workers started. Listening for jobs...')

// Keep process alive
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('[WORKER] Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('[WORKER] Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
