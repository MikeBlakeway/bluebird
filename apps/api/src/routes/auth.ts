import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  MagicLinkRequestSchema,
  VerifyMagicLinkRequestSchema,
  MagicLinkResponseSchema,
  AuthResponseSchema,
  type AuthResponse,
  type MagicLinkResponse,
} from '@bluebird/types'
import { generateMagicLink, verifyMagicLink } from '../lib/auth.js'
import { generateToken } from '../lib/jwt.js'
import { createRouteLogger } from '../lib/logger.js'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'

const log = createRouteLogger('/auth', 'POST')

/**
 * POST /auth/magic-link
 * Request a magic link to sign in
 */
export async function magicLinkHandler(_request: FastifyRequest, reply: FastifyReply) {
  const body = MagicLinkRequestSchema.parse(_request.body)

  try {
    const { token } = await generateMagicLink(body.email)

    if (process.env.NODE_ENV === 'development') {
      log.info(
        { email: body.email },
        `Magic link: http://localhost:3000/auth/verify?token=${token}`
      )
    }

    log.info({ email: body.email }, 'Magic link generated successfully')

    // TODO: In production, send email with magic link
    // await sendMagicLinkEmail(body.email, token, expiresAt);

    return reply.code(200).send({
      success: true,
      message: `Magic link sent to ${body.email}`,
    } as MagicLinkResponse)
  } catch (error) {
    log.error({ error, email: body.email }, 'Failed to generate magic link')
    return reply.code(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate magic link',
    })
  }
}

/**
 * POST /auth/verify
 * Verify a magic link token and return JWT
 */
export async function verifyMagicLinkHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = VerifyMagicLinkRequestSchema.parse(request.body)

  try {
    const user = await verifyMagicLink(body.token)
    const jwtToken = await generateToken({
      userId: user.id,
      email: user.email,
    })

    log.info({ userId: user.id, email: user.email }, 'User authenticated via magic link')

    // Set httpOnly cookie with strict security settings
    const isProduction = process.env.NODE_ENV === 'production'
    reply.setCookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: isProduction, // Avoid breaking local dev; enforced in prod
      sameSite: 'strict', // Stricter CSRF protection
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
    })

    return reply.code(200).send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token: jwtToken,
    } as AuthResponse)
  } catch (error) {
    log.error({ error }, 'Failed to verify magic link')
    return reply.code(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify magic link',
    })
  }
}

/**
 * GET /auth/me
 * Get current user info (requires auth)
 */
export async function getCurrentUserHandler(request: FastifyRequest, reply: FastifyReply) {
  // Auth middleware will populate request.user
  if (!request.user) {
    return reply.code(401).send({ message: 'Unauthorized' })
  }

  return reply.code(200).send({
    id: request.user.userId,
    email: request.user.email,
  })
}

/**
 * POST /auth/logout
 * Clear auth cookie
 */
export async function logoutHandler(_request: FastifyRequest, reply: FastifyReply) {
  log.info('User logged out')
  reply.clearCookie('auth_token', { path: '/' })
  return reply.code(200).send({ success: true, message: 'Logged out' })
}

export function registerAuthRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Stricter rate limiting for authentication endpoints
  const authRateLimit = {
    config: {
      rateLimit: {
        max: 5, // 5 requests
        timeWindow: '15 minutes',
      },
    },
  }

  app.post(
    '/auth/magic-link',
    {
      schema: {
        body: MagicLinkRequestSchema,
        response: {
          200: MagicLinkResponseSchema,
          400: z.object({ success: z.boolean(), message: z.string() }),
        },
        tags: ['Auth'],
        description: 'Request a magic link to sign in',
      },
      ...authRateLimit,
      preHandler: [requireIdempotencyKey],
    },
    magicLinkHandler
  )
  app.post(
    '/auth/verify',
    {
      schema: {
        body: VerifyMagicLinkRequestSchema,
        response: {
          200: AuthResponseSchema,
          400: z.object({ success: z.boolean(), message: z.string() }),
        },
        tags: ['Auth'],
        description: 'Verify magic link token',
      },
      ...authRateLimit,
      preHandler: [requireIdempotencyKey],
    },
    verifyMagicLinkHandler
  )
  app.get(
    '/auth/me',
    {
      schema: {
        response: {
          200: z.object({ id: z.string(), email: z.string() }),
          401: z.object({ message: z.string() }),
        },
        tags: ['Auth'],
        description: 'Get current user',
      },
    },
    getCurrentUserHandler
  )
  app.post(
    '/auth/logout',
    {
      schema: {
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }),
        },
        tags: ['Auth'],
        description: 'Logout user',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    logoutHandler
  )
}
