/**
 * Global teardown for Vitest
 * Ensures all connections are closed after test run
 */

import { disconnectDb } from './src/lib/db.js'

export default async function teardown() {
  // Disconnect Prisma to close database connections
  await disconnectDb()
}
