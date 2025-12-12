import { SignJWT, jwtVerify } from 'jose'
import { JWTPayload, JWTPayloadSchema, type Id } from '@bluebird/types'

// Validate JWT_SECRET is properly configured
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be set and at least 32 characters long. ' +
      'Generate with: openssl rand -base64 32'
  )
}

// Additional validation: prevent default/weak secrets
if (JWT_SECRET === 'dev-secret-change-in-production' || JWT_SECRET.includes('change')) {
  throw new Error('Default JWT_SECRET detected. Must use unique secret.')
}

const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRY = '7d'

const secret = new TextEncoder().encode(JWT_SECRET)

export type { JWTPayload }

/**
 * Generate a JWT token for a user.
 */
export async function generateToken(payload: { userId: Id; email: string }): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret)
}

/**
 * Verify a JWT token and extract the payload.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return JWTPayloadSchema.parse(payload)
  } catch (error) {
    // Preserve error context while providing safe message
    const message =
      error instanceof Error
        ? `Token verification failed: ${error.message}`
        : 'Invalid or expired token'
    const err = new Error(message)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(err as any).cause = error
    throw err
  }
}
