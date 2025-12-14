import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { verifyToken, type JWTPayload } from './jwt.js'

// Augment Fastify types for our auth
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload
    idempotencyKey?: string
  }
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: JWTPayload
  idempotencyKey?: string
}

const IdempotencyKeySchema = z
  .string()
  .min(8, 'Idempotency-Key must be at least 8 characters')
  .max(128, 'Idempotency-Key must be 128 characters or fewer')

/**
 * Extract JWT from cookies or Authorization header.
 */
function extractToken(request: FastifyRequest): string | null {
  // Try cookie first
  const cookieToken = request.cookies.auth_token
  if (cookieToken) return cookieToken

  // Try Authorization header
  const authHeader = request.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

/**
 * Auth middleware: verify JWT and attach user to request.
 * Optional: if no token, continue; let route handlers check auth if needed.
 */
export async function authMiddleware(request: AuthenticatedRequest, _reply: FastifyReply) {
  const token = extractToken(request)

  if (!token) {
    // No token; let route handlers decide if auth is required
    return
  }

  try {
    const payload = await verifyToken(token)
    // Attach user to request
    request.user = payload
  } catch (error) {
    // Invalid token; let route handlers decide
    // (could also return 401 here if you prefer strict auth)
    // eslint-disable-next-line no-console
    console.warn('[AUTH MIDDLEWARE] Invalid token:', error)
  }
}

/**
 * Guard middleware: reject requests without auth.
 * Use this on routes that require authentication.
 */
export async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.code(401).send({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    })
  }
}

/**
 * Enforce presence of Idempotency-Key header on POST requests.
 * This guards against duplicate expensive operations.
 */
export async function requireIdempotencyKey(request: AuthenticatedRequest, reply: FastifyReply) {
  if (request.method !== 'POST') return

  const parsed = IdempotencyKeySchema.safeParse(request.headers['idempotency-key'])
  if (!parsed.success) {
    return reply.code(400).send({
      message: 'Missing or invalid Idempotency-Key header',
      code: 'INVALID_IDEMPOTENCY_KEY',
      details: parsed.error.format(),
    })
  }

  request.idempotencyKey = parsed.data
}
