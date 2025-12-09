import { SignJWT, jwtVerify } from 'jose'
import { JWTPayload, JWTPayloadSchema, type Id } from '@bluebird/types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
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
    throw new Error('Invalid or expired token')
  }
}
