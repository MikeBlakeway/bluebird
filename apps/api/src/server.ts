import Fastify, { type FastifyBaseLogger } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'
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
import { logger } from './lib/logger.js'

const PORT = parseInt(process.env.BLUEBIRD_PORT || '4000', 10)
const HOST = process.env.BLUEBIRD_HOST || '0.0.0.0'
const ENV = process.env.BLUEBIRD_ENV || 'development'

export async function createServer() {
  // Fastify expects `FastifyBaseLogger`; our pino instance is structurally compatible.
  const fastifyLogger = logger as unknown as FastifyBaseLogger

  const fastify = Fastify({
    loggerInstance: fastifyLogger,
    bodyLimit: 1024 * 1024, // 1MB global limit
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

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

  // Documentation: Swagger / OpenAPI
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Bluebird API',
        description: 'AI music composition platform API',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://${HOST}:${PORT}`,
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'token',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
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

  try {
    await fastify.listen({ port: PORT, host: HOST })
    logger.info({ port: PORT, host: HOST, env: ENV }, `Server running on http://${HOST}:${PORT}`)
  } catch (err) {
    logger.error(err, 'Failed to start server')
    throw err
  }

  return fastify
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err) => {
    logger.fatal(err, 'Fatal error during server startup')
    process.exit(1)
  })
}
