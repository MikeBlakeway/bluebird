import { createServer } from './server.js'
import { logger } from './lib/logger.js'

/**
 * Export OpenAPI spec to JSON
 * Usage: node --import tsx ./src/export-openapi.ts > openapi.json
 */
async function exportOpenAPISpec() {
  try {
    const fastify = await createServer()

    // Boot server (registers all routes)
    // Don't actually listen; just initialize
    await fastify.ready()

    // Fetch the OpenAPI spec
    const spec = fastify.swagger()

    // Output to stdout as JSON
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(spec, null, 2))

    await fastify.close()
    process.exit(0)
  } catch (error) {
    logger.error(error, 'Failed to export OpenAPI spec')
    process.exit(1)
  }
}

exportOpenAPISpec()
