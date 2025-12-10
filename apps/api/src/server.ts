import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { registerAuthRoutes } from './routes/auth.js'
import { registerProjectRoutes } from './routes/projects.js'
import { registerAnalyzerRoutes } from './routes/analyzer.js'
import { registerPlannerRoutes } from './routes/planner.js'
import { registerOrchestratorRoutes } from './routes/orchestrator.js'
import { registerJobRoutes } from './routes/jobs.js'
import { authMiddleware } from './lib/middleware.js'

const PORT = parseInt(process.env.BLUEBIRD_PORT || '4000', 10)
const HOST = process.env.BLUEBIRD_HOST || '0.0.0.0'
const ENV = process.env.BLUEBIRD_ENV || 'development'

export async function createServer() {
  const fastify = Fastify({
    logger: ENV === 'development',
  })

  // Register plugins
  await fastify.register(fastifyCookie)

  // Register middleware
  fastify.addHook('preHandler', authMiddleware)

  // Health check
  fastify.get('/health', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Register route modules
  registerAuthRoutes(fastify)
  registerProjectRoutes(fastify)
  registerAnalyzerRoutes(fastify)
  registerPlannerRoutes(fastify)
  registerOrchestratorRoutes(fastify)
  registerJobRoutes(fastify)

  return fastify
}

export async function startServer() {
  const fastify = await createServer()

  // Start server
  await fastify.listen({ port: PORT, host: HOST })
  // eslint-disable-next-line no-console
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)

  return fastify
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error)
}
