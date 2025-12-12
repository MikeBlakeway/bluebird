import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import helmet from '@fastify/helmet'
import { registerAuthRoutes } from './routes/auth.js'
import { registerProjectRoutes } from './routes/projects.js'
import { registerAnalyzerRoutes } from './routes/analyzer.js'
import { registerPlannerRoutes } from './routes/planner.js'
import { registerOrchestratorRoutes } from './routes/orchestrator.js'
import { registerJobRoutes } from './routes/jobs.js'
import { registerRenderRoutes } from './routes/render.js'
import { registerMixRoutes } from './routes/mix.js'
import { registerExportRoutes } from './routes/export.js'
import { authMiddleware } from './lib/middleware.js'

const PORT = parseInt(process.env.BLUEBIRD_PORT || '4000', 10)
const HOST = process.env.BLUEBIRD_HOST || '0.0.0.0'
const ENV = process.env.BLUEBIRD_ENV || 'development'

export async function createServer() {
  const fastify = Fastify({
    logger: ENV === 'development',
    bodyLimit: 1024 * 1024, // 1MB global limit
  })

  // Security: CORS protection
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:4000',
  ]
  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })

  // Security: Helmet for security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })

  // Security: Rate limiting (global)
  await fastify.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '15 minutes',
    cache: 10000,
    allowList: ['127.0.0.1'],
    skipOnError: true,
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
  registerRenderRoutes(fastify)
  registerMixRoutes(fastify)
  registerExportRoutes(fastify)

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
